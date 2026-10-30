// src/lib/markdown.ts — Render and sanitize Markdown
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: [
      'h2','h3','h4','p','ul','ol','li','strong','em','a','blockquote',
      'img','table','thead','tbody','tr','th','td','code','pre','hr','br',
      'details','summary','div','span'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'class'],
      details: ['open', 'class'],
      summary: ['class'],
      div: ['class', 'id', 'style'],
      span: ['class', 'style'],
      h2: ['id', 'class'],
      h3: ['id', 'class'],
      h4: ['id', 'class'],
      p: ['class'],
      blockquote: ['class'],
      table: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowProtocolRelative: true,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
