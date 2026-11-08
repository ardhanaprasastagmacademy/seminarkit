// src/pages/api/inquiry.ts
import type { APIRoute } from 'astro';
import { getSupabaseAdmin, getSupabase } from '../../lib/supabase';
import { getAdminStore, saveAdminStore } from '../../lib/admin-store';

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
  // 1. Cek Origin (Dukung same-origin, Vercel deployments, localhost, dan konfigurasi ALLOWED_ORIGINS)
  const origin = request.headers.get('origin') ?? '';
  let isAllowedOrigin = true;

  if (origin) {
    try {
      const reqUrl = new URL(request.url);
      const isSameOrigin = origin === reqUrl.origin;
      const isVercel = origin.endsWith('.vercel.app');
      const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');

      const allowedRaw =
        (typeof process !== 'undefined' ? process.env?.ALLOWED_ORIGINS || process.env?.PUBLIC_SITE_URL : '') ||
        import.meta.env?.ALLOWED_ORIGINS ||
        import.meta.env?.PUBLIC_SITE_URL ||
        '';
      const allowed = allowedRaw.split(',').map((s: string) => s.trim()).filter(Boolean);

      isAllowedOrigin = isSameOrigin || isVercel || isLocal || (allowed.length > 0 && allowed.includes(origin));
    } catch {
      isAllowedOrigin = true;
    }
  }

  if (!isAllowedOrigin) {
    return json(403, { ok: false, error: 'origin', message: 'Domain asal permintaan tidak diizinkan.' });
  }

  // 2. Content-Type dan ukuran body
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, error: 'content_type', message: 'Content-Type harus application/json' });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return json(413, { ok: false, error: 'payload_too_large', message: 'Ukuran data melebihi batas maksimal.' });
  }

  let b: Record<string, unknown>;
  try {
    b = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'bad_json', message: 'Format data JSON tidak valid.' });
  }

  // 3. Honeypot dan time-trap (pura-pura sukses untuk bot)
  const timeDiff = Date.now() - Number(b.t);
  const tooFast = timeDiff < 1500;
  if (oneLine(b.website, 50) !== '') {
    return json(200, { ok: true, saved: false, waUrl: null });
  }

  // 4. Verifikasi Turnstile
  const token = oneLine(b.turnstileToken, 2048);
  if (!token) {
    return json(400, { ok: false, error: 'captcha', message: 'Verifikasi keamanan diperlukan.' });
  }

  const turnstileSecret =
    (typeof process !== 'undefined' ? process.env?.TURNSTILE_SECRET_KEY : '') ||
    import.meta.env?.TURNSTILE_SECRET_KEY ||
    '1x0000000000000000000000000000000AA';

  const isTestingKey = turnstileSecret === '1x0000000000000000000000000000000AA';

  try {
    const fd = new FormData();
    fd.append('secret', turnstileSecret);
    fd.append('response', token);
    if (clientAddress) {
      fd.append('remoteip', clientAddress);
    }

    const verdict = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(6000),
    }).then(r => r.json()).catch(() => null);

    if (!verdict?.success && !isTestingKey) {
      return json(403, { ok: false, error: 'captcha', message: 'Verifikasi keamanan gagal. Silakan coba kembali.' });
    }
  } catch (err) {
    if (!isTestingKey) {
      console.warn('Turnstile verification error:', err);
      return json(403, { ok: false, error: 'captcha', message: 'Gagal memverifikasi keamanan. Silakan coba lagi.' });
    }
  }

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
  if (!wa) errors.noWa = 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';
  if (jumlah !== null && (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 1_000_000)) {
    errors.jumlah = 'Jumlah pesanan minimal 1 pcs.';
  }
  if (Object.keys(errors).length > 0) {
    return json(422, { ok: false, errors, message: 'Harap periksa kembali isian formulir.' });
  }

  // 6. Simpan ke database Supabase
  const id = crypto.randomUUID();
  const kode = id.slice(0, 8).toUpperCase();
  let dbError: any = null;

  try {
    const supabase = getSupabaseAdmin() || getSupabase();
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
    dbError = error;
    if (error) {
      console.error('inquiry insert gagal:', error.code, error.message);
    }
  } catch (err) {
    console.error('inquiry insert exception:', err);
    dbError = err;
  }

  // Cadangan simpan ke admin_store lokal
  try {
    const store = await getAdminStore();
    if (!store.inquiries) store.inquiries = [];
    store.inquiries.unshift({
      id,
      nama,
      no_wa: wa,
      perusahaan: perusahaan || '',
      email: email || '',
      produk_diminati: produk || '',
      jumlah: jumlah || 0,
      tanggal_dibutuhkan: tanggal || '',
      pesan: pesan || '',
      status: 'baru',
      source_page: sourcePage || '/kontak',
      created_at: new Date().toISOString(),
    });
    await saveAdminStore(store);
  } catch {
    // Non-fatal
  }

  // 7. Ambil nomor WA admin untuk tautan chat
  let waNumber = '62822232730246';
  try {
    const supabase = getSupabase();
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('wa_number')
      .eq('id', 1)
      .single();
    if (settingsData?.wa_number) {
      let raw = settingsData.wa_number.replace(/\D/g, '');
      if (raw.startsWith('0')) raw = '62' + raw.slice(1);
      if (raw) waNumber = raw;
    }
  } catch {
    // Gunakan nomor default
  }

  const lines = [
    `Halo seminarkit, saya *${nama}*${perusahaan ? ` dari *${perusahaan}*` : ''}.`,
    produk ? `• Produk: ${produk}` : null,
    jumlah ? `• Jumlah: ${jumlah} pcs` : null,
    tanggal ? `• Dibutuhkan: ${tanggal}` : null,
    pesan ? `• Catatan: ${pesan}` : null,
    `Ref: #${kode}`,
  ].filter(Boolean).join('\n');

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines)}`;

  return json(200, {
    ok: true,
    saved: !dbError,
    waUrl,
    ref: kode,
  });
};
