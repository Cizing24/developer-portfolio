/* global document, innerWidth, innerHeight */
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'docs/screenshots/studio';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader'],
});
const manifest = [];
const results = [];
for (const [name, width, height, locale] of [
  ['desktop', 1440, 1000, 'zh-tw'],
  ['tablet', 768, 1024, 'zh-tw'],
  ['mobile', 390, 844, 'zh-tw'],
  ['english', 1440, 1000, 'en'],
  ['small-mobile', 320, 760, 'en'],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:4321/${locale}/`);
  await page.locator('[data-studio][data-renderer="ready"]').waitFor();
  async function capture(suffix) {
    const file = `${name}${suffix}.png`;
    await page
      .locator('[data-studio]')
      .screenshot({ path: `${directory}/${file}` });
    manifest.push({
      file,
      width,
      height,
      locale,
      kind: 'actual Astro production build',
      reducedMotion: true,
      island: await page.locator('[data-studio]').getAttribute('data-island'),
      time: await page.locator('[data-studio]').getAttribute('data-phase'),
      sha256: createHash('sha256')
        .update(await readFile(`${directory}/${file}`))
        .digest('hex'),
    });
  }
  await capture('');
  await page.locator('[data-portal="bookflow"]').click();
  await page.locator('[data-studio][data-traveling="false"]').waitFor();
  await capture('-explore');
  await page.locator('[data-station="2"]').click();
  await capture('-reader');
  await page.keyboard.press('Escape');
  await page.locator('[data-reader]').waitFor({ state: 'hidden' });
  await page.locator('[data-overview]').click();
  if (name === 'desktop' || name === 'mobile') {
    for (const time of ['dawn', 'sunset', 'night']) {
      await page.locator(`[data-phase-choice="${time}"]`).click();
      await capture(`-${time}`);
    }
    await page.locator('[data-menu-toggle]').click();
    await page.locator('[data-island-go="journal"]').click();
    await capture('-menu');
    await page.locator('[data-menu-close]').click();
    await page.locator('[data-avatar-focus]').click();
    await capture('-avatar');
  }
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight + 1,
  );
  results.push({
    name,
    width,
    height,
    locale,
    renderer: await page.locator('[data-studio]').getAttribute('data-renderer'),
    errors,
    overflow,
  });
  await context.close();
}
await browser.close();
await writeFile(
  `${directory}/manifest.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
await writeFile(
  'docs/evidence/studio/six-island-screenshots.json',
  JSON.stringify(
    { date: new Date().toISOString(), count: manifest.length, results },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ count: manifest.length, results }, null, 2));
if (results.some((result) => result.errors.length || result.overflow))
  process.exitCode = 1;
