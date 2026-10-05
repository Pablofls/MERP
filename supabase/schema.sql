-- MERP — esquema consolidado (foto vigente para trazabilidad; NO se ejecuta tal cual en producción).
-- Las migraciones en supabase/migrations/ son el historial; este archivo es el resultado de aplicarlas todas.
-- Actualizar en el mismo commit que cada migración nueva.
--
-- Refleja hasta: 20261007_unicidad_nombres.sql (aplicadas 20261005 y 20261006; 20261007 es opcional).
-- Normalización: 4FN (clases + clase_dias), FKs compuestas (fk, user_id) para consistencia con RLS.
--
-- Las tablas base (materias, pendientes, habitos, registros_habito) se crearon antes de que el repo
-- guardara DDL: sus definiciones aquí están reconstruidas de los hooks (src/features/**/hooks) y deben
-- contrastarse con la sección 1_columnas / 2_constraints de supabase/diagnostico_esquema.sql.
--
-- Convención RLS: toda tabla tiene user_id y política "auth.uid() = user_id" (FOR ALL).

-- ── materias ────────────────────────────────────────────────────────────────────────────────────
create table materias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  color       text not null,                              -- hex
  created_at  timestamptz not null default now(),
  constraint materias_id_user_key unique (id, user_id)
);
create index idx_materias_user_created on materias (user_id, created_at);
create unique index uq_materias_user_nombre on materias (user_id, lower(btrim(nombre)));         -- 20261007

-- ── clases (4FN): un horario de una materia; los días van en clase_dias ──────────────────────────
create table clases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  materia_id      uuid not null,
  hora_inicio     time not null,
  hora_fin        time not null,
  salon           text,
  fecha_inicio    date,
  fecha_fin       date,
  google_event_id text,                                    -- evento recurrente de Google Calendar
  created_at      timestamptz not null default now(),
  constraint clases_id_user_key unique (id, user_id),
  constraint clases_materia_fk foreign key (materia_id, user_id)
    references materias (id, user_id) on delete cascade,
  constraint clases_horas_ck  check (hora_fin > hora_inicio),
  constraint clases_fechas_ck check (fecha_inicio is null or fecha_fin is null or fecha_fin >= fecha_inicio)
);
create index idx_clases_user_created on clases (user_id, created_at);
create index idx_clases_materia on clases (materia_id);

create table clase_dias (
  clase_id  uuid not null,
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       text not null,
  primary key (clase_id, dia),
  constraint clase_dias_clase_fk foreign key (clase_id, user_id)
    references clases (id, user_id) on delete cascade,
  constraint clase_dias_dia_ck check (dia in ('lunes','martes','miércoles','jueves','viernes','sábado','domingo'))
);
create index idx_clase_dias_user on clase_dias (user_id);

-- clases_legacy: copia de la tabla anterior (una fila por día), solo para rollback.
-- Se elimina con supabase/diferidas/drop_clases_legacy.sql y debe borrarse de este archivo.

-- ── categorias_personales ───────────────────────────────────────────────────────────────────────
create table categorias_personales (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  color       text not null default '#4a3a6b',
  created_at  timestamptz default now(),
  constraint categorias_personales_id_user_key unique (id, user_id)
);
create index idx_categorias_personales_user_created on categorias_personales (user_id, created_at);
create unique index uq_categorias_personales_user_nombre on categorias_personales (user_id, lower(btrim(nombre))); -- 20261007

-- ── pendientes ──────────────────────────────────────────────────────────────────────────────────
create table pendientes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  titulo                text not null,
  descripcion           text,
  fecha_limite          timestamptz,                       -- tipo exacto: confirmar con el diagnóstico
  completado            boolean not null default false,
  tipo                  text not null,                     -- 'escolar' | 'personal'
  materia_id            uuid,
  categoria_personal_id uuid,
  google_task_id        text,
  created_at            timestamptz not null default now(),
  constraint pendientes_id_user_key unique (id, user_id),
  constraint pendientes_materia_fk foreign key (materia_id, user_id)
    references materias (id, user_id) on delete set null (materia_id),
  constraint pendientes_categoria_fk foreign key (categoria_personal_id, user_id)
    references categorias_personales (id, user_id) on delete set null (categoria_personal_id),
  constraint pendientes_tipo_ck check (
    (tipo = 'escolar' and categoria_personal_id is null) or (tipo = 'personal' and materia_id is null))
);
create index idx_pendientes_user_created on pendientes (user_id, created_at desc);
create index idx_pendientes_user_pendiente on pendientes (user_id) where completado = false;
create index idx_pendientes_materia on pendientes (materia_id) where materia_id is not null;
create index idx_pendientes_categoria on pendientes (categoria_personal_id) where categoria_personal_id is not null;
create unique index uq_pendientes_user_google_task on pendientes (user_id, google_task_id) where google_task_id is not null; -- 20261007

create table subtareas (
  id            uuid primary key default gen_random_uuid(),
  pendiente_id  uuid not null,
  user_id       uuid not null references auth.users(id),
  titulo        text not null,
  completado    boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint subtareas_pendiente_fk foreign key (pendiente_id, user_id)
    references pendientes (id, user_id) on delete cascade
);
create index idx_subtareas_pendiente_created on subtareas (pendiente_id, created_at);

-- ── fechas_importantes ──────────────────────────────────────────────────────────────────────────
create table fechas_importantes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null,
  descripcion text,
  fecha       date not null,
  materia_id  uuid,
  tipo        text not null check (tipo in ('examen_final', 'examen_parcial', 'quiz', 'proyecto')),
  completado  boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint fechas_importantes_materia_fk foreign key (materia_id, user_id)
    references materias (id, user_id) on delete set null (materia_id)
);
create index idx_fechas_importantes_user_fecha on fechas_importantes (user_id, fecha);
create index idx_fechas_importantes_materia on fechas_importantes (materia_id) where materia_id is not null;

-- ── hábitos ─────────────────────────────────────────────────────────────────────────────────────
create table habitos (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  topico                text not null,
  tipo_medida           text not null,                     -- 'numerica' | 'booleana'
  unidad                text,                              -- solo numérica
  frecuencia            text not null default 'diaria',    -- 'diaria' | 'semanal'
  meta_semanal          integer,                           -- semanal, modo conteo (1..7)
  meta_cantidad_semanal numeric,                           -- semanal numérica, modo acumulado
  activo                boolean not null default true,
  created_at            timestamptz not null default now(),
  constraint habitos_id_user_key unique (id, user_id),
  constraint habitos_frecuencia_ck check (frecuencia in ('diaria','semanal')),
  constraint habitos_tipo_medida_ck check (tipo_medida in ('numerica','booleana')),
  constraint habitos_metas_ck check (
    (meta_semanal is null or (frecuencia = 'semanal' and meta_semanal between 1 and 7))
    and (meta_cantidad_semanal is null or (frecuencia = 'semanal' and tipo_medida = 'numerica' and meta_cantidad_semanal > 0))
    and not (meta_semanal is not null and meta_cantidad_semanal is not null)
    and (unidad is null or tipo_medida = 'numerica'))
);
create index idx_habitos_user_created on habitos (user_id, created_at);

create table registros_habito (
  id         uuid primary key default gen_random_uuid(),
  habito_id  uuid not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  fecha      date not null,
  valor      numeric not null,                             -- 1 = sí (booleanos)
  constraint registros_habito_habito_fecha_key unique (habito_id, fecha),   -- onConflict del upsert
  constraint registros_habito_habito_fk foreign key (habito_id, user_id)
    references habitos (id, user_id) on delete cascade,
  constraint registros_habito_valor_ck check (valor >= 0)
);
create index idx_registros_habito_user_fecha on registros_habito (user_id, fecha desc);

-- ── google_tokens (1:1 con el usuario) ──────────────────────────────────────────────────────────
create table google_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,                             -- cifrado en servidor
  scope         text,
  updated_at    timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────────────────────────
alter table materias              enable row level security;
alter table clases                enable row level security;
alter table clase_dias            enable row level security;
alter table categorias_personales enable row level security;
alter table pendientes            enable row level security;
alter table subtareas             enable row level security;
alter table fechas_importantes    enable row level security;
alter table habitos               enable row level security;
alter table registros_habito      enable row level security;
alter table google_tokens         enable row level security;

create policy "clases: own rows"      on clases      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "clase_dias: own rows"  on clase_dias  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subtareas: own rows"   on subtareas   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own categorias" on categorias_personales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own fechas_importantes" on fechas_importantes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "google_tokens_own_row" on google_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- materias, pendientes, habitos, registros_habito: política equivalente "auth.uid() = user_id" (nombre exacto: ver 4_politicas_rls del diagnóstico).
