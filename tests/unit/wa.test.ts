// tests/unit/wa.test.ts
import { describe, it, expect } from 'vitest';
import { buildWaUrl, buildWaFromPage, buildWaFromProduct, buildWaFromInquiry } from '../../src/lib/wa';

describe('buildWaUrl', () => {
  it('meng-encode teks dan hanya memakai digit pada nomor', () => {
    const url = buildWaUrl('+62 812-3456-789', 'Halo & "tes"\nbaris 2');
    expect(url.startsWith('https://wa.me/628123456789')).toBe(true);
    expect(url).not.toContain(' ');
    expect(url).toContain(encodeURIComponent('Halo & "tes"\nbaris 2'));
  });

  it('menyertakan nama produk pada pesan card', () => {
    const url = buildWaUrl('6281234567890', 'Saya tertarik dengan produk Tumbler Custom');
    expect(decodeURIComponent(url)).toContain('Tumbler Custom');
  });

  it('buildWaFromPage menyertakan nama halaman dengan format tebal', () => {
    const url = buildWaFromPage('6281234567890', 'Produk');
    expect(decodeURIComponent(url)).toContain('*Produk*');
  });

  it('buildWaFromProduct menyertakan nama produk', () => {
    const url = buildWaFromProduct('6281234567890', 'Paket Seminar Kit Premium');
    expect(decodeURIComponent(url)).toContain('*Paket Seminar Kit Premium*');
  });

  it('buildWaFromInquiry memformat pesan inquiry lengkap dengan kode ref', () => {
    const url = buildWaFromInquiry('6281234567890', {
      nama: 'Ahmad Dahlan',
      perusahaan: 'PT Solusi Bangsa',
      produk: 'Tumbler Stainless',
      jumlah: 100,
      tanggal: '2026-11-20',
      pesan: 'Mohon info katalog lengkap',
      kode: 'SK-20261025-001',
    });
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Ahmad Dahlan');
    expect(decoded).toContain('PT Solusi Bangsa');
    expect(decoded).toContain('Tumbler Stainless');
    expect(decoded).toContain('Jumlah: 100');
    expect(decoded).toContain('Ref: #SK-20261025-001');
  });
});
