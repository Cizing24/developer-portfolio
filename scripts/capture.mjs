import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
for (const [name, width, height, route, light] of [
  ['home-desktop', 1440, 1000, '/', false],
  ['home-mobile', 390, 844, '/', false],
  ['projects-tablet', 768, 1024, '/projects/', false],
  ['case-study', 1440, 1000, '/projects/bookflow/', false],
  ['notes', 1440, 1000, '/notes/booking-consistency/', false],
  ['home-light', 1440, 1000, '/', true],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:4321${route}`);
  if (light) await page.getByRole('button', { name: '切換淺色主題' }).click();
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(
      images.map((img) => {
        if (!(img instanceof HTMLImageElement))
          throw new Error('Expected image');
        img.loading = 'eager';
        return img.decode();
      }),
    );
  });
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    fullPage: true,
  });
  console.log(`Captured ${name}: ${width} × ${height}`);
  await page.close();
}
await browser.close();
