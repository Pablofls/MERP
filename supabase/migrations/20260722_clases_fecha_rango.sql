alter table clases
  add column if not exists fecha_inicio date,
  add column if not exists fecha_fin date;
