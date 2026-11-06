-- Módulos: catálogo de plantillas de pendientes y aplicaciones que cada usuario activa o desactiva.
--
--  * modulos               catálogo global (sin user_id). `clase` distingue plantilla de pendientes y aplicación.
--  * plantillas_pendientes subtipo de modulos (clase = 'plantilla_pendientes'); es lo que referencia pendientes.tipo.
--                          Las subcategorías de cada plantilla siguen en sus tablas: materias (escolar) y
--                          categorias_personales (personal).
--  * usuario_modulos       una fila por (usuario, módulo) activo. Desactivar = borrar la fila; los datos del
--                          módulo no se tocan.
--
-- Normalización: en `modulos` todo depende solo de `clave` (BCNF); `usuario_modulos` es toda clave con una
-- única dependencia multivaluada user_id ->> modulo_clave (4FN). El subtipo usa FK compuesta (clave, clase),
-- el mismo patrón que notificacion_pendientes.
--
-- Cambio ADITIVO: la app desplegada hoy no lee estas tablas y sigue funcionando igual. Todo usuario existente
-- y nuevo queda con Escolar, Personal y Hábitos activos (activo_por_defecto).
--
-- Ejecutar completo en el SQL Editor de Supabase. Es una sola transacción: si cualquier aserción falla,
-- no se aplica nada. Correr ANTES de desplegar la rama feat/modulos.

begin;

-- 0. Guardia: pendientes.tipo pasará a ser FK a la plantilla ---------------------------------------
do $$
begin
  if exists (select 1 from pendientes where tipo not in ('escolar', 'personal')) then
    raise exception 'modulos: hay pendientes con tipo fuera de (escolar, personal)';
  end if;
end $$;

-- 1. Catálogo ------------------------------------------------------------------------------------
create table modulos (
  clave               text     primary key,
  clase               text     not null,
  nombre              text     not null,
  descripcion         text     not null,
  orden               smallint not null,
  activo_por_defecto  boolean  not null default false,      -- se activa al crear la cuenta
  constraint modulos_clave_clase_key unique (clave, clase),
  constraint modulos_clave_ck check (clave ~ '^[a-z][a-z_]*$'),
  constraint modulos_clase_ck check (clase in ('plantilla_pendientes', 'aplicacion'))
);

create table plantillas_pendientes (
  modulo_clave  text primary key,
  clase         text not null default 'plantilla_pendientes',
  constraint plantillas_pendientes_clase_ck check (clase = 'plantilla_pendientes'),
  constraint plantillas_pendientes_modulo_fk foreign key (modulo_clave, clase)
    references modulos (clave, clase)
);

insert into modulos (clave, clase, nombre, descripcion, orden, activo_por_defecto) values
  ('escolar',  'plantilla_pendientes', 'Escolar',
   'Materias con su horario de clases, fechas importantes y pendientes por materia.', 1, true),
  ('personal', 'plantilla_pendientes', 'Personal',
   'Pendientes personales organizados en las categorías que tú crees.', 2, true),
  ('habitos',  'aplicacion', 'Hábitos',
   'Da seguimiento a tus hábitos diarios y semanales con metas y registros.', 3, true);

insert into plantillas_pendientes (modulo_clave) values ('escolar'), ('personal');

-- 2. Activación por usuario ---------------------------------------------------------------------
create table usuario_modulos (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  modulo_clave  text        not null references modulos(clave) on delete cascade,
  activado_at   timestamptz not null default now(),
  primary key (user_id, modulo_clave)
);

-- Backfill: todo usuario existente con los módulos por defecto (= lo que ve hoy)
insert into usuario_modulos (user_id, modulo_clave)
select u.id, m.clave
from auth.users u
cross join modulos m
where m.activo_por_defecto;

-- Usuarios nuevos: activar los módulos por defecto al crear la cuenta
create function public.activar_modulos_iniciales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuario_modulos (user_id, modulo_clave)
  select new.id, m.clave
  from public.modulos m
  where m.activo_por_defecto
  on conflict do nothing;
  return new;
end $$;

revoke execute on function public.activar_modulos_iniciales() from public, anon, authenticated;

create trigger usuario_modulos_iniciales
  after insert on auth.users
  for each row execute function public.activar_modulos_iniciales();

-- 3. pendientes.tipo es la plantilla del pendiente -------------------------------------------------
-- Los CHECK actuales (pendientes_tipo_check y pendientes_tipo_ck) se conservan.
alter table pendientes
  add constraint pendientes_plantilla_fk foreign key (tipo)
  references plantillas_pendientes (modulo_clave);

-- 4. RLS ----------------------------------------------------------------------------------------
alter table modulos               enable row level security;
alter table plantillas_pendientes enable row level security;
alter table usuario_modulos       enable row level security;

-- El catálogo es de solo lectura para la app
create policy "modulos: lectura" on modulos
  for select to authenticated using (true);
create policy "plantillas_pendientes: lectura" on plantillas_pendientes
  for select to authenticated using (true);
revoke insert, update, delete, truncate on modulos, plantillas_pendientes from anon, authenticated;

create policy "usuario_modulos: own rows" on usuario_modulos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Aserciones -----------------------------------------------------------------------------------
do $$
declare
  n_modulos     int;
  n_plantillas  int;
  n_faltantes   int;
  n_usuarios    int;
begin
  select count(*) into n_modulos    from modulos;
  select count(*) into n_plantillas from plantillas_pendientes;
  if n_modulos <> 3 or n_plantillas <> 2 then
    raise exception 'modulos: catálogo=% plantillas=% (se esperaban 3 y 2)', n_modulos, n_plantillas;
  end if;

  select count(*) into n_faltantes
  from auth.users u
  cross join modulos m
  where m.activo_por_defecto
    and not exists (select 1 from usuario_modulos um where um.user_id = u.id and um.modulo_clave = m.clave);
  if n_faltantes <> 0 then
    raise exception 'modulos: % activaciones por defecto faltantes', n_faltantes;
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'usuario_modulos_iniciales' and tgrelid = 'auth.users'::regclass
  ) then
    raise exception 'modulos: no se creó el trigger usuario_modulos_iniciales';
  end if;

  select count(*) into n_usuarios from auth.users;
  raise notice 'modulos ok: % módulos, % usuarios, % activaciones',
    n_modulos, n_usuarios, (select count(*) from usuario_modulos);
end $$;

commit;

-- Verificación posterior (opcional):
--   select m.orden, m.clave, m.clase, count(um.user_id) as usuarios_activos
--   from modulos m left join usuario_modulos um on um.modulo_clave = m.clave
--   group by m.orden, m.clave, m.clase order by m.orden;
--
-- Rollback (la app de feat/modulos cae a "todos activos" si estas tablas no existen):
--   begin;
--   drop trigger if exists usuario_modulos_iniciales on auth.users;
--   drop function if exists public.activar_modulos_iniciales();
--   alter table pendientes drop constraint if exists pendientes_plantilla_fk;
--   drop table if exists usuario_modulos;
--   drop table if exists plantillas_pendientes;
--   drop table if exists modulos;
--   commit;
