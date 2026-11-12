import { expect, test } from '@playwright/test';

for (const locale of ['zh-tw', 'en']) {
  test(`${locale} direct reading defers 3D until the reader closes`, async ({
    page,
  }) => {
    const sceneRequests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (/\/studio-scene\.[^/]+\.js$/.test(request.url()))
        sceneRequests.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}/?view=journal&island=bookflow&time=night`, {
      waitUntil: 'networkidle',
    });
    const reader = page.locator('[data-reader]');
    await expect(reader).toBeVisible();
    await expect(page.locator('[data-view-panel=journal]')).toBeVisible();
    expect(sceneRequests).toEqual([]);
    await expect(page.locator('[data-viewport] canvas')).toHaveCount(0);
    await page.locator('[data-reader] [data-lab-query]').fill('GiST');
    await expect(page.locator('[data-reader] [data-lab-total]')).toHaveText(
      '1',
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(reader).not.toBeVisible();
    await expect(page.locator('[data-studio]')).toHaveAttribute(
      'data-renderer',
      'ready',
      { timeout: 20000 },
    );
    expect(sceneRequests).toHaveLength(1);
    await expect(page.locator('[data-studio]')).toHaveAttribute(
      'data-island',
      'bookflow',
    );
    await expect(page.locator('[data-studio]')).toHaveAttribute(
      'data-phase',
      'night',
    );
    await expect(page.locator('[data-viewport] canvas')).toHaveCount(1);
    await expect(page.locator('[data-menu-toggle]')).toBeFocused();
    await page.locator('[data-overview]').click();
    expect(sceneRequests).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}
