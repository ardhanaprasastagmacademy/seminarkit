// src/lib/markdown.ts — Render Markdown cleanly with marked
import { marked } from 'marked';

// Custom renderer to format links safely with rel="noopener noreferrer"
const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
  const relAttr = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
  return `<a href="${href}"${titleAttr}${relAttr}>${text}</a>`;
};

export function renderMarkdown(md: string): string {
  if (!md) return '';
  try {
    return marked.parse(md, {
      async: false,
      renderer,
      breaks: true,
      gfm: true,
    }) as string;
  } catch (err) {
    console.error('Error rendering markdown:', err);
    return md;
  }
}
