import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(90000);

for (const locale of ['zh-tw', 'en']) {
  test(`${locale} TravelOps case is discoverable and media remains readable`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    const unexpected: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (
        !request.url().startsWith('http://127.0.0.1:4321/') &&
        !request.url().startsWith('data:')
      )
        unexpected.push(request.url());
    });
    await page.goto(`/${locale}/projects/`);
    await page.locator('#project-filter').selectOption('Laravel');
    await expect(page.locator('.project-card:visible')).toHaveCount(1);
    await page
      .getByRole('heading', { name: 'TravelOps', exact: true })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(`/${locale}/projects/travelops/`);
    await expect(page.locator('.project-introduction > section')).toHaveCount(
      3,
    );
    expect(await page.locator('.engineering-case').innerText()).not.toContain(
      '**',
    );
    await expect(page.locator('.simple-project-source a')).toHaveCount(0);
    await expect(page.locator('[data-enter-world]')).toHaveCount(0);
    const screenshots = page.locator(
      '.case-cover img, [data-travelops-media=customer] img, [data-travelops-media=pos] img, [data-travelops-media=operations] img',
    );
    await expect(screenshots).toHaveCount(8);
    for (const image of await screenshots.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(Number(await image.getAttribute('width'))).toBeGreaterThan(0);
      expect(await image.getAttribute('alt')).toBeTruthy();
    }
    const original = page
      .locator('[data-travelops-media=customer] figure a')
      .first();
    await original.focus();
    await expect(original).toBeFocused();
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.keyboard.press('Enter'),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toMatch(/travelops-product-mobile/);
    await popup.close();
    const architecture = page.locator('[data-travelops-media=architecture]');
    const dark = architecture.locator('details').first();
    await dark.locator('summary').click();
    await expect(dark.locator('img')).toBeVisible();
    const flow = architecture.locator('details').last();
    await flow.locator('summary').focus();
    await page.keyboard.press('Enter');
    const scroll = flow.getByRole('region');
    await expect(scroll).toBeVisible();
    await scroll.focus();
    await page.keyboard.press('ArrowRight');
    expect(await scroll.evaluate((node) => node.scrollWidth)).toBeGreaterThan(
      900,
    );
    await expect
      .poll(() => scroll.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.emulateMedia({ colorScheme: 'dark' });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await flow.locator('summary').click();
    await page.emulateMedia({ colorScheme: 'light' });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.locator('#travelops-demo').scrollIntoViewIfNeeded();
    await info.attach(`${locale}-travelops`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.locator('nav[aria-label] a[href="#verification"]').click();
    await page.locator('[data-locale]').click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale === 'en' ? 'zh-tw' : 'en'}/projects/travelops/#verification`,
      ),
    );
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

test('TravelOps video supports metadata, playback, seeking and English captions', async ({
  page,
}) => {
  await page.goto('/en/projects/travelops/');
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'metadata');
  await expect(video).toHaveAttribute('playsinline', '');
  expect(await video.getAttribute('autoplay')).toBeNull();
  expect(
    await video.evaluate(
      (node: HTMLVideoElement) => node.controls && node.paused,
    ),
  ).toBe(true);
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.duration))
    .toBeCloseTo(74.36, 1);
  await video.evaluate((node: HTMLVideoElement) => node.play());
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
    .toBeGreaterThan(0.1);
  await video.evaluate((node: HTMLVideoElement) => node.pause());
  for (const time of [1, 37, 73]) {
    await video.evaluate((node: HTMLVideoElement, value) => {
      node.currentTime = value;
    }, time);
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) => !node.seeking && node.readyState >= 2,
        ),
      )
      .toBe(true);
    expect(
      await video.evaluate((node: HTMLVideoElement) => node.currentTime),
    ).toBeCloseTo(time, 0);
  }
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) => node.textTracks[0]?.cues?.length,
      ),
    )
    .toBe(10);
  expect(
    await video.evaluate(
      (node: HTMLVideoElement) => node.textTracks[0]?.language,
    ),
  ).toBe('en');
});

test('homepage links to TravelOps without requesting or embedding its media', async ({
  page,
}) => {
  const travelopsRequests: string[] = [];
  page.on('request', (request) => {
    if (/travelops/i.test(request.url())) travelopsRequests.push(request.url());
  });
  await page.goto('/zh-tw/?view=projects', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-view-panel=projects]')).toBeVisible();
  await expect(page.locator('[data-portal]')).toHaveCount(7);
  await expect(page.locator('video, [data-travelops-media]')).toHaveCount(0);
  expect(travelopsRequests).toEqual([]);
  const card = page.locator('.reader-project-grid article').filter({
    has: page.getByRole('heading', { name: 'TravelOps', exact: true }),
  });
  await expect(card.locator('[data-enter-world]')).toHaveCount(0);
  await card.getByRole('link').click();
  await expect(page).toHaveURL('/zh-tw/projects/travelops/');
});

test('TravelOps remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/projects/');
  await page
    .getByRole('heading', { name: 'TravelOps', exact: true })
    .getByRole('link')
    .click();
  await expect(page.locator('#engineering-decisions')).toBeVisible();
  await page.getByText('Read the video transcript', { exact: true }).click();
  await expect(page.getByText('00:33–00:49:', { exact: false })).toBeVisible();
  await context.close();
});
