// src/pages/sitemap.xml.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getSupabase } from '../lib/supabase';

export const GET: APIRoute = async ({ site }) => {
  const sb = getSupabase();
  const siteUrl = (site?.toString() ?? import.meta.env.PUBLIC_SITE_URL ?? 'https://seminarkit.id').replace(/\/$/, '');

  const [{ data: products }, { data: articles }, { data: categories }] = await Promise.all([
    sb.from('products').select('slug, updated_at').eq('is_published', true),
    sb.from('articles').select('slug, updated_at').eq('is_published', true).lte('published_at', new Date().toISOString()),
    sb.from('categories').select('slug').eq('is_active', true),
  ]);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/tentang', priority: '0.8', changefreq: 'monthly' },
    { url: '/produk', priority: '0.9', changefreq: 'weekly' },
    { url: '/galeri', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'daily' },
    { url: '/kontak', priority: '0.7', changefreq: 'monthly' },
  ];

  const productPages = (products ?? []).map(p => ({
    url: `/produk/${p.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: p.updated_at ? p.updated_at.split('T')[0] : undefined,
  }));

  const articlePages = (articles ?? []).map(a => ({
    url: `/blog/${a.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: a.updated_at ? a.updated_at.split('T')[0] : undefined,
  }));

  const allPages = [...staticPages, ...productPages, ...articlePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${siteUrl}${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
};
