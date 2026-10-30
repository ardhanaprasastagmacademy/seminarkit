# Panduan Lengkap Penggunaan & Pengembangan Website seminarkit

Selamat datang di dokumentasi resmi **seminarkit** — website profil perusahaan dan katalog produk souvenir kantor & paket seminar kit yang dibangun dengan arsitektur modern **Astro SSR**, **Supabase (Postgres + Auth + RLS + Storage)**, dan **Bootstrap 5**.

Dokumen ini disusun untuk memudahkan pemilik bisnis, administrator, maupun developer dalam mengelola konten, mengatur keamanan, hingga mendeploy website ke lingkungan produksi.

---

## Daftar Isi
1. [Tentang Website seminarkit](#1-tentang-website-seminarkit)
2. [Persyaratan Sistem](#2-persyaratan-sistem)
3. [Pengaturan Environment Variables (.env)](#3-pengaturan-environment-variables-env)
4. [Persiapan Database Supabase](#4-persiapan-database-supabase)
5. [Menjalankan Proyek Secara Lokal](#5-menjalankan-proyek-secara-lokal)
6. [Panduan Panel Admin (/admin)](#6-panduan-panel-admin-admin)
7. [Alur Pemesanan & Alur Data Lead](#7-alur-pemesanan--alur-data-lead)
8. [Panduan Deployment ke Vercel](#8-panduan-deployment-ke-vercel)
9. [Menjalankan Pengujian (Testing)](#9-menjalankan-pengujian-testing)
10. [Panduan Pemecahan Masalah (Troubleshooting)](#10-panduan-pemecahan-masalah-troubleshooting)

---

## 1. Tentang Website seminarkit

Website **seminarkit** dirancang untuk performa tinggi (target skor PageSpeed Mobile 90+), SEO ramah mesin pencari, dan konversi calon pembeli langsung ke WhatsApp.

### Struktur Halaman
- **Halaman Publik**:
  - `/` (Beranda): Hero produk, profil singkat, 4 keunggulan bernomor, 3 produk unggulan, galeri foto, testimoni, FAQ accordion, tombol WhatsApp melayang.
  - `/tentang`: Profil lengkap, tabel perbandingan transparansi vs vendor umum, 6 pilar keunggulan, CTA.
  - `/produk`: Katalog produk lengkap dengan filter kategori dinamis via URL query (`?kategori=slug`) dan pagination.
  - `/produk/[slug]`: Halaman detail spesifikasi produk, harga mulai dari, minimal pemesanan, produk terkait, dan JSON-LD schema `Product`.
  - `/galeri`: Galeri dokumentasi hasil produksi dengan lightbox interaktif (navigasi keyboard Esc, panah kiri/kanan).
  - `/blog`: Artikel tips dan wawasan pengadaan souvenir kantor dengan pagination 9 artikel per halaman.
  - `/blog/[slug]`: Halaman membaca artikel yang dirender aman dari format Markdown dengan sanitasi anti-XSS dan JSON-LD schema `BlogPosting`.
  - `/kontak`: Alamat kantor, jam kerja, nomor WhatsApp, email, Google Maps embed, serta formulir pemesanan dengan proteksi anti-spam ganda.
  - `/404`: Halaman ramah pengunjung saat link tidak ditemukan.
- **Halaman Panel Admin (Tersembunyi & Noindex)**:
  - `/admin/login`: Login admin (email & password Supabase Auth).
  - `/admin`: Dashboard ringkasan jumlah pesan baru, produk, artikel, dan galeri.
  - `/admin/pesan`: Daftar pertanyaan masuk (inquiries) dengan filter status, tombol balas WhatsApp otomatis, dan ekspor data ke file CSV.
  - `/admin/produk`: CRUD produk & kategori (tambah, edit, atur urutan, toggle tampil/unggulan).
  - `/admin/galeri`: CRUD foto dokumentasi (tambah, edit alt-text aksesibilitas, urutan).
  - `/admin/testimoni`: CRUD testimoni pelanggan (rating bintang 1–5, nama, perusahaan, jabatan).
  - `/admin/faq`: CRUD pertanyaan yang sering ditanyakan.
  - `/admin/blog`: Editor artikel berbasis Markdown dengan tab pratinjau instan (*live preview*) dan penjadwalan terbit.
  - `/admin/pengaturan`: Pengaturan kontak situs (nomor WhatsApp resmi, alamat kantor, jam operasional, link media sosial).

---

## 2. Persyaratan Sistem

Sebelum memulai di komputer lokal, pastikan Anda telah memasang:
- **Node.js**: Versi 20.x atau 22.x LTS (disarankan versi LTS stabil).
- **NPM**: Versi 9.x atau 10.x (otomatis terpasang bersama Node.js).
- **Akun Supabase**: [supabase.com](https://supabase.com) (tersedia paket gratis).
- **Akun Cloudflare Turnstile**: [dash.cloudflare.com](https://dash.cloudflare.com) (gratis untuk proteksi bot captcha).

---

## 3. Pengaturan Environment Variables (.env)

Buat berkas baru bernama `.env` di folder utama proyek (sejajar dengan `package.json`). Salin isi dari `.env.example` lalu sesuaikan isinya:

```bash
# URL proyek Supabase Anda
PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Kunci API Publik Supabase (Publishable Key / Anon Key)
# Aman terlihat di browser karena dibatasi oleh Row Level Security (RLS)
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx

# Kunci Widget Cloudflare Turnstile (Tampil di browser)
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAxxxxxxxxxxxxxx

# Kunci Rahasia Cloudflare Turnstile (HANYA di Server, jangan pernah diberi prefix PUBLIC_)
TURNSTILE_SECRET_KEY=0x4AAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL Domain Publik Situs (untuk Canonical Link, Sitemap XML, dan Open Graph)
PUBLIC_SITE_URL=https://seminarkit.id

# Domain yang diizinkan mengirim data form ke /api/inquiry (CORS/Origin Guard)
ALLOWED_ORIGINS=https://seminarkit.id,http://localhost:4321
```

> **PENTING UNTUK KEAMANAN:**
> 1. Jangan pernah membagikan atau mengunggah berkas `.env` ke Git repository publik.
> 2. Variabel tanpa awalan `PUBLIC_` hanya terbaca di server SSR dan tidak akan dibocorkan ke bundel JavaScript browser.

---

## 4. Persiapan Database Supabase

Untuk menyiapkan database, tabel, aturan keamanan Row Level Security (RLS), dan data awal, ikuti 3 langkah berikut di dashboard Supabase:

### Langkah 4.1: Jalankan Skema Database & RLS
1. Masuk ke dashboard proyek Anda di [supabase.com](https://supabase.com).
2. Di menu sisi kiri, klik **SQL Editor**.
3. Buka file `supabase/schema.sql` di proyek Anda, salin seluruh kodenya, tempelkan di SQL Editor Supabase, lalu klik tombol **Run**.
4. Skema ini otomatis membuat:
   - 9 tabel utama beserta indeks performa.
   - Mengaktifkan Row Level Security (RLS) di seluruh tabel.
   - Menerapkan hak akses baca publik hanya pada konten berstatus `is_published = true`.
   - Mengatur hak `INSERT` publik pada formulir pesanan (`inquiries`) tanpa memberikan izin baca/ubah/hapus ke publik.
   - Menerapkan trigger rate limiting (maksimal 5 pesanan per jam per nomor WhatsApp).
   - Menyiapkan storage bucket `media` dengan batas ukuran 5 MB dan format yang diizinkan (WebP, JPEG, PNG).

### Langkah 4.2: Masukkan Data Awal (Seed Data)
1. Di SQL Editor Supabase yang sama, buka file `supabase/seed.sql`.
2. Salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**.
3. Langkah ini mengisi database dengan data siap pakai:
   - Data pengaturan identitas website (nomor WA, alamat, jam kerja, maps embed).
   - Kategori produk (Paket Seminar Kit, Tumbler, Agenda, Totebag, Flashdisk).
   - 5 produk sampel lengkap dengan spesifikasi JSONB.
   - 6 foto galeri dokumentasi.
   - 4 testimoni klien asli.
   - 6 pertanyaan dan jawaban FAQ.
   - 2 artikel blog informatif.

### Langkah 4.3: Daftarkan Akun Administrator Pertama
1. Di menu sisi kiri dashboard Supabase, klik **Authentication** > **Users**.
2. Klik tombol **Add User** > **Create User**.
3. Masukkan Email dan Password Anda (misalnya: `admin@seminarkit.id`).
4. Setelah user terbuat, salin **User UID** milik akun tersebut (format UUID seperti `a1b2c3d4-e5f6-...`).
5. Buka kembali **SQL Editor**, jalankan perintah SQL berikut untuk memberikan status administrator:

```sql
insert into public.admin_users (user_id)
values ('TEMPEL_USER_UID_ANDA_DI_SINI');
```

6. Matikan pendaftaran publik agar orang asing tidak dapat membuat akun:
   - Masuk ke **Authentication** > **Providers** > **Email**.
   - Matikan (nonaktifkan) pilihan **"Enable Signup"**.

---

## 5. Menjalankan Proyek Secara Lokal

### 1. Instalasi Dependensi
Buka terminal di folder proyek (`c:\PROJECT\seminarkit`) dan jalankan:
```bash
npm install
```

### 2. Jalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Aplikasi akan aktif di alamat: **`http://localhost:4321`**

### 3. Build Proyek untuk Validasi
Untuk memastikan semua tipe data dan bundel SSR valid tanpa kesalahan kompilasi:
```bash
npm run build
```

---

## 6. Panduan Panel Admin (/admin)

Panel admin dirancang sederhana, elegan, ringan, dan tidak terindeks oleh mesin pencari Google (`noindex, nofollow`).

### 6.1 Cara Masuk ke Panel Admin
1. Buka browser dan arahkan ke alamat: `http://localhost:4321/admin/login` (atau `https://domain-anda.id/admin/login`).
2. Masukkan email dan kata sandi admin yang telah didaftarkan pada Langkah 4.3.
3. Sistem akan memverifikasi sesi aktif dan memastikan akun Anda terdaftar di tabel `admin_users`.

### 6.2 Menu Dashboard (`/admin`)
- Menampilkan ringkasan jumlah pesan baru berstatus 'baru', total produk aktif, artikel blog, dan foto galeri.
- Terdapat tombol pintasan untuk mengelola masing-masing bagian dengan satu klik.

### 6.3 Menu Pesan Masuk (`/admin/pesan`)
- **Filter Status**: Mengelompokkan prospek berdasarkan tahapan: `Baru`, `Dihubungi`, `Penawaran`, `Selesai`, `Batal`, atau `Semua`.
- **Ubah Status**: Anda dapat langsung mengubah status pesanan melalui dropdown di tabel.
- **Balas WhatsApp**: Mengklik tombol "Balas WA" akan langsung membuka WhatsApp Web atau aplikasi WhatsApp dengan pesan pembuka otomatis yang menyertakan nomor referensi pesanan pelanggan.
- **Ekspor CSV**: Tombol di pojok kanan atas untuk mengunduh semua data pesanan ke dalam format spreadsheet (.csv) yang telah disanitasi dari potensi formula injection.

### 6.4 Menu Produk & Kategori (`/admin/produk`)
- **Tambah / Edit Produk**:
  - `Nama Produk` & `Slug URL` (otomatis dibuat huruf kecil dan strip).
  - `Harga Mulai` (angka murni tanpa titik) & `Satuan` (default: pcs atau paket).
  - `Minimal Pemesanan` (MOQ).
  - `Deskripsi Singkat` (maksimal 200 karakter, tampil di kartu produk).
  - `Deskripsi Lengkap` (penjelasan detail material dan kegunaan).
  - `Foto Produk` (unggah langsung file gambar JPG/PNG/WebP dari komputer, dilengkapi pratinjau instan thumbnail, tombol hapus gambar, dan kompresi otomatis ke format WebP di bawah 100 KB).
  - `Alt Text` (deskripsi foto untuk optimasi SEO Google Image & aksesibilitas).
  - `Urutan` (semakin kecil angkanya, semakin awal posisinya di katalog).
  - Checkbox `Terbit` (ditampilkan di publik) dan `Unggulan` (tampil di halaman utama).

### 6.5 Menu Galeri (`/admin/galeri`)
- Digunakan untuk memamerkan portofolio hasil cetak souvenir.
- Dilengkapi fitur **Upload Foto File Langsung** dengan pratinjau visual dan penyimpanan terintegrasi ke Supabase Storage.
- Wajib menyertakan **Alt Text** deskriptif demi aksesibilitas dan SEO gambar di Google Image.

### 6.6 Menu Testimoni (`/admin/testimoni`)
- Mengelola ulasan kepuasan klien instansi/perusahaan.
- Mendukung pemilihan rating bintang 1 hingga 5.
- Menampilkan nama klien, nama instansi/perusahaan, dan jabatan (misal: HR Manager / Event Coordinator).

### 6.7 Menu Kelola FAQ (`/admin/faq`)
- Mengelola daftar pertanyaan yang sering diajukan mengenai minimal order, estimasi waktu produksi, prosedur pengiriman sampel, perpajakan, dan jangkauan kargo.
- FAQ yang diaktifkan otomatis dibaca oleh Google sebagai data terstruktur `FAQPage` JSON-LD.

### 6.8 Menu Blog (`/admin/blog`)
- Tulis artikel edukasi untuk mendatangkan pengunjung organik (SEO).
- Dilengkapi pengisi otomatis Slug URL berdasarkan judul yang Anda ketik.
- Dilengkapi indikator panjang Meta Description (maksimal 160 karakter).
- Editor isi mendukung format Markdown dengan tab **Pratinjau** untuk melihat hasil format teks sebelum dipublikasikan.
- Mendukung fitur **Jadwal Terbit**: jika tanggal diatur untuk masa depan, artikel tidak akan tampil di situs publik sampai waktu tersebut tiba.

### 6.9 Menu Pengaturan Situs (`/admin/pengaturan`)
- Mengubah nomor WhatsApp utama (format internasional tanpa tanda plus, contoh: `6281234567890`).
- Mengubah alamat kantor, email resmi, jam operasional layanan, dan embed Google Maps.
- Mengatur draft pesan WhatsApp default saat calon pembeli mengklik tombol WA melayang.
- Tautan akun media sosial resmi (Instagram, Facebook, TikTok).

---

## 7. Alur Pemesanan & Alur Data Lead

Setiap calon pembeli yang mengisi formulir di halaman `/kontak` melalui alur pengamanan 7 lapis:

```
[Pengunjung Mengisi Form Kontak]
           │
           ▼
[1. Validasi Input di Browser (Bootstrap)]
           │
           ▼
[2. Cloudflare Turnstile Memverifikasi Pengunjung Bukan Bot]
           │
           ▼
[3. Pengiriman JSON ke Endpoint Server: POST /api/inquiry]
   ├── Memeriksa Header Origin
   ├── Memeriksa Ukuran Body (maks. 8 KB)
   ├── Memeriksa Jebakan Honeypot & Time-Trap
   └── Memvalidasi Ulang di Sisi Server
           │
           ▼
[4. Server Menyimpan ke Tabel 'inquiries' di Supabase]
   ├── Status Awal: 'baru'
   └── Diberi Kode Referensi Unik (misal: Ref #A1B2C3D4)
           │
           ▼
[5. Klien Langsung Diarahkan Membuka WhatsApp Resmi]
   └── Teks Pesan Otomatis Terisi Rinci Sesuai Pilihan Produk & Ref Code
```

> **Keunggulan Sistem Cadangan (*Fallback*):**
> Jika terjadi gangguan koneksi ke database saat pengiriman formulir, server tetap membuatkan link WhatsApp dan segera mengarahkan calon pelanggan ke chat WhatsApp admin. Dengan begitu, prospek penjualan **tidak akan pernah hilang**.

---

## 8. Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi menggunakan adapter `@astrojs/vercel` mode `server` (SSR) dengan optimasi caching CDN di berkas `vercel.json`.

### Langkah-langkah Deploy:
1. Dorong (*push*) kode sumber ke akun GitHub / GitLab Anda.
2. Buka [vercel.com](https://vercel.com) dan login dengan akun Anda.
3. Klik **Add New...** > **Project**, lalu impor repository `seminarkit`.
4. Di bagian **Build and Output Settings**, biarkan pengaturan default (Framework Preset: **Astro**).
5. Buka bagian **Environment Variables**, lalu masukkan seluruh nilai dari berkas `.env`:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `PUBLIC_SITE_URL` (atur ke domain produksi Anda, misal: `https://seminarkit.id`)
   - `ALLOWED_ORIGINS` (atur ke domain produksi Anda)
6. Klik tombol **Deploy**.
7. Setelah selesai, website Anda telah online dan siap melayani pengunjung.

### Pengaturan Domain Kustom di Vercel:
- Masuk ke dashboard proyek di Vercel > **Settings** > **Domains**.
- Masukkan nama domain kustom Anda (misalnya `seminarkit.id` dan `www.seminarkit.id`).
- Konfigurasikan DNS CNAME / A Record di penyedia domain Anda sesuai petunjuk yang ditampilkan oleh Vercel.

---

## 9. Menjalankan Pengujian (Testing)

Proyek ini dilengkapi dengan unit test otomatis berbasis **Vitest** untuk memverifikasi logika kritis:

Jalankan perintah berikut di terminal:
```bash
npm run test
```

### Cakupan Pengujian:
1. `tests/unit/phone.test.ts`: Memastikan seluruh variasi nomor telepon dinormalkan ke format internasional `62...` dan nomor mencurigakan ditolak.
2. `tests/unit/wa.test.ts`: Memastikan link WhatsApp ter-encode dengan aman dan memuat konteks produk yang benar.
3. `tests/unit/format.test.ts`: Memverifikasi format mata uang Rupiah dan tanggal standar Indonesia.
4. `tests/unit/markdown.test.ts`: Memastikan skrip jahat (`<script>`, atribut `onerror`, `javascript:`) dibersihkan saat artikel blog dirender.
5. `tests/unit/jsonld.test.ts`: Memastikan skema data terstruktur mesin pencari valid dan karakter kurung siku tidak merusak struktur HTML.
6. `tests/api/inquiry.test.ts`: Memastikan endpoint form kontak menolak bot, membatasi ukuran payload, dan memvalidasi captcha.

---

## 10. Panduan Pemecahan Masalah (Troubleshooting)

### Q: Tombol simpan di panel admin menampilkan pesan error "Gagal menyimpan: ..."?
**Penyebab:**
- Pengguna belum masuk dengan akun yang memiliki hak akses administrator.
- Akun pengguna di Auth Supabase belum didaftarkan ke dalam tabel `admin_users`.
**Solusi:**
Buka dashboard Supabase > SQL Editor, dan jalankan perintah:
```sql
insert into public.admin_users (user_id) values ('UUID_AKUN_ANDA');
```

### Q: Pengiriman form di halaman Kontak menghasilkan galat "captcha"?
**Penyebab:**
Nilai `PUBLIC_TURNSTILE_SITE_KEY` atau `TURNSTILE_SECRET_KEY` pada `.env` belum diisi atau salah pasang.
**Solusi:**
- Pastikan Site Key dipasang pada `PUBLIC_TURNSTILE_SITE_KEY`.
- Pastikan Secret Key dipasang pada `TURNSTILE_SECRET_KEY`.
- Jika menguji di `localhost`, daftarkan domain `localhost` pada pengaturan widget di dashboard Cloudflare Turnstile.

### Q: Mengapa produk yang baru ditambahkan di Admin tidak langsung muncul di beranda?
**Penyebab:**
- Periksa checkbox **"Terbit"** pada produk tersebut di panel admin. Hanya produk berstatus terbit yang tampil ke publik.
- Untuk tampil di bagian produk unggulan beranda, pastikan checkbox **"Unggulan"** juga dicentang.
- Vercel menerapkan cache CDN singkat (*stale-while-revalidate*) selama beberapa menit untuk menjaga kecepatan halaman. Muat ulang halaman secara penuh (*hard refresh*: `Ctrl + F5`) untuk melihat perubahan terbaru.

---

*Dokumentasi ini disusun untuk kelancaran operasional dan pemeliharaan website **seminarkit**.*
