import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/',
  '/about/',
  '/projects/',
  '/projects/assetflow/',
  '/projects/bookflow/',
  '/notes/',
  '/notes/booking-consistency/',
  '/notes/date-contracts/',
  '/contact/',
];
test('首頁、鍵盤跳轉與主要導覽', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '設計有依據',
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要內容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const menu = page.getByRole('button', { name: '選單' });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '作品', exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects\//);
});
test('作品篩選、私人來源與詳細章節', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByLabel('依技術篩選').selectOption('Vue 3');
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await page
    .getByRole('heading', { name: 'AssetFlow ITAM' })
    .getByRole('link')
    .click();
  await expect(page.locator('.prose h2')).toHaveCount(13);
  await expect(
    page.getByRole('link', { name: 'GitHub ↗', exact: true }),
  ).toHaveCount(1);
  await expect(page.locator('a[href*="assetflow-itam"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Live Demo' })).toHaveCount(0);
  await page.locator('.toc').getByRole('link', { name: '工程難點' }).click();
  await expect(page).toHaveURL(/#/);
  await page.goto('/projects/bookflow/');
  await expect(
    page.locator(
      '.case-facts a[href="https://github.com/Cizing24/bookflow-saas"]',
    ),
  ).toBeVisible();
});
test('文章分類、標籤、目錄與閱讀導覽', async ({ page }) => {
  await page.goto('/notes/');
  await page.getByLabel('分類', { exact: true }).selectOption('資料一致性');
  await expect(page.locator('.note-row:visible')).toHaveCount(1);
  await page.getByLabel('標籤', { exact: true }).selectOption('AssetFlow');
  await expect(page.locator('#note-empty')).toBeVisible();
  await page.getByLabel('標籤', { exact: true }).selectOption('');
  await page.locator('.note-row:visible').click();
  await expect(page.locator('.prose pre')).toBeVisible();
  await expect(
    page.getByRole('complementary', { name: '文章目錄' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: '閱讀導覽' }),
  ).toBeVisible();
});
test('行動選單 Escape、主題持久化與無儲存狀態', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('button', { name: '選單' });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
    await menu.click();
    await page
      .getByRole('navigation', { name: '主要導覽' })
      .getByRole('link', { name: '聯絡', exact: true })
      .click();
    await expect(page).toHaveURL(/\/contact\//);
  }
  await page.getByRole('button', { name: '切換淺色主題' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '切換深色主題' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage unavailable');
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '切換淺色主題' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('無效路由回傳自訂 404', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '還沒有寫進地圖',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );
  await page.getByRole('link', { name: '回到首頁 ↗' }).click();
  await expect(page).toHaveURL('/');
});
test('所有頁面沒有壞連結、資源錯誤、console 錯誤或溢位', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const links = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')!)))
      links.add(href.split('#')[0]!);
    const missingAnchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((anchors) =>
        anchors
          .map((anchor) => anchor.getAttribute('href')!.slice(1))
          .filter(
            (id) => id && !document.getElementById(decodeURIComponent(id)),
          ),
      );
    expect(missingAnchors, route).toEqual([]);
  }
  for (const href of links)
    expect((await request.get(href)).status(), href).toBe(200);
  expect(errors).toEqual([]);
});
test('主要頁面的 WCAG 2.2 AA 自動化檢查與淺色主題', async ({ page }) => {
  for (const route of [
    '/',
    '/projects/',
    '/projects/assetflow/',
    '/notes/booking-consistency/',
    '/contact/',
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
  await page.getByRole('button', { name: '切換淺色主題' }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('降低動態效果與聯絡邊界', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact/');
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe('auto');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator('a[download]')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: '前往 GitHub ↗' }),
  ).toHaveAttribute('href', 'https://github.com/Cizing24');
});
