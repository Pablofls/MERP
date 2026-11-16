-- Hábitos: la meta "semanal" pasa a ser "X veces (o X cantidad) cada N días".
--
--  * habitos.periodo_dias  largo del periodo en días (2..30). Obligatorio cuando frecuencia = 'semanal', null en diarios.
--
-- El periodo ya no es lunes–domingo: empieza en el primer registro y dura periodo_dias. Si se cumple, el siguiente
-- bloque empieza pegado (el día base queda fijo); si no, el día más viejo se cae y el periodo se recorre al siguiente
-- registro. Todo eso se calcula en la app (src/features/habitos/periodo.ts); la BD solo guarda N.
--
-- Se conservan frecuencia = 'semanal' y los nombres meta_semanal / meta_cantidad_semanal: ahora son la meta del periodo.
-- Backfill: los hábitos semanales existentes quedan con 7 días.
--
-- Ejecutar completo en el SQL Editor ANTES de desplegar: la app nueva lee periodo_dias.

begin;

alter table habitos add column periodo_dias smallint;

update habitos set periodo_dias = 7 where frecuencia = 'semanal';

alter table habitos add constraint habitos_periodo_ck check (
  (frecuencia = 'semanal') = (periodo_dias is not null)
  and (periodo_dias is null or periodo_dias between 2 and 30)
);

alter table habitos drop constraint habitos_metas_ck;
alter table habitos add constraint habitos_metas_ck check (
  (meta_semanal is null or (frecuencia = 'semanal' and meta_semanal between 1 and periodo_dias))
  and (meta_cantidad_semanal is null or (frecuencia = 'semanal' and tipo_medida = 'numerica' and meta_cantidad_semanal > 0))
  and not (meta_semanal is not null and meta_cantidad_semanal is not null)
  and (unidad is null or tipo_medida = 'numerica')
);

do $$
declare
  n_sin int;
begin
  select count(*) into n_sin from habitos where frecuencia = 'semanal' and periodo_dias is null;
  if n_sin <> 0 then
    raise exception 'habitos_periodo_dias: % hábitos semanales sin periodo_dias', n_sin;
  end if;
end $$;

commit;
