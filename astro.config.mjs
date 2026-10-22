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
  i18n: {
    defaultLocale: 'zh-tw',
    locales: ['zh-tw', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    mdx(),
    ...(site
      ? [
          sitemap({
            filter: (url) =>
              /\/(zh-tw|en)\//.test(new URL(url).pathname) &&
              !url.endsWith('/404/'),
            i18n: {
              defaultLocale: 'zh-tw',
              locales: { 'zh-tw': 'zh-TW', en: 'en' },
            },
          }),
        ]
      : []),
  ],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      transformers: [
        {
          name: 'readable-comments',
          tokens(lines) {
            for (const line of lines)
              for (const token of line) {
                if (token.color?.toLowerCase() === '#6a737d')
                  token.color = '#aab3bd';
              }
          },
        },
      ],
    },
  },
});
