import fs from 'node:fs/promises';
import path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'src', 'data', 'admin_store.json');

export interface AdminStoreData {
  products: any[];
  categories: any[];
  gallery: any[];
  articles: any[];
  testimonials: any[];
  faqs: any[];
  site_settings: any;
  inquiries: any[];
}

let memoryCache: AdminStoreData | null = null;

export async function getAdminStore(fresh = false): Promise<AdminStoreData> {
  if (memoryCache && !fresh) return memoryCache;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    memoryCache = JSON.parse(raw);
    return memoryCache!;
  } catch (err) {
    memoryCache = {
      products: [],
      categories: [],
      gallery: [],
      articles: [],
      testimonials: [],
      faqs: [],
      site_settings: {
        id: 1,
        nama_brand: 'seminarkit',
        tagline: 'Vendor Souvenir Kantor & Paket Seminar Kit Terpercaya di Indonesia',
        wa_number: '6281234567890',
        wa_default_text: 'Halo seminarkit, saya ingin berkonsultasi mengenai paket seminar kit.',
        email: 'halo@seminarkit.id',
        alamat: 'Jl. Tebet Barat Dalam Raya No. 18, Jakarta Selatan',
        jam_kerja: 'Senin – Jumat: 08.30 – 17.30 WIB',
      },
      inquiries: [],
    };
    return memoryCache;
  }
}

export async function saveAdminStore(data: AdminStoreData): Promise<void> {
  memoryCache = data;
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write admin_store.json:', err);
  }
}

