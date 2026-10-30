import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  security: { checkOrigin: true },
  vite: { build: { assetsInlineLimit: 0 } },
  site: process.env.PUBLIC_SITE_URL || 'https://seminarkit.id',
});
