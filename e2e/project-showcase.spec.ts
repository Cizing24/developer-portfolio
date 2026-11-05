import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(45000);

async function enter(page: Page, island: string) {
  const studio = page.locator('[data-studio]');
  await expect(studio).toHaveAttribute('data-renderer', 'ready', {
    timeout: 20000,
  });
  await page.locator(`[data-portal=${island}]`).click();
  await expect(studio).toHaveAttribute('data-traveling', 'false');
}

async function clickModel(page: Page, index: number) {
  const label = (await page
    .locator(`[data-station="${index}"]`)
    .boundingBox())!;
  const canvas = page.locator('canvas');
  // The label projects just above the facility. Aim at its volume from the canvas.
  for (const dy of [30, 48, 65]) {
    for (const dx of [0, -14, 14]) {
      const x = label.x + label.width / 2 + dx;
      const y = label.y + label.height / 2 + dy;
      await page.mouse.move(x, y);
      if ((await canvas.getAttribute('style'))?.includes('cursor: pointer')) {
        await page.mouse.click(x, y);
        return;
      }
    }
  }
  throw new Error(`Canvas facility ${index} did not respond to pointer hover`);
}

test('BookFlow facility opens the booking desk and preserves history across sections', async ({
  page,
}, info) => {
  const errors: string[] = [];
  const loadedImages: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.resourceType() === 'image') loadedImages.push(request.url());
  });
  await page.goto('/zh-tw/');
  await enter(page, 'bookflow');
  expect(
    loadedImages.some((url) => /bookflow-calendar|bookflow-booking/.test(url)),
  ).toBe(false);
  const station = page.locator('[data-station="0"]');
  if (info.project.name === 'mobile') await station.tap();
  else {
    await page.screenshot({ path: info.outputPath('bookflow-island.png') });
    await clickModel(page, 0);
  }

  const reader = page.locator('[data-reader]');
  const booking = reader.locator('[data-booking-demo]');
  await expect(booking).toBeVisible();
  await booking.getByRole('button', { name: '下一步' }).click();
  await expect(booking.getByRole('status')).toHaveText('請先選擇一項服務。');
  await booking.getByLabel('服務項目').selectOption('consult');
  await booking.getByRole('button', { name: '下一步' }).click();
  await booking.getByLabel('日期').selectOption('2026-11-14');
  await booking.getByLabel('服務人員').selectOption('north');
  await booking.getByRole('button', { name: '下一步' }).click();
  await expect(booking.getByRole('status')).toContainText('沒有可用時段');
  await booking.getByRole('button', { name: '上一步' }).click();
  await booking.getByLabel('日期').selectOption('2026-11-12');
  await booking.getByRole('button', { name: '下一步' }).click();
  await booking.getByLabel('可用時段').selectOption('10:00');
  await booking.getByRole('button', { name: '送出示範預約' }).click();
  await expect(booking.getByRole('status')).toContainText('示範預約成立');
  await expect(booking.locator('option[value="10:00"]')).toContainText(
    '已預約',
  );
  await booking.getByRole('button', { name: '送出示範預約' }).click();
  await expect(booking.getByRole('status')).toContainText('時段已被預約');
  await booking.getByRole('button', { name: '重新開始' }).click();
  await expect(booking.getByLabel('服務項目')).toHaveValue('');

  await reader.getByRole('link', { name: '店家行事曆' }).click();
  const calendar = reader.locator('[data-showcase-region=secondary]:visible');
  await expect(calendar).toBeVisible();
  await calendar.getByRole('button', { name: '下一步' }).click();
  await expect(
    calendar.getByRole('heading', { name: '登記休假與例外' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      calendar
        .locator('img')
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);

  await reader.getByRole('link', { name: '系統架構', exact: true }).click();
  const architecture = reader.locator(
    '[data-showcase-region=architecture]:visible',
  );
  const layer = architecture.locator('summary').nth(1);
  await layer.focus();
  await page.keyboard.press('Enter');
  await expect(
    architecture.getByText('送出時由伺服器', { exact: false }),
  ).toBeVisible();
  await reader.getByRole('link', { name: '工程證據', exact: true }).click();
  await expect(page).toHaveURL(/view=project-bookflow-evidence/);
  await page.goBack();
  await expect(architecture).toBeVisible();
  await page.goForward();
  await expect(
    reader.locator('[data-showcase-region=evidence]:visible'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reader).not.toBeVisible();
  await expect(station).toBeFocused();
  expect(errors).toEqual([]);
});

test('AssetFlow inventory and handover update the same state and audit log', async ({
  page,
}, info) => {
  await page.goto('/en/?island=assetflow&view=project-assetflow-purpose');
  const reader = page.locator('[data-reader]');
  const assets = reader.locator('[data-asset-demo]');
  await expect(
    assets.getByRole('heading', { name: 'Equipment register' }),
  ).toBeVisible();
  await assets.getByLabel('Find equipment').fill('missing');
  await expect(assets.getByText('No matching equipment.')).toBeVisible();
  await assets.getByLabel('Find equipment').fill('');
  await assets.getByLabel('Filter by status').selectOption('available');
  await expect(assets.locator('[data-asset-row]:visible')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(reader).not.toBeVisible();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-renderer',
    'ready',
    { timeout: 20000 },
  );
  const station = page.locator('[data-station="1"]');
  if (info.project.name === 'mobile') await station.tap();
  else {
    await page.screenshot({ path: info.outputPath('assetflow-island.png') });
    await clickModel(page, 1);
  }
  await expect(page).toHaveURL(/view=project-assetflow-handover/);
  const form = assets.locator('form');
  const apply = form.getByRole('button', { name: 'Apply equipment change' });
  const device = form.getByLabel('Device');
  const action = form.getByLabel('Action');
  const feedback = form.getByRole('status');
  const laptop = assets.locator('[data-asset-row="LT-104"]');
  await device.selectOption('LT-104');
  await form.getByLabel('Employee').selectOption('A');
  await apply.click();
  await expect(laptop).toContainText('Employee A');
  await apply.click();
  await expect(feedback).toContainText('Only available equipment');
  await action.selectOption('checkin');
  await apply.click();
  await expect(laptop).toContainText('Available');
  await device.selectOption('DT-207');
  await action.selectOption('damaged');
  await apply.click();
  await expect(feedback).toContainText('Describe the fault');
  await form.getByLabel('Fault description').fill('Screen cracked');
  await apply.click();
  await expect(assets.locator('[data-asset-row="DT-207"]')).toContainText(
    'Under repair',
  );
  await expect(assets.locator('[data-handover-status]')).toContainText(
    'all equipment',
  );
  await expect(assets.locator('[data-asset-audit] li')).toHaveCount(3);
  if (info.project.name === 'mobile') {
    await page.screenshot({ path: info.outputPath('assetflow-handover.png') });
    const { width, scroll } = await assets.evaluate((node) => ({
      width: node.clientWidth,
      scroll: node.scrollWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(width + 1);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
  await form.getByRole('button', { name: 'Start over' }).click();
  await expect(assets.locator('[data-asset-audit] li')).toHaveCount(0);
  await expect(assets.locator('[data-handover-status]')).toContainText(
    'still has equipment',
  );
  await page.keyboard.press('Escape');
  await expect(reader).not.toBeVisible();

  await page.locator('[data-menu-toggle]').click();
  await page
    .locator(
      '[data-index-details=assetflow] [data-open=project-assetflow-handover]',
    )
    .click();
  await expect(page).toHaveURL(/view=project-assetflow-handover/);
  await reader.locator('[data-reader-locale]').click();
  await expect(
    assets.getByRole('heading', { name: '領還與離職交接' }),
  ).toBeVisible();
});

test('project case pages remain readable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto('/zh-tw/');
    await page.getByRole('link', { name: '作品', exact: true }).click();
    for (const [id, title] of [
      ['bookflow', 'BookFlow SaaS'],
      ['assetflow', 'AssetFlow ITAM'],
    ]) {
      await page.goto(`/zh-tw/projects/${id}/`);
      await expect(
        page.getByRole('heading', { name: title, level: 1 }),
      ).toBeVisible();
      await expect(page.locator('.project-introduction > section')).toHaveCount(
        3,
      );
    }
  } finally {
    await context.close();
  }
});
