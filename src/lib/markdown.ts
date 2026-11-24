// src/lib/markdown.ts — Render Markdown cleanly with marked
import { marked } from 'marked';

// Custom renderer to format links safely with rel="noopener noreferrer" and prevent javascript: injection
const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }) => {
  const cleanHref = typeof href === 'string' && href.trim().toLowerCase().startsWith('javascript:') ? '#' : href;
  const titleAttr = title ? ` title="${title}"` : '';
  const isExternal = typeof cleanHref === 'string' && (cleanHref.startsWith('http://') || cleanHref.startsWith('https://'));
  const relAttr = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
  return `<a href="${cleanHref}"${titleAttr}${relAttr}>${text}</a>`;
};

export function renderMarkdown(md: string): string {
  if (!md) return '';
  try {
    const rawHtml = marked.parse(md, {
      async: false,
      renderer,
      breaks: true,
      gfm: true,
    }) as string;

    // Filter dangerous script tags, iframes, and event handlers (onerror, onclick, etc.)
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return md;
  }
}
