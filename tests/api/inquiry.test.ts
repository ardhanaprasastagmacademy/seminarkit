// tests/api/inquiry.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '../../src/pages/api/inquiry';

describe('POST /api/inquiry', () => {
  it('menolak Content-Type yang bukan application/json dengan 415', async () => {
    const request = new Request('http://localhost:4321/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'bukan json',
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(415);
  });

  it('menolak payload berukuran lebih dari 8KB dengan 413', async () => {
    const bigBody = JSON.stringify({ nama: 'A'.repeat(9000) });
    const request = new Request('http://localhost:4321/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bigBody,
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(413);
  });

  it('menjebak bot honeypot (website terisi) dengan status 200 tetapi saved: false', async () => {
    const request = new Request('http://localhost:4321/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama: 'Bot Spammer',
        noWa: '081234567890',
        website: 'http://spam-link.com', // honeypot
        t: Date.now() - 5000,
      }),
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.saved).toBe(false);
    expect(data.waUrl).toBeNull();
  });

  it('menolak permintaan tanpa token Turnstile dengan 400', async () => {
    const request = new Request('http://localhost:4321/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama: 'Pengunjung Asli',
        noWa: '081234567890',
        website: '',
        t: Date.now() - 5000, // waktu cukup
      }),
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('captcha');
  });

  it('mengizinkan origin Vercel preview/production dan menghasilkan response valid', async () => {
    const request = new Request('https://seminarkit-tau.vercel.app/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://seminarkit-tau.vercel.app',
      },
      body: JSON.stringify({
        nama: 'Ardhanaaa Prasasta',
        email: 'ardhanaprasasta@gmail.com',
        noWa: '+62867253722',
        perusahaan: 'Google',
        produk: 'Buku Agenda Softcover Doff A5',
        jumlah: '100',
        tanggal: '2026-11-18',
        pesan: 'Konsultasi kebutuhan seminar kit kantor',
        turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
        sourcePage: '/kontak',
        t: Date.now() - 4000,
        website: '',
      }),
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.waUrl).toContain('https://wa.me/');
    expect(data.waUrl).toContain('Ardhanaaa');
  });

  it('menolak origin penyerang lintas-situs (CORS/CSRF)', async () => {
    const request = new Request('https://seminarkit-tau.vercel.app/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil-attacker-site.com',
      },
      body: JSON.stringify({
        nama: 'Spam Attack',
        noWa: '081234567890',
        turnstileToken: 'token',
        t: Date.now() - 4000,
      }),
    });

    const res = await (POST as any)({ request, clientAddress: '127.0.0.1' });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('origin');
  });
});
