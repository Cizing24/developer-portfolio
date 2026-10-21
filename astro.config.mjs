import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { resolveSiteUrl } from './src/lib/site-url.mjs';

const site = resolveSiteUrl(process.env.SITE_URL);
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    ...(site ? [sitemap({ filter: (url) => !url.endsWith('/404/') })] : []),
  ],
  vite: { plugins: [tailwindcss()] },
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
