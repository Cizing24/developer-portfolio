import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('docs/screenshots/v2', { recursive: true });
const browser = await chromium.launch();
const manifest = [];
try {
  for (const locale of ['zh-tw', 'en'])
    for (const [device, width, height] of [
      ['desktop', 1440, 1000],
      ['tablet', 768, 1024],
      ['mobile', 390, 844],
      ['small-mobile', 320, 760],
    ]) {
      for (const [name, route] of [
        ['home', ''],
        ['projects', 'projects/'],
        ['date-article', 'notes/date-contracts/'],
        ['404', '404/'],
        ['assetflow', 'projects/assetflow/'],
        ['bookflow', 'projects/bookflow/'],
        ['notes', 'notes/'],
        ['article', 'notes/booking-consistency/'],
        ['about', 'about/'],
        ['contact', 'contact/'],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        });
        const url = `http://127.0.0.1:4321/${locale}/${route}`;
        await page.goto(url);
        await page.locator('img').evaluateAll(async (images) => {
          await Promise.all(
            images.map((img) => {
              img.loading = 'eager';
              return img.decode();
            }),
          );
        });
        const file = `${locale}-${name}-${device}.png`;
        await page.screenshot({
          path: `docs/screenshots/v2/${file}`,
          fullPage: true,
        });
        manifest.push({
          file,
          url,
          width,
          height,
          kind: 'actual Astro V2 production output',
        });
        if (name === 'home' && device === 'mobile') {
          await page.locator('.menu-toggle').click();
          await page.screenshot({
            path: `docs/screenshots/v2/${locale}-navigation-mobile.png`,
          });
        }
        if (
          (name === 'assetflow' || name === 'bookflow') &&
          ['desktop', 'mobile'].includes(device)
        ) {
          const lab = page.locator('[data-simulation]');
          await lab.locator('[data-node="6"]').click();
          await lab.screenshot({
            path: `docs/screenshots/v2/${locale}-${name}-result-${device}.png`,
          });
          manifest.push({
            file: `${locale}-${name}-result-${device}.png`,
            result: await lab.locator('[data-state]').innerText(),
            detail: await lab.locator('[data-detail]').innerText(),
            scenario: 'conflict',
          });
          if (name === 'assetflow') {
            await lab.locator('[data-scenario]').selectOption('denied');
            await lab.locator('[data-node="6"]').click();
            await lab.screenshot({
              path: `docs/screenshots/v2/${locale}-assetflow-denied-${device}.png`,
            });
          }
        }
        await page.close();
        console.log(file);
      }
    }
  await writeFile(
    'docs/screenshots/v2/manifest.json',
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        platform: process.platform,
        browser: browser.version(),
        v1: 'Copied from committed V1 actual website screenshots (historical), not recaptured or prototype imagery.',
        screenshots: manifest,
      },
      null,
      2,
    ) + '\n',
  );
  const hashes = {};
  for (const file of await readdir('docs/screenshots/v2')) {
    if (file.endsWith('.png'))
      hashes[file] = createHash('sha256')
        .update(await readFile(`docs/screenshots/v2/${file}`))
        .digest('hex');
  }
  await writeFile(
    'docs/screenshots/v2/files.sha256.json',
    JSON.stringify(hashes, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
