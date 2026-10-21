import { build } from 'astro';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const read = (path) => readFile(path, 'utf8');
const preview = await read('dist/index.html');
assert.match(preview, /content="noindex,follow"/);
assert.doesNotMatch(preview, /rel="canonical"/);
assert.match(await read('dist/robots.txt'), /Disallow: \//);
await assert.rejects(access('dist/sitemap-index.xml'));
// Reserved test origin, never deployed and never used as the default site identity.
const origin = 'https://portfolio.test';
// Set before the config is evaluated so its conditional sitemap is exercised.
process.env.SITE_URL = origin;
await build({ outDir: '.local/seo-config-dist' });
const html = await read('.local/seo-config-dist/projects/bookflow/index.html');
assert.match(
  html,
  /rel="canonical" href="https:\/\/portfolio\.test\/projects\/bookflow\/"/,
);
assert.match(html, /content="index,follow"/);
assert.match(
  html,
  /property="og:image" content="https:\/\/portfolio\.test\/og\.png"/,
);
assert.match(html, /"@type":"Article"/);
assert.match(
  await read('.local/seo-config-dist/robots.txt'),
  /Sitemap: https:\/\/portfolio\.test\/sitemap-index.xml/,
);
const sitemap = await read('.local/seo-config-dist/sitemap-0.xml');
assert.match(
  sitemap,
  /https:\/\/portfolio\.test\/notes\/booking-consistency\//,
);
assert.doesNotMatch(sitemap, /404/);
assert.match(
  await read('.local/seo-config-dist/404.html'),
  /content="noindex,follow"/,
);
console.log(
  'SEO contracts passed: preview noindex, configured canonical/OG/Article/sitemap/robots, 404 excluded.',
);
