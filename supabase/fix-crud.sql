-- supabase/fix-crud.sql
-- Skrip perbaikan izin CRUD untuk Supabase seminarkit
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda (https://supabase.com)

-- 1. Berikan izin akses CRUD penuh ke tabel schema public
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- 2. Nonaktifkan Row Level Security (RLS) pada tabel konten agar Serverless Vercel & Admin dapat melakukan CRUD
alter table if exists public.products disable row level security;
alter table if exists public.categories disable row level security;
alter table if exists public.gallery disable row level security;
alter table if exists public.testimonials disable row level security;
alter table if exists public.faqs disable row level security;
alter table if exists public.articles disable row level security;
alter table if exists public.site_settings disable row level security;
alter table if exists public.inquiries disable row level security;

-- 3. Siapkan storage bucket 'media' dan izinkan akses upload/hapus gambar
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/jpeg','image/png','image/gif','image/svg+xml'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

drop policy if exists "media public read" on storage.objects;
drop policy if exists "media all access" on storage.objects;
drop policy if exists "media admin write" on storage.objects;

create policy "media public read" on storage.objects
  for select to public using (bucket_id = 'media');

create policy "media all access" on storage.objects
  for all to public using (bucket_id = 'media') with check (bucket_id = 'media');

