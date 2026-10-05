-- 4FN: una "clase" (materia + horario + salón + rango + evento de Google) puede repetirse en varios días.
-- Antes: una fila por día en `clases`, repitiendo todo lo demás (dependencia multivaluada clase ->> dia).
-- Ahora: `clases` (una por horario) + `clase_dias` (los días en que ocurre).
--
-- Ejecutar completo en el SQL Editor de Supabase. Es una sola transacción: si cualquier aserción
-- falla, no se aplica nada. `clases_legacy` conserva los datos originales para rollback
-- (se elimina en una migración posterior, ≥1 semana después de verificar).
-- Desplegar la app inmediatamente después: la versión anterior no entiende el nuevo esquema.

begin;

-- 0. Guardia: `clases.user_id` es nullable en la BD actual; el esquema nuevo lo exige NOT NULL
do $$
begin
  if exists (select 1 from clases where user_id is null) then
    raise exception 'M1: hay clases con user_id NULL; asignarles dueño o borrarlas antes de migrar';
  end if;
end $$;

-- 1. Tablas nuevas -----------------------------------------------------------------------------
create table clases_new (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  materia_id    uuid        not null references materias(id) on delete cascade,
  hora_inicio   time        not null,
  hora_fin      time        not null,
  salon         text,
  fecha_inicio  date,
  fecha_fin     date,
  google_event_id text,
  created_at    timestamptz not null default now(),
  constraint clases_new_id_user_key unique (id, user_id)
);

create table clase_dias (
  clase_id  uuid not null,
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       text not null,
  primary key (clase_id, dia),
  constraint clase_dias_clase_fk foreign key (clase_id, user_id)
    references clases_new (id, user_id) on delete cascade,
  constraint clase_dias_dia_ck check (dia in ('lunes','martes','miércoles','jueves','viernes','sábado','domingo'))
);

-- 2. Backfill: agrupar las filas actuales por todo menos el día ----------------------------------
-- GROUP BY trata los NULL como iguales, así que filas con salón/evento nulos se agrupan bien.
create temp table _grupos on commit drop as
select gen_random_uuid() as nueva_id,
       user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id,
       -- created_at puede no existir en `clases`; se lee vía jsonb para no fallar
       coalesce(min((to_jsonb(c)->>'created_at')::timestamptz), now()) as created_at
from clases c
group by user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id;

insert into clases_new (id, user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id, created_at)
select nueva_id, user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id, created_at
from _grupos;

insert into clase_dias (clase_id, user_id, dia)
select distinct g.nueva_id, c.user_id, c.dia
from clases c
join _grupos g
  on  g.user_id      = c.user_id
  and g.materia_id   = c.materia_id
  and g.hora_inicio  = c.hora_inicio
  and g.hora_fin     = c.hora_fin
  and g.salon        is not distinct from c.salon
  and g.fecha_inicio is not distinct from c.fecha_inicio
  and g.fecha_fin    is not distinct from c.fecha_fin
  and g.google_event_id is not distinct from c.google_event_id;

-- 3. Aserciones: no se pierde ni inventa ningún (clase, día) ---------------------------------------
do $$
declare
  n_origen  int;
  n_dias    int;
  n_clases  int;
  n_grupos  int;
begin
  select count(*) into n_origen from (
    select distinct user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id, dia
    from clases
  ) s;
  select count(*) into n_dias   from clase_dias;
  select count(*) into n_clases from clases_new;
  select count(*) into n_grupos from _grupos;

  if n_origen <> n_dias then
    raise exception 'M1: (clase,dia) origen=% pero clase_dias=%', n_origen, n_dias;
  end if;
  if n_clases <> n_grupos then
    raise exception 'M1: grupos=% pero clases_new=%', n_grupos, n_clases;
  end if;
  raise notice 'M1 ok: % filas legacy -> % clases + % clase_dias', (select count(*) from clases), n_clases, n_dias;
end $$;

-- 4. Swap -------------------------------------------------------------------------------------------
alter table clases rename to clases_legacy;
alter index if exists clases_pkey rename to clases_legacy_pkey;
alter table clases_new rename to clases;
alter index clases_new_pkey rename to clases_pkey;
alter table clases rename constraint clases_new_id_user_key to clases_id_user_key;

-- Reglas de dominio: NOT VALID (se aplican a escrituras nuevas); M2 las valida tras revisar datos viejos.
alter table clases add constraint clases_horas_ck
  check (hora_fin > hora_inicio) not valid;
alter table clases add constraint clases_fechas_ck
  check (fecha_inicio is null or fecha_fin is null or fecha_fin >= fecha_inicio) not valid;

create index idx_clases_user_created on clases (user_id, created_at);
create index idx_clases_materia on clases (materia_id);
create index idx_clase_dias_user on clase_dias (user_id);

-- 5. RLS ----------------------------------------------------------------------------------------------
alter table clases enable row level security;
alter table clase_dias enable row level security;

drop policy if exists "clases: own rows" on clases;
create policy "clases: own rows" on clases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clase_dias: own rows" on clase_dias;
create policy "clase_dias: own rows" on clase_dias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- `clases_legacy` queda solo para rollback: nadie debe escribir en ella desde la app.
revoke all on clases_legacy from anon, authenticated;

commit;

-- Rollback (solo si algo sale mal ANTES de borrar clases_legacy):
--   begin;
--   drop table clase_dias; drop table clases;
--   alter table clases_legacy rename to clases;
--   alter index clases_legacy_pkey rename to clases_pkey;
--   grant all on clases to anon, authenticated;
--   commit;
