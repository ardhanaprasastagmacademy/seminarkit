-- supabase/schema.sql
-- Skema Database, RLS, Storage, dan Hardening Keamanan seminarkit

-- 1. Helper: updated_at otomatis
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Daftar admin (diisi manual lewat SQL Editor)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- 3. Pengaturan situs (satu baris)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  nama_brand text not null default 'seminarkit',
  tagline text default 'Souvenir Kantor & Paket Seminar Kit Berkualitas',
  wa_number text not null default '6281234567890',   -- format internasional tanpa +, contoh: 6281234567890
  wa_default_text text not null default 'Halo seminarkit, saya ingin bertanya tentang souvenir kantor dan seminar kit.',
  email text default 'halo@seminarkit.id',
  alamat text default 'Jl. Bisnis Raya No. 45, Jakarta Selatan',
  jam_kerja text default 'Senin – Jumat: 08.00 – 17.00 WIB',
  instagram_url text default 'https://instagram.com/seminarkit',
  facebook_url text default 'https://facebook.com/seminarkit',
  tiktok_url text default 'https://tiktok.com/@seminarkit',
  maps_embed_url text,
  updated_at timestamptz not null default now()
);

-- 4. Kategori produk
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  slug text not null unique,
  urutan int not null default 0,
  is_active boolean not null default true
);

-- 5. Produk
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  nama text not null,
  slug text not null unique,
  deskripsi_singkat text not null check (char_length(deskripsi_singkat) <= 200),
  deskripsi_lengkap text,
  harga_mulai numeric(12,0) not null check (harga_mulai >= 0),
  satuan text not null default 'pcs',
  min_order int check (min_order is null or min_order > 0),
  spesifikasi jsonb not null default '{}'::jsonb,
  gambar_url text,
  gambar_alt text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Galeri foto
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  judul text,
  alt_text text not null,
  gambar_url text not null,
  kategori text,
  is_published boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

-- 7. Testimoni
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  perusahaan text,
  jabatan text,
  isi text not null,
  rating smallint check (rating between 1 and 5),
  foto_url text,
  is_published boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

-- 8. FAQ
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  pertanyaan text not null,
  jawaban text not null,
  urutan int not null default 0,
  is_published boolean not null default true
);

-- 9. Artikel blog
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  slug text not null unique,
  meta_description text not null check (char_length(meta_description) <= 160),
  isi text not null,                 -- Markdown
  cover_url text,
  cover_alt text,
  penulis text not null default 'Tim seminarkit',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Permintaan / Inquiry dari kontak form
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  perusahaan text,
  no_wa text not null,
  email text,
  product_id uuid references public.products(id) on delete set null,
  produk_diminati text,
  jumlah int check (jumlah is null or jumlah > 0),
  tanggal_dibutuhkan date,
  pesan text,
  status text not null default 'baru'
    check (status in ('baru','dihubungi','penawaran','selesai','batal')),
  source_page text,
  created_at timestamptz not null default now()
);

-- Indeks performa
create index if not exists idx_products_published on public.products (is_published, is_featured, urutan);
create index if not exists idx_gallery_published on public.gallery (is_published, urutan);
create index if not exists idx_articles_published on public.articles (is_published, published_at desc);
create index if not exists idx_inquiries_status on public.inquiries (status, created_at desc);

-- Triggers updated_at
drop trigger if exists t_products_upd on public.products;
create trigger t_products_upd before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists t_articles_upd on public.articles;
create trigger t_articles_upd before update on public.articles
  for each row execute function public.set_updated_at();

drop trigger if exists t_settings_upd on public.site_settings;
create trigger t_settings_upd before update on public.site_settings
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['admin_users','site_settings','categories','products',
    'gallery','testimonials','faqs','articles','inquiries'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Drop policy lama jika ada untuk idempotensi
drop policy if exists "public read settings" on public.site_settings;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read products" on public.products;
drop policy if exists "public read gallery" on public.gallery;
drop policy if exists "public read testimonials" on public.testimonials;
drop policy if exists "public read faqs" on public.faqs;
drop policy if exists "public read articles" on public.articles;
drop policy if exists "public insert inquiries" on public.inquiries;

-- Baca publik: hanya data aktif / terbit
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "public read categories" on public.categories for select to anon, authenticated using (is_active);
create policy "public read products" on public.products for select to anon, authenticated using (is_published);
create policy "public read gallery" on public.gallery for select to anon, authenticated using (is_published);
create policy "public read testimonials" on public.testimonials for select to anon, authenticated using (is_published);
create policy "public read faqs" on public.faqs for select to anon, authenticated using (is_published);
create policy "public read articles" on public.articles for select to anon, authenticated
  using (is_published and (published_at is null or published_at <= now()));

-- Admin: akses penuh ke semua tabel konten
do $$ declare t text; begin
  foreach t in array array['site_settings','categories','products','gallery',
    'testimonials','faqs','articles','inquiries'] loop
    execute format('drop policy if exists "admin all %I" on public.%I', t, t);
    execute format('create policy "admin all %I" on public.%I for all to authenticated
      using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Form pemesanan: publik hanya boleh INSERT (tidak boleh membaca)
create policy "public insert inquiries" on public.inquiries for insert to anon, authenticated
with check (
  status = 'baru'
  and char_length(nama) between 2 and 100
  and char_length(no_wa) between 8 and 20
  and (pesan is null or char_length(pesan) <= 2000)
);

-- -------------------------------------------------------------
-- HARDENING KEAMANAN (Defense in depth)
-- -------------------------------------------------------------
revoke insert, update, delete, truncate on all tables in schema public from anon;
grant insert (id, nama, perusahaan, no_wa, email, product_id, produk_diminati,
              jumlah, tanggal_dibutuhkan, pesan, source_page)
  on public.inquiries to anon;

alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- Rate limit per nomor WhatsApp (maks 5 permintaan per jam)
create or replace function public.limit_inquiry_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.inquiries
      where no_wa = new.no_wa and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'terlalu banyak permintaan' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists t_inquiries_rate on public.inquiries;
create trigger t_inquiries_rate before insert on public.inquiries
  for each row execute function public.limit_inquiry_rate();

-- -------------------------------------------------------------
-- STORAGE BUCKET (Media)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select to public
  using (bucket_id = 'media');
