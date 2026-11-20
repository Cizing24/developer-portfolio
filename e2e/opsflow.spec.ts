import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['zh-tw', 'en']) {
  test(`${locale} OpsFlow evidence, media and locale anchors remain usable`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${locale}/projects/`);
    await page.locator('#project-filter').selectOption('NestJS');
    const card = page.locator('.project-card:visible');
    await expect(card).toHaveCount(1);
    await expect(
      card.getByRole('link', { name: 'GitHub', exact: true }),
    ).toHaveAttribute('href', 'https://github.com/Cizing24/opsflow-mini-erp');
    await card.getByRole('heading').getByRole('link').click();
    await expect(page).toHaveURL(`/${locale}/projects/opsflow/`);
    await expect(page.locator('h1')).toHaveText('OpsFlow Mini ERP');
    for (const id of [
      'opsflow-purpose',
      'business-workflow',
      'opsflow-architecture',
      'product-screenshots',
      'data-sources',
      'benchmarks',
      'maintenance',
      'verification',
      'engineering-decisions',
      'project-resources',
    ]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    const images = page.locator('.case-cover img, [data-opsflow-screens] img');
    await expect(images).toHaveCount(3);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(await image.getAttribute('alt')).toBeTruthy();
    }
    await expect(page.locator('[data-opsflow-benchmarks]')).toContainText(
      '137.55',
    );
    await expect(page.locator('[data-opsflow-benchmarks]')).toContainText(
      '303.19',
    );
    await expect(page.locator('[data-opsflow-benchmarks]')).toContainText(
      '315.39',
    );
    await expect(page.locator('a[href*="opsflow"][href*="demo"]')).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`${locale}-opsflow-full.png`),
      fullPage: true,
    });
    await page.locator('nav[aria-label] a[href="#benchmarks"]').click();
    await page.screenshot({
      path: info.outputPath(`${locale}-opsflow-benchmarks.png`),
    });
    await page.locator('[data-locale]').click();
    await expect(page).toHaveURL(
      new RegExp(
        `/${locale === 'en' ? 'zh-tw' : 'en'}/projects/opsflow/#benchmarks`,
      ),
    );
    expect(errors).toEqual([]);
  });
}

test('OpsFlow is reachable from Harbor and the searchable engineering lab', async ({
  page,
}) => {
  await page.goto('/en/?view=projects');
  const harbor = page.locator('[data-harbor]');
  while (
    !(await harbor
      .locator('[data-harbor-entry]:visible')
      .filter({ hasText: 'OpsFlow Mini ERP' })
      .count())
  ) {
    await harbor.locator('[data-harbor-next]').click();
  }
  const entry = harbor
    .locator('[data-harbor-entry]:visible')
    .filter({ hasText: 'OpsFlow Mini ERP' });
  await expect(
    entry.getByRole('link', { name: 'Try interactive demo' }),
  ).toHaveCount(0);
  await entry.getByRole('link', { name: 'Read case study' }).click();
  await expect(page).toHaveURL('/en/projects/opsflow/');
  await page.goto('/en/?view=journal');
  await page.locator('[data-lab-query]').fill('OpsFlow');
  await expect(page.locator('[data-lab-item]:visible')).toHaveCount(2);
  await page.locator('[data-lab-item]:visible a[href$="#maintenance"]').click();
  await expect(page).toHaveURL('/en/projects/opsflow/#maintenance');
});

test('OpsFlow case stays readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/projects/opsflow/');
  await expect(page.locator('h1')).toHaveText('OpsFlow Mini ERP');
  await expect(page.locator('[data-opsflow-benchmarks]')).toContainText(
    '315.39',
  );
  await context.close();
});
