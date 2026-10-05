-- Diagnóstico de esquema (SOLO LECTURA). Pegar completo en el SQL Editor de Supabase y ejecutar.
-- Devuelve una sola tabla (seccion, detalle). Copia/pega el resultado para verificar contra supabase/schema.sql.
-- Correr ANTES de las migraciones 20261005–20261007 y de nuevo DESPUÉS.

with
cols as (
  select '1_columnas' as seccion,
         table_name || '.' || column_name || ' ' || data_type
           || case when is_nullable = 'NO' then ' NOT NULL' else '' end
           || coalesce(' DEFAULT ' || column_default, '') as detalle
  from information_schema.columns
  where table_schema = 'public'
),
cons as (
  select '2_constraints',
         conrelid::regclass || ' ' || conname || ': ' || pg_get_constraintdef(oid)
  from pg_constraint
  where connamespace = 'public'::regnamespace
),
idx as (
  select '3_indices', tablename || ' ' || indexdef
  from pg_indexes where schemaname = 'public'
),
pol as (
  select '4_politicas_rls',
         tablename || ' ' || policyname || ' [' || cmd || '] using ' || coalesce(qual, '-')
           || ' check ' || coalesce(with_check, '-')
  from pg_policies where schemaname = 'public'
),
rls as (
  select '5_rls_activo', relname || ' ' || relrowsecurity::text
  from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
),
conteos as (
  select '6_conteos', 'materias ' || count(*) from materias union all
  select '6_conteos', 'clases ' || count(*) from clases union all
  select '6_conteos', 'pendientes ' || count(*) from pendientes union all
  select '6_conteos', 'subtareas ' || count(*) from subtareas union all
  select '6_conteos', 'categorias_personales ' || count(*) from categorias_personales union all
  select '6_conteos', 'fechas_importantes ' || count(*) from fechas_importantes union all
  select '6_conteos', 'habitos ' || count(*) from habitos union all
  select '6_conteos', 'registros_habito ' || count(*) from registros_habito
),
-- Datos que violarían los nuevos constraints (todo debe dar 0 salvo lo marcado como "se limpia")
violaciones as (
  select '7_violaciones', 'pendientes.materia de otro usuario: ' || count(*)
    from pendientes p join materias m on m.id = p.materia_id and m.user_id <> p.user_id
  union all
  select '7_violaciones', 'pendientes.categoria de otro usuario: ' || count(*)
    from pendientes p join categorias_personales c on c.id = p.categoria_personal_id and c.user_id <> p.user_id
  union all
  select '7_violaciones', 'fechas_importantes.materia de otro usuario: ' || count(*)
    from fechas_importantes f join materias m on m.id = f.materia_id and m.user_id <> f.user_id
  union all
  select '7_violaciones', 'subtareas de otro usuario que su pendiente: ' || count(*)
    from subtareas s join pendientes p on p.id = s.pendiente_id and p.user_id <> s.user_id
  union all
  select '7_violaciones', 'registros_habito de otro usuario que su habito: ' || count(*)
    from registros_habito r join habitos h on h.id = r.habito_id and h.user_id <> r.user_id
  union all
  select '7_violaciones', 'clases con materia de otro usuario: ' || count(*)
    from clases c join materias m on m.id = c.materia_id and m.user_id <> c.user_id
  union all
  select '7_violaciones', 'pendientes tipo/FK incoherente (se limpia en M2): ' || count(*)
    from pendientes
    where not ((tipo = 'escolar' and categoria_personal_id is null) or (tipo = 'personal' and materia_id is null))
  union all
  select '7_violaciones', 'habitos con metas incoherentes (se limpia en M2): ' || count(*)
    from habitos
    where (meta_semanal is not null and frecuencia <> 'semanal')
       or (meta_cantidad_semanal is not null and (frecuencia <> 'semanal' or tipo_medida <> 'numerica'))
       or (meta_semanal is not null and meta_cantidad_semanal is not null)
       or (unidad is not null and tipo_medida <> 'numerica')
  union all
  select '7_violaciones', 'clases hora_fin <= hora_inicio: ' || count(*) from clases where hora_fin <= hora_inicio
  union all
  select '7_violaciones', 'clases fecha_fin < fecha_inicio: ' || count(*)
    from clases where fecha_fin is not null and fecha_inicio is not null and fecha_fin < fecha_inicio
  union all
  select '7_violaciones', 'clases con dia fuera del dominio: ' || count(*)
    from clases where dia not in ('lunes','martes','miércoles','jueves','viernes','sábado','domingo')
  union all
  select '7_violaciones', 'registros_habito con valor < 0: ' || count(*) from registros_habito where valor < 0
  union all
  select '7_violaciones', 'materias duplicadas por (user, nombre): ' || count(*)
    from (select 1 from materias group by user_id, lower(btrim(nombre)) having count(*) > 1) d
  union all
  select '7_violaciones', 'categorias_personales duplicadas por (user, nombre): ' || count(*)
    from (select 1 from categorias_personales group by user_id, lower(btrim(nombre)) having count(*) > 1) d
  union all
  select '7_violaciones', 'google_task_id repetido por usuario: ' || count(*)
    from (select 1 from pendientes where google_task_id is not null group by user_id, google_task_id having count(*) > 1) d
  union all
  -- Redundancia 4FN en clases: grupos que comparten horario/salón/rango/evento y solo difieren en el día
  select '7_violaciones', 'clases: filas = ' || count(*) || ', clases lógicas tras agrupar = ' || count(distinct (user_id, materia_id, hora_inicio, hora_fin, salon, fecha_inicio, fecha_fin, google_event_id))
    from clases
),
version as (
  select '0_version' as seccion, version() as detalle
)
select * from version
union all select * from cols
union all select * from cons
union all select * from idx
union all select * from pol
union all select * from rls
union all select * from conteos
union all select * from violaciones
order by 1, 2;
