# SECURITY.md — seminarkit

Panduan pengamanan website seminarkit (Astro + Supabase + Vercel). Dibaca bersama `PRD.md` (arsitektur dan skema) dan `TESTING.md` (cara membuktikan kontrol di sini benar-benar bekerja).

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 25 Oktober 2026 |
| **Cakupan** | Situs publik, form pemesanan, admin panel, Supabase (database, auth, storage), deploy Vercel |
| **Prinsip utama** | Anggap semua input dari browser tidak tepercaya. Keamanan data ada di database (RLS), bukan di tampilan |

---

## 1. Model Ancaman Singkat

**Aset yang dilindungi:** data lead (nama, nomor WhatsApp, email, perusahaan), akun admin, integritas konten (produk, harga, artikel), reputasi dan peringkat SEO, ketersediaan situs.

**Pihak yang perlu diantisipasi:** bot spam, penyerang oportunistik yang memindai celah umum, scraper, pesaing yang ingin merusak konten atau mengambil data lead, dan kesalahan manusia (admin ceroboh, kunci bocor).

| Ancaman | Dampak | Kontrol utama | Bagian |
|---|---|---|---|
| Spam atau banjir form pemesanan | Database penuh, lead asli tertimbun | Turnstile, honeypot, rate limit, constraint DB | 5 |
| Membaca data lead lewat API Supabase | Kebocoran data pribadi | RLS tanpa policy baca publik, grant kolom | 3 |
| Mengubah atau menghapus produk lewat API | Harga dan konten rusak | RLS khusus admin, cabut hak tulis anon | 3 |
| Pengambilalihan akun admin | Seluruh konten dan lead terbuka | Password kuat, MFA, tanpa pendaftaran publik | 7 |
| XSS (isi form, artikel, JSON-LD, galat) | Pencurian sesi admin, defacement | Escape output, sanitasi Markdown, CSP | 4, 6, 7 |
| Kebocoran kunci (secret key, `.env`) | Akses penuh ke database | Secret key tidak dipakai di klien, rotasi, secret scanning | 3, 9 |
| CSRF pada endpoint form | Pengiriman data atas nama pengguna lain | Cek `Origin`, Turnstile | 4, 5 |
| Unggah file berbahaya | Malware, XSS lewat SVG | Admin-only, allowlist MIME, tanpa SVG | 3.5 |
| Dependensi rentan | Eksploitasi lewat paket pihak ketiga | Audit, pembaruan rutin, lockfile | 9 |
| Data pribadi disalahgunakan atau disimpan terlalu lama | Risiko hukum dan reputasi | Persetujuan, retensi, akses terbatas | 8 |

---

## 2. Prioritas Kontrol

| Prioritas | Artinya | Isi |
|---|---|---|
| **P0** | Wajib selesai sebelum rilis | RLS lengkap dan teruji, cabut hak tulis anon, signup dimatikan, Turnstile + validasi server, header keamanan, tidak ada secret di repo atau klien, HTTPS, admin noindex |
| **P1** | Selesai dalam minggu pertama setelah rilis | CSP enforce (setelah mode report-only), MFA admin, rate limit Vercel, retensi data, kebijakan privasi, alert uptime |
| **P2** | Berkala | Audit dependensi bulanan, tinjau log, uji pemulihan backup, rotasi kunci, uji penetrasi ringan |

---

## 3. Supabase

### 3.1 Kunci API

Supabase kini memakai **publishable key** (`sb_publishable_...`, pengganti `anon`) dan **secret key** (`sb_secret_...`, pengganti `service_role`). Proyek baru tidak lagi punya kunci lama, dan kunci lama dijadwalkan dihentikan.

| Kunci | Boleh di | Catatan |
|---|---|---|
| Publishable | Browser dan server | Hak akses sama dengan role `anon`, dibatasi RLS. Boleh terlihat publik |
| Secret | **Server saja** | Melewati RLS. Tidak dipakai di Fase 1. Tidak pernah diberi prefix `PUBLIC_`, tidak pernah masuk bundel klien |

Aturan:

- Secret key di browser otomatis gagal dengan HTTP 401. Jangan mencoba menyiasatinya.
- Jangan commit `.env`. Commit hanya `.env.example` berisi nama variabel.
- Jika sebuah secret key bocor: buat secret key baru di dashboard (Settings > API Keys), pasang di Vercel, deploy ulang, lalu hapus key lama (menghapus key langsung mencabutnya).
- Pisahkan proyek Supabase: **produksi**, **staging**, dan **lokal** (`supabase start`). Preview deployment Vercel tidak boleh menunjuk ke database produksi.

### 3.2 Row Level Security

- RLS aktif di **semua** tabel di schema `public`, tanpa pengecualian, termasuk tabel yang dibuat belakangan.
- Pola kebijakan (sudah ada di `PRD.md` bagian 6.3):
  - Baca publik hanya untuk baris `is_published` (atau `is_active`).
  - `inquiries`: publik hanya `INSERT`, tidak ada policy `SELECT`/`UPDATE`/`DELETE`.
  - Semua tulis lewat policy admin berbasis `public.is_admin()`.
- Tabel tanpa policy berarti tertutup. Itu perilaku yang diinginkan (`admin_users`).
- Setiap tabel baru wajib disertai RLS dan test pgTAP-nya sebelum merge (lihat `TESTING.md`).
- Cek berkala di dashboard: Security Advisor Supabase tidak boleh menampilkan peringatan "RLS disabled" atau "policy always true" pada tabel sensitif.

### 3.3 Pengerasan tambahan (defense in depth)

Jalankan setelah skema di `PRD.md`. Tujuannya: meski suatu policy keliru, hak dasar role `anon` tetap sempit.

```sql
-- 1. Anon tidak boleh menulis apa pun, kecuali INSERT kolom tertentu di inquiries
revoke insert, update, delete, truncate on all tables in schema public from anon;
grant insert (id, nama, perusahaan, no_wa, email, product_id, produk_diminati,
              jumlah, tanggal_dibutuhkan, pesan, source_page)
  on public.inquiries to anon;

-- Tabel baru ke depan tidak otomatis bisa ditulis anon
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon;

-- 2. Fungsi is_admin hanya untuk pengguna login
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- 3. Batasi laju per nomor WhatsApp (maks. 5 permintaan per jam)
create or replace function public.limit_inquiry_rate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.inquiries
      where no_wa = new.no_wa and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'terlalu banyak permintaan' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger t_inquiries_rate before insert on public.inquiries
  for each row execute function public.limit_inquiry_rate();

-- 4. Format data dipaksa di level database
alter table public.inquiries
  add constraint inquiries_no_wa_format check (no_wa ~ '^62[0-9]{8,13}$'),
  add constraint inquiries_email_len   check (email is null or char_length(email) <= 150),
  add constraint inquiries_nama_len    check (char_length(nama) between 2 and 100);
```

Catatan: trigger ini hanya menahan spam dari nomor yang sama. Pertahanan utama terhadap bot tetap Turnstile dan rate limit per IP di Vercel (bagian 5).

### 3.4 Autentikasi (Supabase Auth)

- **Matikan pendaftaran publik.** Akun admin dibuat manual di dashboard, lalu ditambahkan ke `admin_users` lewat SQL Editor.
- Metode: email + password. Panjang minimal 12 karakter. Aktifkan perlindungan password bocor jika tersedia di plan yang dipakai.
- **Aktifkan MFA (TOTP)** untuk semua akun admin (P1).
- Aktifkan CAPTCHA pada login (Supabase Auth mendukung Turnstile) agar tebakan password otomatis sulit.
- Batas laju endpoint auth bawaan Supabase dibiarkan aktif. Jika plan mendukung, atur batas masa sesi (session timebox) dan inactivity timeout untuk admin.
- Jumlah admin sesedikit mungkin. Akun yang tidak lagi dipakai dihapus dari `admin_users` dan dari Auth.
- Gunakan email khusus admin yang kotak masuknya dilindungi MFA.

### 3.5 Storage

- Satu bucket publik `media`. Hanya admin yang boleh menulis (policy di `PRD.md` bagian 6.4).
- Batas ukuran 5 MB dan MIME yang diizinkan: `image/webp`, `image/jpeg`, `image/png`. **SVG tidak diizinkan** karena bisa membawa skrip.
- Nama file dibuat acak (UUID) oleh admin panel, bukan nama dari pengguna. Hindari spasi, karakter khusus, dan path traversal.
- Gambar di-*re-encode* di browser (canvas → WebP) sebelum upload, sehingga metadata EXIF (termasuk lokasi GPS) ikut terhapus.
- Jangan simpan dokumen sensitif di bucket publik. Jika suatu saat butuh file privat (misalnya lampiran penawaran), buat bucket privat dengan signed URL berumur pendek.

### 3.6 Kebersihan proyek

- Akun dashboard Supabase memakai 2FA. Batasi anggota tim.
- Cek kebijakan backup plan yang dipakai. Untuk produksi, siapkan ekspor berkala (misalnya mingguan) dan **uji pemulihannya** (P2).
- Cek kebijakan jeda proyek tidak aktif pada plan gratis agar situs tidak mendadak mati.
- Matikan fitur yang tidak dipakai (Realtime, tabel yang tidak perlu diekspos lewat Data API).

---

## 4. Aplikasi Astro

### 4.1 Konfigurasi

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  security: { checkOrigin: true },        // default true sejak Astro 5, tulis eksplisit agar jelas
  vite: { build: { assetsInlineLimit: 0 } } // paksa skrip kecil tetap file terpisah (kompatibel CSP)
});
```

Catatan penting:

- `checkOrigin` hanya melindungi halaman yang dirender sesuai permintaan, dan hanya untuk permintaan `POST`/`PUT`/`PATCH`/`DELETE` bertipe `application/x-www-form-urlencoded`, `multipart/form-data`, atau `text/plain`. **Endpoint JSON seperti `/api/inquiry` tidak tercakup**, jadi cek `Origin` secara manual (bagian 5).
- Pernah ada celah CSRF pada middleware ini (CVE-2024-56140, diperbaiki di rilis lanjutan). Alasan lain menjaga Astro selalu terbarui (bagian 9).

### 4.2 Escape output dan XSS

- Template Astro meng-escape ekspresi `{...}` secara otomatis. **Jangan** memakai `set:html` untuk data dari database kecuali sudah disanitasi.
- Konten artikel (Markdown) selalu melewati sanitasi sebelum `set:html`:

```ts
// src/lib/markdown.ts
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: ['h2','h3','h4','p','ul','ol','li','strong','em','a','blockquote',
                  'img','table','thead','tbody','tr','th','td','code','pre','hr','br'],
    allowedAttributes: { a: ['href','title','rel','target'], img: ['src','alt','width','height','loading'] },
    allowedSchemes: ['https','mailto','tel'],
    allowedSchemesByTag: { img: ['https'] },
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
}
```

- **JSON-LD:** data dari database yang disisipkan ke `<script type="application/ld+json">` harus di-escape agar teks seperti `</script>` tidak memutus tag:

```astro
---
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
---
<script type="application/ld+json" set:html={safeJson(schema)} />
```

- Tautan dari data (`href`) hanya skema `https`, `mailto`, `tel`. Tolak `javascript:`.
- URL WhatsApp selalu dibuat dengan `encodeURIComponent` untuk teks pesan, dan nomor hanya digit.
- Link eksternal memakai `rel="noopener noreferrer"`.

### 4.3 Penanganan galat dan log

- Jangan menampilkan pesan galat database, stack trace, atau nama tabel ke pengunjung. Balas dengan pesan umum ("Terjadi kesalahan, silakan coba lagi.").
- Di log server hanya catat kode galat dan konteks teknis, **bukan data pribadi** (nama, nomor, email, isi pesan).
- Halaman produk atau artikel yang tidak ada mengembalikan status **404 sungguhan**, bukan 200.
- Parameter query (`?page=`, `?kategori=`) divalidasi: `page` harus bilangan bulat positif dengan batas wajar, `kategori` harus cocok dengan slug yang ada (query berparameter, bukan string yang dirangkai).

### 4.4 Variabel lingkungan

- Hanya variabel berawalan `PUBLIC_` yang masuk ke klien. `TURNSTILE_SECRET_KEY` dan kunci rahasia lain tidak boleh berawalan itu.
- Di Vercel, atur variabel per lingkungan (Production, Preview, Development) dengan nilai berbeda. Preview memakai proyek Supabase staging dan kunci Turnstile uji.

---

## 5. Form Pemesanan (`POST /api/inquiry`)

Lapisan pertahanan, berurutan dari yang paling murah:

1. **Cek `Origin`** terhadap daftar domain yang diizinkan.
2. **Content-Type** harus `application/json`, **ukuran body** dibatasi (misalnya 8 KB).
3. **Honeypot** (`website`) dan **time-trap**: jika honeypot terisi atau form dikirim kurang dari 3 detik setelah dimuat, balas seolah sukses tanpa menyimpan apa pun (jangan beri tahu bot).
4. **Turnstile**: verifikasi token ke `siteverify` dengan secret key **di server**. Tanpa token valid, tolak.
5. **Validasi dan normalisasi** semua field di server (jangan percaya validasi klien).
6. **Insert** memakai publishable key (RLS insert-only + grant kolom + constraint + trigger rate limit).
7. **Rate limit per IP** lewat aturan Vercel Firewall pada path `/api/inquiry` (misalnya 5 permintaan per menit per IP).

Kerangka referensi:

```ts
// src/pages/api/inquiry.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const MAX_BODY = 8 * 1024;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const oneLine = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
const multiLine = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

function normalizeWa(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return /^62\d{8,13}$/.test(d) ? d : null;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // 1. Origin (endpoint JSON tidak dilindungi checkOrigin bawaan Astro)
  const allowed = (import.meta.env.ALLOWED_ORIGINS ?? import.meta.env.PUBLIC_SITE_URL)
    .split(',').map((s: string) => s.trim());
  if (!allowed.includes(request.headers.get('origin') ?? '')) return json(403, { ok: false });

  // 2. Content-Type dan ukuran
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return json(415, { ok: false });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false });
  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return json(400, { ok: false }); }

  // 3. Honeypot dan time-trap: pura-pura sukses
  const tooFast = Date.now() - Number(b.t) < 3000;
  if (oneLine(b.website, 50) !== '' || tooFast) return json(200, { ok: true, saved: false, waUrl: null });

  // 4. Turnstile
  const token = oneLine(b.turnstileToken, 2048);
  if (!token) return json(400, { ok: false, error: 'captcha' });
  const fd = new FormData();
  fd.append('secret', import.meta.env.TURNSTILE_SECRET_KEY);
  fd.append('response', token);
  fd.append('remoteip', clientAddress);
  const verdict = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: fd, signal: AbortSignal.timeout(5000),
  }).then((r) => r.json()).catch(() => null);
  if (!verdict?.success) return json(403, { ok: false, error: 'captcha' });
  // Opsional: cocokkan verdict.hostname dengan domain situs

  // 5. Validasi dan normalisasi
  const nama = oneLine(b.nama, 100);
  const wa = normalizeWa(oneLine(b.noWa, 30));
  const email = oneLine(b.email, 150);
  const jumlah = b.jumlah ? Number.parseInt(String(b.jumlah), 10) : null;
  const errors: Record<string, string> = {};
  if (nama.length < 2) errors.nama = 'Nama minimal 2 karakter.';
  if (!wa) errors.noWa = 'Nomor WhatsApp tidak valid.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';
  if (jumlah !== null && (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 1_000_000))
    errors.jumlah = 'Jumlah tidak valid.';
  if (Object.keys(errors).length) return json(422, { ok: false, errors });

  // 6. Simpan (publishable key, dibatasi RLS). Tanpa .select(): publik tidak punya hak baca.
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const id = crypto.randomUUID();
  const { error } = await supabase.from('inquiries').insert({
    id, nama, no_wa: wa,
    perusahaan: oneLine(b.perusahaan, 150) || null,
    email: email || null,
    produk_diminati: oneLine(b.produk, 150) || null,
    jumlah,
    pesan: multiLine(b.pesan, 2000) || null,
    source_page: oneLine(b.sourcePage, 200) || null,
  });
  if (error) console.error('inquiry insert gagal', error.code); // tanpa data pribadi

  // 7. Balasan: URL WhatsApp dibuat di server. Tetap diberikan walau simpan gagal
  const waNumber = '...'; // ambil dari site_settings
  const text = `Halo seminarkit, saya ${nama}.\nRef: #${id.slice(0, 8)}`;
  return json(200, {
    ok: true,
    saved: !error,
    waUrl: `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`,
  });
};
```

Catatan:

- Tambahkan `ALLOWED_ORIGINS` (dipisah koma) untuk domain produksi dan domain preview staging.
- Jangan pernah menaruh `TURNSTILE_SECRET_KEY` di kode klien.
- Untuk pengujian, pakai kunci uji Turnstile (lihat `TESTING.md`), bukan kunci produksi.

---

## 6. Header HTTP dan CSP

Pasang lewat `vercel.json`. Mulai dengan `Content-Security-Policy-Report-Only` selama masa uji, lalu ganti ke `Content-Security-Policy` ketika tidak ada pelanggaran pada semua halaman (termasuk admin).

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://PROJECT_REF.supabase.co; font-src 'self'; connect-src 'self' https://PROJECT_REF.supabase.co; frame-src https://challenges.cloudflare.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" }
      ]
    },
    {
      "source": "/admin/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ]
}
```

Catatan:

- Ganti `PROJECT_REF` dengan ID proyek Supabase. Hapus `https://www.google.com` dari `frame-src` jika tidak memakai peta.
- `style-src 'unsafe-inline'` dipertahankan karena Astro dan Bootstrap memakai gaya inline. Skrip tetap ketat (`'self'` plus Turnstile). Skrip kecil yang di-inline Vite sudah dicegah oleh `assetsInlineLimit: 0`. Jika setelah build masih ada skrip inline, pindahkan ke file atau gunakan hash.
- JSON-LD (`type="application/ld+json"`) adalah blok data, bukan skrip yang dieksekusi, sehingga tidak dibatasi `script-src`.
- HSTS: gunakan `preload` hanya setelah yakin seluruh subdomain bisa HTTPS.
- Setelah deploy, uji di securityheaders.com dan lewat konsol browser (tidak ada pelanggaran CSP).

---

## 7. Admin Panel

- **Akses:** `/admin/*` hanya untuk akun yang ada di `admin_users`. Guard halaman menyembunyikan UI sampai `getSession()` **dan** `rpc('is_admin')` selesai. Guard hanyalah kenyamanan, yang melindungi data tetap RLS.
- **Tidak terindeks:** meta `noindex`, header `X-Robots-Tag`, tidak masuk `sitemap.xml`, dikecualikan di `robots.txt`.
- **Login:** password kuat, MFA, CAPTCHA, pesan galat login yang sama untuk email salah maupun password salah.
- **Sesi:** logout menghapus sesi. Jangan menyimpan token di tempat lain selain yang dikelola `supabase-js`. Tambahkan logout otomatis setelah tidak aktif jika memungkinkan.
- **Data dari pengunjung = tidak tepercaya.** Di halaman "Pesan Masuk", tampilkan nama, perusahaan, pesan, dan semua isi form dengan `textContent` atau escape, **tidak pernah** `innerHTML`. Ini mencegah stored XSS yang menyerang admin.
- **Ekspor CSV:** awali sel yang dimulai dengan `=`, `+`, `-`, atau `@` dengan tanda kutip tunggal agar tidak dieksekusi sebagai rumus di spreadsheet (CSV injection).
- **Operasi destruktif:** hapus produk, artikel, atau foto meminta konfirmasi. Pertimbangkan *soft delete* (`is_published = false`) sebagai default.
- **Jejak aktivitas (opsional, P2):** tabel `audit_log` yang diisi trigger untuk perubahan `products`, `articles`, `site_settings`, berisi siapa, kapan, dan apa yang berubah.
- **Pemisahan:** akun admin tidak dipakai untuk membuka situs publik di perangkat umum. Admin mengakses dari perangkat yang diperbarui.

---

## 8. Data Pribadi

Tabel `inquiries` menyimpan data pribadi pengunjung (nama, nomor WhatsApp, email, perusahaan, isi pesan). Di Indonesia, pelindungan data pribadi diatur oleh UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Dokumen ini bukan nasihat hukum, jadi pastikan kewajiban spesifik bisnis Anda ditinjau oleh ahli hukum.

Langkah praktis:

1. **Halaman kebijakan privasi** (`/kebijakan-privasi`): data apa yang dikumpulkan, untuk apa, berapa lama disimpan, siapa yang bisa mengakses, dan cara meminta penghapusan. Tautkan dari footer dan form.
2. **Persetujuan eksplisit** pada form: kotak centang tidak tercentang secara default, misalnya "Saya setuju data saya digunakan untuk menanggapi permintaan ini."
3. **Minimalkan data:** hanya kolom yang benar-benar perlu. Email dan perusahaan opsional.
4. **Retensi:** tetapkan masa simpan (misalnya 24 bulan setelah status `selesai` atau `batal`), lalu hapus atau anonimkan secara berkala.
5. **Akses terbatas:** hanya admin, tanpa berbagi akun. Jangan menyalin data lead ke spreadsheet publik atau grup chat.
6. **Permintaan penghapusan:** siapkan prosedur (cari berdasarkan nomor WhatsApp atau kode referensi, hapus, catat).
7. **Jangan masukkan data pribadi ke log**, analytics, atau URL (tidak ada nama atau nomor di query string).
8. **Pelacak pihak ketiga:** jika memakai analytics atau pixel, cantumkan di kebijakan privasi dan muat hanya setelah dipertimbangkan matang. Bootstrap, font, dan skrip lain di-self-host agar tidak membocorkan alamat IP pengunjung ke pihak ketiga.

---

## 9. Rantai Pasok dan Akun

**Dependensi**

- Commit `package-lock.json`. Pasang dengan `npm ci` di CI dan Vercel.
- Jalankan `npm audit` di CI (gagal pada tingkat *high* ke atas) dan aktifkan Dependabot atau Renovate.
- **Perbarui Astro, adapter Vercel, dan `@supabase/supabase-js` secara rutin.** Celah pada middleware keamanan framework pernah ditemukan dan hanya tertutup bila versi diperbarui.
- Hindari paket kecil yang tidak perlu. Tinjau paket baru (jumlah unduhan, pemelihara, skrip `postinstall`).
- Pin versi CDN jika ada skrip eksternal (sebaiknya tidak ada, karena semua aset di-self-host).

**Rahasia dan akun**

- Aktifkan 2FA di GitHub, Vercel, Supabase, Cloudflare, registrar domain, dan email pemilik.
- Jalankan secret scanning (misalnya `gitleaks` di CI dan pre-commit). Jika ada rahasia yang pernah ter-commit, anggap bocor dan rotasi, bukan sekadar hapus dari riwayat.
- Domain: aktifkan kunci transfer dan perpanjangan otomatis, serta DNSSEC jika tersedia. Pastikan DNS (SPF, DKIM, DMARC) siap bila nanti mengirim email notifikasi.
- Branch `main` dilindungi: wajib pull request dan CI hijau sebelum merge.

---

## 10. Pemantauan dan Respons Insiden

**Pemantauan**

- Uptime monitor eksternal untuk beranda dan `/api/inquiry` (uji kesehatan, bukan kirim data asli).
- Tinjau log Vercel (error 4xx/5xx, lonjakan permintaan) dan log Supabase (Auth, API, Postgres) setiap minggu.
- Alert untuk lonjakan jumlah `inquiries` dalam waktu singkat, percobaan login admin yang gagal berulang, dan kenaikan error 403 pada `/api/inquiry`.

**Respons insiden (urutan tindakan)**

1. **Tahan:** nonaktifkan form (flag di `site_settings` atau cabut grant insert anon sementara), tambahkan aturan blokir di Vercel Firewall, cabut sesi admin (ubah password dan hapus sesi di Auth).
2. **Putar kunci:** buat secret key baru, ganti kunci Turnstile, ganti password admin, hapus kunci lama.
3. **Selidiki:** periksa log Auth, API, dan Postgres untuk waktu dan pola akses. Catat data apa yang terdampak.
4. **Pulihkan:** kembalikan data dari backup jika ada yang rusak, deploy ulang dari commit yang diketahui bersih.
5. **Beri tahu:** jika data pribadi pengunjung terdampak, informasikan pihak terkait sesuai kewajiban hukum (konsultasikan dengan ahli hukum).
6. **Pelajari:** tulis catatan pasca-insiden dan tambahkan test yang akan menangkap kasus serupa (`TESTING.md`).

---

## 11. Pelaporan Kerentanan

Sediakan `public/.well-known/security.txt`:

```
Contact: mailto:keamanan@domain-anda.id
Expires: 2027-10-25T00:00:00.000Z
Preferred-Languages: id, en
Canonical: https://domain-anda.id/.well-known/security.txt
```

Perbarui tanggal `Expires` setiap tahun. Pastikan kotak masuk yang tertera benar-benar dipantau.

---

## 12. Checklist Pra-Rilis

**Supabase**
- [ ] RLS aktif di semua tabel `public`. Security Advisor bersih dari peringatan terkait RLS.
- [ ] Hak tulis `anon` dicabut. Hanya `INSERT` kolom tertentu pada `inquiries`.
- [ ] Tidak ada policy `SELECT` publik pada `inquiries`.
- [ ] Pendaftaran publik dimatikan. Akun admin terdaftar di `admin_users`, MFA aktif.
- [ ] Bucket `media`: batas ukuran dan allowlist MIME terpasang, SVG tidak diizinkan.
- [ ] Proyek produksi, staging, dan lokal terpisah. Preview Vercel memakai staging.
- [ ] Backup atau ekspor terjadwal dan pernah diuji dipulihkan.

**Aplikasi**
- [ ] Tidak ada secret di repo, riwayat git, atau bundel klien (`gitleaks` bersih).
- [ ] `/api/inquiry`: Origin, Content-Type, ukuran body, honeypot, Turnstile, validasi server, rate limit Vercel.
- [ ] Semua `set:html` berasal dari data yang sudah disanitasi atau di-escape.
- [ ] Halaman tak ada mengembalikan 404 sungguhan. Tidak ada stack trace atau pesan database ke pengunjung.
- [ ] Panel admin menampilkan data pengunjung sebagai teks (bukan HTML), ekspor CSV aman dari rumus.

**Infrastruktur**
- [ ] HTTPS dan HSTS aktif. Header keamanan terpasang, CSP sudah mode enforce (atau report-only dengan rencana tanggal enforce).
- [ ] `/admin/*` noindex dan `no-store`. `security.txt` tersedia.
- [ ] 2FA aktif di GitHub, Vercel, Supabase, Cloudflare, registrar, dan email pemilik.
- [ ] `npm audit` tanpa temuan *high/critical*, Dependabot/Renovate aktif.
- [ ] Uptime monitor dan alert aktif.

**Privasi**
- [ ] Halaman kebijakan privasi, kotak persetujuan di form, kebijakan retensi tertulis.