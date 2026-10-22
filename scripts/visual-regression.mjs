import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const manifest = JSON.parse(
  await readFile('docs/screenshots/v2/manifest.json', 'utf8'),
);
assert.equal(
  process.platform,
  manifest.platform,
  'Use the recorded OS and browser for pixel baselines; review a new platform separately.',
);
const browser = await chromium.launch();
const rows = [];
await mkdir('.local/visual-diffs', { recursive: true });
await mkdir('docs/evidence/v2', { recursive: true });
try {
  assert.equal(
    browser.version(),
    manifest.browser,
    'Baseline Chromium version must match.',
  );
  for (const locale of ['zh-tw', 'en'])
    for (const [device, width, height] of [
      ['desktop', 1440, 1000],
      ['mobile', 390, 844],
    ])
      for (const [name, route] of [
        ['home', ''],
        ['assetflow', 'projects/assetflow/'],
        ['bookflow', 'projects/bookflow/'],
        ['article', 'notes/booking-consistency/'],
      ]) {
        const page = await browser.newPage({
          viewport: { width, height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        });
        await page.goto(`http://127.0.0.1:4321/${locale}/${route}`);
        await page.locator('img').evaluateAll(async (xs) => {
          await Promise.all(
            xs.map((x) => {
              x.loading = 'eager';
              return x.decode();
            }),
          );
        });
        const file = `${locale}-${name}-${device}.png`;
        const actual = await page.screenshot({ fullPage: true });
        const expected = await readFile(`docs/screenshots/v2/${file}`);
        const a = await sharp(actual)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const e = await sharp(expected)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        assert.deepEqual(a.info, e.info, `${file}: dimensions changed`);
        let different = 0;
        for (let i = 0; i < a.data.length; i++)
          if (Math.abs(a.data[i] - e.data[i]) > 12) different++;
        const ratio = different / a.data.length;
        rows.push({
          file,
          differentChannels: different,
          totalChannels: a.data.length,
          ratio,
        });
        if (ratio > 0.001)
          await writeFile(`.local/visual-diffs/${file}`, actual);
        assert.ok(
          ratio <= 0.001,
          `${file}: pixel regression ${(ratio * 100).toFixed(3)}%`,
        );
        await page.close();
      }
  await writeFile(
    'docs/evidence/v2/visual-regression.json',
    JSON.stringify(
      {
        platform: process.platform,
        browser: browser.version(),
        threshold: 0.001,
        channelTolerance: 12,
        results: rows,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Visual regression: ${rows.length} reviewed-baseline comparisons passed.`,
  );
} finally {
  await browser.close();
}
