// src/lib/wa.ts — WhatsApp URL builder
export { normalizeWa, formatPhoneDisplay } from './format';

const DEFAULT_WA = '6282232730246';

export function buildWaUrl(number: string | null | undefined, text: string): string {
  let no = (number ?? DEFAULT_WA).replace(/\D/g, '');
  if (no.startsWith('0')) no = '62' + no.slice(1);
  else if (no.startsWith('8')) no = '62' + no;
  else if (!no.startsWith('62')) no = '62' + no;
  return `https://wa.me/${no}?text=${encodeURIComponent(text)}`;
}

export function buildWaFromPage(waNumber: string | null | undefined, pageName: string): string {
  const text = `Halo seminarkit, saya melihat halaman *${pageName}* dan ingin bertanya.`;
  return buildWaUrl(waNumber, text);
}

export function buildWaFromProduct(waNumber: string | null | undefined, productName: string): string {
  const text = `Halo seminarkit, saya tertarik dengan produk *${productName}* dan ingin bertanya lebih lanjut.`;
  return buildWaUrl(waNumber, text);
}

export function buildWaFromInquiry(waNumber: string | null | undefined, params: {
  nama: string;
  perusahaan?: string;
  produk?: string;
  jumlah?: number | null;
  tanggal?: string | null;
  pesan?: string | null;
  kode: string;
}): string {
  const lines = [
    `Halo seminarkit, saya ${params.nama}${params.perusahaan ? ` dari ${params.perusahaan}` : ''}.`,
    params.produk ? `Produk: ${params.produk}` : null,
    params.jumlah ? `Jumlah: ${params.jumlah}` : null,
    params.tanggal ? `Dibutuhkan: ${params.tanggal}` : null,
    params.pesan ? `Catatan: ${params.pesan}` : null,
    `Ref: #${params.kode}`,
  ].filter(Boolean).join('\n');
  return buildWaUrl(waNumber, lines);
}
