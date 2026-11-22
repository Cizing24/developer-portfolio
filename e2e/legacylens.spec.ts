import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(90000);
const source = 'https://github.com/Cizing24/LegacyLens-Showcase';
const anchors = [
  'legacylens-purpose',
  'legacylens-demo',
  'legacylens-features',
  'legacylens-architecture',
  'product-screenshots',
  'web-001',
  'sql-001',
  'benchmarks',
  'change-001',
  'development-issues',
  'verification',
  'engineering-decisions',
  'known-limitations',
];

for (const locale of ['zh-tw', 'en']) {
  test(`${locale} LegacyLens has real media, maintenance evidence and accessible reading`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (e) => {
      if (e.type() === 'error') errors.push(e.text());
    });
    await page.goto(`/${locale}/projects/`);
    await page.locator('#project-filter').selectOption('ASP.NET Web Forms');
    await expect(page.locator('.project-card:visible')).toHaveCount(1);
    await expect(page.locator('.project-card:visible')).toHaveAttribute(
      'data-featured',
      'false',
    );
    await expect(
      page.locator('.project-card:visible a[href="' + source + '"]'),
    ).toHaveCount(1);
    await page
      .getByRole('heading', { name: 'LegacyLens', exact: true })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(`/${locale}/projects/legacylens/`);
    for (const id of anchors)
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator('.engineering-case')).toContainText(
      'Controlled Fault Injection',
    );
    await expect(page.locator('.engineering-case')).toContainText(
      'Synthetic Scenario',
    );
    for (const value of [
      '22.3420',
      '1.0832',
      '26.7085',
      '1.3413',
      '3,255',
      '87',
      '16.8213',
      '10,000',
      '50,000',
      '100,000',
    ]) {
      await expect(
        page.locator('[data-legacylens-evidence=benchmarks]'),
      ).toContainText(value);
    }
    await expect(
      page.locator('[data-legacylens-evidence=benchmarks] tbody tr'),
    ).toHaveCount(9);
    await expect(page.locator('.simple-project-source a')).toHaveAttribute(
      'href',
      source,
    );
    await expect(
      page.locator(
        'a[href*="?view=project-legacylens"], a[href*="/login"], a[href*="Cizing24/LegacyLens/"]',
      ),
    ).toHaveCount(0);
    const images = page.locator(
      '.case-cover img, [data-legacylens-evidence=screens] img, [data-legacylens-evidence=architecture] img, [data-legacylens-evidence=failure] img',
    );
    await expect(images).toHaveCount(9);
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate(
            (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(await img.getAttribute('alt')).toBeTruthy();
    }
    const video = page.locator('video');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).not.toHaveAttribute('autoplay');
    expect(
      await video.evaluate(
        (e: HTMLVideoElement) => e.paused && e.controls && e.playsInline,
      ),
    ).toBe(true);
    for (const path of [
      'demo.mp4',
      'demo.zh-TW.vtt',
      'demo.en.vtt',
      'demo.zh-TW.srt',
      'demo.en.srt',
      'workflow.gif',
    ]) {
      const response = await page.request.get(`/media/legacylens/${path}`);
      expect(response.ok()).toBe(true);
      expect((await response.body()).length).toBeGreaterThan(100);
      if (path.endsWith('.vtt'))
        expect(await response.text()).toMatch(/^WEBVTT\s/);
    }
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((e: HTMLVideoElement) => {
      e.load();
    });
    await expect
      .poll(() =>
        video.evaluate((e: HTMLVideoElement) =>
          Number.isFinite(e.duration) ? Math.round(e.duration) : 0,
        ),
      )
      .toBe(118);
    // Native caption parsing verifies browser-usable timestamps as well as URLs.
    await video.evaluate((e: HTMLVideoElement) => {
      for (const track of Array.from(e.textTracks)) track.mode = 'hidden';
    });
    await expect
      .poll(() =>
        video.evaluate((e: HTMLVideoElement) =>
          Array.from(e.textTracks).every((t) => (t.cues?.length ?? 0) > 0),
        ),
      )
      .toBe(true);
    const gifDetails = page
      .locator('details')
      .filter({ has: page.locator('img[src$="workflow.gif"]') });
    await gifDetails.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(gifDetails.locator('img')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(gifDetails.locator('img')).not.toBeVisible();
    await page.locator('.simple-project-source summary').click();
    const benchmarkRegion = page.locator('.benchmark-table');
    if (await benchmarkRegion.evaluate((e) => e.scrollWidth > e.clientWidth)) {
      await benchmarkRegion.focus();
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => benchmarkRegion.evaluate((e) => e.scrollLeft))
        .toBeGreaterThan(0);
    }
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`${locale}-legacylens.png`),
      fullPage: true,
    });
    await page
      .locator('[data-legacylens-evidence=benchmarks]')
      .screenshot({ path: info.outputPath(`${locale}-benchmark.png`) });
    for (const project of ['bookflow', 'assetflow', 'travelops', 'opsflow']) {
      await expect(
        page.locator(
          `.simple-project-related a[href="/${locale}/projects/${project}/"]`,
        ),
      ).toHaveCount(1);
    }
    if (info.project.name === 'desktop') {
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    await page.goto(`/${locale}/projects/legacylens/#sql-001`);
    await page.locator('[data-locale]').click();
    await expect(page).toHaveURL(
      `/${locale === 'en' ? 'zh-tw' : 'en'}/projects/legacylens/#sql-001`,
    );
    expect(errors).toEqual([]);
  });

  test(`${locale} Harbor pagination, lab search and skills reach LegacyLens evidence`, async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await page.goto(`/${locale}/?view=projects`);
    const harbor = page.locator('[data-harbor]');
    await expect(harbor.locator('[data-harbor-entry]:visible')).toHaveCount(3);
    await harbor.locator('[data-harbor-next]').click();
    const entry = harbor
      .locator('[data-harbor-entry]:visible')
      .filter({ hasText: 'LegacyLens' });
    await expect(entry).toHaveCount(1);
    await expect(entry.locator(`a[href="${source}"]`)).toHaveCount(1);
    await expect(
      entry.locator('a[href*="?view=project-legacylens"]'),
    ).toHaveCount(0);
    await harbor.locator('[data-harbor-prev]').click();
    await expect(entry).toHaveCount(0);
    await harbor.locator('[data-harbor-filter]').selectOption('featured');
    await expect(
      harbor
        .locator('[data-harbor-entry]:visible')
        .filter({ hasText: 'LegacyLens' }),
    ).toHaveCount(0);
    await harbor.locator('[data-harbor-filter]').selectOption('other');
    await expect(entry).toHaveCount(1);
    expect(
      requested.some((url) =>
        /legacylens.*\.(mp4|gif)|legacylens-evidence/.test(url),
      ),
    ).toBe(false);
    await entry.locator('a[href$="#legacylens-demo"]').click();
    await expect(page).toHaveURL(
      `/${locale}/projects/legacylens/#legacylens-demo`,
    );
    await page.goto(`/${locale}/?view=journal`);
    await page.locator('[data-lab-query]').fill('LegacyLens');
    await expect(page.locator('[data-lab-item]:visible')).toHaveCount(2);
    await page.locator('[data-lab-tag]').selectOption('SQL Server');
    await expect(page.locator('[data-lab-item]:visible')).toHaveCount(1);
    await page.locator('[data-lab-item]:visible a').click();
    await expect(page).toHaveURL(`/${locale}/projects/legacylens/#sql-001`);
    await page.goto(`/${locale}/about/#skills`);
    await expect(
      page.locator('#skills a[href*="projects/legacylens/"]'),
    ).toHaveCount(3);
    await page.locator('#skills a[href$="#verification"]').click();
    await expect(page).toHaveURL(
      `/${locale}/projects/legacylens/#verification`,
    );
  });
}

test('LegacyLens bilingual evidence stays available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const locale of ['zh-tw', 'en']) {
    await page.goto(`http://127.0.0.1:4321/${locale}/projects/legacylens/`);
    await expect(page.locator('h1')).toHaveText('LegacyLens');
    for (const id of anchors)
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(
      page.locator('[data-legacylens-evidence=benchmarks]'),
    ).toContainText('1.3413');
    await expect(page.locator('video track')).toHaveCount(2);
  }
  await context.close();
});
