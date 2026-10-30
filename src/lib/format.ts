// src/lib/format.ts — Formatting utilities

/** Format harga IDR */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format tanggal Indonesia: "25 Oktober 2026" */
export function formatTanggal(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

/** Normalisasi nomor WA ke format 62xxx */
export function normalizeWa(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return /^62\d{8,13}$/.test(d) ? d : null;
}

/** Truncate text */
export function truncate(text: string, max = 160): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}
