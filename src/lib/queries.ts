// src/lib/queries.ts — Hybrid Server queries (AdminStore with Supabase fallback)
import { getSupabase } from './supabase';
import { getAdminStore } from './admin-store';

export async function getSiteSettings() {
  const store = await getAdminStore();
  if (store.site_settings && Object.keys(store.site_settings).length > 0) {
    return store.site_settings;
  }
  try {
    const sb = getSupabase();
    const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
    return data;
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(limit = 6) {
  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    const prods = store.products
      .filter((p) => p.is_published)
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return (a.urutan ?? 999) - (b.urutan ?? 999);
      })
      .slice(0, limit);
    return prods;
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('products')
      .select('id, nama, slug, deskripsi_singkat, harga_mulai, satuan, gambar_url, gambar_alt, is_featured, urutan, category_id')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('urutan', { ascending: true })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getAllProducts(page = 1, kategori?: string) {
  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    const perPage = 12;
    let prods = store.products.filter((p) => p.is_published);
    if (kategori) {
      const cat = store.categories.find((c) => c.slug === kategori);
      if (cat) prods = prods.filter((p) => p.category_id === cat.id);
    }
    prods.sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
    const count = prods.length;
    const from = (page - 1) * perPage;
    return { products: prods.slice(from, from + perPage), count };
  }
  try {
    const sb = getSupabase();
    const perPage = 12;
    const from = (page - 1) * perPage;
    let q = sb
      .from('products')
      .select('id, nama, slug, deskripsi_singkat, harga_mulai, satuan, gambar_url, gambar_alt, category_id, urutan', { count: 'exact' })
      .eq('is_published', true)
      .order('urutan', { ascending: true });

    if (kategori) {
      const { data: cat } = await sb.from('categories').select('id').eq('slug', kategori).single();
      if (cat) q = q.eq('category_id', cat.id);
    }

    const { data, count } = await q.range(from, from + perPage - 1);
    return { products: data ?? [], count: count ?? 0 };
  } catch {
    return { products: [], count: 0 };
  }
}

export async function getProductBySlug(slug: string) {
  const store = await getAdminStore();
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (Array.isArray(store.products) && store.products.length > 0) {
    const p = store.products.find((prod) => prod.slug && prod.slug.toLowerCase() === cleanSlug && prod.is_published);
    if (p) {
      const cat = store.categories.find((c) => c.id === p.category_id);
      return { ...p, categories: cat ? { nama: cat.nama, slug: cat.slug } : null };
    }
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('products')
      .select('*, categories(nama, slug)')
      .eq('slug', cleanSlug)
      .eq('is_published', true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function getCategories() {
  const store = await getAdminStore();
  if (Array.isArray(store.categories) && store.categories.length > 0) {
    return store.categories
      .filter((c) => c.is_active !== false)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
  }
  try {
    const sb = getSupabase();
    const { data } = await sb.from('categories').select('*').eq('is_active', true).order('urutan');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getGallery(page = 1, perPage = 24) {
  const store = await getAdminStore();
  if (Array.isArray(store.gallery) && store.gallery.length > 0) {
    const items = store.gallery
      .filter((g) => g.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
    const count = items.length;
    const from = (page - 1) * perPage;
    return { items: items.slice(from, from + perPage), count };
  }
  try {
    const sb = getSupabase();
    const from = (page - 1) * perPage;
    const { data, count } = await sb
      .from('gallery')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .range(from, from + perPage - 1);
    return { items: data ?? [], count: count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}

export async function getHomeGallery(limit = 10) {
  const store = await getAdminStore();
  if (Array.isArray(store.gallery) && store.gallery.length > 0) {
    return store.gallery
      .filter((g) => g.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, limit);
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('gallery')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getTestimonials() {
  const store = await getAdminStore();
  if (Array.isArray(store.testimonials) && store.testimonials.length > 0) {
    return store.testimonials
      .filter((t) => t.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, 6);
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .limit(6);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getFaqs() {
  const store = await getAdminStore();
  if (Array.isArray(store.faqs) && store.faqs.length > 0) {
    return store.faqs
      .filter((f) => f.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, 8);
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .limit(8);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getArticles(page = 1) {
  const store = await getAdminStore();
  if (Array.isArray(store.articles) && store.articles.length > 0) {
    const now = new Date();
    const articles = store.articles
      .filter((a) => {
        if (!a.is_published) return false;
        if (a.published_at && new Date(a.published_at) > now) return false;
        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.published_at || a.created_at || 0).getTime();
        const tB = new Date(b.published_at || b.created_at || 0).getTime();
        return tB - tA;
      });

    const count = articles.length;
    const perPage = 9;
    const from = (page - 1) * perPage;
    return { articles: articles.slice(from, from + perPage), count };
  }
  try {
    const sb = getSupabase();
    const perPage = 9;
    const from = (page - 1) * perPage;
    const { data, count } = await sb
      .from('articles')
      .select('id, judul, slug, kategori, meta_description, cover_url, cover_alt, cover_caption, penulis, penulis_bio, published_at', { count: 'exact' })
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .range(from, from + perPage - 1);
    return { articles: data ?? [], count: count ?? 0 };
  } catch {
    return { articles: [], count: 0 };
  }
}

export async function getArticleBySlug(slug: string) {
  const store = await getAdminStore();
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (Array.isArray(store.articles) && store.articles.length > 0) {
    const found = store.articles.find(
      (a) => a.slug && a.slug.toLowerCase() === cleanSlug && a.is_published
    );
    if (found) return found;
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('articles')
      .select('*')
      .eq('slug', cleanSlug)
      .eq('is_published', true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function getRelatedArticles(excludeSlug?: string, limit = 3) {
  const store = await getAdminStore();
  if (Array.isArray(store.articles) && store.articles.length > 0) {
    const now = new Date();
    const cleanExclude = excludeSlug ? excludeSlug.toLowerCase() : '';
    const filtered = store.articles
      .filter((a) => {
        if (!a.is_published) return false;
        if (cleanExclude && a.slug && a.slug.toLowerCase() === cleanExclude) return false;
        if (a.published_at && new Date(a.published_at) > now) return false;
        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.published_at || a.created_at || 0).getTime();
        const tB = new Date(b.published_at || b.created_at || 0).getTime();
        return tB - tA;
      });
    return filtered.slice(0, limit);
  }
  try {
    const sb = getSupabase();
    let q = sb
      .from('articles')
      .select('id, judul, slug, kategori, meta_description, cover_url, cover_alt, cover_caption, penulis, published_at')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString());

    if (excludeSlug) {
      q = q.neq('slug', excludeSlug);
    }

    q = q.order('published_at', { ascending: false }).limit(limit);
    const { data } = await q;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getRelatedProducts(excludeSlug?: string, limit = 3) {
  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    const cleanExclude = excludeSlug ? excludeSlug.toLowerCase() : '';
    const filtered = store.products
      .filter((p) => p.is_published && (!cleanExclude || p.slug?.toLowerCase() !== cleanExclude))
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, limit)
      .map((p) => {
        const cat = store.categories.find((c) => c.id === p.category_id);
        return { ...p, categories: cat ? { nama: cat.nama, slug: cat.slug } : null };
      });
    return filtered;
  }
  try {
    const sb = getSupabase();
    let q = sb
      .from('products')
      .select('id, nama, slug, deskripsi_singkat, harga_mulai, satuan, gambar_url, gambar_alt, category_id, min_order, urutan, categories(nama, slug)')
      .eq('is_published', true);

    if (excludeSlug) {
      q = q.neq('slug', excludeSlug);
    }

    q = q.order('urutan', { ascending: true }).limit(limit);
    const { data } = await q;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getProductsForSelect() {
  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    return store.products
      .filter((p) => p.is_published)
      .map((p) => ({ id: p.id, nama: p.nama }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('products')
      .select('id, nama')
      .eq('is_published', true)
      .order('nama');
    return data ?? [];
  } catch {
    return [];
  }
}
