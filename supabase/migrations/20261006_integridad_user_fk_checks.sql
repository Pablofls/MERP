-- Integridad referencial y de dominio (3FN/consistencia):
--  1. FKs compuestas (fk_id, user_id) -> padre(id, user_id): `user_id` sigue desnormalizado por RLS,
--     pero ahora la BD garantiza que hijo y padre pertenecen al mismo usuario.
--  2. CHECK de coherencia: pendientes.tipo <-> materia_id/categoria_personal_id, metas de hábitos, dominios.
--
-- Requisitos: M1 (20261005) aplicada y PostgreSQL 15+ (SET NULL (col)); Supabase lo cumple.
-- Una sola transacción: si hay datos que violen algo (p. ej. materia de otro usuario), falla y no cambia nada.
-- Correr antes supabase/diagnostico_esquema.sql y revisar la sección 7_violaciones.
--
-- Supuesto de ON DELETE al reemplazar FKs de tablas base cuyo DDL no estaba en el repo:
--   pendientes/fechas_importantes -> materia: SET NULL | subtareas -> pendientes: CASCADE
--   registros_habito -> habitos: CASCADE        | clases -> materias: CASCADE
-- Confirmar con la sección 2_constraints del diagnóstico antes de ejecutar.

begin;

-- Helpers temporales (viven solo en esta sesión) ------------------------------------------------------
create function pg_temp.drop_fk(tbl regclass, col text, parent regclass) returns void
language plpgsql as $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
    where con.conrelid = tbl and con.confrelid = parent and con.contype = 'f'
      and array_length(con.conkey, 1) = 1 and a.attname = col
  loop
    execute format('alter table %s drop constraint %I', tbl, c.conname);
  end loop;
end $$;

create function pg_temp.add_unique(tbl regclass, nombre text) returns void
language plpgsql as $$
begin
  if not exists (select 1 from pg_constraint where conrelid = tbl and conname = nombre) then
    execute format('alter table %s add constraint %I unique (id, user_id)', tbl, nombre);
  end if;
end $$;

create function pg_temp.add_con(tbl regclass, nombre text, def text) returns void
language plpgsql as $$
begin
  if not exists (select 1 from pg_constraint where conrelid = tbl and conname = nombre) then
    execute format('alter table %s add constraint %I %s not valid', tbl, nombre, def);
  end if;
  execute format('alter table %s validate constraint %I', tbl, nombre);
end $$;

-- 0. Limpieza dirigida (solo normaliza valores que la app ya ignora; no borra filas) -----------------
-- pendientes: la app decide por `tipo`; la FK del otro tipo es residuo de ediciones previas.
update pendientes set categoria_personal_id = null where tipo = 'escolar' and categoria_personal_id is not null;
update pendientes set materia_id = null            where tipo = 'personal' and materia_id is not null;

-- habitos: metas/unidad que no aplican al modo actual (residuo de editar sin limpiar).
update habitos set meta_semanal = null          where frecuencia <> 'semanal' and meta_semanal is not null;
update habitos set meta_cantidad_semanal = null where (frecuencia <> 'semanal' or tipo_medida <> 'numerica') and meta_cantidad_semanal is not null;
update habitos set meta_semanal = null          where meta_semanal is not null and meta_cantidad_semanal is not null;
update habitos set unidad = null                where tipo_medida <> 'numerica' and unidad is not null;

-- 1. UNIQUE (id, user_id): objetivo de las FKs compuestas -----------------------------------------------
select pg_temp.add_unique('materias', 'materias_id_user_key');
select pg_temp.add_unique('categorias_personales', 'categorias_personales_id_user_key');
select pg_temp.add_unique('pendientes', 'pendientes_id_user_key');
select pg_temp.add_unique('habitos', 'habitos_id_user_key');
-- clases ya tiene clases_id_user_key (M1)

-- 2. FKs compuestas: reemplazan a las simples --------------------------------------------------------------
select pg_temp.drop_fk('pendientes', 'materia_id', 'materias');
select pg_temp.add_con('pendientes', 'pendientes_materia_fk',
  'foreign key (materia_id, user_id) references materias (id, user_id) on delete set null (materia_id)');

select pg_temp.drop_fk('pendientes', 'categoria_personal_id', 'categorias_personales');
select pg_temp.add_con('pendientes', 'pendientes_categoria_fk',
  'foreign key (categoria_personal_id, user_id) references categorias_personales (id, user_id) on delete set null (categoria_personal_id)');

select pg_temp.drop_fk('fechas_importantes', 'materia_id', 'materias');
select pg_temp.add_con('fechas_importantes', 'fechas_importantes_materia_fk',
  'foreign key (materia_id, user_id) references materias (id, user_id) on delete set null (materia_id)');

select pg_temp.drop_fk('subtareas', 'pendiente_id', 'pendientes');
select pg_temp.add_con('subtareas', 'subtareas_pendiente_fk',
  'foreign key (pendiente_id, user_id) references pendientes (id, user_id) on delete cascade');

select pg_temp.drop_fk('registros_habito', 'habito_id', 'habitos');
select pg_temp.add_con('registros_habito', 'registros_habito_habito_fk',
  'foreign key (habito_id, user_id) references habitos (id, user_id) on delete cascade');

select pg_temp.drop_fk('clases', 'materia_id', 'materias');
select pg_temp.add_con('clases', 'clases_materia_fk',
  'foreign key (materia_id, user_id) references materias (id, user_id) on delete cascade');

-- 3. CHECK de coherencia y dominio ---------------------------------------------------------------------------
select pg_temp.add_con('pendientes', 'pendientes_tipo_ck',
  $c$check ((tipo = 'escolar' and categoria_personal_id is null) or (tipo = 'personal' and materia_id is null))$c$);

select pg_temp.add_con('habitos', 'habitos_frecuencia_ck', $c$check (frecuencia in ('diaria','semanal'))$c$);
select pg_temp.add_con('habitos', 'habitos_tipo_medida_ck', $c$check (tipo_medida in ('numerica','booleana'))$c$);
select pg_temp.add_con('habitos', 'habitos_metas_ck', $c$check (
  (meta_semanal is null or (frecuencia = 'semanal' and meta_semanal between 1 and 7))
  and (meta_cantidad_semanal is null or (frecuencia = 'semanal' and tipo_medida = 'numerica' and meta_cantidad_semanal > 0))
  and not (meta_semanal is not null and meta_cantidad_semanal is not null)
  and (unidad is null or tipo_medida = 'numerica')
)$c$);

select pg_temp.add_con('registros_habito', 'registros_habito_valor_ck', $c$check (valor >= 0)$c$);

-- Reglas de `clases` creadas NOT VALID en M1: validarlas ahora con los datos migrados
alter table clases validate constraint clases_horas_ck;
alter table clases validate constraint clases_fechas_ck;

-- 4. Índices de soporte para las FKs compuestas (borrados en cascada / SET NULL) --------------------------------
create index if not exists idx_pendientes_materia on pendientes (materia_id) where materia_id is not null;
create index if not exists idx_pendientes_categoria on pendientes (categoria_personal_id) where categoria_personal_id is not null;
create index if not exists idx_fechas_importantes_materia on fechas_importantes (materia_id) where materia_id is not null;

commit;

-- Rollback: alter table <t> drop constraint <nombre>; (las FKs simples originales no se restauran:
-- recrearlas con `foreign key (col) references padre(id)` si hiciera falta).
