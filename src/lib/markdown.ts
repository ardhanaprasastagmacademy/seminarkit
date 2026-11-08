// src/lib/markdown.ts — Render Markdown cleanly with marked and sanitizeHtml
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

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

    return sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        a: ['href', 'title', 'target', 'rel'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    });
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return md;
  }
}
