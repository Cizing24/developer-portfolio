import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
await mkdir('.local/harbor-measurements', { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    reducedMotion: 'reduce',
  });
  const responses = [];
  page.on('response', (r) => responses.push(r.url()));
  const start = Date.now();
  const response = await page.goto('http://127.0.0.1:4321/en/');
  assert.ok(response.ok());
  await page
    .locator('[data-studio][data-renderer=ready]')
    .waitFor({ timeout: 30000 });
  results.push({
    width,
    readyMs: Date.now() - start,
    resources: await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((r) => ({ name: r.name.split('/').pop(), bytes: r.transferSize })),
    ),
    requests: responses.length,
  });
  await page.screenshot({ path: `.local/harbor-measurements/v3-${width}.png` });
  await page.close();
}
await writeFile(
  '.local/harbor-measurements/v3-performance.json',
  JSON.stringify(results, null, 2),
);
await browser.close();
