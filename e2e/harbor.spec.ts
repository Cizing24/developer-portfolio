import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('TravelOps purchasing, refund exclusion and reconciliation are operable', async ({
  page,
}, info) => {
  await page.goto('/en/?view=project-travelops');
  const demo = page.locator('[data-travel-demo]');
  const action = (name: string) =>
    demo.locator(`[data-travel-action="${name}"]`).click();
  await expect(demo).toBeVisible();
  await action('last');
  await demo.locator('[data-travel-checkout] button[type=submit]').click();
  await demo.locator('[name=channel]').selectOption('pos');
  await demo.locator('[data-travel-checkout] button[type=submit]').click();
  await expect(demo.locator('[data-travel-status]')).toContainText(
    'Insufficient stock',
  );
  await action('pay');
  await action('pay');
  await expect(demo.locator('[data-travel-status]')).toContainText(
    'Identical event',
  );
  await action('conflict');
  await expect(demo.locator('[data-travel-status]')).toContainText(
    'different contents',
  );
  await action('issue');
  await action('request');
  await action('approve');
  await demo.getByRole('button', { name: 'Redeem', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    demo.getByRole('button', { name: 'Redeem', exact: true }),
  ).toBeFocused();
  await expect(demo.locator('[data-travel-status]')).toContainText(
    'Redemption blocked',
  );
  await action('confirm');
  await expect(demo.locator('[data-travel-order-state]')).toContainText(
    'refunded',
  );
  await action('reconcile');
  await expect(demo.locator('[data-travel-differences] li')).toHaveCount(3);
  const reason = demo.getByLabel('Disposition reason');
  await reason.scrollIntoViewIfNeeded();
  const reasonBox = (await reason.boundingBox())!;
  const statusBox = (await demo.locator('[data-travel-status]').boundingBox())!;
  expect(
    reasonBox.y + reasonBox.height <= statusBox.y ||
      statusBox.y + statusBox.height <= reasonBox.y,
  ).toBe(true);
  await reason.fill('Request provider evidence');
  await demo.locator('[data-travel-resolution] button').click();
  await action('reconcile');
  await expect(demo.locator('[data-travel-differences] li')).toHaveCount(3);
  await expect(demo.locator('[data-travel-resolutions]')).toContainText(
    'Request provider evidence',
  );
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('travelops.png') });
  await page.locator('[data-reader-locale]').click();
  await expect(demo).toBeVisible();
  await expect(demo.locator('[data-travel-order-state]')).toContainText(
    'refunded',
  );
  await expect(demo.locator('[data-travel-resolutions]')).toContainText(
    'Request provider evidence',
  );
  await expect(demo.locator('[data-travel-differences] li')).toHaveCount(3);
  await expect(demo.locator('h3').first()).toHaveText('購票與共用庫存');
});

test('Harbor offers data-driven entries without scene loading for direct reading', async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/en/?view=projects');
  const harbor = page.locator('[data-harbor]');
  await expect(harbor).toBeVisible();
  await expect(harbor.locator('[data-harbor-entry]:visible')).toHaveCount(3);
  await harbor.getByLabel('Project group').selectOption('other');
  await expect(harbor.locator('[data-harbor-entry]:visible')).toHaveCount(1);
  await expect(harbor.locator('[data-harbor-entry]:visible h3')).toHaveText(
    'LegacyLens',
  );
  await harbor.getByLabel('Project group').selectOption('featured');
  await expect(harbor.locator('[data-harbor-entry]:visible')).toHaveCount(3);
  expect(requests.some((r) => r.includes('studio-scene'))).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('harbor.png') });
});

test('failed demo chunk blocks native submit and can be retried', async ({
  page,
}) => {
  let failed = false;
  await page.route(/\/travelops\.[^/]+\.js$/, async (route) => {
    if (!failed) {
      failed = true;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('/en/?view=project-travelops');
  const demo = page.locator('[data-travel-demo]');
  await expect(
    demo.getByRole('button', { name: 'Retry', exact: true }),
  ).toBeVisible();
  await expect(
    demo.locator('[data-travel-checkout] button[type=submit]'),
  ).toBeDisabled();
  await demo.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    demo.locator('[data-travel-checkout] button[type=submit]'),
  ).toBeEnabled();
  await demo.locator('[data-travel-checkout] button[type=submit]').click();
  await expect(demo.locator('[data-travel-status]')).toContainText(
    'Stock reserved',
  );
});
