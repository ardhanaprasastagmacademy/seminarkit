// tests/unit/phone.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeWa, formatPhoneDisplay } from '../../src/lib/wa';

describe('normalizeWa', () => {
  it.each([
    ['081234567890', '6281234567890'],
    ['+62 812-3456-7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
  ])('menormalkan %s -> %s', (input, expected) => {
    expect(normalizeWa(input)).toBe(expected);
  });

  it.each(['', 'abc', '0812', '0812345678901234567890', '+1 202 555 0100'])(
    'menolak nomor tidak valid: %s',
    (input) => {
      expect(normalizeWa(input)).toBeNull();
    }
  );
});

describe('formatPhoneDisplay', () => {
  it('memformat nomor WA ke format resmi +62 822-3273-0246', () => {
    expect(formatPhoneDisplay('6282232730246')).toBe('+62 822-3273-0246');
    expect(formatPhoneDisplay('082232730246')).toBe('+62 822-3273-0246');
    expect(formatPhoneDisplay('+62 822-3273-0246')).toBe('+62 822-3273-0246');
    expect(formatPhoneDisplay(null)).toBe('+62 822-3273-0246');
  });
});
