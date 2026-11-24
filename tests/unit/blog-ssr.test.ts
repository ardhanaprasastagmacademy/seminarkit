import { describe, it, expect } from 'vitest';
import { getArticleBySlug, getRelatedArticles, getCategories } from '../../src/lib/queries';
import { renderMarkdown } from '../../src/lib/markdown';
import { formatTanggal } from '../../src/lib/format';
import { articleSchema } from '../../src/lib/seo';

describe('Blog SSR and queries verification', () => {
  const slugs = [
    'tren-souvenir-ramah-lingkungan-perusahaan',
    'panduan-memilih-paket-seminar-kit-fungsional',
    'dokumen-pkl-siswa-smk'
  ];

  for (const slug of slugs) {
    it(`should successfully fetch and render article: ${slug}`, async () => {
      const article = await getArticleBySlug(slug);
      expect(article).not.toBeNull();
      expect(article.slug).toBe(slug);
      expect(article.judul).toBeTruthy();

      const html = renderMarkdown(article.isi || '');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);

      const formattedDate = formatTanggal(article.published_at);
      expect(formattedDate).toBeTruthy();
      expect(formattedDate).not.toBe('Terbaru');

      const schema = articleSchema(article);
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe(article.judul);
    });
  }

  it('should return null for non-existent slug', async () => {
    const article = await getArticleBySlug('slug-tidak-ada-12345');
    expect(article).toBeNull();
  });
});
