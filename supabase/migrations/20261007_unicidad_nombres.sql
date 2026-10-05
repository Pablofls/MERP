-- Unicidad de claves candidatas (OPCIONAL: ejecutar solo tras revisar las secciones de duplicados
-- de supabase/diagnostico_esquema.sql). Requiere M1 y M2.
--
--  * materias y categorias_personales: un nombre por usuario (sin distinguir mayúsculas/espacios).
--    Los duplicados existentes se fusionan en el más antiguo (se repuntan pendientes, fechas y clases) y se borra el sobrante.
--  * pendientes.google_task_id: una tarea de Google corresponde a un solo pendiente por usuario.
--
-- Efecto en la app: crear una materia/categoría con nombre repetido pasa a ser rechazado por la BD
-- (los hooks ya ignoran el error del insert, por lo que simplemente no se agrega).
-- clases.google_event_id NO se hace único a propósito: dos clases de la misma materia con distinto
-- horario pueden compartir el mismo evento recurrente de Google Calendar.

begin;

-- 1. Fusionar materias duplicadas ---------------------------------------------------------------------
create temp table _mat_map on commit drop as
select id as viejo,
       first_value(id) over (partition by user_id, lower(btrim(nombre)) order by created_at, id) as nuevo
from materias;
delete from _mat_map where viejo = nuevo;

update pendientes p          set materia_id = m.nuevo from _mat_map m where p.materia_id = m.viejo;
update fechas_importantes f  set materia_id = m.nuevo from _mat_map m where f.materia_id = m.viejo;
update clases c              set materia_id = m.nuevo from _mat_map m where c.materia_id = m.viejo;
delete from materias where id in (select viejo from _mat_map);

-- 2. Fusionar categorías duplicadas -------------------------------------------------------------------
create temp table _cat_map on commit drop as
select id as viejo,
       first_value(id) over (partition by user_id, lower(btrim(nombre)) order by created_at, id) as nuevo
from categorias_personales;
delete from _cat_map where viejo = nuevo;

update pendientes p set categoria_personal_id = m.nuevo from _cat_map m where p.categoria_personal_id = m.viejo;
delete from categorias_personales where id in (select viejo from _cat_map);

-- 3. Índices únicos ---------------------------------------------------------------------------------------
create unique index if not exists uq_materias_user_nombre
  on materias (user_id, lower(btrim(nombre)));
create unique index if not exists uq_categorias_personales_user_nombre
  on categorias_personales (user_id, lower(btrim(nombre)));
create unique index if not exists uq_pendientes_user_google_task
  on pendientes (user_id, google_task_id) where google_task_id is not null;

commit;
