-- DIFERIDA: NO ejecutar junto con las demás migraciones.
-- Correr ≥1 semana después de aplicar 20261005_clases_dias_4fn.sql, cuando se haya confirmado que
-- Escolar, Home (AgendaHoy) y HorarioSemanal funcionan con los datos migrados.
-- Al ejecutarla, mover este archivo a supabase/migrations/ con la fecha real y quitar la tabla de supabase/schema.sql
-- (ya no aparece allí; solo se documenta mientras exista).
--
-- Comprobación previa (debe devolver 0 filas): ninguna clase legacy sin su (clase, día) en el esquema nuevo.
--   select l.* from clases_legacy l
--   where not exists (
--     select 1 from clases c join clase_dias d on d.clase_id = c.id
--     where c.user_id = l.user_id and c.materia_id = l.materia_id
--       and c.hora_inicio = l.hora_inicio and c.hora_fin = l.hora_fin
--       and c.salon is not distinct from l.salon
--       and c.fecha_inicio is not distinct from l.fecha_inicio
--       and c.fecha_fin is not distinct from l.fecha_fin
--       and c.google_event_id is not distinct from l.google_event_id
--       and d.dia = l.dia);

drop table if exists clases_legacy;
