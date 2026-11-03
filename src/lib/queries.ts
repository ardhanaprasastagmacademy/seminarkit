// src/lib/queries.ts — Hybrid Server queries (Supabase primary with AdminStore fallback)
import { getSupabase } from './supabase';
import { getAdminStore } from './admin-store';

export async function getSiteSettings() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (!error && data) return data;
  } catch {}

  const store = await getAdminStore();
  return store.site_settings || null;
}

export async function getFeaturedProducts(limit = 6) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('products')
      .select('id, nama, slug, deskripsi_singkat, harga_mulai, satuan, gambar_url, gambar_alt, is_featured, urutan, category_id')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('urutan', { ascending: true })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    return store.products
      .filter((p) => p.is_published)
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return (a.urutan ?? 999) - (b.urutan ?? 999);
      })
      .slice(0, limit);
  }
  return [];
}

export async function getAllProducts(page = 1, kategori?: string) {
  const perPage = 12;
  const from = (page - 1) * perPage;

  try {
    const sb = getSupabase();
    let q = sb
      .from('products')
      .select('id, nama, slug, deskripsi_singkat, harga_mulai, satuan, gambar_url, gambar_alt, category_id, urutan', { count: 'exact' })
      .eq('is_published', true)
      .order('urutan', { ascending: true });

    if (kategori) {
      const { data: cat } = await sb.from('categories').select('id').eq('slug', kategori).maybeSingle();
      if (cat) q = q.eq('category_id', cat.id);
    }

    const { data, count, error } = await q.range(from, from + perPage - 1);
    if (!error && data) {
      return { products: data, count: count ?? data.length };
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    let prods = store.products.filter((p) => p.is_published);
    if (kategori) {
      const cat = store.categories.find((c) => c.slug === kategori);
      if (cat) prods = prods.filter((p) => p.category_id === cat.id);
    }
    prods.sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
    const count = prods.length;
    return { products: prods.slice(from, from + perPage), count };
  }

  return { products: [], count: 0 };
}

export async function getProductBySlug(slug: string) {
  const cleanSlug = String(slug || '').trim().toLowerCase();

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('products')
      .select('*, categories(nama, slug)')
      .eq('slug', cleanSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!error && data) return data;
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    const p = store.products.find((prod) => prod.slug && prod.slug.toLowerCase() === cleanSlug && prod.is_published);
    if (p) {
      const cat = store.categories.find((c) => c.id === p.category_id);
      return { ...p, categories: cat ? { nama: cat.nama, slug: cat.slug } : null };
    }
  }
  return null;
}

export async function getCategories() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('urutan', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.categories) && store.categories.length > 0) {
    return store.categories
      .filter((c) => c.is_active !== false)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
  }
  return [];
}

export async function getGallery(page = 1, perPage = 24) {
  const from = (page - 1) * perPage;

  try {
    const sb = getSupabase();
    const { data, count, error } = await sb
      .from('gallery')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .range(from, from + perPage - 1);

    if (!error && data) {
      return { items: data, count: count ?? data.length };
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.gallery) && store.gallery.length > 0) {
    const items = store.gallery
      .filter((g) => g.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
    const count = items.length;
    return { items: items.slice(from, from + perPage), count };
  }
  return { items: [], count: 0 };
}

export async function getHomeGallery(limit = 10) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('gallery')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.gallery) && store.gallery.length > 0) {
    return store.gallery
      .filter((g) => g.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, limit);
  }
  return [];
}

export async function getTestimonials() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .limit(6);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.testimonials) && store.testimonials.length > 0) {
    return store.testimonials
      .filter((t) => t.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, 6);
  }
  return [];
}

export async function getFaqs() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('urutan', { ascending: true })
      .limit(8);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.faqs) && store.faqs.length > 0) {
    return store.faqs
      .filter((f) => f.is_published)
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .slice(0, 8);
  }
  return [];
}

export async function getArticles(page = 1) {
  const perPage = 9;
  const from = (page - 1) * perPage;

  try {
    const sb = getSupabase();
    const { data, count, error } = await sb
      .from('articles')
      .select('id, judul, slug, meta_description, isi, cover_url, cover_alt, penulis, published_at, is_published', { count: 'exact' })
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .range(from, from + perPage - 1);

    if (!error && data) {
      const formatted = data.map((a: any) => ({
        ...a,
        kategori: a.kategori || 'Tips & Panduan',
      }));
      return { articles: formatted, count: count ?? data.length };
    }
  } catch {}

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
    return { articles: articles.slice(from, from + perPage), count };
  }

  return { articles: [], count: 0 };
}

export async function getArticleBySlug(slug: string) {
  const cleanSlug = String(slug || '').trim().toLowerCase();

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('articles')
      .select('*')
      .eq('slug', cleanSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        kategori: data.kategori || 'Tips & Panduan',
      };
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.articles) && store.articles.length > 0) {
    const found = store.articles.find(
      (a) => a.slug && a.slug.toLowerCase() === cleanSlug && a.is_published
    );
    if (found) return found;
  }
  return null;
}

export async function getRelatedArticles(excludeSlug?: string, limit = 3) {
  try {
    const sb = getSupabase();
    let q = sb
      .from('articles')
      .select('id, judul, slug, meta_description, cover_url, cover_alt, penulis, published_at')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString());

    if (excludeSlug) {
      q = q.neq('slug', excludeSlug);
    }

    q = q.order('published_at', { ascending: false }).limit(limit);
    const { data, error } = await q;

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((a: any) => ({
        ...a,
        kategori: (a as any).kategori || 'Tips & Panduan',
      }));
    }
  } catch {}

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
  return [];
}

export async function getRelatedProducts(excludeSlug?: string, limit = 3) {
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
    const { data, error } = await q;

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

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
  return [];
}

export async function getProductsForSelect() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('products')
      .select('id, nama')
      .eq('is_published', true)
      .order('nama');

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}

  const store = await getAdminStore();
  if (Array.isArray(store.products) && store.products.length > 0) {
    return store.products
      .filter((p) => p.is_published)
      .map((p) => ({ id: p.id, nama: p.nama }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }
  return [];
}
