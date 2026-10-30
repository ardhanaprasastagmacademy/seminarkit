// tests/unit/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatRupiah, formatTanggal, truncate } from '../../src/lib/format';

describe('format utilities', () => {
  it('formatRupiah memformat nilai IDR', () => {
    const formatted = formatRupiah(25000);
    // Remove non-breaking spaces if any from Intl formatting
    expect(formatted.replace(/\s+/g, ' ')).toMatch(/Rp\s?25\.000/);
  });

  it('formatTanggal memformat tanggal ke bahasa Indonesia', () => {
    const date = new Date(2026, 9, 25); // 25 Oktober 2026 (0-indexed month)
    const formatted = formatTanggal(date);
    expect(formatted).toContain('25');
    expect(formatted.toLowerCase()).toContain('oktober');
    expect(formatted).toContain('2026');
  });

  it('truncate memotong string lebih dari panjang maksimum', () => {
    const text = 'Ini adalah teks yang sangat panjang sekali untuk diuji pemotongannya';
    expect(truncate(text, 20)).toBe('Ini adalah teks yang…');
  });

  it('truncate mempertahankan teks di bawah batas maksimum', () => {
    const text = 'Teks pendek';
    expect(truncate(text, 50)).toBe('Teks pendek');
  });
});
