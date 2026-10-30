// src/pages/api/inquiry.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const MAX_BODY = 8 * 1024; // 8 KB

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
  // 1. Cek Origin (endpoint JSON tidak dilindungi checkOrigin bawaan Astro)
  const allowedRaw = import.meta.env.ALLOWED_ORIGINS ?? import.meta.env.PUBLIC_SITE_URL ?? '';
  const allowed = allowedRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
  const origin = request.headers.get('origin') ?? '';
  if (allowed.length > 0 && !allowed.includes(origin)) {
    return json(403, { ok: false });
  }

  // 2. Content-Type dan ukuran body
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false });

  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return json(400, { ok: false }); }

  // 3. Honeypot dan time-trap (pura-pura sukses agar bot tidak tahu)
  const tooFast = Date.now() - Number(b.t) < 3000;
  if (oneLine(b.website, 50) !== '' || tooFast) {
    return json(200, { ok: true, saved: false, waUrl: null });
  }

  // 4. Verifikasi Turnstile
  const token = oneLine(b.turnstileToken, 2048);
  if (!token) return json(400, { ok: false, error: 'captcha' });

  const fd = new FormData();
  fd.append('secret', import.meta.env.TURNSTILE_SECRET_KEY ?? '');
  fd.append('response', token);
  fd.append('remoteip', clientAddress);

  const verdict = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: fd,
    signal: AbortSignal.timeout(5000),
  }).then(r => r.json()).catch(() => null);

  if (!verdict?.success) return json(403, { ok: false, error: 'captcha' });

  // 5. Validasi dan normalisasi
  const nama = oneLine(b.nama, 100);
  const wa = normalizeWa(oneLine(b.noWa, 30));
  const email = oneLine(b.email, 150);
  const jumlah = b.jumlah ? Number.parseInt(String(b.jumlah), 10) : null;
  const produk = oneLine(b.produk, 150);
  const pesan = multiLine(b.pesan, 2000);
  const perusahaan = oneLine(b.perusahaan, 150);
  const tanggal = oneLine(b.tanggal, 20) || null;
  const sourcePage = oneLine(b.sourcePage, 200);

  const errors: Record<string, string> = {};
  if (nama.length < 2) errors.nama = 'Nama minimal 2 karakter.';
  if (!wa) errors.noWa = 'Nomor WhatsApp tidak valid.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';
  if (jumlah !== null && (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 1_000_000)) {
    errors.jumlah = 'Jumlah tidak valid.';
  }
  if (Object.keys(errors).length) return json(422, { ok: false, errors });

  // 6. Simpan ke database (publishable key, dibatasi RLS)
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '',
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.SUPABASE_KEY ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const id = crypto.randomUUID();
  const kode = id.slice(0, 8).toUpperCase();

  const { error } = await supabase.from('inquiries').insert({
    id,
    nama,
    no_wa: wa,
    perusahaan: perusahaan || null,
    email: email || null,
    produk_diminati: produk || null,
    jumlah,
    tanggal_dibutuhkan: tanggal || null,
    pesan: pesan || null,
    source_page: sourcePage || null,
  });

  if (error) {
    // Log hanya kode error, bukan data pribadi
    console.error('inquiry insert gagal:', error.code, error.hint);
  }

  // 7. Buat URL WhatsApp di server
  // Ambil nomor WA dari site_settings
  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('wa_number')
    .eq('id', 1)
    .single();

  const waNumber = settingsData?.wa_number ?? '6281234567890';
  const lines = [
    `Halo seminarkit, saya ${nama}${perusahaan ? ` dari ${perusahaan}` : ''}.`,
    produk ? `Produk: ${produk}` : null,
    jumlah ? `Jumlah: ${jumlah}` : null,
    tanggal ? `Dibutuhkan: ${tanggal}` : null,
    pesan ? `Catatan: ${pesan}` : null,
    `Ref: #${kode}`,
  ].filter(Boolean).join('\n');

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines)}`;

  return json(200, {
    ok: true,
    saved: !error,
    waUrl,
  });
};
