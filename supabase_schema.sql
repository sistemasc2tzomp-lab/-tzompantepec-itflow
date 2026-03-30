-- ============================================================
-- MESA DE SERVICIOS TI — H. Ayuntamiento de Tzompantepec
-- Schema completo para Supabase
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. EXTENSIONES
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 2. ENUM: estados y prioridades
-- ─────────────────────────────────────────────
create type ticket_estado as enum ('activo', 'pendiente', 'atendido', 'cerrado');
create type ticket_prioridad as enum ('baja', 'media', 'alta');
create type user_rol as enum ('usuario', 'tecnico', 'admin');

-- ─────────────────────────────────────────────
-- 3. TABLA: perfiles de usuario
-- ─────────────────────────────────────────────
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  departamento text,
  rol         user_rol not null default 'usuario',
  avatar_url  text,
  creado_en   timestamptz not null default now()
);

-- Trigger: crea perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- 4. TABLA: tickets
-- ─────────────────────────────────────────────
create table public.tickets (
  id            uuid primary key default uuid_generate_v4(),
  numero        serial unique,                          -- TK-001, TK-002…
  asunto        text not null,
  descripcion   text not null,
  departamento  text not null,
  estado        ticket_estado not null default 'activo',
  prioridad     ticket_prioridad not null default 'media',
  creado_por    uuid not null references public.perfiles(id),
  asignado_a    uuid references public.perfiles(id),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  cerrado_en    timestamptz
);

-- Índices útiles para filtros frecuentes
create index idx_tickets_estado      on public.tickets(estado);
create index idx_tickets_creado_por  on public.tickets(creado_por);
create index idx_tickets_asignado_a  on public.tickets(asignado_a);
create index idx_tickets_creado_en   on public.tickets(creado_en desc);

-- Trigger: actualiza updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- 5. TABLA: fotos de tickets
-- ─────────────────────────────────────────────
create table public.ticket_fotos (
  id          uuid primary key default uuid_generate_v4(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  storage_path text not null,       -- ruta en Supabase Storage
  nombre      text,
  tamanio     integer,              -- bytes
  mime_type   text,
  subido_por  uuid not null references public.perfiles(id),
  subido_en   timestamptz not null default now()
);

create index idx_fotos_ticket_id on public.ticket_fotos(ticket_id);

-- ─────────────────────────────────────────────
-- 6. TABLA: historial de cambios de estado
-- ─────────────────────────────────────────────
create table public.ticket_historial (
  id           uuid primary key default uuid_generate_v4(),
  ticket_id    uuid not null references public.tickets(id) on delete cascade,
  estado_prev  ticket_estado,
  estado_nuevo ticket_estado not null,
  nota         text,
  cambiado_por uuid not null references public.perfiles(id),
  cambiado_en  timestamptz not null default now()
);

create index idx_historial_ticket_id on public.ticket_historial(ticket_id);

-- Trigger: registra historial automáticamente al cambiar estado
create or replace function public.registrar_cambio_estado()
returns trigger language plpgsql as $$
begin
  if old.estado is distinct from new.estado then
    insert into public.ticket_historial (ticket_id, estado_prev, estado_nuevo, cambiado_por)
    values (new.id, old.estado, new.estado, auth.uid());

    -- Si se cierra el ticket, guarda la fecha de cierre
    if new.estado = 'cerrado' then
      new.cerrado_en = now();
    end if;
  end if;
  return new;
end;
$$;

create trigger on_ticket_estado_changed
  before update on public.tickets
  for each row execute procedure public.registrar_cambio_estado();

-- ─────────────────────────────────────────────
-- 7. TABLA: comentarios en tickets
-- ─────────────────────────────────────────────
create table public.ticket_comentarios (
  id          uuid primary key default uuid_generate_v4(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  autor_id    uuid not null references public.perfiles(id),
  contenido   text not null,
  es_interno  boolean not null default false,  -- true = solo técnicos/admin ven el comentario
  creado_en   timestamptz not null default now()
);

create index idx_comentarios_ticket_id on public.ticket_comentarios(ticket_id);

-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
alter table public.perfiles          enable row level security;
alter table public.tickets           enable row level security;
alter table public.ticket_fotos      enable row level security;
alter table public.ticket_historial  enable row level security;
alter table public.ticket_comentarios enable row level security;

-- Helpers para verificar rol
create or replace function public.get_rol()
returns user_rol language sql security definer stable as $$
  select rol from public.perfiles where id = auth.uid();
$$;

create or replace function public.es_admin_o_tecnico()
returns boolean language sql security definer stable as $$
  select rol in ('admin', 'tecnico') from public.perfiles where id = auth.uid();
$$;

-- ── PERFILES ──────────────────────────────────
-- Usuarios ven su propio perfil; admin/técnico ven todos
create policy "perfil_select_propio" on public.perfiles
  for select using (id = auth.uid() or public.es_admin_o_tecnico());

create policy "perfil_update_propio" on public.perfiles
  for update using (id = auth.uid());

-- ── TICKETS ───────────────────────────────────
-- Usuario: solo ve y edita sus propios tickets
create policy "tickets_select_usuario" on public.tickets
  for select using (
    creado_por = auth.uid() or public.es_admin_o_tecnico()
  );

create policy "tickets_insert_usuario" on public.tickets
  for insert with check (creado_por = auth.uid());

-- Usuario puede actualizar solo campos permitidos de sus tickets
-- (técnico/admin pueden actualizar cualquier ticket)
create policy "tickets_update" on public.tickets
  for update using (
    creado_por = auth.uid() or public.es_admin_o_tecnico()
  );

create policy "tickets_delete_admin" on public.tickets
  for delete using (public.get_rol() = 'admin');

-- ── FOTOS ─────────────────────────────────────
create policy "fotos_select" on public.ticket_fotos
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.creado_por = auth.uid() or public.es_admin_o_tecnico())
    )
  );

create policy "fotos_insert" on public.ticket_fotos
  for insert with check (subido_por = auth.uid());

create policy "fotos_delete" on public.ticket_fotos
  for delete using (
    subido_por = auth.uid() or public.get_rol() = 'admin'
  );

-- ── HISTORIAL ─────────────────────────────────
create policy "historial_select" on public.ticket_historial
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.creado_por = auth.uid() or public.es_admin_o_tecnico())
    )
  );

-- ── COMENTARIOS ───────────────────────────────
create policy "comentarios_select" on public.ticket_comentarios
  for select using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and (t.creado_por = auth.uid() or public.es_admin_o_tecnico())
    )
    -- Comentarios internos solo para técnicos/admin
    and (es_interno = false or public.es_admin_o_tecnico())
  );

create policy "comentarios_insert" on public.ticket_comentarios
  for insert with check (autor_id = auth.uid());

-- ─────────────────────────────────────────────
-- 9. STORAGE: bucket para fotos de tickets
-- ─────────────────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-fotos',
  'ticket-fotos',
  false,                        -- privado
  5242880,                      -- 5 MB máximo por archivo
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Políticas de storage
create policy "storage_select" on storage.objects
  for select using (
    bucket_id = 'ticket-fotos'
    and auth.role() = 'authenticated'
  );

create policy "storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'ticket-fotos'
    and auth.role() = 'authenticated'
    -- Ruta: ticket-fotos/{ticket_id}/{user_id}/{filename}
    and (storage.foldername(name))[1] is not null
  );

create policy "storage_delete" on storage.objects
  for delete using (
    bucket_id = 'ticket-fotos'
    and (auth.uid()::text = (storage.foldername(name))[2]
         or public.get_rol() = 'admin')
  );

-- ─────────────────────────────────────────────
-- 10. VISTA útil: tickets con datos del creador
-- ─────────────────────────────────────────────
create or replace view public.vista_tickets as
  select
    t.id,
    t.numero,
    'TK-' || lpad(t.numero::text, 3, '0') as numero_display,
    t.asunto,
    t.descripcion,
    t.departamento,
    t.estado,
    t.prioridad,
    t.creado_en,
    t.actualizado_en,
    t.cerrado_en,
    p.nombre  as creado_por_nombre,
    p.email   as creado_por_email,
    tec.nombre as tecnico_nombre,
    (select count(*) from public.ticket_fotos f where f.ticket_id = t.id) as total_fotos,
    (select count(*) from public.ticket_comentarios c where c.ticket_id = t.id) as total_comentarios
  from public.tickets t
  join public.perfiles p   on p.id  = t.creado_por
  left join public.perfiles tec on tec.id = t.asignado_a;
