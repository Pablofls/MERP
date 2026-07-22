create table if not exists subtareas (
  id          uuid primary key default gen_random_uuid(),
  pendiente_id uuid not null references pendientes(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  titulo      text not null,
  completado  boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table subtareas enable row level security;

create policy "subtareas: own rows"
  on subtareas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
