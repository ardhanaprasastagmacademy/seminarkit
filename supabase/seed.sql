-- supabase/seed.sql
-- Data awal realistis untuk seminarkit (Souvenir Kantor & Seminar Kit)
-- Seluruh UUID valid RFC-4122 (hex 0-9, a-f, format 8-4-4-4-12)
-- Seluruh gambar produk dan galeri menggunakan aset WebP lokal berukuran < 100 KB

-- 1. Pengaturan Situs
insert into public.site_settings (
  id, nama_brand, tagline, wa_number, wa_default_text, email, alamat, jam_kerja,
  instagram_url, facebook_url, tiktok_url, maps_embed_url
) values (
  1,
  'seminarkit',
  'Vendor Souvenir Kantor & Paket Seminar Kit Terpercaya di Indonesia',
  '6281234567890',
  'Halo seminarkit, saya ingin berkonsultasi mengenai paket seminar kit dan souvenir kantor.',
  'halo@seminarkit.id',
  'Jl. Tebet Barat Dalam Raya No. 18, Jakarta Selatan, DKI Jakarta 12810',
  'Senin – Jumat: 08.30 – 17.30 WIB | Sabtu: 09.00 – 14.00 WIB',
  'https://instagram.com/seminarkit.id',
  'https://facebook.com/seminarkit.id',
  'https://tiktok.com/@seminarkit.id',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.292543886477!2d106.8488253!3d-6.2251026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3900989c9df%3A0x6e2c317f2269e96!2sJakarta!5e0!3m2!1sid!2sid!4v1700000000000'
) on conflict (id) do update set
  nama_brand = excluded.nama_brand,
  tagline = excluded.tagline,
  wa_number = excluded.wa_number,
  wa_default_text = excluded.wa_default_text,
  email = excluded.email,
  alamat = excluded.alamat,
  jam_kerja = excluded.jam_kerja;

-- 2. Kategori Produk
insert into public.categories (id, nama, slug, urutan, is_active) values
  ('c0000000-0000-0000-0000-000000000001', 'Paket Seminar Kit', 'paket-seminar-kit', 1, true),
  ('c0000000-0000-0000-0000-000000000002', 'Buku Agenda & Pulpen', 'buku-agenda-pulpen', 2, true),
  ('c0000000-0000-0000-0000-000000000003', 'Tumbler & Botol Minum', 'tumbler-botol-minum', 3, true),
  ('c0000000-0000-0000-0000-000000000004', 'Tas & Totebag', 'tas-totebag', 4, true),
  ('c0000000-0000-0000-0000-000000000005', 'Souvenir & Aksesori Kantor', 'souvenir-aksesori-kantor', 5, true)
on conflict (slug) do nothing;

-- 3. Produk (Semua gambar WebP lokal < 100 KB)
insert into public.products (
  id, category_id, nama, slug, deskripsi_singkat, deskripsi_lengkap, harga_mulai, satuan, min_order, spesifikasi, gambar_url, gambar_alt, is_featured, is_published, urutan
) values
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Paket Seminar Kit Eksekutif Kulit',
    'paket-seminar-kit-eksekutif-kulit',
    'Kombinasi elegan buku agenda kulit A5, pulpen metal laser engrave, tumbler vacuum insulated, dan hardbox custom logo.',
    'Paket seminar kit eksekutif dirancang khusus untuk konferensi bergengsi, pelatihan eksekutif, dan rapat umum pemegang saham. Setiap item dikerjakan dengan presisi tinggi dan logo instansi dicetak rapi melalui teknik hot print emas/perak atau grafir laser tahan lama.',
    85000,
    'paket',
    30,
    '{"Bahan Agenda": "Kulit Sintetis PU Premium", "Ukuran Agenda": "A5 (100 lembar bergaris)", "Pulpen": "Metal Rollerball Tinta Hitam", "Tumbler": "Stainless Steel SUS 304 500ml", "Kemasan": "Hardbox Magnetik dengan Hot Print Gold"}'::jsonb,
    '/images/seminakit-set.webp',
    'Paket seminar kit eksekutif lengkap dengan buku agenda kulit dan tumbler',
    true,
    true,
    1
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'Tumbler Stainless Vacuum Insulated 500ml',
    'tumbler-stainless-vacuum-500ml',
    'Tumbler termos stainless steel SUS 304 food-grade yang mampu menjaga suhu panas dan dingin hingga 12 jam.',
    'Pilihan tepat untuk souvenir ramah lingkungan dan merchandise kantor. Permukaan tumbler doff matte nyaman digenggam dan sangat cocok untuk aplikasi logo dengan grafir laser presisi atau sablon UV full color.',
    45000,
    'pcs',
    50,
    '{"Material": "Stainless Steel SUS 304 Food Grade", "Kapasitas": "500 ml", "Daya Tahan Suhu": "Panas & Dingin 8-12 Jam", "Pilihan Finishing": "Matte Black, Slate Grey, Forest Green, Sand Khaki", "Metode Branding": "Laser Grafir / UV Print"}'::jsonb,
    '/images/tumble.webp',
    'Tumbler stainless vacuum insulated 500ml doff matte',
    true,
    true,
    2
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004',
    'Totebag Kanvas Twill Premium Resleting',
    'totebag-kanvas-twill-premium-resleting',
    'Tas totebag bahan kanvas katun tebal dengan jahitan bar-tack ganda, resleting utama YKK, dan saku dalam fungsional.',
    'Totebag serbaguna untuk membawa berkas seminar, laptop, atau perlengkapan kerja harian. Menggunakan material ramah lingkungan dan pewarna reaktif yang tidak luntur saat dicuci.',
    32000,
    'pcs',
    50,
    '{"Bahan": "Katun Kanvas Twill 12oz", "Ukuran": "36 x 40 x 8 cm", "Penutup": "Resleting YKK Kuat", "Fitur Tambahan": "Saku dalam organizer berkas", "Metode Branding": "Sablon Manual Rubber / Bordir Komputer / DTF Presisi"}'::jsonb,
    '/images/totebag.webp',
    'Totebag kanvas twill premium warna natural dengan resleting',
    true,
    true,
    3
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Buku Agenda Softcover Doff A5',
    'buku-agenda-softcover-doff-a5',
    'Buku catatan praktis dengan jilid lem panas tahan lepas, kertas bookpaper kekuningan 80gsm yang nyaman di mata.',
    'Buku agenda softcover menjadi pilihan ekonomis namun tetap profesional untuk pelatihan massal, orientasi karyawan baru, atau workshop kampus. Sampul laminasi doff memberikan sentuhan lembut anti sidik jari.',
    18000,
    'pcs',
    100,
    '{"Ukuran": "A5 (14.8 x 21 cm)", "Sampul": "Art Carton 310gsm Laminasi Doff", "Isi": "160 Halaman Bookpaper 80gsm Polos/Garis", "Finishing Jilid": "Perfect Binding Lem Panas Kuat"}'::jsonb,
    '/images/notebook.webp',
    'Buku agenda notebook softcover doff minimalis',
    false,
    true,
    4
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'Hardbox Gift Set Eksklusif Perusahaan',
    'hardbox-gift-set-eksklusif',
    'Kemasan box mewah magnetik custom board tebal berlapis kertas fancy texture dengan busa cetak presisi (EVA foam).',
    'Hardbox presentasi dirancang untuk menampung paket souvenir VIP, hadiah penghargaan karyawan masa kerja, atau bingkisan tahun baru mitra strategis perusahaan.',
    65000,
    'box',
    30,
    '{"Material": "Greyboard No. 30 (Tebal 2.5 mm)", "Pelapis": "Fancy Paper Linen / Doff", "Pengunci": "Magnet Neodymium Tersembunyi", "Insert": "Busa Cetak EVA Foam Die Cut Sesuai Produk"}'::jsonb,
    '/images/giftbox.webp',
    'Hardbox kemasan hadiah eksklusif dengan magnet',
    false,
    true,
    5
  ),
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'Paket Onboarding Karyawan Baru Gift Set',
    'paket-onboarding-karyawan-baru',
    'Paket selamat datang komprehensif berisi tumbler, notebook, pulpen, lanyard, dan kartu ucapan sambutan resmi.',
    'Tingkatkan loyalitas dan kebanggaan tim baru sejak hari pertama bekerja dengan paket onboarding berstandar korporasi modern.',
    95000,
    'paket',
    25,
    '{"Isi Paket": "Tumbler SUS 304, Notebook A5, Pulpen Metal, Lanyard ID", "Kemasan": "Hardbox Custom Full Brand Logo", "Kartu Ucapan": "Art Carton 260gsm Laminasi Doff"}'::jsonb,
    '/images/gift-set.webp',
    'Paket gift set onboarding karyawan baru',
    true,
    true,
    6
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000005',
    'Lanyard & ID Card Holder Kulit Sintetis',
    'lanyard-id-card-holder-kulit',
    'Tali lanyard bahan tisu lembut anti gatal dilengkapi card holder berbahan kulit sintetis 2 slot kartu.',
    'Aksesori identitas kerja formal yang tahan lama dan nyaman dikenakan sepanjang hari kerja maupun selama perhelatan konferensi berlangsung.',
    22000,
    'set',
    50,
    '{"Bahan Tali": "Polyester Tisu Printing 2 cm", "Bahan Holder": "Kulit Sintetis PU Jahit Tepi Rapi", "Aksesoris": "Kait Logam Putar & Stopper Plastik Solid"}'::jsonb,
    '/images/lanyard.webp',
    'Tali lanyard dan kartu tanda pengenal kulit sintetis',
    false,
    true,
    7
  ),
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000005',
    'Mug Keramik Matte Custom Logo',
    'mug-keramik-matte-custom-logo',
    'Cangkir kopi keramik berkualitas tinggi dengan lapisan luar doff matte dan pilihan sablon decal bakar anti gores.',
    'Souvenir meja kerja abadi yang cocok untuk menemani produktivitas tim kantor Anda. Tahan panas microwave dan pencucian berulang.',
    25000,
    'pcs',
    50,
    '{"Material": "Keramik Stoneware Food Grade", "Kapasitas": "330 ml (11 oz)", "Finishing": "Matte Doff / Glossy", "Metode Cetak": "Decal Bakar High Temperature / Sablon Sublim"}'::jsonb,
    '/images/mug.webp',
    'Mug keramik matte custom logo instansi',
    false,
    true,
    8
  ),
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000005',
    'Payung Lipat Otomatis Anti UV Custom',
    'payung-lipat-otomatis-anti-uv',
    'Payung lipat 3 tombol otomatis buka-tutup dengan rangka fiber tahan angin dan lapisan silver vinyl proteksi UV 50+.',
    'Pilihan hadiah korporasi yang sangat fungsional di segala musim. Area cetak logo luas di panel payung memberikan visibilitas tinggi.',
    48000,
    'pcs',
    50,
    '{"Mekanisme": "Tombol Otomatis Buka & Tutup", "Rangka": "Alumunium + Fiber Fleksibel", "Kain": "Pongee Berlapis Silver Anti UV", "Diameter Buka": "98 cm"}'::jsonb,
    '/images/payunglipat.webp',
    'Payung lipat otomatis dengan lapisan pelindung anti UV',
    false,
    true,
    9
  ),
  (
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000001',
    'Paket Seminar Welcome Kit Minimalis',
    'paket-seminar-welcome-kit-minimalis',
    'Paket hemat fungsional untuk seminar akbar, orientasi mahasiswa, atau rapat kerja daerah: pulpen, notes, dan totebag.',
    'Solusi terbaik untuk kepanitiaan dengan alokasi anggaran efisien tanpa mengorbankan kualitas dan kerapian pengemasan souvenir.',
    28000,
    'paket',
    100,
    '{"Isi Paket": "Totebag Spunbond/Blacu, Buku Notes A5, Pulpen Gel Stylus", "Finishing": "Sablon 1 Warna Tiap Item"}'::jsonb,
    '/images/seminar-welcome.webp',
    'Paket seminar welcome kit minimalis dan fungsional',
    false,
    true,
    10
  )
on conflict (slug) do nothing;

-- 4. Galeri (Menggunakan seluruh foto WebP < 100 KB)
insert into public.gallery (id, judul, alt_text, gambar_url, kategori, urutan, is_published) values
  ('e0000000-0000-0000-0000-000000000001', 'Paket Seminar Kit Premium BUMN', 'Paket seminar kit lengkap buku agenda dan tumbler stainless untuk forum BUMN', '/images/seminakit-set.webp', 'Seminar Kit', 1, true),
  ('e0000000-0000-0000-0000-000000000002', 'Tumbler Termos Matte Instansi Pemerintah', 'Deretan tumbler termos hitam doff dengan laser grafir logo institusi', '/images/tumble.webp', 'Tumbler', 2, true),
  ('e0000000-0000-0000-0000-000000000003', 'Totebag Kanvas Twill Pelatihan Nasional', 'Totebag kanvas twill ramah lingkungan untuk pelatihan aparatur negara', '/images/totebag.webp', 'Totebag', 3, true),
  ('e0000000-0000-0000-0000-000000000004', 'Buku Agenda Kerja Kulit Sintetis', 'Buku agenda notebook softcover doff minimalis dengan jilid lem kuat', '/images/notebook.webp', 'Buku Agenda', 4, true),
  ('e0000000-0000-0000-0000-000000000005', 'Hardbox Kemasan Hadiah VIP', 'Hardbox magnetik eksklusif untuk bingkisan dewan direksi perusahaan', '/images/giftbox.webp', 'Gift Set', 5, true),
  ('e0000000-0000-0000-0000-000000000006', 'Paket Onboarding Karyawan Startup', 'Box souvenir kantor onboarding berisi tumbler agenda dan aksesoris kerja', '/images/gift-set.webp', 'Gift Set', 6, true),
  ('e0000000-0000-0000-0000-000000000007', 'Tali Lanyard & ID Card Holder', 'Tali gantungan ID card bahan lembut dengan tempat kartu kulit rapi', '/images/lanyard.webp', 'Souvenir Kantor', 7, true),
  ('e0000000-0000-0000-0000-000000000008', 'Mug Keramik Meja Kerja Custom', 'Cangkir kopi mug keramik matte sablon logo korporasi elegan', '/images/mug.webp', 'Souvenir Kantor', 8, true),
  ('e0000000-0000-0000-0000-000000000009', 'Payung Lipat Otomatis Anti UV', 'Payung lipat custom tahan angin dengan lapisan pelindung sinar UV', '/images/payunglipat.webp', 'Souvenir Kantor', 9, true),
  ('e0000000-0000-0000-0000-000000000010', 'Paket Welcome Kit Peserta Konferensi', 'Paket sambutan peserta seminar tas totebag notes dan pulpen', '/images/seminar-welcome.webp', 'Seminar Kit', 10, true)
on conflict (id) do nothing;

-- 5. Testimoni
insert into public.testimonials (id, nama, perusahaan, jabatan, isi, rating, foto_url, is_published, urutan) values
  ('b0000000-0000-0000-0000-000000000001', 'Rian Hidayat', 'PT Telekomunikasi Nusantara', 'Head of People Operations', 'Pemesanan 350 paket seminar kit selesai 3 hari sebelum tenggat waktu acara. Kualitas finishing bahan kulitnya sangat memuaskan dan disukai para peserta dewan direksi.', 5, null, true, 1),
  ('b0000000-0000-0000-0000-000000000002', 'dr. Fitriani Prasetyo', 'Ikatan Ahli Kesehatan Masyarakat', 'Ketua Panitia Simposium Nasional', 'Komunikasi sangat responsif via WhatsApp. Sampel produk dikirimkan cepat sehingga panitia yakin sebelum produksi massal 800 pcs. Sangat profesional.', 5, null, true, 2),
  ('b0000000-0000-0000-0000-000000000003', 'Darmawan Santosa', 'Astra Internasional Partner', 'Procurement Specialist', 'Transparansi rincian harga per komponen dan ketepatan jumlah barang tanpa ada yang cacat. Rekomendasi vendor seminar kit terbaik di Jakarta.', 5, null, true, 3),
  ('b0000000-0000-0000-0000-000000000004', 'Nabila Syakira', 'Yayasan Pendidikan Global', 'Event Coordinator', 'Totebag dan tumblernya ramah lingkungan sesuai tema acara kami. Kemasan rapi dan sudah dikelompokkan per sesi sehingga pembagian ke peserta berjalan mulus.', 5, null, true, 4)
on conflict (id) do nothing;

-- 6. FAQ
insert into public.faqs (id, pertanyaan, jawaban, urutan, is_published) values
  ('f0000000-0000-0000-0000-000000000001', 'Berapa jumlah minimal pemesanan (MOQ) di seminarkit?', 'Minimal order mulai dari 30 pcs untuk paket custom hardbox eksklusif dan mulai dari 50 pcs untuk souvenir satuan seperti tumbler atau totebag. Untuk pemesanan di bawah MOQ standar, silakan konsultasikan dengan tim sales kami lewat WhatsApp.', 1, true),
  ('f0000000-0000-0000-0000-000000000002', 'Berapa lama estimasi waktu produksi?', 'Waktu produksi standar berkisar antara 7 hingga 14 hari kerja setelah approval sampel fisik / mockup digital final. Untuk kebutuhan mendesak (urgent order), kami menyediakan layanan pengerjaan kilat tergantung ketersediaan stok.', 2, true),
  ('f0000000-0000-0000-0000-000000000003', 'Apakah bisa mengirim sampel fisik sebelum produksi massal?', 'Ya, kami dapat mengirimkan sampel material fisik (dummy produk) atau proofing digital dengan logo perusahaan Anda agar Anda dapat memastikan warna, tekstur, dan proporsinya sesuai standar sebelum produksi penuh.', 3, true),
  ('f0000000-0000-0000-0000-000000000004', 'Apakah isi paket seminar kit bisa dikustomisasi sendiri?', 'Tentu. Anda bebas mengombinasikan item apa pun, misalnya agenda + flashdisk saja, atau totebag + tumbler + pulpen + kartu tanda pengenal (lanyard), sesuai anggaran dan tema kegiatan Anda.', 4, true),
  ('f0000000-0000-0000-0000-000000000005', 'Apakah seminarkit melayani pengiriman ke luar Jabodetabek?', 'Kami melayani pengiriman ke seluruh kota di Indonesia melalui ekspedisi kargo darat, laut, maupun udara dengan packing kayu pelindung ekstra untuk menjaga keamanan barang sampai di tempat tujuan.', 5, true),
  ('f0000000-0000-0000-0000-000000000006', 'Bagaimana prosedur pembayaran dan perpajakan resmi?', 'Kami melayani pembayaran transfer bank resmi atas nama perusahaan (rekening giro) dan siap menerbitkan Faktur Pajak resmi (PPN) serta invoice resmi untuk keperluan pertanggungjawaban anggaran instansi Anda.', 6, true)
on conflict (id) do nothing;

-- 7. Artikel Blog
insert into public.articles (
  id, judul, slug, meta_description, isi, cover_url, cover_alt, penulis, is_published, published_at
) values
  (
    'a0000000-0000-0000-0000-000000000001',
    'Panduan Memilih Paket Seminar Kit yang Fungsional dan Berkesan',
    'panduan-memilih-paket-seminar-kit-fungsional',
    'Tips praktis memilih seminar kit dan souvenir kantor yang benar-benar bermanfaat bagi peserta konferensi dan sesuai anggaran perusahaan.',
    E'Menyelenggarakan seminar atau pelatihan nasional membutuhkan persiapan matang di berbagai lini, salah satunya pemilihan **seminar kit**.\n\nSering kali merchandise yang dibagikan hanya berakhir disimpan di laci meja kerja karena kurang fungsional. Padahal, souvenir kantor berkualitas adalah media branding berdaya jangkau panjang yang efektif.\n\n## 1. Pahami Profil dan Kebutuhan Peserta\n\nLangkah pertama adalah membedah siapa audiens utama acara Anda:\n- **Tingkat Eksekutif:** Lebih menghargai item bernilai tinggi seperti agenda kulit, pulpen metal laser grafir, atau flashdisk multifungsi.\n- **Pelatihan Teknis / Mahasiswa:** Membutuhkan buku catatan softcover praktis, totebag kanvas tahan lama, dan botol minum portabel.\n\n## 2. Utamakan Manfaat Penggunaan Jangka Panjang\n\nBarang seperti **tumbler stainless steel vacuum** memiliki tingkat retensi penggunaan harian yang sangat tinggi. Setiap kali peserta meminum air di meja kantornya, logo institusi Anda akan terlihat secara organik.\n\n## 3. Perhatikan Detail Kerapian Branding\n\nLogo yang terlalu besar dan mencolok sering kali membuat penerima enggan memakainya di tempat umum. Gunakan teknik *subtle branding*, misalnya:\n- Emboss buta (blind deboss) pada kulit sintetis.\n- Laser grafir monokrom yang elegan pada material logam.\n- Warna netral seperti slate grey, navy, atau khaki.\n\nKonsultasikan kebutuhan seminar kit instansi Anda bersama tim kurator kami di [seminarkit](/produk).',
    '/images/seminakit-set.webp',
    'Seminar kit eksklusif dengan buku agenda kulit dan pulpen mewah',
    'Tim Redaksi seminarkit',
    true,
    now() - interval '3 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Tren Souvenir Ramah Lingkungan untuk Perusahaan Berkelanjutan',
    'tren-souvenir-ramah-lingkungan-perusahaan',
    'Mengapa perusahaan modern beralih ke eco-friendly corporate gifts seperti totebag kanvas katun dan tumbler reusable.',
    E'Komitmen terhadap prinsip keberlanjutan (*Environment, Social, and Governance* / ESG) kini bukan sekadar slogan, melainkan budaya kerja nyata di korporasi modern.\n\nSalah satu wujud nyata yang mudah dirasakan oleh mitra bisnis dan karyawan adalah pemilihan souvenir kantor ramah lingkungan.\n\n## Mengurangi Sampah Plastik Sekali Pakai\n\nDalam satu sesi seminar berskala 500 orang, penggunaan botol air mineral kemasan plastik sekali pakai menghasilkan limbah signifikan. Dengan membagikan **tumbler stainless steel**, perusahaan Anda secara aktif mempromosikan kebiasaan baik isi ulang air minum.\n\n## Material Alami yang Dapat Didaur Ulang\n\nBeberapa material pilihan ramah lingkungan yang diminati saat ini:\n1. **Katun Kanvas Twill:** Kuat, dapat dicuci berulang kali, dan menggantikan kantong plastik belanja.\n2. **Stainless Steel SUS 304:** Tahan karat seumur hidup dan 100% dapat didaur ulang.\n3. **Kertas Daur Ulang Bookpaper:** Memerlukan energi produksi lebih rendah dan memberi kenyamanan membaca optimal.\n\nMelalui pilihan cermat ini, perusahaan Anda tidak hanya memberi cenderamata, tetapi juga menyuarakan nilai kepedulian lingkungan.',
    '/images/totebag.webp',
    'Totebag ramah lingkungan berbahan kanvas twill alami',
    'Tim Redaksi seminarkit',
    true,
    now() - interval '7 days'
  )
on conflict (slug) do nothing;
