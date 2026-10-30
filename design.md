# DESIGN.md — seminarkit

Panduan visual untuk website seminarkit (souvenir kantor & paket seminar kit). Dibaca bersama `PRD.md`. Jika ada beda, dokumen ini yang berlaku untuk urusan tampilan.

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 25 Oktober 2026 |
| **Warna dasar** | `darkslategrey` `#2F4F4F` dan `darkkhaki` `#BDB76B` |
| **Kesan** | Elegan, premium, sederhana |

---

## 1. Prinsip Desain

1. **Tenang, bukan ramai.** Banyak ruang kosong, satu hal penting per bagian layar.
2. **Dua warna, dipakai dengan disiplin.** Darkslategrey sebagai fondasi, darkkhaki sebagai aksen yang jarang. Sisanya krem hangat dan putih.
3. **Tipografi yang bekerja.** Judul serif yang tenang, isi sans-serif yang mudah dibaca. Hierarki dibangun dari ukuran, bobot, dan jarak, bukan dari hiasan.
4. **Foto produk asli lebih berharga dari dekorasi.** Tidak ada ilustrasi generik atau bentuk dekoratif pengisi ruang.
5. **Garis tipis, bukan bayangan tebal.** Pemisah berupa garis 1px, kartu datar, sudut hampir tegas.

---

## 2. Daftar Larangan (agar tidak terlihat "AI slop")

Ini aturan keras. Jika ragu, jangan pakai.

| Dilarang | Gantinya |
|---|---|
| Ikon panah di tombol atau tautan (`→`, `›`, `»`, `↗`, chevron) | Tombol teks saja |
| Emoji di mana pun (teks, tombol, judul, daftar) | Tidak ada |
| Ikon di dalam tombol | Tombol teks saja |
| Gradien warna, efek kaca (glassmorphism), blob/bentuk melayang | Warna solid |
| Bayangan besar dan lembut di semua kartu | Garis 1px, bayangan hanya pada elemen melayang (WA, lightbox) |
| Tombol pill (sangat bulat), kartu sangat bulat | Radius 2–4px |
| Set ikon generik berwarna-warni di tiap keunggulan | Nomor urut 01–04 bergaya serif |
| Warna di luar palet (ungu, biru neon, oranye) | Hanya turunan darkslategrey, darkkhaki, krem |
| Semua teks rata tengah | Rata kiri sebagai default, tengah hanya untuk CTA pendek |
| Label kecil huruf kapital di atas setiap judul | Dipakai maksimal di hero dan satu section lain |
| Angka klaim yang tidak bisa dibuktikan ("1000+ klien", "No.1") | Hanya fakta nyata |
| Kata klise: "solusi terbaik", "inovatif", "terdepan", "one-stop solution" | Kalimat konkret tentang produk dan proses |
| Foto stok bergaya sama dengan orang tersenyum berjabat tangan | Foto produk dan hasil kerja sendiri |

---

## 3. Warna

### 3.1 Token

| Token | Hex | Peran |
|---|---|---|
| `--sk-slate-900` | `#1F3636` | Footer, lapisan gelap di bawah teks pada foto |
| `--sk-slate-800` | `#264242` | Hover tombol utama |
| `--sk-slate-700` | `#2F4F4F` | **darkslategrey**. Navbar, banner, tombol utama, judul |
| `--sk-slate-600` | `#3F6363` | Hover elemen di atas latar gelap, garis aktif |
| `--sk-khaki-500` | `#BDB76B` | **darkkhaki**. Tombol aksen, garis dekoratif, cincin WA |
| `--sk-khaki-600` | `#A8A25A` | Hover tombol aksen |
| `--sk-khaki-300` | `#D9D58F` | Teks kecil dan label di atas latar gelap |
| `--sk-khaki-700` | `#6B672F` | Teks aksen kecil di atas latar terang (nomor, label) |
| `--sk-ink` | `#1F2D2D` | Teks utama di latar terang, teks di atas darkkhaki |
| `--sk-muted` | `#4F5F5F` | Teks sekunder di latar terang |
| `--sk-muted-on-dark` | `#C9D3D0` | Teks sekunder di latar gelap |
| `--sk-bg` | `#FBFAF5` | Latar halaman |
| `--sk-bg-alt` | `#F2F0E2` | Latar section selang-seling (krem dari darkkhaki) |
| `--sk-surface` | `#FFFFFF` | Kartu, form |
| `--sk-line` | `#DEDBC4` | Garis pemisah dan border kartu |
| `--sk-field-border` | `#7F8C86` | Border input (kontras ≥ 3:1) |
| `--sk-focus` | `#2F4F4F` | Cincin fokus di latar terang |
| `--sk-focus-on-dark` | `#D9D58F` | Cincin fokus di latar gelap |
| `--sk-error` | `#8C2F2F` | Pesan galat form |

### 3.2 Proporsi pemakaian

- **~65%** krem dan putih (`--sk-bg`, `--sk-bg-alt`, `--sk-surface`).
- **~28%** darkslategrey (navbar, banner, hero, CTA, footer, tombol utama).
- **~7%** darkkhaki (tombol aksen di latar gelap, garis tipis, nomor).

Darkkhaki adalah bumbu. Jangan dipakai sebagai latar besar di halaman terang.

### 3.3 Aturan kontras (sudah dihitung)

| Kombinasi | Rasio | Boleh untuk |
|---|---|---|
| Putih di atas `#2F4F4F` | ± 8,9:1 | Semua teks |
| `--sk-ink` di atas `#BDB76B` | ± 7,2:1 | Semua teks (tombol aksen) |
| `--sk-khaki-300` di atas `#2F4F4F` | ± 5,9:1 | Teks kecil di latar gelap |
| `--sk-khaki-700` di atas `--sk-bg-alt` | ± 5,1:1 | Teks kecil di latar terang |
| `#BDB76B` di atas `#2F4F4F` | ± 4,3:1 | **Hanya** teks besar (≥ 24px, atau ≥ 19px tebal), garis, dekorasi |
| Putih di atas `#BDB76B` | ± 2,1:1 | **Dilarang** |
| `#BDB76B` di atas krem | ± 1,9:1 | **Dilarang** untuk teks maupun indikator fokus |

---

## 4. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Judul | **Newsreader** (serif, variabel) | Bobot 500, tenang dan terbaca |
| Isi & UI | **Hanken Grotesk** (sans-serif) | Bobot 400, 500, 600, 700 |

Pasang lewat `@fontsource-variable/newsreader` dan `@fontsource-variable/hanken-grotesk` (self-host, `font-display: swap`). Fallback: `Georgia, 'Times New Roman', serif` dan `system-ui, -apple-system, 'Segoe UI', sans-serif`.

### 4.1 Skala

| Elemen | Ukuran | Bobot | Line-height | Catatan |
|---|---|---|---|---|
| H1 | `clamp(2.25rem, 1.4rem + 3.6vw, 3.75rem)` | 500 serif | 1.1 | letter-spacing −0,01em |
| H2 | `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)` | 500 serif | 1.2 | |
| H3 | `1.375rem` | 500 serif | 1.3 | |
| H4 / judul card | `1.125rem` | 600 sans | 1.35 | |
| Isi | `1.0625rem` (17px) | 400 | 1.65 | maks. lebar baris 68 karakter |
| Teks kecil | `0.875rem` | 400 | 1.5 | |
| Label | `0.8125rem` | 600 | 1.4 | huruf kapital, letter-spacing 0,12em, **hemat** |
| Harga | `1.375rem` | 600 serif | 1.2 | |

### 4.2 Aturan

- Judul serif, selain itu sans-serif. Jangan campur lebih dari dua keluarga.
- Tidak ada teks miring panjang dan tidak ada huruf tebal berlebihan di paragraf.
- Angka harga memakai `font-variant-numeric: tabular-nums`.

---

## 5. Layout, Jarak, Bentuk

- **Container:** maks. 1180px, padding samping 20px (mobile) / 32px (desktop). Grid Bootstrap 12 kolom, gutter 24px.
- **Skala jarak:** kelipatan 4px (4, 8, 12, 16, 24, 32, 48, 64, 96).
- **Padding section:** `clamp(64px, 8vw, 112px)` atas dan bawah.
- **Ritme latar:** `--sk-bg` → `--sk-bg-alt` → `--sk-bg` … diselingi blok darkslategrey untuk hero, banner, dan CTA. Jangan menumpuk dua section gelap berurutan, kecuali CTA lalu footer.
- **Radius:** 2px untuk tombol dan input, 4px untuk kartu dan gambar. Tanpa pill.
- **Border:** 1px `--sk-line`. Garis dekoratif pendek (48px × 2px) darkkhaki boleh dipakai di bawah judul hero dan CTA saja.
- **Bayangan:** tidak ada pada kartu. Hanya pada tombol WA melayang dan lightbox: `0 8px 24px rgb(0 0 0 / .22)`.
- **Rasio gambar:** produk 4:3, galeri 1:1 atau 4:5 (konsisten dalam satu grid), sampul blog 16:10, hero 4:3 atau 5:4.

---

## 6. Komponen

### 6.1 Navbar

- Latar `--sk-slate-700`, teks **putih**. Tinggi 72px (desktop), sticky, border bawah `1px rgb(255 255 255 / .08)`.
- Kiri: logo wordmark `seminarkit` putih. Tengah/kanan: Beranda, Tentang, Produk, Galeri, Blog, Kontak. Paling kanan: tombol aksen "Pesan Sekarang" (teks saja).
- **Penanda halaman aktif: hanya teks tebal (bobot 700).** Tidak ada garis bawah, latar, atau perubahan warna.
- Tautan tidak aktif: bobot 400, putih 88% opasitas. Hover: putih 100%, tanpa garis bawah dan tanpa bold.
- **Cegah lompatan lebar:** teks tebal lebih lebar dari teks biasa. Pesan lebar bobot 700 lewat pseudo-element agar menu tidak bergeser saat pindah halaman (lihat CSS di bagian 10).
- Mobile: collapse Bootstrap dengan toggler tiga garis polos (`data-bs-theme="dark"` pada navbar), panel menu latar sama, tautan tersusun vertikal, tinggi sentuh 48px.

### 6.2 Tombol

**Tanpa ikon, tanpa panah, tanpa emoji. Teks saja.** Berlaku untuk semua tombol dan tautan bergaya tombol di situs.

| Varian | Latar terang | Latar gelap | Dipakai untuk |
|---|---|---|---|
| **Utama** | Fill `#2F4F4F`, teks putih. Hover `#264242` | — | Pesan via WA, Kirim Pesan, aksi utama |
| **Aksen** | — | Fill `#BDB76B`, teks `--sk-ink`. Hover `#A8A25A` | Hero, CTA, navbar |
| **Garis** | Border 1px `#2F4F4F`, teks `#2F4F4F`. Hover: fill `#2F4F4F`, teks putih | Border 1px putih, teks putih. Hover: fill putih, teks `#2F4F4F` | Detail Produk, Lihat Semua |
| **Tautan teks** | Teks `#2F4F4F`, garis bawah 1px offset 4px | Teks putih, garis bawah | "Selengkapnya" |

Ukuran: tinggi 48px (kecil 40px), padding horizontal 28px, radius 2px, bobot 600, ukuran 15px, letter-spacing 0,01em, huruf biasa (bukan kapital semua). Fokus: lihat bagian 9. Status nonaktif/loading memakai teks ("Mengirim…"), bukan spinner berikon.

### 6.3 Page Banner + Breadcrumb

- Latar `#2F4F4F`, padding 72px atas dan bawah (mobile 48px). Tanpa gambar latar dan tanpa pola.
- H1 putih serif, deskripsi satu kalimat `--sk-muted-on-dark` (maks. 60 karakter per baris).
- Breadcrumb di atas judul: tautan `--sk-khaki-300`, pemisah `/` putih 50%, halaman saat ini putih. Tidak ada ikon rumah dan tidak ada chevron.
- Garis dekoratif 48px × 2px `#BDB76B` di bawah deskripsi (opsional, konsisten di semua banner).

### 6.4 Hero (beranda)

- Dua kolom di desktop. Kiri: panel `#2F4F4F` berisi label kecil (opsional), H1 putih, paragraf, dua tombol (Aksen "Lihat Produk" + Garis-gelap "Pesan via WA"). Kanan: foto produk asli, rasio 4:3, radius 4px.
- Mobile: foto di atas, teks di bawah, tombol penuh lebar bertumpuk.
- Tidak ada gradien, tidak ada overlay warna di atas foto kecuali ada teks di atasnya (jika ada, `rgb(31 54 54 / .72)` solid, bukan gradien).

### 6.5 Card Produk (beranda dan `/produk`)

- Latar `--sk-surface`, border 1px `--sk-line`, radius 4px, tanpa bayangan.
- Urutan: gambar 4:3 → nama produk (H4) → deskripsi singkat (maks. 3 baris, `--sk-muted`) → baris harga → dua tombol.
- Harga: label kecil "Mulai dari" `--sk-muted`, di bawahnya nilai `Rp 25.000` serif 600 `#2F4F4F`, satuan "/ pcs" kecil `--sk-muted`.
- Dua tombol sama lebar berdampingan: **Detail Produk** (Garis) dan **Pesan via WA** (Utama). Di layar sempit (<360px) bertumpuk.
- Hover: border berubah ke `#BDB76B`, gambar membesar 1,03 dalam 250ms. Tidak ada pengangkatan (translateY) dan tidak ada bayangan.

### 6.6 Kenapa Pilih Kami (satu card, 4 keunggulan)

- Satu card putih lebar, border 1px `--sk-line`, di atas latar `--sk-bg-alt`.
- Empat kolom (2×2 di tablet, 1 kolom di mobile) dipisah **garis tipis 1px** `--sk-line`, bukan kotak terpisah.
- Tiap keunggulan: nomor `01`–`04` serif 500 ukuran 2rem warna `--sk-khaki-700`, judul H4, satu kalimat penjelas. Tanpa ikon.

### 6.7 Galeri dan Lightbox

- Grid 3 kolom (desktop) / 2 (tablet) / 2 rapat (mobile), jarak 12px, rasio gambar seragam per grid, radius 2px.
- Hover: lapisan `rgb(31 54 54 / .35)` solid dengan judul foto putih di bawah, tanpa ikon kaca pembesar.
- Lightbox: latar `rgb(31 54 54 / .96)`, foto di tengah, teks kontrol **"Sebelumnya"**, **"Berikutnya"**, **"Tutup"** (tombol teks putih, tanpa panah dan tanpa ikon X). Keyboard: panah kiri/kanan dan Esc.

### 6.8 Testimoni

- Card putih, border `--sk-line`, padding 32px. Isi testimoni 17px, `--sk-ink`. Di bawahnya garis 1px, lalu nama (600) dan "jabatan, perusahaan" (`--sk-muted`).
- Tanpa tanda kutip besar dekoratif, tanpa bintang emas. Jika rating dipakai, tulis teks "Penilaian 5 dari 5", bukan deretan ikon bintang.

### 6.9 FAQ (accordion)

- Tanpa kotak: tiap item dipisah garis 1px `--sk-line`. Pertanyaan 18px (600), padding vertikal 20px.
- Indikator buka/tutup adalah tanda **plus** dan **minus** yang digambar dengan CSS (bukan chevron). Jawaban `--sk-muted`.

### 6.10 CTA

- Blok `#2F4F4F`, padding 80px, rata tengah (pengecualian yang diizinkan). H2 putih, satu kalimat `--sk-muted-on-dark`, dua tombol: Aksen "Chat WhatsApp" + Garis-gelap "Isi Form Pemesanan".
- Garis dekoratif 48px × 2px `#BDB76B` di atas judul.

### 6.11 Card Blog

- Card putih, border `--sk-line`, gambar sampul 16:10. Urutan: tanggal (teks kecil `--sk-muted`, format "25 Oktober 2026") → judul (H3 serif, maks. 2 baris) → meta deskripsi (maks. 3 baris) → tombol **Baca Selengkapnya** (Garis, tanpa panah).
- Hover: judul bergaris bawah 1px. Tanpa efek lain.

### 6.12 Form Kontak

- Label di atas input (14px, 600). Input tinggi 48px, border 1px `--sk-field-border`, radius 2px, latar putih. Placeholder `--sk-muted` (bukan pengganti label).
- Fokus: border `#2F4F4F` + cincin 2px `#2F4F4F` offset 2px. Galat: border dan teks pesan `--sk-error`, pesan ditulis di bawah field dalam kalimat jelas.
- Tombol kirim: Utama, lebar penuh di mobile, teks "Kirim dan Lanjut ke WhatsApp". Saat proses: teks berubah menjadi "Mengirim…".
- Pesan sukses: kotak `--sk-bg-alt` dengan garis kiri 3px `#BDB76B`, teks `--sk-ink`.

### 6.13 Pagination

Tautan teks: **Sebelumnya**, nomor halaman, **Berikutnya**. Halaman aktif tebal dengan garis bawah 2px `#2F4F4F`. Tanpa panah dan tanpa kotak.

### 6.14 Footer

- Latar `--sk-slate-900` (`#1F3636`), teks `--sk-muted-on-dark`, judul kolom putih serif 18px.
- Empat kolom: brand + deskripsi, tautan cepat, kontak, jam kerja dan sosial media (sosial media berupa teks tautan, bukan deretan ikon). Garis atas 1px `rgb(189 183 107 / .35)`, baris hak cipta di bawah.

### 6.15 WhatsApp Melayang + Scroll Bar

- Tombol bulat 56px, latar `#2F4F4F`, glyph logo WhatsApp putih (satu-satunya ikon di situs yang berada di dalam elemen tombol, sesuai permintaan), **cincin 2px `#BDB76B`** agar tetap terlihat di atas section gelap, bayangan `0 8px 24px rgb(0 0 0 / .22)`.
- Scroll bar di atas tombol: lebar 6px, tinggi 64px, latar krem `--sk-bg`, border 1px `#2F4F4F`, isi `#2F4F4F` yang naik sesuai persentase scroll. Terlihat jelas di latar terang maupun gelap.
- Kanan-bawah, mengikuti `safe-area-inset`, z-index di bawah lightbox.
- Opsi: bila ingin hijau khas WhatsApp demi pengenalan instan, ganti latar tombol ke `#25D366`. Rekomendasi tetap darkslategrey agar seragam dengan brand.

---

## 7. Gambar dan Fotografi

- Foto produk asli, latar bersih netral (putih, krem, atau abu hangat), cahaya lembut dan konsisten antarfoto.
- Foto hasil kerja (seminar kit yang sudah dirakit, acara klien) lebih diutamakan daripada foto stok.
- Warna foto dibiarkan natural. Tidak ada filter duotone, tidak ada overlay warna merata.
- Semua gambar: format WebP, `width` dan `height` eksplisit, `alt` deskriptif (bukan "gambar produk"), `loading="lazy"` kecuali hero.
- Logo: wordmark huruf kecil `seminarkit` (serif). Putih di atas darkslategrey, `#2F4F4F` di atas terang. Tinggi minimum 24px, tanpa efek bayangan atau gradien.

---

## 8. Gerak

- Transisi 150–250ms, easing `ease-out`. Hanya untuk: warna tombol, border kartu, zoom gambar, buka/tutup accordion, fade lightbox.
- Tanpa animasi masuk saat scroll untuk konten utama. Jika dipakai, hanya fade 8px, satu kali, dan tidak pernah pada konten yang disisipkan JavaScript.
- Hormati `prefers-reduced-motion: reduce` (matikan semua transisi dan zoom).

---

## 9. Aksesibilitas

- Rasio kontras mengikuti tabel di bagian 3.3.
- **Fokus terlihat** pada semua elemen interaktif: cincin 2px offset 2px. Di latar terang `--sk-focus` (`#2F4F4F`), di latar gelap `--sk-focus-on-dark` (`#D9D58F`). Jangan pakai darkkhaki `#BDB76B` untuk cincin fokus di latar terang (kontras kurang).
- Target sentuh minimal 44×44px (tombol 48px).
- Penanda halaman aktif di navbar memakai `aria-current="page"` selain tampilan tebal.
- Struktur heading berurutan (satu H1 per halaman), tautan "lompat ke konten" di awal halaman.
- Warna bukan satu-satunya penanda status (galat selalu disertai teks).

---

## 10. Token dan CSS Dasar

Urutan impor di `BaseLayout.astro`: font → Bootstrap CSS → `tokens.css` → `base.css` → `components.css`.

```js
import '@fontsource-variable/newsreader';
import '@fontsource-variable/hanken-grotesk';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
```

### 10.1 `tokens.css`

```css
:root {
  /* Warna */
  --sk-slate-900: #1F3636;
  --sk-slate-800: #264242;
  --sk-slate-700: #2F4F4F;   /* darkslategrey */
  --sk-slate-600: #3F6363;
  --sk-khaki-500: #BDB76B;   /* darkkhaki */
  --sk-khaki-600: #A8A25A;
  --sk-khaki-300: #D9D58F;
  --sk-khaki-700: #6B672F;
  --sk-ink: #1F2D2D;
  --sk-muted: #4F5F5F;
  --sk-muted-on-dark: #C9D3D0;
  --sk-bg: #FBFAF5;
  --sk-bg-alt: #F2F0E2;
  --sk-surface: #FFFFFF;
  --sk-line: #DEDBC4;
  --sk-field-border: #7F8C86;
  --sk-focus: #2F4F4F;
  --sk-focus-on-dark: #D9D58F;
  --sk-error: #8C2F2F;

  /* Tipografi */
  --sk-font-serif: 'Newsreader Variable', Georgia, 'Times New Roman', serif;
  --sk-font-sans: 'Hanken Grotesk Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* Bentuk */
  --sk-radius-sm: 2px;
  --sk-radius-md: 4px;

  /* Pemetaan ke variabel Bootstrap 5.3 */
  --bs-body-font-family: var(--sk-font-sans);
  --bs-body-font-size: 1.0625rem;
  --bs-body-line-height: 1.65;
  --bs-body-color: var(--sk-ink);
  --bs-body-color-rgb: 31, 45, 45;
  --bs-body-bg: var(--sk-bg);
  --bs-body-bg-rgb: 251, 250, 245;
  --bs-border-color: var(--sk-line);
  --bs-border-radius: var(--sk-radius-md);
  --bs-primary: #2F4F4F;
  --bs-primary-rgb: 47, 79, 79;
  --bs-link-color: #2F4F4F;
  --bs-link-color-rgb: 47, 79, 79;
  --bs-link-hover-color: #264242;
  --bs-link-hover-color-rgb: 38, 66, 66;
}
```

### 10.2 `base.css`

```css
body { background: var(--sk-bg); color: var(--sk-ink); }

h1, h2, h3 {
  font-family: var(--sk-font-serif);
  font-weight: 500;
  color: var(--sk-slate-700);
  letter-spacing: -0.01em;
  text-wrap: balance;
}
h1 { font-size: clamp(2.25rem, 1.4rem + 3.6vw, 3.75rem); line-height: 1.1; }
h2 { font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem); line-height: 1.2; }
h3 { font-size: 1.375rem; line-height: 1.3; }
h4 { font-size: 1.125rem; font-weight: 600; line-height: 1.35; color: var(--sk-ink); }
p  { max-width: 68ch; }

.sk-section      { padding-block: clamp(64px, 8vw, 112px); }
.sk-section--alt { background: var(--sk-bg-alt); }
.sk-section--dark, .sk-banner, .sk-cta { background: var(--sk-slate-700); color: #fff; }
.sk-section--dark h1, .sk-section--dark h2, .sk-section--dark h3,
.sk-cta h2, .sk-banner h1 { color: #fff; }
.sk-section--dark p, .sk-cta p { color: var(--sk-muted-on-dark); }

.sk-rule { width: 48px; height: 2px; background: var(--sk-khaki-500); border: 0; opacity: 1; margin: 0 0 24px; }
.sk-eyebrow { font-size: .8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: var(--sk-khaki-700); }
.sk-section--dark .sk-eyebrow, .sk-banner .sk-eyebrow { color: var(--sk-khaki-300); }

.link-sk { color: var(--sk-slate-700); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }

:focus-visible { outline: 2px solid var(--sk-focus); outline-offset: 2px; }
.sk-section--dark :focus-visible, .sk-banner :focus-visible,
.sk-cta :focus-visible, .sk-navbar :focus-visible, .sk-footer :focus-visible {
  outline-color: var(--sk-focus-on-dark);
}

.skip-link { position: absolute; left: -999px; top: 0; background: #fff; color: var(--sk-slate-700); padding: 12px 16px; z-index: 2000; }
.skip-link:focus { left: 16px; top: 16px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
```

### 10.3 `components.css`

```css
/* ---------- Navbar ---------- */
.sk-navbar {
  background: var(--sk-slate-700);
  border-bottom: 1px solid rgb(255 255 255 / .08);
  min-height: 72px;
  --bs-navbar-color: rgb(255 255 255 / .88);
  --bs-navbar-hover-color: #fff;
  --bs-navbar-active-color: #fff;
}
.sk-navbar .navbar-brand { font-family: var(--sk-font-serif); font-size: 1.5rem; font-weight: 500; color: #fff; letter-spacing: -.01em; }
.sk-navbar .nav-link {
  display: inline-flex; flex-direction: column; align-items: center;
  padding: .5rem 1rem; font-weight: 400; color: rgb(255 255 255 / .88);
}
/* Cadangkan lebar versi tebal agar menu tidak bergeser */
.sk-navbar .nav-link::after {
  content: attr(data-label); font-weight: 700; height: 0; overflow: hidden;
  visibility: hidden; pointer-events: none; user-select: none;
}
.sk-navbar .nav-link:hover { color: #fff; }
.sk-navbar .nav-link[aria-current="page"] { color: #fff; font-weight: 700; }
@media (max-width: 991.98px) { .sk-navbar .nav-link { align-items: flex-start; min-height: 48px; justify-content: center; } }

/* ---------- Tombol (tanpa ikon) ---------- */
.btn-sk {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 48px; padding: 0 28px; border: 1px solid transparent; border-radius: var(--sk-radius-sm);
  font-family: var(--sk-font-sans); font-size: .9375rem; font-weight: 600; letter-spacing: .01em; line-height: 1;
  text-decoration: none; cursor: pointer;
  transition: background-color .2s ease-out, color .2s ease-out, border-color .2s ease-out;
}
.btn-sk--sm { min-height: 40px; padding: 0 20px; font-size: .875rem; }
.btn-sk--primary { background: var(--sk-slate-700); color: #fff; }
.btn-sk--primary:hover { background: var(--sk-slate-800); color: #fff; }
.btn-sk--accent { background: var(--sk-khaki-500); color: var(--sk-ink); }
.btn-sk--accent:hover { background: var(--sk-khaki-600); color: var(--sk-ink); }
.btn-sk--outline { border-color: var(--sk-slate-700); color: var(--sk-slate-700); background: transparent; }
.btn-sk--outline:hover { background: var(--sk-slate-700); color: #fff; }
.btn-sk--outline-inverse { border-color: #fff; color: #fff; background: transparent; }
.btn-sk--outline-inverse:hover { background: #fff; color: var(--sk-slate-700); }
.btn-sk[disabled], .btn-sk[aria-disabled="true"] { opacity: .6; pointer-events: none; }

/* ---------- Banner + breadcrumb ---------- */
.sk-banner { padding-block: clamp(48px, 6vw, 72px); }
.sk-banner p { color: var(--sk-muted-on-dark); max-width: 60ch; margin-bottom: 24px; }
.sk-breadcrumb {
  --bs-breadcrumb-divider: '/';
  --bs-breadcrumb-divider-color: rgb(255 255 255 / .5);
  --bs-breadcrumb-item-active-color: #fff;
  font-size: .875rem; margin-bottom: 16px;
}
.sk-breadcrumb a { color: var(--sk-khaki-300); text-decoration: none; }
.sk-breadcrumb a:hover { text-decoration: underline; text-underline-offset: 4px; }

/* ---------- Card (produk, blog, testimoni) ---------- */
.sk-card {
  display: flex; flex-direction: column; height: 100%;
  background: var(--sk-surface); border: 1px solid var(--sk-line); border-radius: var(--sk-radius-md);
  overflow: hidden; transition: border-color .2s ease-out;
}
.sk-card:hover { border-color: var(--sk-khaki-500); }
.sk-card__media { aspect-ratio: 4 / 3; overflow: hidden; background: var(--sk-bg-alt); }
.sk-card__media img { width: 100%; height: 100%; object-fit: cover; transition: transform .25s ease-out; }
.sk-card:hover .sk-card__media img { transform: scale(1.03); }
.sk-card__body { display: flex; flex-direction: column; gap: 12px; flex: 1; padding: 24px; }
.sk-card__desc { color: var(--sk-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.sk-price__label { display: block; font-size: .8125rem; color: var(--sk-muted); }
.sk-price__value { font-family: var(--sk-font-serif); font-size: 1.375rem; font-weight: 600; color: var(--sk-slate-700); font-variant-numeric: tabular-nums; }
.sk-price__unit { font-size: .875rem; color: var(--sk-muted); }
.sk-card__actions { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sk-card__actions .btn-sk { padding-inline: 12px; }
@media (max-width: 359.98px) { .sk-card__actions { grid-template-columns: 1fr; } }

/* ---------- Kenapa pilih kami: satu card, 4 keunggulan ---------- */
.sk-features {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: var(--sk-line); border: 1px solid var(--sk-line); border-radius: var(--sk-radius-md); overflow: hidden;
}
.sk-features__item { background: var(--sk-surface); padding: 40px 32px; }
.sk-features__no { font-family: var(--sk-font-serif); font-size: 2rem; font-weight: 500; line-height: 1; color: var(--sk-khaki-700); margin-bottom: 16px; }
@media (max-width: 991.98px) { .sk-features { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 575.98px) { .sk-features { grid-template-columns: 1fr; } }

/* ---------- Galeri ---------- */
.sk-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.sk-gallery__item { position: relative; aspect-ratio: 1 / 1; overflow: hidden; border-radius: var(--sk-radius-sm); background: var(--sk-bg-alt); }
.sk-gallery__item img { width: 100%; height: 100%; object-fit: cover; }
.sk-gallery__caption {
  position: absolute; inset: auto 0 0 0; padding: 12px 14px; color: #fff; font-size: .875rem;
  background: rgb(31 54 54 / .72); opacity: 0; transition: opacity .2s ease-out;
}
.sk-gallery__item:hover .sk-gallery__caption, .sk-gallery__item:focus-within .sk-gallery__caption { opacity: 1; }
@media (max-width: 767.98px) { .sk-gallery { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

/* ---------- FAQ: plus / minus, tanpa chevron ---------- */
.sk-accordion .accordion-item { border: 0; border-bottom: 1px solid var(--sk-line); background: transparent; border-radius: 0; }
.sk-accordion .accordion-button { background: transparent; box-shadow: none; padding: 20px 0; font-size: 1.125rem; font-weight: 600; color: var(--sk-ink); }
.sk-accordion .accordion-button:not(.collapsed) { background: transparent; color: var(--sk-slate-700); box-shadow: none; }
.sk-accordion .accordion-button::after {
  content: '+'; background-image: none; width: auto; height: auto; margin-left: auto;
  font-size: 1.5rem; font-weight: 300; line-height: 1; color: var(--sk-slate-700); transform: none;
}
.sk-accordion .accordion-button:not(.collapsed)::after { content: '\2212'; background-image: none; transform: none; }
.sk-accordion .accordion-body { padding: 0 0 24px; color: var(--sk-muted); }

/* ---------- Form ---------- */
.sk-label { display: block; margin-bottom: 8px; font-size: .875rem; font-weight: 600; }
.form-control.sk-input, .form-select.sk-input {
  min-height: 48px; padding: 12px 16px; background-color: #fff; color: var(--sk-ink);
  border: 1px solid var(--sk-field-border); border-radius: var(--sk-radius-sm);
}
.sk-input::placeholder { color: var(--sk-muted); opacity: 1; }
.form-control.sk-input:focus, .form-select.sk-input:focus {
  border-color: var(--sk-slate-700); box-shadow: none; outline: 2px solid var(--sk-focus); outline-offset: 2px;
}
.sk-input.is-invalid { border-color: var(--sk-error); background-image: none; }
.sk-error { margin-top: 6px; font-size: .875rem; color: var(--sk-error); }
.sk-notice { padding: 16px 20px; background: var(--sk-bg-alt); border-left: 3px solid var(--sk-khaki-500); color: var(--sk-ink); }

/* ---------- Pagination (teks) ---------- */
.sk-pagination { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 24px; }
.sk-pagination a { padding: 8px 4px; color: var(--sk-slate-700); text-decoration: none; border-bottom: 2px solid transparent; }
.sk-pagination a:hover { border-bottom-color: var(--sk-line); }
.sk-pagination a[aria-current="page"] { font-weight: 700; border-bottom-color: var(--sk-slate-700); }

/* ---------- CTA ---------- */
.sk-cta { padding-block: 80px; text-align: center; }
.sk-cta .sk-rule { margin-inline: auto; }
.sk-cta p { margin-inline: auto; }
.sk-cta__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 32px; }

/* ---------- Footer ---------- */
.sk-footer { background: var(--sk-slate-900); color: var(--sk-muted-on-dark); padding-block: 72px 32px; border-top: 1px solid rgb(189 183 107 / .35); }
.sk-footer h3 { color: #fff; font-size: 1.125rem; margin-bottom: 16px; }
.sk-footer a { color: var(--sk-muted-on-dark); text-decoration: none; }
.sk-footer a:hover { color: #fff; text-decoration: underline; text-underline-offset: 4px; }

/* ---------- WhatsApp melayang ---------- */
.wa-float {
  position: fixed; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 1030; display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.wa-float__track {
  width: 6px; height: 64px; display: flex; align-items: flex-end; overflow: hidden;
  background: var(--sk-bg); border: 1px solid var(--sk-slate-700); border-radius: 6px;
}
.wa-float__fill { width: 100%; height: calc(var(--wa-progress, 0) * 1%); background: var(--sk-slate-700); }
.wa-float__btn {
  width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%;
  background: var(--sk-slate-700); color: #fff; border: 2px solid var(--sk-khaki-500);
  box-shadow: 0 8px 24px rgb(0 0 0 / .22);
}
.wa-float__btn svg { width: 28px; height: 28px; fill: currentColor; }
.wa-float__btn:focus-visible { outline: 2px solid var(--sk-slate-700); outline-offset: 3px; box-shadow: 0 0 0 3px #fff, 0 8px 24px rgb(0 0 0 / .22); }
```

### 10.4 Navbar di Astro (penanda halaman aktif)

```astro
---
const path = Astro.url.pathname.replace(/\/$/, '') || '/';
const isActive = (href) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));
---
<nav class="navbar navbar-expand-lg sk-navbar sticky-top" data-bs-theme="dark" aria-label="Navigasi utama">
  <div class="container">
    <a class="navbar-brand" href="/">seminarkit</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="Buka menu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav ms-auto align-items-lg-center">
        {nav.map((i) => (
          <li class="nav-item">
            <a class="nav-link" href={i.href} data-label={i.label}
               aria-current={isActive(i.href) ? 'page' : undefined}>{i.label}</a>
          </li>
        ))}
      </ul>
      <a class="btn-sk btn-sk--accent btn-sk--sm ms-lg-3" href={waUrl}
         target="_blank" rel="noopener noreferrer">Pesan Sekarang</a>
    </div>
  </div>
</nav>
```

---

## 11. Gaya Bahasa (Copywriting)

- Bahasa Indonesia yang lugas dan sopan, sapaan "Anda". Kalimat pendek, konkret, tanpa tanda seru.
- Label tombol memakai kata kerja jelas dan huruf biasa: **Lihat Produk**, **Detail Produk**, **Pesan via WA**, **Baca Selengkapnya**, **Chat WhatsApp**, **Isi Form Pemesanan**, **Kirim dan Lanjut ke WhatsApp**.
- Sebutkan hal nyata: bahan, ukuran, jumlah minimal pesanan, teknik cetak, estimasi waktu pengerjaan. Hindari kata klise dan superlatif tanpa bukti.
- Judul bagian berupa pernyataan informatif, bukan slogan kosong.

---

## 12. Daftar Periksa Desain

- [ ] Tidak ada ikon panah, emoji, atau ikon di dalam tombol (kecuali glyph WhatsApp pada tombol melayang).
- [ ] Navbar darkslategrey, teks putih, halaman aktif hanya ditandai tebal, menu tidak bergeser saat pindah halaman.
- [ ] Hanya warna dari palet bagian 3 yang dipakai. Tidak ada gradien dan tidak ada bayangan pada kartu.
- [ ] Darkkhaki tidak dipakai sebagai warna teks kecil di latar terang, dan tidak dipakai di bawah teks putih.
- [ ] Judul memakai Newsreader, isi memakai Hanken Grotesk, tidak ada font ketiga.
- [ ] Card produk: gambar, nama, deskripsi singkat, harga, dua tombol teks (Detail Produk dan Pesan via WA).
- [ ] Kenapa Pilih Kami berupa satu card dengan 4 keunggulan bernomor, tanpa ikon.
- [ ] FAQ memakai plus/minus, pagination dan lightbox memakai teks (Sebelumnya, Berikutnya, Tutup).
- [ ] WhatsApp melayang dan scroll bar terlihat jelas di atas section terang maupun gelap.
- [ ] Fokus keyboard terlihat di semua elemen interaktif, kontras sesuai tabel bagian 3.3.
- [ ] Semua gambar punya `alt`, `width`, `height`, dan berformat WebP.
- [ ] Diuji di 360px, 768px, dan 1280px, serta dengan `prefers-reduced-motion`.