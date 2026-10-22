import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { profile } from '../src/config';
const paths = [
  '',
  'about/',
  'projects/',
  'projects/assetflow/',
  'projects/bookflow/',
  'notes/',
  'notes/booking-consistency/',
  'notes/date-contracts/',
  'contact/',
];
const routes = ['zh-tw', 'en'].flatMap((locale) =>
  paths.map((path) => `/${locale}/${path}`),
);
test('localized homes, keyboard skip and main navigation', async ({ page }) => {
  await page.goto('/zh-tw/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '可靠的軟體',
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
  await expect(page).toHaveURL('/zh-tw/projects/');
  await page.goto('/en/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Reliable software',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
test('project filtering, 13 source sections, private boundary and public source', async ({
  page,
}) => {
  await page.goto('/zh-tw/projects/');
  await page.getByLabel('依技術篩選').selectOption('Vue 3');
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await page
    .getByRole('heading', { name: 'AssetFlow ITAM' })
    .getByRole('link')
    .click();
  await expect(page.locator('.prose > h2')).toHaveCount(13);
  await expect(page.locator('a[href*="assetflow-itam"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Live Demo' })).toHaveCount(0);
  await page.locator('.toc').getByRole('link', { name: '工程難點' }).click();
  await expect(page).toHaveURL(/#/);
  await page.goto('/en/projects/bookflow/');
  await expect(page.locator('.prose > h2')).toHaveCount(13);
  await expect(page.locator('.case-facts a')).toHaveAttribute(
    'href',
    'https://github.com/Cizing24/bookflow-saas',
  );
});
test('notes category, tag, empty state, localized articles and reading navigation', async ({
  page,
}) => {
  for (const locale of ['zh-tw', 'en']) {
    await page.goto(`/${locale}/notes/`);
    await page
      .getByLabel(locale === 'en' ? 'Category' : '分類', { exact: true })
      .selectOption(locale === 'en' ? 'Data consistency' : '資料一致性');
    await expect(page.locator('.note-row:visible')).toHaveCount(1);
    await page
      .getByLabel(locale === 'en' ? 'Tag' : '標籤', { exact: true })
      .selectOption('AssetFlow');
    await expect(page.locator('#note-empty')).toBeVisible();
    await page
      .getByLabel(locale === 'en' ? 'Tag' : '標籤', { exact: true })
      .selectOption('');
    await page.locator('.note-row:visible').click();
    await expect(page.locator('.prose pre')).toBeVisible();
    await expect(page.locator('.toc')).toBeVisible();
    await expect(page.locator('.article-footer')).toBeVisible();
    await page.goto(`/${locale}/notes/date-contracts/`);
    await expect(page.locator('.prose pre')).toBeVisible();
  }
});
test('language switch preserves case, query and translated chapter anchor', async ({
  page,
}) => {
  for (const slug of ['assetflow', 'bookflow']) {
    await page.goto(`/zh-tw/projects/${slug}/?from=review`);
    await page.locator('.toc a').nth(7).click();
    await page.getByRole('link', { name: 'Switch to English' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/en/projects/${slug}/\\?from=review#engineering-challenges`),
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(
      await page.evaluate(
        () =>
          !!document.getElementById(decodeURIComponent(location.hash.slice(1))),
      ),
    ).toBe(true);
    await page.getByRole('link', { name: '切換繁體中文' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/zh-tw/projects/${slug}/\\?from=review#`),
    );
  }
  await page.goto('/en/notes/date-contracts/#verification-boundaries');
  await page.getByRole('link', { name: '切換繁體中文' }).click();
  await expect(page).toHaveURL(/\/zh-tw\/notes\/date-contracts\/#/);
  await page.goto('/en/projects/bookflow/#nonexistent');
  await page.getByRole('link', { name: '切換繁體中文' }).click();
  expect(new URL(page.url()).hash).toBe('');
});
test('mobile menu keyboard, Escape and focus return', async ({ page }) => {
  await page.goto('/en/');
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(page.locator('#navigation a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
    await menu.click();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Contact', exact: true })
      .click();
    await expect(page).toHaveURL('/en/contact/');
  }
});
test('legacy routes preserve destination, search and valid anchors', async ({
  page,
}) => {
  for (const path of paths) {
    await page.goto(`/${path}?from=v1#main`);
    await expect(page).toHaveURL(`/zh-tw/${path}?from=v1#main`);
  }
});
test('invalid language and route return actual 404 with localized recovery', async ({
  page,
}) => {
  for (const path of ['/fr/projects/', '/en/unknown/', '/zh-tw/unknown/']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,follow',
    );
    await expect(page.locator('html')).toHaveAttribute(
      'lang',
      path.startsWith('/en/') ? 'en' : 'zh-TW',
    );
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      path.startsWith('/en/') ? 'unwritten' : '還沒有寫進地圖',
    );
  }
});
test('BookFlow and AssetFlow scenarios, click steps, keyboard replay and reset', async ({
  page,
}) => {
  for (const locale of ['zh-tw', 'en'])
    for (const system of ['bookflow', 'assetflow']) {
      await page.goto(`/${locale}/projects/${system}/#simulation`);
      const lab = page.locator('[data-simulation]');
      await lab.locator('[data-node="6"]').focus();
      await page.keyboard.press('Enter');
      await expect(lab.locator('[data-state]')).toContainText('409');
      await lab.locator('[data-replay]').focus();
      await page.keyboard.press('Space');
      await expect(lab.locator('.step-count')).toHaveText('1 / 6');
      await lab.locator('[data-reset]').click();
      await expect(lab.locator('.step-count')).toHaveText('0 / 6');
      for (let i = 0; i < 6; i++) await lab.locator('[data-next]').click();
      await expect(lab.locator('[data-next]')).toBeDisabled();
      await expect(lab.locator('[data-state]')).toContainText('409');
      await lab.locator('[data-scenario]').selectOption('success');
      await lab.locator('[data-node="6"]').click();
      await expect(lab.locator('[data-state]')).toContainText(
        locale === 'en' ? 'success' : '成功',
      );
      if (system === 'assetflow') {
        await lab.locator('[data-scenario]').selectOption('denied');
        await lab.locator('[data-node="3"]').click();
        await expect(lab.locator('[data-state]')).toContainText('403');
        await lab.locator('[data-node="6"]').click();
        await expect(lab.locator('[data-state]')).toContainText('AVAILABLE');
        await expect(lab.locator('[data-detail]')).toContainText(
          locale === 'en' ? 'No assignment' : '不建立領用',
        );
      }
      await lab.locator('[data-reset]').focus();
      await page.keyboard.press('Enter');
      await expect(lab.locator('.step-count')).toHaveText('0 / 6');
    }
});
test('all pages: no overflow, broken links, broken anchors, image or console errors, decorative arrows', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
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
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('a,button').allTextContents(), route).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/[↗→↘➜➔]/)]),
    );
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')!)))
      links.add(href.split('#')[0]!);
    expect(
      await page
        .locator('a[href^="#"]')
        .evaluateAll((as) =>
          as
            .map((a) => a.getAttribute('href')!.slice(1))
            .filter(
              (id) => id && !document.getElementById(decodeURIComponent(id)),
            ),
        ),
      route,
    ).toEqual([]);
  }
  for (const href of links)
    expect((await request.get(href)).status(), href).toBe(200);
  expect(errors).toEqual([]);
});
test('all localized pages pass automated WCAG 2.2 AA checks', async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const route of routes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22a',
        'wcag22aa',
      ])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
});
test('reduced motion, contact boundaries and readable content without JavaScript', async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/projects/assetflow/');
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe('auto');
  await page.locator('[data-node="6"]').click();
  await expect(page.locator('.step-count')).toHaveText('6 / 6');
  await page.goto('/en/contact/');

  await expect(page.locator('form')).toHaveCount(0);

  const contactLinks = page.locator('.contact-links');

  await expect(contactLinks).toBeVisible();

  await expect(contactLinks.locator('a[href^="mailto:"]')).toHaveCount(
    profile.email ? 1 : 0,
  );

  await expect(contactLinks.locator('a[download]')).toHaveCount(
    profile.resume ? 1 : 0,
  );

  await expect(contactLinks.locator(`a[href="${profile.github}"]`)).toHaveCount(
    1,
  );

  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto('http://127.0.0.1:4321/en/projects/bookflow/');
  await expect(plain.locator('.prose > h2')).toHaveCount(13);
  await plain.locator('.flow-explanation summary').click();
  await expect(plain.locator('.flow-explanation ol')).toBeVisible();
  await context.close();
});
