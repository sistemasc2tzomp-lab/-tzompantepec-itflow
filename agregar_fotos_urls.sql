-- Agregar columna fotos_urls a la tabla tickets existente
-- Ejecuta esto en Supabase → SQL Editor

alter table public.tickets
  add column if not exists fotos_urls text[] default '{}';
