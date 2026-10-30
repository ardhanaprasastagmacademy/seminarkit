# PRD — Website seminarkit (Souvenir Kantor & Paket Seminar Kit)

| | |
|---|---|
| **Versi** | 1.0 (draf awal) |
| **Tanggal** | 25 Oktober 2026 |
| **Brand** | seminarkit |
| **Stack** | Astro + Supabase + Bootstrap 5 (HTML, CSS kustom, JavaScript vanilla) |
| **Bahasa situs** | Indonesia (`lang="id"`) |

---

## 1. Ringkasan

seminarkit adalah website company profile sekaligus katalog untuk souvenir kantor dan paket seminar kit. Konten produk, galeri, testimoni, FAQ, dan blog dikelola lewat database sehingga bisa diubah tanpa deploy ulang. Calon pembeli menghubungi lewat WhatsApp; setiap permintaan juga tersimpan di database sebagai lead.

### 1.1 Tujuan

1. Menampilkan katalog produk, galeri, dan blog yang dinamis dari Supabase.
2. Mengumpulkan lead lewat tombol "Pesan via WA" dan form pemesanan (masuk ke WhatsApp dan database).
3. Mendapatkan trafik organik lewat SEO, AEO, dan GEO dengan PageSpeed mobile yang baik.
4. Memberi admin panel sederhana agar pemilik bisa mengelola konten sendiri.

### 1.2 Di dalam scope (Fase 1)

- 6 halaman publik sesuai permintaan: beranda, tentang, produk, galeri, blog, kontak.
- Halaman pendukung yang diperlukan agar tombol berfungsi: detail produk, detail artikel, 404.
- Tombol WhatsApp melayang di semua halaman, dengan scroll bar di atasnya.
- Backend Supabase: database, RLS, storage gambar, auth admin.
- Admin panel (CRUD konten + daftar pesan masuk).
- SEO teknis: meta, Open Graph, JSON-LD, sitemap, robots.

### 1.3 Di luar scope (Fase 1)

Keranjang dan checkout, pembayaran online, akun pelanggan, multi-bahasa, notifikasi email otomatis (opsional Fase 2).

---

## 2. Keputusan Teknis

| Area | Keputusan | Alasan |
|---|---|---|
| Framework | Astro dengan adapter Vercel | HTML server-rendered, JS minimal, bagus untuk SEO dan PageSpeed |
| Rendering | SSR + header cache CDN (`s-maxage`, `stale-while-revalidate`) | Data dari Supabase selalu segar tanpa rebuild, tetap cepat. Alternatif: prerender + deploy hook |
| UI | Bootstrap 5 (npm) + CSS kustom + JS vanilla | Sesuai permintaan. Impor hanya modul JS Bootstrap yang dipakai |
| Database | Supabase Postgres | Relasional, RLS bawaan |
| Auth | Supabase Auth (email + password), hanya untuk admin | Pendaftaran publik dimatikan |
| File gambar | Supabase Storage (bucket publik `media`) | Satu tempat untuk semua gambar |
| Anti-spam | Honeypot + Cloudflare Turnstile + validasi server | Form publik rawan bot |
| Hosting | Vercel | Sudah satu ekosistem dengan adapter Astro |

> Setelah `npm create astro`, cek dokumentasi versi Astro dan adapter yang terpasang untuk sintaks output (`server` atau `static` + `prerender = false`).

### 2.1 Environment variables

Supabase kini memakai **publishable key** (`sb_publishable_...`) menggantikan `anon`, dan **secret key** (`sb_secret_...`) menggantikan `service_role`. Proyek baru tidak lagi punya key lama, jadi dokumen ini memakai nama key yang baru.

```bash
# .env.example
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx   # aman di browser, dibatasi RLS
PUBLIC_TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx                             # hanya server
PUBLIC_SITE_URL=https://seminarkit.example           # untuk canonical, sitemap, OG
```

Secret key **tidak dipakai di Fase 1**. Admin bekerja dengan JWT login + RLS, dan form pemesanan memakai policy insert-only. Jika nanti perlu (misalnya notifikasi), simpan hanya di server dan jangan pernah diberi prefix `PUBLIC_`.

---

## 3. Sitemap & Routing

| Route | Halaman | Sumber data |
|---|---|---|
| `/` | Beranda | `products` (unggulan), `gallery`, `testimonials`, `faqs`, `site_settings` |
| `/tentang` | Tentang | Statis (`src/data/site.ts`) |
| `/produk` | Daftar produk | `products`, `categories` |
| `/produk/[slug]` | Detail produk | `products` |
| `/galeri` | Galeri | `gallery` |
| `/blog` | Daftar artikel | `articles` |
| `/blog/[slug]` | Detail artikel | `articles` |
| `/kontak` | Kontak + form pemesanan | `site_settings`, `products` (pilihan produk) |
| `/404` | Halaman tidak ditemukan | Statis |
| `/api/inquiry` | Endpoint form pemesanan (POST) | menulis ke `inquiries` |
| `/sitemap.xml`, `/robots.txt` | SEO | dibangkitkan dari database |
| `/admin/*` | Admin panel (noindex) | semua tabel |

---

## 4. Komponen Global (ada di semua halaman)

### 4.1 Navbar
Logo seminarkit di kiri. Menu: Beranda, Tentang, Produk, Galeri, Blog, Kontak. Tombol "Pesan Sekarang" mengarah ke WhatsApp. Sticky, collapse di mobile (JS navbar Bootstrap), tautan aktif ditandai sesuai route.

### 4.2 Page Banner + Breadcrumb
Dipakai di semua halaman kecuali beranda. Berisi judul H1 halaman, deskripsi satu kalimat, dan breadcrumb (`Beranda > Produk`). Breadcrumb memakai markup `<nav aria-label="breadcrumb">` dan disertai JSON-LD `BreadcrumbList`.

### 4.3 CTA Section
Komponen yang dipakai ulang dengan props `judul`, `deskripsi`, `labelWa`. Berisi dua tombol: "Chat WhatsApp" dan "Isi Form Pemesanan" (`/kontak`).

### 4.4 Footer
Logo + deskripsi singkat, tautan cepat, kontak (alamat, WhatsApp, email), jam kerja, sosial media. Data diambil dari `site_settings`.

### 4.5 WhatsApp Melayang + Scroll Bar (wajib di semua halaman)

Perilaku:

- Tombol bulat 56px, `position: fixed`, kanan bawah, dengan jarak dari tepi mengikuti `env(safe-area-inset-*)`.
- **Di atas tombol** ada bar vertikal tipis (track 6px × 64px). Tinggi isinya mengikuti persentase scroll halaman (0–100%).
- Klik tombol membuka `wa.me/<nomor>?text=<pesan>` di tab baru. Pesan otomatis menyertakan judul halaman, misalnya "Halo seminarkit, saya melihat halaman *Produk* dan ingin bertanya."
- Bar bersifat dekoratif (`aria-hidden="true"`), tombol punya `aria-label="Chat WhatsApp seminarkit"`.
- Z-index di bawah modal/lightbox. Update scroll dibatasi dengan `requestAnimationFrame` dan listener `passive`.
- Nomor WA berasal dari `site_settings.wa_number`.

Contoh implementasi:

```html
<!-- components/WhatsAppFloat.astro -->
<div class="wa-float" data-wa-float>
  <div class="wa-float__track" aria-hidden="true"><span class="wa-float__fill"></span></div>
  <a class="wa-float__btn" href={waUrl} target="_blank" rel="noopener noreferrer"
     aria-label="Chat WhatsApp seminarkit">
    <!-- SVG ikon WhatsApp inline -->
  </a>
</div>
```

```css
.wa-float { position: fixed; right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom)); z-index: 1030;
  display: flex; flex-direction: column; align-items: center; gap: 10px; }
.wa-float__track { width: 6px; height: 64px; border-radius: 6px; overflow: hidden;
  background: var(--sk-bg); border: 1px solid var(--sk-slate-700);
  display: flex; align-items: flex-end; }
.wa-float__fill { width: 100%; height: calc(var(--wa-progress, 0) * 1%);
  background: var(--sk-slate-700); }
.wa-float__btn { width: 56px; height: 56px; border-radius: 50%; background: var(--sk-slate-700);
  border: 2px solid var(--sk-khaki-500); color: #fff;
  display: grid; place-items: center; box-shadow: 0 8px 24px rgb(0 0 0 / .22); }
```

```js
// scripts/wa-float.js
const el = document.querySelector('[data-wa-float]');
let ticking = false;
function update() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = max > 0 ? Math.min(100, Math.round((scrollY / max) * 100)) : 0;
  el.style.setProperty('--wa-progress', pct);
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
update();
```

---

## 5. Spesifikasi Halaman

### 5.1 Beranda (`/`)

Urutan section:

1. **Hero** — H1 (kata kunci utama: souvenir kantor / seminar kit), subjudul, dua tombol (Lihat Produk, Pesan via WA), gambar hero (`fetchpriority="high"`, ukuran eksplisit).
2. **Tentang** — ringkasan singkat + gambar + tautan "Selengkapnya" ke `/tentang`. Konten statis.
3. **Kenapa Pilih Kami** — **satu card** besar berisi **4 keunggulan** (nomor urut 01–04, judul, satu kalimat; tanpa ikon). Konten statis.
4. **Produk** (dinamis) — **3 card** dari `products` dengan `is_featured = true`, urut `urutan`. Tiap card: gambar, nama, **harga** ("Mulai Rp 25.000 / pcs"), **deskripsi singkat** (maks. 3 baris), tombol **Detail Produk** (`/produk/[slug]`) dan **Pesan via WA** (pesan otomatis memuat nama produk). Tombol "Lihat Semua Produk" di bawah.
5. **Galeri** (dinamis) — 6–8 foto terbaru dari `gallery`, grid rapi, klik membuka lightbox. Tombol "Lihat Galeri".
6. **Testimoni** (dinamis) — hingga 6 card dari `testimonials` (nama, perusahaan, isi). Grid 3 kolom di desktop, scroll-snap horizontal di mobile.
7. **FAQ** (dinamis) — accordion Bootstrap dari `faqs` (6–8 item) + JSON-LD `FAQPage`.
8. **CTA** — komponen CTA global.

### 5.2 Tentang (`/tentang`)

1. Page banner + breadcrumb.
2. **Tentang** — profil seminarkit, cerita singkat, gambar.
3. **Perbedaan dengan perusahaan lain** — tabel perbandingan 5–6 baris (seminarkit vs vendor umum), misalnya transparansi harga, minimal order, proses desain, ketepatan waktu. Gunakan klaim yang bisa dibuktikan, hindari superlatif tanpa bukti.
4. **Keunggulan** — grid card keunggulan lengkap (6 item).
5. **CTA**.

Semua konten halaman ini statis dan disimpan di `src/data/site.ts`.

### 5.3 Produk (`/produk`)

1. Page banner + breadcrumb.
2. **Section produk** (dinamis) — grid 3 kolom desktop / 2 tablet / 1 mobile. Card sama dengan beranda. Filter kategori berupa pill yang memakai query string (`?kategori=seminar-kit`) sehingga dirender di server dan bisa dibagikan. Pagination `?page=` jika lebih dari 12 produk.
3. **CTA**.

**Detail produk (`/produk/[slug]`)** — dibutuhkan agar tombol "Detail Produk" berfungsi: gambar, nama, harga mulai, minimal order, deskripsi lengkap, tabel spesifikasi (dari `spesifikasi` jsonb), tombol Pesan via WA, produk terkait, JSON-LD `Product`.

### 5.4 Galeri (`/galeri`)

1. Page banner + breadcrumb.
2. **Section galeri** (dinamis) — grid foto dari `gallery`, lazy-load, klik membuka lightbox (modal Bootstrap + JS vanilla: navigasi prev/next, tombol Esc, fokus terkunci). Pagination `?page=` (12 per halaman).
3. **CTA**.

### 5.5 Blog (`/blog`)

1. Page banner + breadcrumb.
2. **Section blog** (dinamis) — grid card dari `articles` (hanya yang `is_published` dan `published_at <= now()`), urut terbaru. Card: gambar sampul (opsional), **judul**, **meta deskripsi**, **tanggal** (format "25 Oktober 2026"), tombol **Baca Selengkapnya**. Pagination 9 per halaman.

**Detail artikel (`/blog/[slug]`)** — judul H1, penulis, tanggal terbit dan diperbarui, daftar isi dari heading, isi artikel (Markdown dirender di server lalu disanitasi), tautan internal ke produk, artikel terkait, JSON-LD `BlogPosting`.

### 5.6 Kontak (`/kontak`)

1. Page banner + breadcrumb.
2. Dua kolom: info kontak (alamat, WhatsApp, email, jam kerja, peta opsional dengan iframe lazy-load) dan **form kontak pemesanan**.

**Field form:**

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| Nama | teks | Ya | 2–100 karakter |
| Perusahaan/instansi | teks | Tidak | maks. 150 |
| No. WhatsApp | tel | Ya | 8–20 digit, dinormalisasi ke format 62… |
| Email | email | Tidak | format valid |
| Produk diminati | select (dari `products`) + "Lainnya" | Tidak | |
| Jumlah | angka | Tidak | ≥ 1 |
| Tanggal dibutuhkan | date | Tidak | tidak boleh masa lalu |
| Pesan / kebutuhan | textarea | Tidak | maks. 2000 |
| `website` (honeypot) | tersembunyi | — | harus kosong |
| Turnstile | widget | Ya | diverifikasi di server |

**Alur submit:**

1. Validasi di klien (Bootstrap validation), kirim JSON ke `POST /api/inquiry`.
2. Server memverifikasi honeypot dan Turnstile, memvalidasi ulang, membuat `id` (UUID) dan kode referensi, lalu menyimpan ke `inquiries`.
3. Server membalas `{ ok, saved, waUrl }`. Jika penyimpanan database gagal, tetap kirim `waUrl` (`saved: false`) agar lead tidak hilang.
4. Klien menampilkan pesan sukses, lalu mengarahkan ke `waUrl` (`location.assign`, bukan `window.open` setelah `fetch`, karena pop-up sering diblokir Safari iOS). Sediakan tombol "Buka WhatsApp" sebagai cadangan.

Format pesan WhatsApp:

```
Halo seminarkit, saya {nama} dari {perusahaan}.
Produk: {produk}
Jumlah: {jumlah}
Dibutuhkan: {tanggal}
Catatan: {pesan}
Ref: #{kode}
```

---

## 6. Rekomendasi Backend (Supabase)

### 6.1 Arsitektur

```
Browser ──► Astro SSR (Vercel, cache CDN) ──► Supabase (Postgres + RLS)
   │                                              ▲
   ├─ Form pemesanan ► /api/inquiry ──────────────┤ insert-only (RLS)
   └─ Admin panel (JS vanilla + JWT login) ───────┘ CRUD (RLS: is_admin)
                         Supabase Storage (bucket publik `media`)
```

Prinsip: **keamanan data ada di RLS**, bukan di tampilan. Publishable key boleh terlihat di browser karena hak aksesnya dibatasi policy.

### 6.2 Skema database

Jalankan di SQL Editor Supabase.

```sql
-- Helper: updated_at otomatis
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- Daftar admin (diisi manual lewat SQL Editor)
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- Pengaturan situs (satu baris)
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  nama_brand text not null default 'seminarkit',
  tagline text,
  wa_number text not null,   -- format internasional tanpa +, contoh: 628123456789
  wa_default_text text not null default 'Halo seminarkit, saya ingin bertanya tentang souvenir kantor.',
  email text, alamat text, jam_kerja text,
  instagram_url text, facebook_url text, tiktok_url text, maps_embed_url text,
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  slug text not null unique,
  urutan int not null default 0,
  is_active boolean not null default true
);

create table public.products (
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

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  judul text,
  alt_text text not null,
  gambar_url text not null,
  kategori text,
  is_published boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

create table public.testimonials (
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

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  pertanyaan text not null,
  jawaban text not null,
  urutan int not null default 0,
  is_published boolean not null default true
);

create table public.articles (
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

create table public.inquiries (
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

-- Indeks
create index on public.products (is_published, is_featured, urutan);
create index on public.gallery (is_published, urutan);
create index on public.articles (is_published, published_at desc);
create index on public.inquiries (status, created_at desc);

-- Trigger updated_at
create trigger t_products_upd before update on public.products
  for each row execute function public.set_updated_at();
create trigger t_articles_upd before update on public.articles
  for each row execute function public.set_updated_at();
create trigger t_settings_upd before update on public.site_settings
  for each row execute function public.set_updated_at();
```

### 6.3 Row Level Security

```sql
-- Aktifkan RLS di semua tabel
do $$ declare t text; begin
  foreach t in array array['admin_users','site_settings','categories','products',
    'gallery','testimonials','faqs','articles','inquiries'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Baca publik: hanya konten yang dipublikasikan
create policy "public read" on public.site_settings for select to anon, authenticated using (true);
create policy "public read" on public.categories   for select to anon, authenticated using (is_active);
create policy "public read" on public.products     for select to anon, authenticated using (is_published);
create policy "public read" on public.gallery      for select to anon, authenticated using (is_published);
create policy "public read" on public.testimonials for select to anon, authenticated using (is_published);
create policy "public read" on public.faqs         for select to anon, authenticated using (is_published);
create policy "public read" on public.articles     for select to anon, authenticated
  using (is_published and published_at <= now());

-- Admin: akses penuh
do $$ declare t text; begin
  foreach t in array array['site_settings','categories','products','gallery',
    'testimonials','faqs','articles','inquiries'] loop
    execute format('create policy "admin all" on public.%I for all to authenticated
      using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Form pemesanan: publik hanya boleh INSERT (tidak bisa membaca)
create policy "public insert" on public.inquiries for insert to anon, authenticated
with check (
  status = 'baru'
  and char_length(nama) between 2 and 100
  and char_length(no_wa) between 8 and 20
  and (pesan is null or char_length(pesan) <= 2000)
);
-- admin_users: tanpa policy = tertutup untuk semua. Dicek lewat fungsi is_admin().
```

Catatan:

- Untuk insert publik, panggil `insert(...)` **tanpa** `.select()`, karena publik memang tidak punya hak baca di `inquiries`. Karena itu `id` dibuat di server sebelum insert.
- Jika query ditolak padahal policy sudah benar, periksa `GRANT` tabel ke role `anon` dan `authenticated`.

### 6.4 Storage

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "media admin write" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
```

- Struktur folder: `products/`, `gallery/`, `blog/`, `testimonials/`.
- Admin panel mengompres gambar sebelum upload: ubah ke WebP, sisi terpanjang maks. 1600px (canvas API). Simpan juga versi thumbnail 480px untuk card.
- Gambar yang ditampilkan wajib punya `alt`, `width`, `height`.

### 6.5 Autentikasi admin

- Aktifkan login email + password, **matikan pendaftaran publik** di pengaturan Auth.
- Buat satu akun admin di dashboard, lalu tambahkan ke `admin_users` lewat SQL Editor:
  `insert into public.admin_users (user_id) select id from auth.users where email = 'admin@contoh.com';`
- Guard halaman admin: sembunyikan UI sampai `getSession()` **dan** `rpc('is_admin')` selesai, baru render atau redirect. Jangan redirect di antara dua pengecekan itu, karena itu sumber race condition.
- Semua halaman `/admin/*` memakai `noindex` dan `X-Robots-Tag`, dan dikecualikan dari sitemap.

### 6.6 Admin panel

| Menu | Fungsi |
|---|---|
| Dashboard | Jumlah pesan baru, produk, artikel |
| Pesan Masuk | Daftar `inquiries`, ubah status (baru → dihubungi → penawaran → selesai/batal), tombol balas via WA, filter tanggal, ekspor CSV |
| Produk & Kategori | CRUD, upload gambar, toggle terbit/unggulan, atur urutan |
| Galeri | Upload banyak foto, alt text, atur urutan |
| Testimoni | CRUD, toggle tayang |
| FAQ | CRUD, urutan |
| Blog | CRUD, editor Markdown + pratinjau, jadwalkan `published_at` |
| Pengaturan | Nomor WA, kontak, jam kerja, sosial media |

Dibangun dengan Bootstrap + JS vanilla memakai `supabase-js` di browser dengan sesi admin.

### 6.7 Keamanan & operasional

- Markdown artikel dirender di server (`marked`) lalu disanitasi (`sanitize-html`) sebelum ditampilkan.
- `/api/inquiry`: honeypot, verifikasi Turnstile, validasi panjang dan format, dan aturan rate limit di Vercel Firewall.
- Secret key tidak dipakai di klien. Jangan commit `.env`.
- Uji RLS sebelum rilis: sebagai anon harus gagal membaca `inquiries`, gagal menulis `products`, dan hanya melihat baris `is_published = true`.
- Cek kebijakan plan Supabase yang dipakai untuk backup dan jeda project yang tidak aktif. Untuk produksi, siapkan ekspor berkala atau backup otomatis.

---

## 7. SEO, AEO, GEO

**Meta di setiap halaman:** `<title>` dan meta description unik, canonical, Open Graph + Twitter Card, `lang="id"`, favicon.

**JSON-LD:**

| Halaman | Skema |
|---|---|
| Semua | `Organization` (atau `LocalBusiness`), `WebSite` |
| Semua kecuali beranda | `BreadcrumbList` |
| Beranda | `FAQPage` |
| Produk (daftar) | `ItemList` |
| Detail produk | `Product` + `AggregateOffer` (`lowPrice`, `priceCurrency: IDR`) |
| Detail artikel | `BlogPosting` (`author`, `datePublished`, `dateModified`) |
| Kontak | `ContactPage` |

**AEO/GEO:** paragraf pertama setiap halaman produk dan artikel menjawab pertanyaan inti secara langsung, tambahkan blok FAQ singkat per produk, gunakan istilah yang konsisten (souvenir kantor, seminar kit, goodie bag, merchandise perusahaan), dan cantumkan data kontak serta area layanan yang jelas.

**Teknis:** `sitemap.xml` dinamis dari database, `robots.txt`, URL slug bersih, tautan internal antara blog dan produk, 404 kustom, redirect untuk slug yang berubah.

---

## 8. Performa (target PageSpeed mobile)

- Target awal Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- Impor CSS Bootstrap sekali, impor JS Bootstrap per modul (collapse, accordion, modal). Hindari jQuery dan library carousel berat.
- Font: self-host (`@fontsource`), maksimal 2 bobot, `font-display: swap`.
- Gambar: WebP, `srcset`/`sizes`, `loading="lazy"` kecuali hero (`fetchpriority="high"`), selalu berikan `width` dan `height` untuk mencegah CLS.
- JS halaman dibuat modul kecil yang dimuat hanya di halaman yang membutuhkan (lightbox hanya di galeri/beranda, form hanya di kontak).
- Header cache: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` untuk halaman publik.

---

## 9. Arah Desain

Panduan visual lengkap ada di **`DESIGN.md`** (menggantikan usulan palet sebelumnya). Ringkasan:

- Warna dasar `darkslategrey` (`#2F4F4F`) dan `darkkhaki` (`#BDB76B`), dengan krem hangat sebagai latar terang.
- Navbar darkslategrey, teks putih, halaman aktif ditandai dengan teks tebal saja.
- Tombol tanpa ikon panah dan tanpa emoji. Keunggulan memakai nomor urut, bukan ikon.
- Kesan elegan, premium, sederhana: tanpa gradien, tanpa bayangan pada kartu, radius kecil, garis tipis.
- Font: Newsreader (judul) dan Hanken Grotesk (isi).

---

## 10. Struktur Folder

```
seminarkit/
├─ astro.config.mjs
├─ package.json
├─ .env.example
├─ public/                      favicon, og-default.jpg
├─ supabase/
│  ├─ schema.sql                skema + RLS + storage
│  └─ seed.sql                  data awal
└─ src/
   ├─ lib/                      supabase.ts, queries.ts, wa.ts, format.ts, markdown.ts, seo.ts
   ├─ data/site.ts              nav, hero, tentang, keunggulan, perbandingan (statis)
   ├─ layouts/                  BaseLayout.astro, AdminLayout.astro
   ├─ components/               Navbar, Footer, PageBanner, Breadcrumb, CTA, WhatsAppFloat,
   │                            ProductCard, GalleryGrid, TestimonialCard, FaqAccordion,
   │                            BlogCard, Pagination, SeoHead, JsonLd
   ├─ pages/
   │  ├─ index.astro  tentang.astro  galeri.astro  kontak.astro  404.astro
   │  ├─ produk/index.astro  produk/[slug].astro
   │  ├─ blog/index.astro    blog/[slug].astro
   │  ├─ api/inquiry.ts
   │  ├─ sitemap.xml.ts
   │  └─ admin/                login, index, produk, galeri, testimoni, faq, blog, pesan, pengaturan
   ├─ scripts/                  wa-float.js, lightbox.js, inquiry-form.js, admin/*.js
   └─ styles/                   tokens.css, base.css, components.css
```

### Catatan implementasi Astro

- CSS di `<style>` komponen Astro bersifat scoped. Elemen yang disisipkan lewat JavaScript (lightbox, hasil admin, pesan status form) memerlukan `:global(...)` agar gaya terbaca.
- Jangan memasang kelas animasi `reveal` pada konten yang disuntikkan secara asinkron. Observer animasi tidak melihat elemen yang muncul belakangan, sehingga konten tetap tak terlihat.
- Produk, galeri, testimoni, FAQ, dan blog dirender di server, jadi tidak perlu `fetch` dari klien. Hanya lightbox, form, dan admin yang memakai JS klien.

---

## 11. Rencana Pengerjaan

| Fase | Isi | Hasil |
|---|---|---|
| 1. Fondasi | Proyek Astro, Bootstrap, token CSS, layout, navbar, footer, WA float, breadcrumb/banner, skema + RLS Supabase | Kerangka situs + database siap |
| 2. Halaman statis | Beranda (hero, tentang, keunggulan, CTA), halaman Tentang | Konten statis tayang |
| 3. Konten dinamis | Produk, detail produk, galeri + lightbox, testimoni, FAQ, blog + detail | Semua section terhubung database |
| 4. Pemesanan | Halaman kontak, `/api/inquiry`, Turnstile, alur WA | Lead masuk ke WA + database |
| 5. Admin | Login, guard, CRUD semua konten, pesan masuk, upload gambar | Konten dikelola mandiri |
| 6. SEO & QA | JSON-LD, sitemap, robots, uji RLS, uji Lighthouse, uji perangkat | Siap rilis |

---

## 12. Kriteria Penerimaan

- [ ] Semua 6 halaman dan halaman detail tampil sesuai spesifikasi, responsif di 360px sampai desktop.
- [ ] Section produk, galeri, testimoni, FAQ, dan blog mengambil data dari Supabase; perubahan di admin tampil di situs tanpa deploy ulang (dalam rentang cache).
- [ ] Tombol WA melayang dengan scroll bar muncul di semua halaman termasuk 404.
- [ ] Form pemesanan menyimpan ke `inquiries` dan membuka WhatsApp dengan pesan terisi; jika database gagal, WhatsApp tetap terbuka.
- [ ] Uji RLS lulus (anon tidak bisa baca `inquiries`, tidak bisa menulis tabel konten).
- [ ] Setiap halaman punya title, meta description, canonical, OG, dan JSON-LD yang valid.
- [ ] Lighthouse mobile memenuhi target di bagian 8.
- [ ] Admin panel tidak bisa diakses tanpa login admin dan tidak terindeks.

---

## 13. Hal yang Perlu Dikonfirmasi

1. Logo dan nama domain (warna brand sudah ditetapkan di `DESIGN.md`).
2. Nomor WhatsApp utama, email, alamat, jam kerja, sosial media.
3. Daftar kategori produk awal dan apakah harga ditampilkan sebagai "mulai dari" atau harga tetap.
4. Apakah produk perlu lebih dari satu foto dan harga bertingkat berdasarkan jumlah (rencana Fase 2).
5. Apakah perlu notifikasi email saat ada pesan baru.
6. Konten awal: teks tentang, 4 keunggulan, tabel perbedaan, foto galeri, testimoni (nama dan perusahaan asli dengan izin), FAQ.