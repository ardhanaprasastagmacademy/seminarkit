// src/pages/api/admin/upload.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async ({ request }) => {
  // 1. Verifikasi Header Authorization
  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Unauthorized: Token tidak disertakan' });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json(500, { error: 'Konfigurasi Supabase belum disetel di server.' });
  }

  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Verifikasi role admin via RPC
  const { data: isAdmin, error: rpcErr } = await sb.rpc('is_admin');
  if (rpcErr || !isAdmin) {
    return json(403, { error: 'Forbidden: Hanya admin yang diizinkan mengunggah file.' });
  }

  // 2. Baca FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: any) {
    return json(400, { error: 'Gagal memproses form data: ' + (err?.message || err) });
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return json(400, { error: 'File gambar tidak ditemukan dalam permintaan.' });
  }

  if (file.size > MAX_FILE_SIZE) {
    return json(400, { error: 'Ukuran file melebihi batas 5 MB.' });
  }

  const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return json(400, { error: 'Format file tidak diizinkan. Gunakan WebP, JPEG, atau PNG.' });
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
  } catch {
    // Supabase bucket belum ada, fallback ke penyimpanan lokal
  }

  // 4. Fallback lokal untuk lingkungan development / server
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
  } catch (fsErr: any) {
    return json(500, { error: 'Gagal menyimpan file: ' + (fsErr?.message || fsErr) });
  }
};
