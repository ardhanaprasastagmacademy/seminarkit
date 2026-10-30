// src/lib/seo.ts — JSON-LD helpers and SEO utilities

const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://seminarkit.id';

/** Escape JSON-LD agar </script> tidak memutus tag */
export const safeJson = (obj: unknown): string =>
  JSON.stringify(obj).replace(/</g, '\\u003c');

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'seminarkit',
    url: SITE_URL,
    description: 'Souvenir kantor dan paket seminar kit berkualitas.',
    address: { '@type': 'PostalAddress', addressCountry: 'ID' },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'seminarkit',
    url: SITE_URL,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(faqs: Array<{ pertanyaan: string; jawaban: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.pertanyaan,
      acceptedAnswer: { '@type': 'Answer', text: faq.jawaban },
    })),
  };
}

export function productSchema(product: {
  nama: string;
  slug: string;
  deskripsi_lengkap?: string;
  harga_mulai: number;
  gambar_url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nama,
    url: `${SITE_URL}/produk/${product.slug}`,
    description: product.deskripsi_lengkap,
    image: product.gambar_url,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: product.harga_mulai,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function articleSchema(article: {
  judul: string;
  slug: string;
  penulis: string;
  published_at: string;
  updated_at: string;
  meta_description: string;
  cover_url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.judul,
    url: `${SITE_URL}/blog/${article.slug}`,
    author: { '@type': 'Person', name: article.penulis },
    datePublished: article.published_at,
    dateModified: article.updated_at,
    description: article.meta_description,
    image: article.cover_url,
  };
}
