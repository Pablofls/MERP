-- Índices para las consultas más frecuentes de la app (todas filtran por RLS en user_id).
-- Seguro de re-ejecutar. Aplicar desde el SQL editor de Supabase o con `supabase db push`.

create index if not exists idx_pendientes_user_created on pendientes (user_id, created_at desc);
create index if not exists idx_pendientes_user_pendiente on pendientes (user_id) where completado = false;
create index if not exists idx_materias_user_created on materias (user_id, created_at);
create index if not exists idx_clases_user_dia on clases (user_id, dia);
create index if not exists idx_habitos_user_created on habitos (user_id, created_at);
create index if not exists idx_registros_habito_user_fecha on registros_habito (user_id, fecha desc);
create index if not exists idx_fechas_importantes_user_fecha on fechas_importantes (user_id, fecha);
create index if not exists idx_categorias_personales_user_created on categorias_personales (user_id, created_at);
create index if not exists idx_subtareas_pendiente_created on subtareas (pendiente_id, created_at);
