# TESTING.md — seminarkit

Rencana dan panduan pengujian website seminarkit (Astro + Supabase + Bootstrap). Dibaca bersama `PRD.md` (apa yang harus ada), `DESIGN.md` (bagaimana tampilannya), dan `SECURITY.md` (kontrol yang harus terbukti bekerja).

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 25 Oktober 2026 |
| **Alat utama** | Vitest, pgTAP (`supabase test db`), Playwright, axe-core, Lighthouse CI |
| **Aturan emas** | Jangan pernah menguji ke database produksi |

---

## 1. Strategi Pengujian

| Lapisan | Apa yang diuji | Alat | Kapan jalan |
|---|---|---|---|
| Statis | Lint, tipe, format | ESLint, Prettier, `astro check` | Setiap commit |
| Unit | Fungsi murni: format tanggal/harga, normalisasi nomor WA, pembuat URL WA, sanitasi Markdown, pembuat JSON-LD | Vitest | Setiap commit |
| Database | RLS, grant, constraint, trigger | pgTAP lewat `supabase test db` | Setiap PR |
| API | `/api/inquiry` (validasi, Turnstile, Origin, rate limit) | Vitest + `fetch` ke server uji | Setiap PR |
| End-to-end | Alur pengguna di browser nyata, semua halaman dan komponen | Playwright (Chromium, WebKit, mobile) | Setiap PR |
| Aksesibilitas | Pelanggaran WCAG otomatis + uji keyboard | `@axe-core/playwright` + manual | Setiap PR + sebelum rilis |
| Performa | Lighthouse mobile, LCP, CLS | Lighthouse CI | Setiap PR ke preview |
| SEO | Meta, canonical, JSON-LD, sitemap, 404 | Playwright + validator | Setiap PR |
| Keamanan | Header, XSS, RLS dari sisi klien, secret scanning | Playwright, Vitest, gitleaks, `npm audit` | Setiap PR + sebelum rilis |
| Manual (UAT) | Perangkat nyata, alur WhatsApp nyata, kesan visual | Daftar periksa bagian 12 | Sebelum rilis |

Prinsip: uji sebanyak mungkin secara otomatis di lapisan paling bawah yang bisa menangkapnya (lebih cepat dan murah), dan sisakan browser nyata untuk hal yang memang hanya bisa dilihat di sana.

---

## 2. Lingkungan Uji

| Lingkungan | Database | Turnstile | Kegunaan |
|---|---|---|---|
| **Lokal** | `supabase start` (Docker) | Kunci uji | Pengembangan dan CI |
| **Staging** | Proyek Supabase terpisah | Kunci uji | Preview Vercel, Lighthouse, UAT |
| **Produksi** | Proyek produksi | Kunci produksi | Hanya uji asap (smoke) pasca-rilis, tanpa data uji permanen |

Variabel `.env.test`:

```bash
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<dari output `supabase status`>
PUBLIC_SITE_URL=http://localhost:4321
ALLOWED_ORIGINS=http://localhost:4321
# Kunci uji Turnstile (resmi dari Cloudflare):
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA     # selalu lolos
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # selalu lolos
```

Kunci uji Turnstile lain untuk skenario gagal:

| Kunci | Perilaku |
|---|---|
| Site key `2x00000000000000000000AB` | Widget selalu memblokir |
| Secret `2x0000000000000000000000000000000AA` | `siteverify` selalu gagal |
| Secret `3x0000000000000000000000000000000AA` | Galat "token sudah dipakai" |
| Token dummy | `XXXX.DUMMY.TOKEN.XXXX` (hanya diterima secret uji) |

Kunci uji hanya boleh ada di lingkungan lokal, CI, dan staging. Secret uji menerima token apa pun, jadi jangan pernah dipasang di produksi.

---

## 3. Persiapan

```bash
npm i -D vitest @playwright/test @axe-core/playwright @lhci/cli eslint prettier
npx playwright install --with-deps
supabase init            # sekali saja
supabase start           # menjalankan Postgres + Auth + Storage lokal
supabase db reset        # menerapkan supabase/schema.sql dan seed
```

`package.json`:

```json
{
  "scripts": {
    "lint": "eslint . && prettier --check .",
    "check": "astro check",
    "test:unit": "vitest run",
    "test:db": "supabase test db",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test --grep @a11y",
    "test:lh": "lhci autorun",
    "test": "npm run lint && npm run check && npm run test:unit && npm run test:db && npm run test:e2e"
  }
}
```

Struktur:

```
tests/
├─ unit/              wa.test.ts, phone.test.ts, markdown.test.ts, jsonld.test.ts, format.test.ts
├─ api/               inquiry.test.ts
├─ e2e/               global.spec.ts, home.spec.ts, produk.spec.ts, galeri.spec.ts,
│                     blog.spec.ts, kontak.spec.ts, admin.spec.ts, design.spec.ts,
│                     seo.spec.ts, security.spec.ts, a11y.spec.ts
└─ fixtures/          seed.test.sql
supabase/
└─ tests/             rls.test.sql, constraints.test.sql
lighthouserc.json
playwright.config.ts
```

### 3.1 Data uji (`tests/fixtures/seed.test.sql`)

Seed minimal yang cukup untuk semua skenario. Semua baris uji memakai awalan `uji-` agar mudah dibersihkan.

| Tabel | Isi |
|---|---|
| `site_settings` | 1 baris, `wa_number` = `628123456789` |
| `categories` | 2 kategori aktif, 1 tidak aktif |
| `products` | 5 terbit (3 `is_featured`), 2 draf (`is_published = false`), 1 tanpa gambar |
| `gallery` | 14 terbit (untuk uji pagination 12 per halaman), 1 draf |
| `testimonials` | 4 terbit, 1 draf |
| `faqs` | 6 terbit, 1 draf |
| `articles` | 10 terbit (uji pagination 9 per halaman), 1 draf, 1 dengan `published_at` di masa depan |
| `inquiries` | Kosong (diisi oleh test) |
| Pengguna admin | 1 admin (di `admin_users`), 1 pengguna biasa bukan admin |

---

## 4. Uji Unit (Vitest)

Fokus pada logika yang jika salah akan merugikan: nomor WA dan URL pesan.

```ts
// tests/unit/phone.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeWa } from '../../src/lib/wa';

describe('normalizeWa', () => {
  it.each([
    ['081234567890', '6281234567890'],
    ['+62 812-3456-7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
  ])('menormalkan %s', (input, expected) => {
    expect(normalizeWa(input)).toBe(expected);
  });

  it.each(['', 'abc', '0812', '0812345678901234567890', '+1 202 555 0100'])(
    'menolak %s', (input) => { expect(normalizeWa(input)).toBeNull(); });
});
```

```ts
// tests/unit/wa.test.ts
import { describe, it, expect } from 'vitest';
import { buildWaUrl } from '../../src/lib/wa';

describe('buildWaUrl', () => {
  it('meng-encode teks dan hanya memakai digit pada nomor', () => {
    const url = buildWaUrl('+62 812-3456-789', 'Halo & "tes"\nbaris 2');
    expect(url.startsWith('https://wa.me/62812345678')).toBe(true);
    expect(url).not.toContain(' ');
    expect(url).toContain(encodeURIComponent('Halo & "tes"\nbaris 2'));
  });
  it('menyertakan nama produk pada pesan card', () => {
    const url = buildWaUrl('628123456789', 'Saya tertarik dengan produk Tumbler Custom');
    expect(decodeURIComponent(url)).toContain('Tumbler Custom');
  });
});
```

```ts
// tests/unit/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

describe('renderMarkdown (sanitasi)', () => {
  it('membuang skrip dan atribut event', () => {
    const html = renderMarkdown('Halo <script>alert(1)</script> <img src="https://x.id/a.webp" onerror="alert(1)">');
    expect(html).not.toMatch(/<script|onerror/i);
  });
  it('menolak tautan javascript:', () => {
    expect(renderMarkdown('[klik](javascript:alert(1))')).not.toMatch(/javascript:/i);
  });
  it('menambahkan rel pada tautan', () => {
    expect(renderMarkdown('[a](https://contoh.id)')).toContain('rel="noopener noreferrer"');
  });
});
```

```ts
// tests/unit/jsonld.test.ts
import { it, expect } from 'vitest';
import { safeJson } from '../../src/lib/seo';

it('meng-escape "<" agar </script> tidak memutus tag', () => {
  const out = safeJson({ name: '</script><script>alert(1)</script>' });
  expect(out).not.toContain('</script>');
  expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
});
```

Uji unit lain yang perlu ada: format tanggal Indonesia (`25 Oktober 2026`), format harga (`Rp 25.000`), pemotongan deskripsi, pembuat `BreadcrumbList`/`Product`/`BlogPosting`, dan validasi parameter `page`.

---

## 5. Uji Database: RLS, Grant, Constraint (pgTAP)

Jalankan dengan `supabase test db`. Berkas di `supabase/tests/`. Setiap test dalam transaksi yang di-*rollback*.

```sql
-- supabase/tests/rls.test.sql
begin;
select plan(15);

-- Fixture (dijalankan sebagai pemilik)
insert into public.products (id, nama, slug, deskripsi_singkat, harga_mulai, is_published) values
  ('00000000-0000-0000-0000-0000000000a1', 'Uji Terbit', 'uji-terbit', 'x', 1000, true),
  ('00000000-0000-0000-0000-0000000000a2', 'Uji Draf',   'uji-draf',   'x', 1000, false);
insert into public.inquiries (id, nama, no_wa) values
  ('00000000-0000-0000-0000-0000000000b1', 'Uji Lead', '6281234567890');
insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000ad01'),   -- admin
  ('00000000-0000-0000-0000-00000000ad02');   -- pengguna biasa
insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-00000000ad01');

-- ========== ANON ==========
set local role anon;

select is((select count(*)::int from public.products where slug like 'uji-%'), 1,
  'anon hanya melihat produk terbit');
select is((select count(*)::int from public.inquiries), 0,
  'anon tidak bisa membaca inquiries');
select is((select count(*)::int from public.admin_users), 0,
  'anon tidak melihat admin_users');

select throws_ok(
  $$insert into public.products (nama, slug, deskripsi_singkat, harga_mulai) values ('x','uji-x','x',1)$$,
  '42501', null, 'anon tidak bisa menulis produk');

select throws_ok($$update public.products set nama = 'diretas' where slug = 'uji-terbit'$$,
  '42501', null, 'anon tidak bisa mengubah produk');

select throws_ok($$delete from public.products where slug = 'uji-terbit'$$,
  '42501', null, 'anon tidak bisa menghapus produk');

select lives_ok(
  $$insert into public.inquiries (nama, no_wa) values ('Uji Anon', '6281234567891')$$,
  'anon boleh mengirim inquiry');

select throws_ok(
  $$insert into public.inquiries (nama, no_wa, status) values ('Uji', '6281234567892', 'selesai')$$,
  null, null, 'anon tidak bisa menetapkan status selain baru');

select throws_ok(
  $$insert into public.inquiries (nama, no_wa) values ('U', '6281234567893')$$,
  null, null, 'nama terlalu pendek ditolak');

select throws_ok(
  $$insert into public.inquiries (nama, no_wa) values ('Uji Format', '12345')$$,
  null, null, 'format nomor WA salah ditolak');

select throws_ok($$select public.is_admin()$$, '42501', null,
  'anon tidak boleh memanggil is_admin()');

reset role;

-- ========== AUTHENTICATED BUKAN ADMIN ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000ad02","role":"authenticated"}', true);

select is((select count(*)::int from public.inquiries), 0,
  'pengguna biasa tidak bisa membaca inquiries');
select throws_ok(
  $$insert into public.products (nama, slug, deskripsi_singkat, harga_mulai) values ('x','uji-y','x',1)$$,
  '42501', null, 'pengguna biasa tidak bisa menulis produk');

reset role;

-- ========== ADMIN ==========
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000ad01","role":"authenticated"}', true);

select is((select count(*)::int from public.products where slug like 'uji-%'), 2,
  'admin melihat produk terbit dan draf');
select ok((select count(*) from public.inquiries) >= 1,
  'admin bisa membaca inquiries');

reset role;

select * from finish();
rollback;
```

Catatan:

- Jika `insert into auth.users (id)` ditolak karena kolom wajib berubah di versi Supabase yang dipakai, buat pengguna lewat helper pgTAP atau sesuaikan kolom minimal.
- Baris "anon tidak bisa menulis" mengandalkan hak tulis anon yang dicabut (`SECURITY.md` bagian 3.3). Setelah itu galat yang muncul adalah `42501` (izin ditolak). Tanpa pencabutan, RLS tetap menolak insert dengan kode yang sama, jadi test tetap valid.
- Tambah test setiap kali ada tabel atau policy baru: baca publik hanya yang terbit, tulis hanya admin.
- Uji trigger rate limit: sisipkan 5 inquiry dengan nomor sama dalam transaksi, yang ke-6 harus gagal (`P0001`).

Uji penyimpanan (Storage) dilakukan di lapisan API (bagian 6.2), karena kebijakan `storage.objects` lebih mudah diuji lewat klien.

---

## 6. Uji API

### 6.1 `POST /api/inquiry`

Server uji: `astro dev` dengan `.env.test` (`astro preview` tidak tersedia untuk adapter Vercel). Pengujian header dan Lighthouse dilakukan terhadap URL preview Vercel. Setiap test memakai token dummy `XXXX.DUMMY.TOKEN.XXXX`.

| ID | Skenario | Input | Hasil yang diharapkan |
|---|---|---|---|
| API-01 | Permintaan valid | Semua field benar, token dummy, `t` > 3 detik lalu | 200, `ok: true`, `saved: true`, `waUrl` berisi nama; 1 baris baru di `inquiries` |
| API-02 | Hanya field wajib | `nama` + `noWa` | 200, tersimpan |
| API-03 | Nomor format lokal | `081234567890` | Tersimpan sebagai `6281234567890` |
| API-04 | Nomor tidak valid | `abc` | 422, `errors.noWa`, tidak tersimpan |
| API-05 | Nama kosong atau 1 huruf | `""` | 422, `errors.nama` |
| API-06 | Email salah format | `a@b` | 422, `errors.email` |
| API-07 | Jumlah negatif atau 0 | `-5` | 422, `errors.jumlah` |
| API-08 | Honeypot terisi | `website: "x"` | 200 palsu, **tidak ada** baris baru |
| API-09 | Terlalu cepat | `t` = sekarang | 200 palsu, tidak tersimpan |
| API-10 | Tanpa token Turnstile | tanpa `turnstileToken` | 400, tidak tersimpan |
| API-11 | Secret Turnstile "selalu gagal" | server dijalankan dengan secret `2x…AA` | 403, tidak tersimpan |
| API-12 | Secret "token sudah dipakai" | secret `3x…AA` | 403 |
| API-13 | Origin salah | header `Origin: https://evil.example` | 403 |
| API-14 | Tanpa Origin | tanpa header | 403 |
| API-15 | Content-Type salah | `text/plain` | 415 |
| API-16 | Body terlalu besar | > 8 KB | 413 |
| API-17 | JSON rusak | `{bad` | 400 |
| API-18 | Pesan terlalu panjang | 5000 karakter | Terpotong 2000 atau ditolak, tidak menyebabkan galat 500 |
| API-19 | Karakter kontrol dan HTML | `nama: "<b>x</b>\u0000"` | Tersimpan sebagai teks (tanpa karakter kontrol), tidak dieksekusi di mana pun |
| API-20 | Batas laju nomor sama | 6 kali dengan nomor sama | Kiriman ke-6 gagal (trigger), respons tetap menyertakan `waUrl` dan `saved: false` |
| API-21 | Database mati | Supabase dihentikan | 200, `saved: false`, `waUrl` tetap ada |
| API-22 | Metode salah | `GET /api/inquiry` | 405 |
| API-23 | Tidak ada kebocoran galat | Paksa galat database | Respons tidak memuat pesan SQL atau stack trace |

Kerangka:

```ts
// tests/api/inquiry.test.ts
import { describe, it, expect } from 'vitest';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:4321';
const ORIGIN = 'http://localhost:4321';
const valid = () => ({
  nama: 'Uji Coba', noWa: '081234567890', perusahaan: 'PT Uji', produk: 'Tumbler Custom',
  jumlah: 50, pesan: 'Butuh 50 pcs', turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  website: '', t: Date.now() - 10_000, sourcePage: '/kontak',
});
const post = (body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${BASE}/api/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/inquiry', () => {
  it('API-01 menerima permintaan valid', async () => {
    const res = await post(valid());
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ ok: true, saved: true });
    expect(data.waUrl).toContain('https://wa.me/');
  });
  it('API-04 menolak nomor tidak valid', async () => {
    const res = await post({ ...valid(), noWa: 'abc' });
    expect(res.status).toBe(422);
  });
  it('API-13 menolak Origin asing', async () => {
    const res = await post(valid(), { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
  });
  it('API-15 menolak Content-Type selain JSON', async () => {
    const res = await post('nama=x', { 'Content-Type': 'text/plain' });
    expect(res.status).toBe(415);
  });
});
```

Verifikasi "tidak tersimpan" atau "tersimpan" dilakukan dengan membaca `inquiries` lewat klien admin uji (atau `psql` ke database lokal), bukan lewat klien anon.

### 6.2 Akses Supabase langsung (dari sudut pandang penyerang)

Dengan publishable key saja (seperti yang dilihat siapa pun di bundel situs), jalankan:

| ID | Percobaan | Hasil yang diharapkan |
|---|---|---|
| SB-01 | `select * from inquiries` | Kosong (`[]`) |
| SB-02 | `select * from products` | Hanya baris `is_published = true` |
| SB-03 | `select * from articles` | Tidak ada draf, tidak ada `published_at` di masa depan |
| SB-04 | `insert/update/delete` pada `products`, `articles`, `gallery`, `site_settings` | Ditolak |
| SB-05 | `insert` ke `inquiries` dengan `status: 'selesai'` | Ditolak |
| SB-06 | `insert` ke `inquiries` dengan kolom di luar daftar grant | Ditolak |
| SB-07 | Upload file ke bucket `media` tanpa login | Ditolak |
| SB-08 | Upload ke `media` sebagai pengguna login non-admin | Ditolak |
| SB-09 | Upload `.svg` atau `.html` sebagai admin | Ditolak (MIME tidak diizinkan) |
| SB-10 | Upload gambar > 5 MB sebagai admin | Ditolak (batas ukuran) |
| SB-11 | Pakai publishable key di header `Authorization` | Tidak memberi hak lebih |
| SB-12 | Daftar akun baru lewat `auth.signUp` | Ditolak (pendaftaran dimatikan) |

---

## 7. Uji End-to-End (Playwright)

### 7.1 Konfigurasi

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome',    use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari',    use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

Konvensi agar mudah diuji: setiap `<section>` utama di `<main>` punya `id` tetap (`hero`, `tentang`, `keunggulan`, `produk`, `galeri`, `testimoni`, `faq`, `cta`), dan komponen memakai kelas dari `DESIGN.md` (`.sk-card`, `.sk-features`, `.btn-sk`, `.sk-navbar`, `.wa-float`).

### 7.2 Uji global (semua halaman)

```ts
// tests/e2e/global.spec.ts
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/tentang', '/produk', '/galeri', '/blog', '/kontak', '/halaman-tidak-ada'];

for (const route of ROUTES) {
  test.describe(`halaman ${route}`, () => {
    test('WhatsApp melayang dan scroll bar tampil', async ({ page }) => {
      await page.goto(route);
      const btn = page.locator('[data-wa-float] .wa-float__btn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+/);
      await expect(page.locator('[data-wa-float] .wa-float__track')).toBeVisible();
    });

    test('tanpa scroll horizontal', async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });

    test('satu H1 dan lang="id"', async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    });
  });
}

test('scroll bar WA naik mengikuti scroll', async ({ page }) => {
  await page.goto('/');
  const progress = () => page.locator('[data-wa-float]').evaluate(
    (el) => Number(el.style.getPropertyValue('--wa-progress')) || 0);
  expect(await progress()).toBe(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(progress).toBeGreaterThan(95);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(progress).toBeLessThan(5);
});

test('halaman tidak ada mengembalikan status 404', async ({ request }) => {
  expect((await request.get('/halaman-tidak-ada')).status()).toBe(404);
  expect((await request.get('/produk/slug-tidak-ada')).status()).toBe(404);
  expect((await request.get('/blog/slug-tidak-ada')).status()).toBe(404);
});
```

### 7.3 Kasus uji per halaman

**Beranda `/`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| HOME-01 | Urutan section | `main > section` ber-id: `hero, tentang, keunggulan, produk, galeri, testimoni, faq, cta` |
| HOME-02 | Hero | Satu H1, dua tombol (Lihat Produk, Pesan via WA), gambar punya `width`/`height` dan `fetchpriority="high"` |
| HOME-03 | Kenapa Pilih Kami | Tepat satu `.sk-features` berisi 4 `.sk-features__item` bernomor 01–04, tanpa ikon |
| HOME-04 | Produk | Tepat 3 `.sk-card`, hanya produk `is_featured` dan terbit, urut `urutan`; draf tidak tampil |
| HOME-05 | Isi card produk | Nama, deskripsi singkat, harga berformat `Rp 25.000`, tombol "Detail Produk" ke `/produk/<slug>`, tombol "Pesan via WA" ke `wa.me` dengan nama produk pada teks |
| HOME-06 | Galeri | 6–8 gambar terbit, semua `alt` terisi, klik membuka lightbox |
| HOME-07 | Lightbox | Tombol teks "Sebelumnya", "Berikutnya", "Tutup" berfungsi, `Esc` menutup, panah kiri/kanan berpindah, fokus kembali ke gambar pemicu |
| HOME-08 | Testimoni | Hanya testimoni terbit, memuat nama dan perusahaan |
| HOME-09 | FAQ | 6 item terbit. Klik membuka satu item, `aria-expanded` berubah, indikator berubah dari `+` ke `−` |
| HOME-10 | CTA | Dua tombol: Chat WhatsApp dan Isi Form Pemesanan (`/kontak`) |
| HOME-11 | Data kosong | Jika tabel kosong, section menampilkan teks kosong yang rapi dan tidak merusak layout |

```ts
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('HOME-04/05 card produk unggulan', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#produk .sk-card');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card.locator('.sk-price__value')).toHaveText(/Rp\s?[\d.]+/);
    const detail = card.getByRole('link', { name: 'Detail Produk' });
    await expect(detail).toHaveAttribute('href', /^\/produk\/[a-z0-9-]+$/);
    const wa = card.getByRole('link', { name: 'Pesan via WA' });
    const name = (await card.locator('h3, h4').first().innerText()).trim();
    expect(decodeURIComponent((await wa.getAttribute('href'))!)).toContain(name);
  }
  await expect(page.locator('#produk')).not.toContainText('Uji Draf');
});

test('HOME-09 FAQ plus/minus', async ({ page }) => {
  await page.goto('/');
  const btn = page.locator('#faq .accordion-button').first();
  const mark = () => btn.evaluate((e) => getComputedStyle(e, '::after').content);
  expect(await mark()).toBe('"+"');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  expect(await mark()).toBe('"\u2212"');
});
```

**Tentang `/tentang`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| ABOUT-01 | Banner dan breadcrumb | `.sk-banner` ada, breadcrumb "Beranda / Tentang", halaman terakhir bukan tautan |
| ABOUT-02 | Urutan section | Tentang, Perbedaan dengan perusahaan lain, Keunggulan, CTA |
| ABOUT-03 | Tabel perbedaan | 5–6 baris, terbaca di mobile (tidak memotong halaman, boleh scroll di dalam wadah) |
| ABOUT-04 | Keunggulan | 6 item |

**Produk `/produk` dan `/produk/[slug]`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| PROD-01 | Banner, breadcrumb, CTA | Ada, breadcrumb "Beranda / Produk" |
| PROD-02 | Daftar | Hanya produk terbit, grid 3/2/1 kolom pada 1280/768/360 px |
| PROD-03 | Filter kategori | `?kategori=<slug>` hanya menampilkan kategori itu. Pill aktif ditandai. Slug tidak dikenal mengembalikan 404 |
| PROD-04 | Pagination | Lebih dari 12 produk menampilkan tautan teks Sebelumnya/Berikutnya. `?page=abc` diperlakukan sebagai halaman 1, `?page=999` mengembalikan 404 |
| PROD-05 | Detail | Nama, harga mulai, min. order, deskripsi lengkap, tabel spesifikasi, tombol Pesan via WA, JSON-LD `Product` |
| PROD-06 | Produk draf | `/produk/uji-draf` mengembalikan 404 |
| PROD-07 | Produk tanpa gambar | Menampilkan pengganti netral, tidak ada gambar rusak |

**Galeri `/galeri`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| GAL-01 | Banner, breadcrumb, CTA | Ada |
| GAL-02 | Pagination | 14 foto terbit: halaman 1 berisi 12, `?page=2` berisi 2. Foto draf tidak tampil |
| GAL-03 | Lazy load dan ukuran | Semua `img` punya `width`, `height`, `alt`, `loading="lazy"` |
| GAL-04 | Lightbox | Sama seperti HOME-07, termasuk jebakan fokus di dalam modal |

**Blog `/blog` dan `/blog/[slug]`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| BLOG-01 | Daftar | Hanya artikel terbit dengan `published_at <= now()`. Draf dan jadwal masa depan tidak tampil |
| BLOG-02 | Isi card | Judul, meta deskripsi, tanggal berformat "25 Oktober 2026", tombol "Baca Selengkapnya" ke `/blog/<slug>` |
| BLOG-03 | Urutan dan pagination | Terbaru di atas. 10 artikel: 9 di halaman 1, 1 di halaman 2 |
| BLOG-04 | Detail | H1, penulis, tanggal terbit dan diperbarui, daftar isi, isi artikel, artikel terkait, JSON-LD `BlogPosting` |
| BLOG-05 | Draf | `/blog/<slug-draf>` mengembalikan 404 |

**Kontak `/kontak`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| KON-01 | Banner dan breadcrumb | Ada |
| KON-02 | Info kontak | Nomor WA, email, alamat, jam kerja sesuai `site_settings` |
| KON-03 | Validasi klien | Kirim kosong menampilkan pesan galat di bawah field, fokus pindah ke field pertama yang salah |
| KON-04 | Alur sukses | Isi valid, kirim, pesan sukses tampil, browser diarahkan ke `wa.me` dengan teks berisi nama, produk, jumlah. Satu baris `inquiries` tersimpan |
| KON-05 | Database gagal | Simulasi `saved: false`: tetap diarahkan ke WhatsApp |
| KON-06 | Tombol cadangan | Jika pengalihan otomatis gagal, tombol "Buka WhatsApp" muncul |
| KON-07 | Status tombol | Saat proses tombol berubah menjadi "Mengirim…" dan nonaktif (mencegah kirim ganda) |
| KON-08 | Persetujuan | Tanpa kotak persetujuan tercentang, kirim ditolak |
| KON-09 | Pilihan produk | Dropdown berisi produk terbit saja. Datang dari `/kontak?produk=<slug>` memilih produk otomatis |

```ts
// tests/e2e/kontak.spec.ts
import { test, expect } from '@playwright/test';
import { countInquiries } from './helpers/db'; // klien admin uji ke database lokal

test('KON-04 form menyimpan lalu membuka WhatsApp', async ({ page }) => {
  await page.route('https://wa.me/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: 'wa' }));
  await page.goto('/kontak');

  await page.getByLabel('Nama').fill('Uji Playwright');
  await page.getByLabel(/WhatsApp/i).fill('081234567890');
  await page.getByLabel(/Produk diminati/i).selectOption({ index: 1 });
  await page.getByLabel('Jumlah').fill('100');
  await page.getByLabel(/Pesan/i).fill('Tes otomatis');
  await page.getByLabel(/setuju/i).check();

  await page.waitForTimeout(3200); // lewati time-trap 3 detik (atau set FORM_MIN_FILL_MS=0 di .env.test)
  const before = await countInquiries('Uji Playwright');
  await page.getByRole('button', { name: 'Kirim dan Lanjut ke WhatsApp' }).click();

  await page.waitForURL(/wa\.me\/\d+\?text=/);
  expect(decodeURIComponent(page.url())).toContain('Uji Playwright');
  expect(await countInquiries('Uji Playwright')).toBe(before + 1);
});

test('KON-03 validasi klien', async ({ page }) => {
  await page.goto('/kontak');
  await page.getByRole('button', { name: 'Kirim dan Lanjut ke WhatsApp' }).click();
  await expect(page.locator('.sk-error').first()).toBeVisible();
  await expect(page.getByLabel('Nama')).toBeFocused();
});
```

**Admin `/admin/*`**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| ADM-01 | Tanpa login | `/admin/produk` tidak menampilkan data apa pun dan berakhir di `/admin/login` (tanpa kilatan konten) |
| ADM-02 | Login admin | Berhasil, dashboard tampil setelah `is_admin` bernilai benar |
| ADM-03 | Login pengguna biasa | Akun yang bukan admin ditolak masuk ke panel |
| ADM-04 | CRUD produk | Buat, ubah, terbitkan, sembunyikan, hapus. Perubahan tampak di `/produk` |
| ADM-05 | Upload gambar | Gambar dikompres ke WebP ≤ 1600 px. Metadata EXIF hilang. SVG ditolak |
| ADM-06 | Pesan masuk | Daftar urut terbaru, ubah status berfungsi, filter tanggal berfungsi |
| ADM-07 | Stored XSS | Inquiry bernama `<img src=x onerror="window.__xss=1">` tampil sebagai teks. `window.__xss` tetap `undefined` |
| ADM-08 | Ekspor CSV | Sel yang diawali `=`, `+`, `-`, `@` diawali tanda kutip tunggal |
| ADM-09 | Logout | Sesi hilang, tombol Back tidak membuka data |
| ADM-10 | Noindex | Semua halaman admin punya `noindex` dan tidak ada di `sitemap.xml` |

---

## 8. Uji Kepatuhan Desain Otomatis

Memastikan aturan `DESIGN.md` tidak dilanggar seiring perubahan kode.

```ts
// tests/e2e/design.spec.ts
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/tentang', '/produk', '/galeri', '/blog', '/kontak', '/halaman-tidak-ada'];
// Panah, chevron, tanda kutip sudut, dan emoji
const FORBIDDEN =
  /[\u2190-\u21FF\u2B00-\u2BFF\u00BB\u203A\u2192\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u;

test('navbar: darkslategrey, teks putih, aktif hanya tebal', async ({ page, isMobile }) => {
  test.skip(isMobile, 'menu tertutup pada layar kecil');
  await page.goto('/produk');
  const nav = page.locator('nav.sk-navbar');
  await expect(nav).toHaveCSS('background-color', 'rgb(47, 79, 79)');

  const active = nav.locator('a.nav-link[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveText('Produk');
  await expect(active).toHaveCSS('font-weight', '700');
  await expect(active).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(active).toHaveCSS('text-decoration-line', 'none');

  for (const link of await nav.locator('a.nav-link:not([aria-current="page"])').all()) {
    await expect(link).toHaveCSS('font-weight', '400');
  }
});

test('menu tidak bergeser saat berpindah halaman', async ({ page, isMobile }) => {
  test.skip(isMobile);
  const widths = () => page.locator('nav.sk-navbar a.nav-link')
    .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  await page.goto('/');
  const a = await widths();
  await page.goto('/galeri');
  expect(await widths()).toEqual(a);
});

for (const route of ROUTES) {
  test(`tanpa panah, emoji, atau ikon pada tombol: ${route}`, async ({ page }) => {
    await page.goto(route);
    expect(await page.locator('body').innerText()).not.toMatch(FORBIDDEN);
    await expect(page.locator('.btn-sk svg, .btn-sk img, .btn-sk i, .btn-sk [class*="icon"]'))
      .toHaveCount(0);
    const withPseudo = await page.locator('.btn-sk, .sk-pagination a').evaluateAll((els) =>
      els.filter((e) => ['::before', '::after'].some((p) => {
        const c = getComputedStyle(e, p).content;
        return c && !['none', 'normal', '""'].includes(c);
      })).length);
    expect(withPseudo).toBe(0);
  });

  test(`tanpa gradien dan bayangan pada kartu: ${route}`, async ({ page }) => {
    await page.goto(route);
    const gradients = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter((e) => getComputedStyle(e).backgroundImage.includes('gradient')).length);
    expect(gradients).toBe(0);
    for (const card of await page.locator('.sk-card').all()) {
      await expect(card).toHaveCSS('box-shadow', 'none');
    }
  });
}

test('tombol memakai varian yang diizinkan dan tinggi sentuh minimal', async ({ page }) => {
  await page.goto('/');
  for (const b of await page.locator('.btn-sk').all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  }
});
```

Tambahan yang dicek manual atau lewat uji visual:

- Font judul Newsreader dan isi Hanken Grotesk benar-benar termuat (`document.fonts.check`).
- Hanya warna palet yang dipakai (tinjau dengan DevTools atau skrip yang mengumpulkan `color` dan `background-color` komputasi).
- Uji visual opsional: `toHaveScreenshot()` untuk navbar, hero, card produk, accordion, dan WA melayang pada 360/768/1280 px. Perbarui baseline hanya secara sengaja dan di lingkungan yang sama (Docker) agar font konsisten.

---

## 9. Aksesibilitas

**Otomatis (axe-core):**

```ts
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/tentang', '/produk', '/galeri', '/blog', '/kontak', '/halaman-tidak-ada'];

for (const route of ROUTES) {
  test(`@a11y tanpa pelanggaran WCAG: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('@a11y lightbox terbuka tanpa pelanggaran', async ({ page }) => {
  await page.goto('/galeri');
  await page.locator('.sk-gallery__item a, .sk-gallery__item button').first().click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Manual (keyboard dan pembaca layar):**

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| A11Y-01 | Tab dari awal halaman | Fokus pertama pada tautan "lompat ke konten", lalu navbar sesuai urutan visual |
| A11Y-02 | Cincin fokus | Terlihat di setiap elemen interaktif. Di latar terang berwarna darkslategrey, di latar gelap khaki terang |
| A11Y-03 | Navbar mobile | Toggler bisa dibuka dengan Enter/Spasi, `aria-expanded` berubah, `Esc` menutup |
| A11Y-04 | Accordion FAQ | Enter/Spasi membuka, status dibacakan pembaca layar |
| A11Y-05 | Lightbox | Fokus masuk ke dalam modal, terkunci di dalamnya, `Esc` menutup, fokus kembali ke pemicu |
| A11Y-06 | Form | Setiap field punya label terhubung. Galat dibacakan (`aria-describedby` atau `role="alert"`) |
| A11Y-07 | Zoom 200% dan teks besar | Tidak ada konten terpotong atau tumpang tindih |
| A11Y-08 | Pembaca layar (VoiceOver/TalkBack) | Menu, form, dan accordion dapat dipakai. Tombol WA melayang dibacakan "Chat WhatsApp seminarkit". Scroll bar tidak dibacakan |
| A11Y-09 | Gerak berkurang | Dengan `prefers-reduced-motion: reduce`, tidak ada transisi atau zoom gambar |

---

## 10. Performa

`lighthouserc.json` (mobile adalah preset bawaan Lighthouse):

```json
{
  "ci": {
    "collect": {
      "url": [
        "https://STAGING-URL/",
        "https://STAGING-URL/produk",
        "https://STAGING-URL/galeri",
        "https://STAGING-URL/blog",
        "https://STAGING-URL/kontak"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }],
        "uses-responsive-images": "warn",
        "offscreen-images": "warn"
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

Catatan:

- Jalankan terhadap **preview Vercel**, bukan `astro dev`. Jika preview dilindungi autentikasi Vercel, gunakan token bypass atau jalankan dari build produksi lokal.
- Gunakan `filesystem`, bukan `temporary-public-storage`, agar laporan staging tidak diunggah ke penyimpanan publik.
- Uji setelah rilis dengan PageSpeed Insights pada URL produksi. Data lapangan (CrUX) baru muncul setelah ada cukup trafik.

Anggaran awal (sesuaikan setelah ada data nyata):

| Metrik | Target (beranda, mobile) |
|---|---|
| LCP | ≤ 2,5 detik |
| CLS | ≤ 0,1 |
| TBT | ≤ 200 ms |
| JavaScript terkirim | ≤ 100 KB (gzip) |
| CSS terkirim | ≤ 60 KB (gzip) |
| Gambar hero | ≤ 150 KB (WebP) |
| Total transfer awal | ≤ 1,2 MB |

Uji manual tambahan: jaringan "Slow 4G" dengan CPU 4× lebih lambat di DevTools. Tidak ada gambar yang memuat lebih besar dari ukuran tampil, tidak ada font yang menyebabkan lompatan tata letak, dan menu serta tombol WA tetap responsif.

---

## 11. SEO dan Keamanan

### 11.1 SEO

```ts
// tests/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/tentang', '/produk', '/galeri', '/blog', '/kontak'];
const EXPECTED_LD: Record<string, string[]> = {
  '/': ['Organization', 'WebSite', 'FAQPage'],
  '/tentang': ['BreadcrumbList'],
  '/produk': ['ItemList', 'BreadcrumbList'],
  '/galeri': ['BreadcrumbList'],
  '/blog': ['BreadcrumbList'],
  '/kontak': ['ContactPage', 'BreadcrumbList'],
};

const titles = new Set<string>();

for (const route of ROUTES) {
  test(`SEO dasar ${route}`, async ({ page }) => {
    await page.goto(route);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(titles.has(title)).toBe(false);
    titles.add(title);

    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc!.length).toBeGreaterThanOrEqual(50);
    expect(desc!.length).toBeLessThanOrEqual(160);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/^https?:\/\//);

    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) {
      await expect(page.locator(`meta[property="${p}"]`)).toHaveCount(1);
    }

    const types: string[] = [];
    for (const s of await page.locator('script[type="application/ld+json"]').all()) {
      const data = JSON.parse((await s.textContent())!); // gagal bila JSON tidak valid
      for (const node of [data].flat()) types.push(node['@type']);
    }
    for (const t of EXPECTED_LD[route]) expect(types).toContain(t);
  });
}

test('sitemap dan robots', async ({ request }) => {
  const sm = await request.get('/sitemap.xml');
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  expect(xml).toContain('/produk/');
  expect(xml).not.toContain('uji-draf');
  expect(xml).not.toContain('/admin');

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Sitemap:/i);
  expect(robots).toMatch(/Disallow:\s*\/admin/i);
});

test('detail produk memuat JSON-LD Product dengan harga', async ({ page }) => {
  await page.goto('/produk/uji-terbit');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').allTextContents())
    .find((t) => t.includes('"Product"'))!);
  expect(ld.offers.priceCurrency).toBe('IDR');
  expect(Number(ld.offers.lowPrice)).toBeGreaterThan(0);
});
```

Tambahan manual sebelum rilis: validasi JSON-LD di Rich Results Test dan Schema Markup Validator, cek tautan rusak (misalnya `linkinator`), kirim `sitemap.xml` ke Google Search Console, dan periksa URL dengan "Inspeksi URL".

### 11.2 Keamanan

Ruang lingkup mengikuti `SECURITY.md`. Uji header dan CSP harus dijalankan terhadap **URL Vercel** karena header dipasang di `vercel.json`, bukan oleh `astro dev`.

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| SEC-01 | Header respons `/` | Ada `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, `X-Frame-Options` (atau `frame-ancestors`) |
| SEC-02 | Isi CSP | Tanpa `unsafe-eval`, tanpa `*` pada `script-src`, ada `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` |
| SEC-03 | Pelanggaran CSP | Menjelajah semua halaman (termasuk form dan admin) tidak memicu event `securitypolicyviolation` |
| SEC-04 | Header `/admin/*` | `X-Robots-Tag: noindex, nofollow` dan `Cache-Control: no-store` |
| SEC-05 | Header `/api/*` | `Cache-Control: no-store` |
| SEC-06 | XSS pada data | Produk `uji-xss` bernama `"><img src=x onerror=window.__xss=1>` dan artikel berisi `<script>`: tampil sebagai teks atau dibuang, `window.__xss` tetap `undefined` di `/produk`, `/produk/uji-xss`, `/blog/...` |
| SEC-07 | JSON-LD injection | Nama produk berisi `</script><script>alert(1)</script>` tidak memutus tag JSON-LD |
| SEC-08 | Tautan berbahaya | Artikel berisi `[x](javascript:alert(1))` tidak menghasilkan tautan `javascript:` |
| SEC-09 | Secret tidak bocor | Bundel hasil build tidak memuat `sb_secret_`, `service_role`, atau `TURNSTILE_SECRET` |
| SEC-10 | Repo bersih | `gitleaks detect` tanpa temuan |
| SEC-11 | Dependensi | `npm audit --audit-level=high` bersih |
| SEC-12 | Galat tidak bocor | Permintaan yang memicu galat tidak menampilkan stack trace atau pesan SQL |
| SEC-13 | Metode HTTP | `PUT/DELETE` ke `/api/inquiry` mengembalikan 405 |
| SEC-14 | Cookie dan sesi admin | Setelah logout tidak ada token tersisa di penyimpanan |

```ts
// tests/e2e/security.spec.ts (@staging: jalankan dengan TEST_BASE_URL=https://STAGING-URL)
import { test, expect } from '@playwright/test';

test('@staging SEC-01/02 header keamanan', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['strict-transport-security']).toBeTruthy();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBeTruthy();
  expect(h['permissions-policy']).toBeTruthy();
  const csp = h['content-security-policy'] ?? '';
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
});

test('@staging SEC-03 tanpa pelanggaran CSP', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as any).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  for (const route of ['/', '/produk', '/galeri', '/blog', '/kontak']) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => (window as any).__csp)).toEqual([]);
  }
});

test('SEC-06 data berbahaya ditampilkan sebagai teks', async ({ page }) => {
  await page.goto('/produk');
  expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  await expect(page.locator('body')).toContainText('<img src=x');
});
```

Tambahan ke `seed.test.sql` untuk skenario ini: produk `uji-xss` dengan payload di `nama` dan `deskripsi_singkat`, artikel `uji-xss-artikel` dengan skrip dan tautan `javascript:` pada `isi`.

Skrip pemeriksaan bundel (SEC-09), jalankan setelah build:

```bash
! grep -rEl "sb_secret_|service_role|TURNSTILE_SECRET" dist .vercel/output/static 2>/dev/null
```

---

## 12. Uji Manual (UAT) Sebelum Rilis

**Matriks perangkat dan browser**

| Perangkat | Browser | Wajib |
|---|---|---|
| Android (layar kecil, ±360 px) | Chrome | Ya |
| iPhone | Safari | Ya (pengalihan ke WhatsApp dan tombol melayang sering berbeda di sini) |
| Laptop/desktop | Chrome, Firefox, Edge | Ya |
| Tablet | Chrome atau Safari | Disarankan |

**Skenario**

- [ ] Kirim form pemesanan dengan data nyata di Android dan iPhone: WhatsApp terbuka dengan pesan terisi, dan baris baru muncul di admin dengan status "baru".
- [ ] Klik "Pesan via WA" dari card produk di beranda dan di `/produk`: pesan menyebut produk yang benar.
- [ ] Tombol WA melayang tidak menutupi tombol atau teks penting, dan scroll bar-nya terlihat di atas section terang maupun gelap (hero, banner, CTA, footer).
- [ ] Navbar: halaman aktif tebal pada keenam halaman, menu tidak bergeser, teks putih terbaca jelas.
- [ ] Tidak ada panah, emoji, atau ikon pada tombol di halaman mana pun.
- [ ] Tambah, ubah, sembunyikan, dan hapus produk, foto, testimoni, FAQ, dan artikel dari admin. Perubahan tampil di situs dalam waktu wajar (sesuai cache).
- [ ] Unggah foto besar dari ponsel: terkompres, orientasi benar, tidak terlalu berat.
- [ ] Jelajahi situs dengan jaringan lambat dan dengan JavaScript dimatikan: konten utama tetap terbaca.
- [ ] Hanya keyboard: semua halaman, menu, form, accordion, dan lightbox bisa dioperasikan.
- [ ] Baca ulang semua teks (typo, harga, nomor telepon, alamat, nama perusahaan). Testimoni memakai nama dan perusahaan asli dengan izin.
- [ ] Tautan footer, sosial media, dan kebijakan privasi mengarah ke tujuan yang benar.
- [ ] Pasca-rilis (produksi): beranda, satu produk, satu artikel, form (dengan satu data uji yang langsung dihapus), `sitemap.xml`, `robots.txt`, `/admin` (butuh login).

---

## 13. Otomasi di CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
      PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
      PUBLIC_SITE_URL: http://localhost:4321
      ALLOWED_ORIGINS: http://localhost:4321
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: npm }
      - run: npm ci
      - run: npm run lint && npm run check
      - run: npm run test:unit
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: supabase db reset
      - run: npm run test:db
      - name: Siapkan env Supabase lokal
        run: |
          echo "PUBLIC_SUPABASE_URL=$(supabase status -o env | grep API_URL | cut -d'"' -f2)" >> $GITHUB_ENV
          echo "PUBLIC_SUPABASE_PUBLISHABLE_KEY=$(supabase status -o env | grep -E 'ANON_KEY|PUBLISHABLE_KEY' | head -1 | cut -d'"' -f2)" >> $GITHUB_ENV
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run test:e2e
      - run: npm audit --audit-level=high
      - uses: gitleaks/gitleaks-action@v2
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: playwright-report }

  lighthouse:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: npm }
      - run: npm ci
      - run: npx lhci autorun   # URL preview Vercel dimasukkan ke lighthouserc.json atau lewat variabel
```

Catatan: nama kunci pada `supabase status -o env` berbeda antar versi CLI. Sesuaikan perintah `grep` dengan keluaran versi yang dipakai. Pasang aturan branch protection agar PR tidak bisa digabung bila `test` gagal.

---

## 14. Defect dan Gerbang Rilis

### 14.1 Tingkat keparahan

| Tingkat | Contoh | Batas rilis |
|---|---|---|
| **Critical** | Data lead bisa dibaca publik, anon bisa mengubah produk, form tidak bisa dikirim, situs tidak terbuka | Blokir rilis, perbaiki segera |
| **High** | Tombol WA salah nomor, pesan WA tidak menyebut produk, XSS, halaman utama rusak di iPhone, pelanggaran aksesibilitas serius | Blokir rilis |
| **Medium** | Layout bergeser di satu ukuran layar, FAQ tidak membuka di satu browser, skor Lighthouse di bawah target | Boleh rilis dengan rencana perbaikan terjadwal |
| **Low** | Typo, selisih jarak kecil, animasi kurang halus | Masuk daftar tunggu |

Format laporan bug: judul singkat, langkah mereproduksi, hasil yang diharapkan, hasil aktual, perangkat/browser/ukuran layar, tangkapan layar atau trace Playwright, tingkat keparahan.

### 14.2 Gerbang rilis (semua harus terpenuhi)

- [ ] Semua uji unit, database (pgTAP), API, dan E2E hijau di CI pada Chromium, WebKit, dan layar mobile.
- [ ] Uji RLS dan uji Supabase langsung (SB-01 sampai SB-12) lulus.
- [ ] axe-core: nol pelanggaran. Uji keyboard manual lulus.
- [ ] Lighthouse mobile memenuhi target bagian 10 pada 5 halaman utama.
- [ ] SEO: meta, canonical, JSON-LD, sitemap, robots, 404 lulus.
- [ ] Keamanan: header dan CSP lulus di staging, SEC-01 sampai SEC-14 lulus, checklist pra-rilis di `SECURITY.md` bagian 12 terpenuhi.
- [ ] UAT manual (bagian 12) ditandatangani, termasuk uji form di Android dan iPhone.
- [ ] Tidak ada bug **Critical** atau **High** yang terbuka.

### 14.3 Keterlacakan (kebutuhan → uji)

| Kebutuhan (`PRD.md`) | Uji |
|---|---|
| Hero, tentang, keunggulan, produk, galeri, testimoni, FAQ, CTA di beranda | HOME-01 sampai HOME-11 |
| Halaman tentang (banner, breadcrumb, perbedaan, keunggulan, CTA) | ABOUT-01 sampai ABOUT-04 |
| Produk dinamis dengan harga, deskripsi, detail, WA | HOME-04/05, PROD-01 sampai PROD-07 |
| Galeri dinamis | HOME-06/07, GAL-01 sampai GAL-04 |
| Blog dinamis (judul, meta deskripsi, tanggal, baca selengkapnya) | BLOG-01 sampai BLOG-05 |
| Form pemesanan masuk ke WA dan database | KON-01 sampai KON-09, API-01 sampai API-23 |
| WA melayang + scroll bar di semua halaman | Uji global (7.2) |
| Navbar darkslategrey, aktif tebal, tombol tanpa ikon/panah/emoji | Bagian 8 |
| Admin panel | ADM-01 sampai ADM-10 |
| Keamanan data | Bagian 5, SB-01 sampai SB-12, SEC-01 sampai SEC-14 |
| SEO/AEO/GEO | Bagian 11.1 |
| PageSpeed | Bagian 10 |