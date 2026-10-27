import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.setTimeout(90000);
async function ready(page: Page) {
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-renderer',
    'ready',
    { timeout: 20000 },
  );
}
async function visit(page: Page, id: string) {
  if (
    (await page.locator('[data-menu-toggle]').getAttribute('aria-expanded')) !==
    'true'
  )
    await page.locator('[data-menu-toggle]').click();
  await page.locator(`[data-island-go="${id}"]`).click();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-traveling',
    'false',
  );
}
async function open(page: Page, id: string, view: string) {
  await visit(page, id);
  await page
    .locator(`[data-index-details="${id}"] [data-open="${view}"]`)
    .first()
    .click();
}

test('dock and menu icons remain centered in playing and paused states', async ({
  page,
}) => {
  await page.goto('/zh-tw/');
  await ready(page);
  async function centered() {
    const offsets = await page
      .locator('.world-tools button,.world-menu-toggle')
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const svg = [...button.querySelectorAll('svg')].find(
            (svg) => svg.getBoundingClientRect().width > 0,
          )!;
          const a = button.getBoundingClientRect(),
            b = svg.getBoundingClientRect();
          return {
            x: b.x + b.width / 2 - a.x - a.width / 2,
            y: b.y + b.height / 2 - a.y - a.height / 2,
            w: b.width,
            h: b.height,
          };
        }),
      );
    expect(offsets).toHaveLength(7);
    for (const offset of offsets) {
      expect(Math.abs(offset.x)).toBeLessThan(0.5);
      expect(Math.abs(offset.y)).toBeLessThan(0.5);
      expect(offset.w).toBe(20);
      expect(offset.h).toBe(20);
    }
  }
  await centered();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('[data-motion]')).toBeEnabled();
  await centered();
  await page.locator('[data-motion]').click();
  await centered();
});

test('independent harbor island exposes bounded bilingual notes and a richer profile', async ({
  page,
}, testInfo) => {
  for (const locale of ['zh-tw', 'en']) {
    await page.goto(`/${locale}/?island=zailongchang`);
    await ready(page);
    await expect(page.locator('[data-portal]')).toHaveCount(7);
    await expect(page.locator('[data-viewport]')).toHaveAttribute(
      'data-bridge-count',
      '5',
    );
    await expect(page.locator('[data-viewport]')).toHaveAttribute(
      'data-scenery-islands',
      '44',
    );
    await page.locator('[data-station="0"]').click();
    await expect(page.locator('[data-view-panel=zailongchang]')).toBeVisible();
    await expect(
      page.locator(
        '[data-view-panel=zailongchang] a[href="https://zailongchang.tw/"]',
      ),
    ).toBeVisible();
    await page
      .locator(
        '[data-view-panel=zailongchang] [data-open=note-youth-village-action]',
      )
      .click();
    await expect(
      page.locator('[data-view-panel=note-youth-village-action]'),
    ).toContainText(
      locale === 'en' ? 'Personal application in progress' : '個人申請中',
    );
    await page.keyboard.press('Escape');
    await visit(page, 'journal');
    const cards = await page
      .locator('[data-station]:visible')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      );
    expect(cards).toHaveLength(5);
    for (let a = 0; a < cards.length; a++)
      for (let b = a + 1; b < cards.length; b++) {
        const x = cards[a]!,
          y = cards[b]!;
        expect(
          Math.min(x.x + x.w, y.x + y.w) - Math.max(x.x, y.x) > 0 &&
            Math.min(x.y + x.h, y.y + y.h) - Math.max(x.y, y.y) > 0,
        ).toBe(false);
      }
    await open(page, 'journal', 'note-cotton-booking');
    const client = page.locator('[data-view-panel=note-cotton-booking]');
    await expect(client).toContainText(
      locale === 'en' ? 'client project' : '接案專案',
    );
    expect(await client.locator('a[href^="https:"]').count()).toBe(0);
    await page.keyboard.press('Escape');
    await open(page, 'about', 'about');
    await expect(page.locator('[data-view-panel=about] h2')).toHaveText(
      'CIZING',
    );
    await expect(page.locator('[data-view-panel=about] h3')).toHaveCount(3);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await visit(page, 'zailongchang');
  await page.locator('[data-menu-close]').click();
  await testInfo.attach('independent-harbor-island', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('avatar travels, boats visit the harbor and shadows update without a time-button click', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/zh-tw/');
  await ready(page);
  const viewport = page.locator('[data-viewport]');
  await expect(viewport).toHaveAttribute('data-shadow-mode', 'tracked');
  await expect
    .poll(async () =>
      Number(await viewport.getAttribute('data-avatar-distance')),
    )
    .toBeGreaterThan(0.2);
  const frame = Number(await viewport.getAttribute('data-shadow-frame'));
  await expect
    .poll(async () => Number(await viewport.getAttribute('data-shadow-frame')))
    .toBeGreaterThan(frame);
  await expect
    .poll(
      async () => Number(await viewport.getAttribute('data-harbor-visits')),
      { timeout: 45000 },
    )
    .toBeGreaterThan(0);
  await page.locator('[data-motion]').click();
  const stopped = await viewport.getAttribute('data-shadow-frame');
  await page.waitForTimeout(250);
  await expect(viewport).toHaveAttribute('data-shadow-frame', stopped!);
  await testInfo.attach('moving-avatar-and-tracked-shadows', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});
