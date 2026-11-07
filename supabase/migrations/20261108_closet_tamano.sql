-- Closet: tamaño real de cada prenda, para que en el outfit todas se vean a la misma escala.
--
--  * closet_prendas.alto_cm  alto en cm del recorte guardado (su caja, sin márgenes). El ancho en cm no se guarda:
--                            se deriva de la proporción del recorte (alto_cm * ancho / alto) → sin redundancia.
--
-- Al registrar una prenda la app muestra el marco de su categoría (p. ej. una playera de 72 × 76 cm) sobre la foto;
-- la escala que elige el usuario (o el ajuste automático del contorno al marco) da alto_cm.
--
-- Backfill: las prendas existentes quedan "encajadas" en el marco de su categoría, igual que el ajuste automático
-- de la app. Los marcos (ancho × alto en cm) son copia de MARCOS en src/features/closet/lib/catalogo.ts.
--
-- Ejecutar completo en el SQL Editor ANTES de desplegar: la app nueva lee alto_cm.

begin;

alter table closet_prendas add column alto_cm numeric(5,1);

update closet_prendas p
set alto_cm = round(least(m.alto, m.ancho * p.alto::numeric / p.ancho), 1)
from (values
  ('gorras',     26,  18),
  ('camisas',    72,  76),
  ('sueteres',   76,  74),
  ('chamarras',  80,  78),
  ('shorts',     56,  52),
  ('pantalones', 52, 106),
  ('calzado',    34,  16),
  ('accesorios', 32,  32)
) as m (categoria, ancho, alto)
where m.categoria = p.categoria_clave;

do $$
declare
  n_sin int;
begin
  select count(*) into n_sin from closet_prendas where alto_cm is null;
  if n_sin <> 0 then
    raise exception 'closet_tamano: % prendas sin alto_cm (¿categoría sin marco?)', n_sin;
  end if;
end $$;

alter table closet_prendas
  alter column alto_cm set not null,
  add constraint closet_prendas_alto_cm_ck check (alto_cm between 1 and 300);

do $$
begin
  raise notice 'closet_tamano ok: % prendas con tamaño', (select count(*) from closet_prendas);
end $$;

commit;

-- Rollback:
--   alter table closet_prendas drop column alto_cm;
