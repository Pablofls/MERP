-- Closet: aplicación para digitalizar la ropa (prendas recortadas a mano) y generar outfits.
--
--  * closet_grupos          catálogo global: Gorras, Tops, Bottoms, Calzado, Accesorios.
--  * closet_categorias      catálogo global: cada categoría pertenece a un grupo (el usuario elige grupo y luego
--                           categoría al registrar una prenda).
--  * closet_categorias_top  subtipo de closet_categorias (grupo = 'tops') con su capa: 1 camisas/camisetas,
--                           2 suéteres/sudaderas, 3 chamarras. La regla "una capa 3 puede actuar como capa 2"
--                           vive en el generador de outfits (código), no en la BD.
--  * closet_prendas         una fila por prenda del usuario; la imagen (recorte con fondo transparente) vive en el
--                           bucket público `closet` bajo <user_id>/<prenda_id>.<ext>.
--
-- Normalización: en los catálogos todo depende solo de su clave (BCNF). El subtipo usa FK compuesta
-- (clave, grupo_clave), el mismo patrón que plantillas_pendientes, para que solo los tops tengan capa sin
-- columnas nulas. closet_prendas no guarda el grupo (se obtiene de la categoría: sin dependencia transitiva)
-- y no tiene dependencias multivaluadas (una prenda = una categoría y una imagen) → 4FN.
--
-- Cambio ADITIVO: el módulo se agrega con activo_por_defecto = false; nadie lo ve hasta activarlo en Módulos.
--
-- Ejecutar completo en el SQL Editor de Supabase. Es una sola transacción: si cualquier aserción falla,
-- no se aplica nada. Requiere 20261106_modulos.sql. Correr ANTES de desplegar la rama feat/closet.

begin;

-- 0. Guardia ------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.modulos') is null then
    raise exception 'closet: falta la tabla modulos (correr antes 20261106_modulos.sql)';
  end if;
end $$;

-- 1. Catálogo de grupos y categorías ---------------------------------------------------------------
create table closet_grupos (
  clave   text     primary key,
  nombre  text     not null,
  orden   smallint not null,
  constraint closet_grupos_clave_ck check (clave ~ '^[a-z][a-z_]*$')
);

create table closet_categorias (
  clave        text     primary key,
  grupo_clave  text     not null references closet_grupos (clave),
  nombre       text     not null,
  orden        smallint not null,
  constraint closet_categorias_clave_grupo_key unique (clave, grupo_clave),
  constraint closet_categorias_clave_ck check (clave ~ '^[a-z][a-z_]*$')
);

create table closet_categorias_top (
  categoria_clave  text     primary key,
  grupo_clave      text     not null default 'tops',
  capa             smallint not null,
  constraint closet_categorias_top_grupo_ck check (grupo_clave = 'tops'),
  constraint closet_categorias_top_capa_ck check (capa between 1 and 3),
  constraint closet_categorias_top_categoria_fk foreign key (categoria_clave, grupo_clave)
    references closet_categorias (clave, grupo_clave)
);

insert into closet_grupos (clave, nombre, orden) values
  ('gorras',     'Gorras',     1),
  ('tops',       'Tops',       2),
  ('bottoms',    'Bottoms',    3),
  ('calzado',    'Calzado',    4),
  ('accesorios', 'Accesorios', 5);

insert into closet_categorias (clave, grupo_clave, nombre, orden) values
  ('gorras',     'gorras',     'Gorras, sombreros y gorros', 1),
  ('camisas',    'tops',       'Camisas y camisetas',        2),
  ('sueteres',   'tops',       'Suéteres y sudaderas',       3),
  ('chamarras',  'tops',       'Chamarras',                  4),
  ('shorts',     'bottoms',    'Shorts',                     5),
  ('pantalones', 'bottoms',    'Pantalones y jeans',         6),
  ('calzado',    'calzado',    'Calzado',                    7),
  ('accesorios', 'accesorios', 'Accesorios',                 8);

insert into closet_categorias_top (categoria_clave, capa) values
  ('camisas',   1),
  ('sueteres',  2),
  ('chamarras', 3);

-- 2. Prendas del usuario ---------------------------------------------------------------------------
create table closet_prendas (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  categoria_clave  text        not null references closet_categorias (clave),
  nombre           text,
  imagen_path      text        not null,                 -- objeto en el bucket `closet`
  ancho            integer     not null,                 -- px del recorte (para reservar el espacio al cargar)
  alto             integer     not null,
  created_at       timestamptz not null default now(),
  constraint closet_prendas_id_user_key unique (id, user_id),
  constraint closet_prendas_imagen_key unique (imagen_path),
  constraint closet_prendas_imagen_ck check (imagen_path like user_id::text || '/%'),
  constraint closet_prendas_dims_ck check (ancho between 1 and 4096 and alto between 1 and 4096),
  constraint closet_prendas_nombre_ck check (nombre is null or char_length(btrim(nombre)) between 1 and 80)
);
create index idx_closet_prendas_user_created on closet_prendas (user_id, created_at desc);

-- 3. Módulo en el catálogo ---------------------------------------------------------------------------
insert into modulos (clave, clase, nombre, descripcion, orden, activo_por_defecto) values
  ('closet', 'aplicacion', 'Closet',
   'Digitaliza tu ropa recortando cada prenda y genera outfits al azar.', 4, false);

-- 4. RLS ----------------------------------------------------------------------------------------
alter table closet_grupos         enable row level security;
alter table closet_categorias     enable row level security;
alter table closet_categorias_top enable row level security;
alter table closet_prendas        enable row level security;

create policy "closet_grupos: lectura"         on closet_grupos         for select to authenticated using (true);
create policy "closet_categorias: lectura"     on closet_categorias     for select to authenticated using (true);
create policy "closet_categorias_top: lectura" on closet_categorias_top for select to authenticated using (true);
revoke insert, update, delete, truncate on closet_grupos, closet_categorias, closet_categorias_top from anon, authenticated;

create policy "closet_prendas: own rows" on closet_prendas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Storage: bucket público; cada usuario solo escribe/borra en su carpeta <user_id>/ ---------------
-- Público = la imagen se lee con su URL (ruta con UUID aleatorio, no adivinable); listar sigue sujeto a RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('closet', 'closet', true, 3145728, array['image/png', 'image/webp']);

create policy "closet: subir en carpeta propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "closet: ver carpeta propia" on storage.objects
  for select to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "closet: borrar de carpeta propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 6. Aserciones -----------------------------------------------------------------------------------
do $$
declare
  n_grupos      int;
  n_categorias  int;
  n_tops_sin    int;
begin
  select count(*) into n_grupos     from closet_grupos;
  select count(*) into n_categorias from closet_categorias;
  if n_grupos <> 5 or n_categorias <> 8 then
    raise exception 'closet: grupos=% categorias=% (se esperaban 5 y 8)', n_grupos, n_categorias;
  end if;

  select count(*) into n_tops_sin
  from closet_categorias c
  where c.grupo_clave = 'tops'
    and not exists (select 1 from closet_categorias_top t where t.categoria_clave = c.clave);
  if n_tops_sin <> 0 then
    raise exception 'closet: % categorías de tops sin capa', n_tops_sin;
  end if;

  if not exists (select 1 from modulos where clave = 'closet' and clase = 'aplicacion') then
    raise exception 'closet: no se registró el módulo';
  end if;

  if not exists (select 1 from storage.buckets where id = 'closet' and public) then
    raise exception 'closet: no se creó el bucket público closet';
  end if;

  raise notice 'closet ok: % grupos, % categorías, módulo y bucket creados', n_grupos, n_categorias;
end $$;

commit;

-- Verificación posterior (opcional):
--   select g.orden, g.nombre as grupo, c.nombre as categoria, t.capa
--   from closet_categorias c
--   join closet_grupos g on g.clave = c.grupo_clave
--   left join closet_categorias_top t on t.categoria_clave = c.clave
--   order by g.orden, c.orden;
--
-- Rollback (borra las prendas). Primero vaciar y eliminar el bucket `closet` desde Storage en el dashboard
-- (Supabase no permite borrar filas de storage.* con SQL), luego:
--   begin;
--   drop policy if exists "closet: subir en carpeta propia" on storage.objects;
--   drop policy if exists "closet: ver carpeta propia" on storage.objects;
--   drop policy if exists "closet: borrar de carpeta propia" on storage.objects;
--   delete from usuario_modulos where modulo_clave = 'closet';
--   delete from modulos where clave = 'closet';
--   drop table if exists closet_prendas;
--   drop table if exists closet_categorias_top;
--   drop table if exists closet_categorias;
--   drop table if exists closet_grupos;
--   commit;
