// tests/unit/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

describe('renderMarkdown (sanitasi)', () => {
  it('membuang skrip dan atribut event', () => {
    const html = renderMarkdown('Halo <script>alert(1)</script> <img src="https://x.id/a.webp" onerror="alert(1)">');
    expect(html).not.toMatch(/<script|onerror/i);
  });

  it('menolak tautan javascript:', () => {
    expect(renderMarkdown('[klik](javascript:alert(1))')).not.toMatch(/javascript:/i);
  });

  it('menambahkan rel pada tautan eksternal', () => {
    expect(renderMarkdown('[a](https://contoh.id)')).toContain('rel="noopener noreferrer"');
  });

  it('merender heading markdown menjadi elemen html yang valid', () => {
    const html = renderMarkdown('## Judul Sub\n\nParagraf teks biasa.');
    expect(html).toContain('<h2>Judul Sub</h2>');
    expect(html).toContain('<p>Paragraf teks biasa.</p>');
  });
});
