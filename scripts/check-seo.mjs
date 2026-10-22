import { build } from 'astro';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const read = (path) => readFile(path, 'utf8');
const paths = [
  '',
  'about/',
  'projects/',
  'projects/assetflow/',
  'projects/bookflow/',
  'notes/',
  'notes/booking-consistency/',
  'notes/date-contracts/',
  'contact/',
];
for (const locale of ['zh-tw', 'en'])
  for (const path of paths) {
    const html = await read(`dist/${locale}/${path}index.html`);
    assert.match(html, /content="noindex,follow"/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.match(
      html,
      new RegExp(`lang="${locale === 'en' ? 'en' : 'zh-TW'}"`),
    );
    assert.equal((html.match(/<title>/g) ?? []).length, 1);
    assert.match(html, /<meta name="description" content="[^"]{20,}"/);
  }
assert.match(await read('dist/robots.txt'), /Disallow: \//);
await assert.rejects(access('dist/sitemap-index.xml'));
const origin = 'https://portfolio.test';
process.env.SITE_URL = origin;
await build({ outDir: '.local/seo-config-dist' });
for (const locale of ['zh-tw', 'en'])
  for (const path of paths) {
    const html = await read(
      `.local/seo-config-dist/${locale}/${path}index.html`,
    );
    assert.ok(
      html.includes(`rel="canonical" href="${origin}/${locale}/${path}"`),
    );
    assert.match(html, /content="index,follow"/);
    const other = locale === 'en' ? 'zh-tw' : 'en';
    assert.ok(html.includes(`href="${origin}/${other}/${path}"`));
    assert.match(html, /hreflang="zh-TW"/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="x-default"/);
    assert.match(
      html,
      /property="og:image" content="https:\/\/portfolio\.test\/og\.png"/,
    );
    if (/projects\/\w|notes\/\w/.test(path))
      assert.match(html, /"@type":"Article"/);
  }
assert.match(
  await read('.local/seo-config-dist/robots.txt'),
  /Sitemap: https:\/\/portfolio\.test\/sitemap-index.xml/,
);
const sitemap = await read('.local/seo-config-dist/sitemap-0.xml');
assert.doesNotMatch(sitemap, /404/);
for (const locale of ['zh-tw', 'en'])
  for (const path of paths)
    assert.ok(sitemap.includes(`${origin}/${locale}/${path}`));
for (const path of ['404.html', 'en/404/index.html', 'zh-tw/404/index.html'])
  assert.match(
    await read(`.local/seo-config-dist/${path}`),
    /content="noindex,follow"/,
  );
console.log(
  'SEO: 18 localized pages, preview noindex, production canonical/alternates/OG/Article/sitemap, legacy and 404 excluded.',
);
