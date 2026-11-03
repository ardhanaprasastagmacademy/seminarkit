// src/pages/api/admin/upload.ts
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('Authorization') ?? '';
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).length > 3) return true;
  if (cookieHeader.includes('sk_admin_session=active')) return true;
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  // 1. Verifikasi Otorisasi Admin
  if (!isAuthorized(request)) {
    return json(401, { ok: false, error: 'Unauthorized: Harap login terlebih dahulu' });
  }

  // 2. Baca FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: any) {
    return json(400, { ok: false, error: 'Gagal memproses form data: ' + (err?.message || err) });
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return json(400, { ok: false, error: 'File gambar tidak ditemukan dalam permintaan.' });
  }

  if (file.size > MAX_FILE_SIZE) {
    return json(400, { ok: false, error: 'Ukuran file melebihi batas 5 MB.' });
  }

  const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return json(400, { ok: false, error: 'Format file tidak diizinkan. Gunakan WebP, JPEG, atau PNG.' });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const rawExt = file.name.split('.').pop() || 'webp';
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  const cleanBase = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30);
  const fileName = `${cleanBase}-${timestamp}-${randomStr}.${ext}`;

  // 3. Coba unggah ke Supabase Storage (bucket 'media')
  try {
    const sb = getSupabaseAdmin();
    const { data: uploadData, error: uploadErr } = await sb.storage
      .from('media')
      .upload(`uploads/${fileName}`, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: { publicUrl } } = sb.storage.from('media').getPublicUrl(`uploads/${fileName}`);
      return json(200, { ok: true, url: publicUrl, storage: 'supabase' });
    }
    if (uploadErr) {
      console.warn('Supabase storage upload returned error:', uploadErr.message);
    }
  } catch (sbErr: any) {
    console.warn('Supabase storage exception:', sbErr?.message || sbErr);
  }

  // 4. Fallback lokal (untuk lingkungan dev dengan filesystem tulis)
  try {
    const uploadDir = path.resolve(process.cwd(), 'public', 'images', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const targetPath = path.join(uploadDir, fileName);
    await fs.writeFile(targetPath, buffer);

    return json(200, {
      ok: true,
      url: `/images/uploads/${fileName}`,
      storage: 'local',
    });
  } catch {
    // Pada lingkungan serverless Vercel (read-only filesystem), gunakan Data URL Base64 yang aman & persisten
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;
    return json(200, {
      ok: true,
      url: dataUrl,
      storage: 'base64',
    });
  }
};
