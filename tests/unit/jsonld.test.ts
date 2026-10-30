// tests/unit/jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { safeJson, breadcrumbSchema, faqSchema, productSchema, articleSchema } from '../../src/lib/seo';

describe('safeJson & JSON-LD helpers', () => {
  it('meng-escape "<" agar </script> tidak memutus tag HTML', () => {
    const out = safeJson({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script>');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });

  it('breadcrumbSchema menghasilkan skema BreadcrumbList valid', () => {
    const schema = breadcrumbSchema([
      { name: 'Beranda', url: 'https://seminarkit.id/' },
      { name: 'Produk', url: 'https://seminarkit.id/produk' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].name).toBe('Produk');
  });

  it('faqSchema menghasilkan skema FAQPage valid', () => {
    const schema = faqSchema([
      { pertanyaan: 'Berapa minimal order?', jawaban: 'Mulai dari 30 pcs.' }
    ]);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity[0].name).toBe('Berapa minimal order?');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('Mulai dari 30 pcs.');
  });

  it('productSchema menghasilkan skema Product dengan AggregateOffer', () => {
    const schema = productSchema({
      nama: 'Paket Seminar Kit Premium',
      slug: 'paket-seminar-kit-premium',
      harga_mulai: 75000,
      deskripsi_lengkap: 'Paket seminar kit berkualitas tinggi',
    });
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('Paket Seminar Kit Premium');
    expect(schema.offers['@type']).toBe('AggregateOffer');
    expect(schema.offers.lowPrice).toBe(75000);
    expect(schema.offers.priceCurrency).toBe('IDR');
  });

  it('articleSchema menghasilkan skema BlogPosting valid', () => {
    const schema = articleSchema({
      judul: 'Panduan Memilih Seminar Kit',
      slug: 'panduan-memilih-seminar-kit',
      meta_description: 'Tips memilih souvenir terbaik',
      published_at: '2026-10-25T10:00:00Z',
      penulis: 'Tim Redaksi',
    });
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Panduan Memilih Seminar Kit');
    expect(schema.author.name).toBe('Tim Redaksi');
  });
});
