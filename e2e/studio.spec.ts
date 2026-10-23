import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(60000);

async function ready(page: Page) {
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-renderer',
    'ready',
    { timeout: 15000 },
  );
}
async function menu(page: Page) {
  if (
    (await page.locator('[data-menu-toggle]').getAttribute('aria-expanded')) !==
    'true'
  )
    await page.locator('[data-menu-toggle]').click();
}
async function visit(page: Page, id: string) {
  await menu(page);
  await page.locator(`[data-island-go="${id}"]`).click();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    id,
  );
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

test('six fixed islands have small labels, no slogans and useful project topics', async ({
  page,
}) => {
  await page.goto('/en/');
  await ready(page);
  await expect(page.locator('h1')).toHaveText('CIZING24');
  await expect(page.locator('.world-header')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
  await expect(page.locator('.world-header a')).toHaveCount(1);
  await expect(page.locator('[data-menu-toggle]')).toHaveCSS(
    'border-radius',
    '50%',
  );
  await expect(page.locator('[data-portal]')).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  await expect(page.locator('.world-header [data-phase-choice]')).toHaveCount(
    4,
  );
  await expect(page.locator('.world-header [data-world-locale]')).toHaveText(
    '繁中',
  );
  await page.locator('[data-portal=bookflow]').click();
  const reader = page.locator('[data-reader]');
  for (const [index, topic, title] of [
    [0, 'purpose', 'Project purpose'],
    [1, 'features', 'What it does'],
    [2, 'architecture', 'How it is built'],
  ] as const) {
    await page.locator(`[data-station="${index}"]`).click();
    await expect(
      reader.locator(`[data-view-panel="project-bookflow-${topic}"] h2`),
    ).toHaveText(title);
    expect(new URL(page.url()).pathname).toBe('/en/');
    await page.keyboard.press('Escape');
    await expect(reader).not.toBeVisible();
  }
  await visit(page, 'assetflow');
  await page.locator('[data-menu-close]').click();
  const rects = await page.locator('[data-station]').evaluateAll((nodes) =>
    nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!,
        b = rects[j]!;
      expect(
        a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y,
      ).toBe(true);
    }
});

test('right menu searches content, flies to every island and restores keyboard focus', async ({
  page,
}) => {
  await page.goto('/zh-tw/');
  await ready(page);
  await menu(page);
  const search = page.getByLabel('搜尋島嶼或內容');
  await search.fill('日期');
  await expect(page.locator('[data-index-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-index-row=journal]')).toBeVisible();
  await search.fill('不存在xyz');
  await expect(page.locator('[data-index-empty]')).toBeVisible();
  await search.fill('');
  for (const id of [
    'portfolio',
    'bookflow',
    'assetflow',
    'journal',
    'contact',
    'about',
  ]) {
    await visit(page, id);
    await expect(page.locator(`[data-index-details="${id}"]`)).toBeVisible();
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-index]')).toBeHidden();
  await expect(page.locator('[data-menu-toggle]')).toBeFocused();
  await page.locator('[data-overview]').click();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-mode',
    'overview',
  );
});

test('four times change actual scene lighting and preserve island, language and reload', async ({
  page,
}) => {
  await page.goto('/zh-tw/?island=journal');
  await ready(page);
  const canvas = page.locator('canvas');
  const pictures: Buffer[] = [];
  for (const time of ['dawn', 'noon', 'sunset', 'night']) {
    await page.locator(`[data-phase-choice="${time}"]`).click();
    await expect(page.locator(`[data-phase-choice="${time}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    pictures.push(await canvas.screenshot());
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  for (let i = 1; i < pictures.length; i++)
    expect(pictures[i]!.equals(pictures[i - 1]!)).toBe(false);
  await page.locator('[data-world-locale]').click();
  await expect(page).toHaveURL(/\/en\/\?island=journal&time=night/);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-phase',
    'night',
  );
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'journal',
  );
});

test('avatar button finds the personal island and opens its profile in place', async ({
  page,
}) => {
  await page.goto('/en/');
  await ready(page);
  await page.locator('[data-avatar-focus]').click();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'about',
  );
  await page.locator('[data-station="0"]').click();
  await expect(page.locator('[data-view-panel=about] h2')).toHaveText(
    'Cizing24',
  );
  await expect(page.locator('[data-view-panel=about]')).toContainText(
    'Full-stack developer',
  );
});

test('topic dialogs preserve project, language and history across reloads and legacy links', async ({
  page,
}) => {
  await page.goto(
    '/zh-tw/?studio=assetflow&topic=architecture&view=project-assetflow-architecture',
  );
  const reader = page.locator('[data-reader]');
  await expect(
    reader.locator(
      '[data-view-panel="project-assetflow-architecture"] .intro-architecture li',
    ),
  ).toHaveCount(3);
  await reader.locator('[data-reader-locale]').click();
  await expect(
    reader.locator('[data-view-panel="project-assetflow-architecture"] h2'),
  ).toHaveText('How it is built');
  await page.reload();
  await expect(reader).toBeVisible();
  await reader.locator('[data-reader-close]').click();
  await expect(reader).not.toBeVisible();
  await ready(page);
  await page.locator('[data-station="0"]').focus();
  await page.keyboard.press('Enter');
  await expect(
    reader.locator('[data-view-panel="project-assetflow-purpose"]'),
  ).toBeVisible();
  await page.goBack();
  await expect(reader).not.toBeVisible();
});

test('camera travel and reader transitions run smoothly and allow rapid interruption', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en/');
  await ready(page);
  await page.evaluate(() => {
    const state = window as unknown as {
      worldTravel: {
        island: string;
        moving: string;
        time: number;
        hidden: boolean;
      }[];
    };
    state.worldTravel = [];
    const root = document.querySelector<HTMLElement>('[data-studio]')!;
    new MutationObserver(() => {
      state.worldTravel.push({
        island: root.dataset.island!,
        moving: root.dataset.traveling!,
        time: performance.now(),
        hidden:
          getComputedStyle(document.querySelector('[data-station="0"]')!)
            .visibility === 'hidden',
      });
    }).observe(root, { attributes: true, attributeFilter: ['data-traveling'] });
    document.querySelector('[data-portal=bookflow]')!.addEventListener(
      'click',
      () => {
        setTimeout(
          () =>
            document
              .querySelector<HTMLButtonElement>('[data-avatar-focus]')!
              .click(),
          50,
        );
      },
      { once: true },
    );
  });
  await page.locator('[data-portal=bookflow]').click();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'about',
  );
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-traveling',
    'false',
  );
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'about',
  );
  const transitions = await page.evaluate(
    () =>
      (
        window as unknown as {
          worldTravel: {
            island: string;
            moving: string;
            time: number;
            hidden: boolean;
          }[];
        }
      ).worldTravel,
  );
  expect(
    transitions.some(
      (event) =>
        event.island === 'bookflow' && event.moving === 'true' && event.hidden,
    ),
  ).toBe(true);
  const start = transitions.find(
    (event) => event.island === 'about' && event.moving === 'true',
  )!;
  const end = transitions.find(
    (event) => event.island === 'about' && event.moving === 'false',
  )!;
  expect(end.time - start.time).toBeGreaterThanOrEqual(1200);
  await page.locator('[data-station="0"]').click();
  await expect(page.locator('[data-reader]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-reader]')).not.toBeVisible();
  await expect(page.locator('[data-station="0"]')).toBeFocused();
});

test('motion button pauses and resumes through real pointer clicks', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en/');
  await ready(page);

  const studio = page.locator('[data-studio]');
  const motion = page.locator('[data-motion]');
  await expect(motion).toBeEnabled();
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(studio).toHaveAttribute('data-ambient', 'playing');
  await motion.click();
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await expect(studio).toHaveAttribute('data-ambient', 'paused');
  await motion.click();
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(studio).toHaveAttribute('data-ambient', 'playing');
});

test('autonomous people, birds, boats and water move, pause and respect reduced motion', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en/');
  await ready(page);
  const studio = page.locator('[data-studio]');
  const motion = page.locator('[data-motion]');
  await expect(studio).toHaveAttribute('data-ambient', 'playing');
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  // Wait for the initial canvas fade, so a fade alone cannot prove animation.
  await page.locator('canvas').evaluate(async (canvas) => {
    await Promise.all(
      canvas.getAnimations().map((animation) => animation.finished),
    );
  });

  // Sample the actual rendered islands, outside the header and bottom controls.
  // Three CSS-scale crops reduce captured pixels and PNG encoding work. Page
  // captures also avoid the element screenshot's scroll/stability checks.
  const viewport = page.viewportSize()!;
  const width = Math.min(640, Math.floor(viewport.width * 0.8));
  const height = Math.min(480, Math.floor(viewport.height * 0.6));
  const frame = () =>
    page.screenshot({
      clip: {
        x: Math.floor((viewport.width - width) / 2),
        y: Math.floor((viewport.height - height) / 2),
        width,
        height,
      },
      scale: 'css',
      animations: 'allow',
    });
  const first = await test.step('Capture a playing scene frame', frame);
  await testInfo.attach('playing-frame', {
    body: first,
    contentType: 'image/png',
  });
  await page.waitForTimeout(600);

  // Real pointer actionability is covered separately above. This test exercises
  // the real click handler without competing for extra animation frames in CI.
  await motion.dispatchEvent('click');
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await expect(studio).toHaveAttribute('data-ambient', 'paused');
  const paused = await test.step(
    'Capture the final frame after pausing',
    frame,
  );
  await testInfo.attach('paused-frame', {
    body: paused,
    contentType: 'image/png',
  });
  // Pausing only cancels future frames; it does not reset or repaint the scene.
  // The final frame must differ from the earlier playing frame.
  expect(paused.equals(first)).toBe(false);
  await page.waitForTimeout(250);
  const later = await test.step(
    'Capture the scene while it remains paused',
    frame,
  );
  await testInfo.attach('still-paused-frame', {
    body: later,
    contentType: 'image/png',
  });
  expect(later.equals(paused)).toBe(true);

  // Reduced motion must stop an actively playing scene, not just keep a scene
  // paused by the user. It must also restore that choice when switched back.
  await motion.dispatchEvent('click');
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(studio).toHaveAttribute('data-ambient', 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(motion).toBeDisabled();
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await expect(studio).toHaveAttribute('data-ambient', 'paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(motion).toBeEnabled();
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(studio).toHaveAttribute('data-ambient', 'playing');
});

test('WebGL fallback retains all six islands, topics, search and reading controls', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/en/');
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-renderer',
    'fallback',
  );
  await page.locator('[data-portal=bookflow]').click();
  await page.locator('[data-station="2"]').click();
  await expect(
    page.locator('[data-view-panel="project-bookflow-architecture"]'),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-reader]')).not.toBeVisible();
  await open(page, 'contact', 'contact');
  await expect(
    page.locator('[data-view-panel=contact] a[href^="mailto:"]'),
  ).toBeVisible();
});

test('3D context loss keeps current island and its content usable', async ({
  page,
}) => {
  await page.goto('/en/?island=bookflow&time=night');
  await ready(page);
  await page
    .locator('canvas')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-renderer',
    'fallback',
  );
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'bookflow',
  );
  await page.locator('[data-station="2"]').click();
  await expect(
    page.locator('[data-view-panel="project-bookflow-architecture"]'),
  ).toBeVisible();
});

test('portfolio, notes, contact and profile stay in the same reader with accessible contents', async ({
  page,
}) => {
  await page.goto('/en/');
  await open(page, 'portfolio', 'projects');
  const reader = page.locator('[data-reader]');
  await reader
    .locator('[data-view-panel=projects] [data-open=project-bookflow]')
    .click();
  await expect(
    reader.locator(
      '[data-view-panel=project-bookflow] .project-introduction > section',
    ),
  ).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(reader).not.toBeVisible();
  for (const [id, view] of [
    ['journal', 'journal'],
    ['about', 'about'],
    ['contact', 'contact'],
  ]) {
    await open(page, id!, view!);
    await expect(reader.locator(`[data-view-panel="${view}"]`)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations, view).toEqual(
      [],
    );
    if (view === 'journal') {
      await reader.locator('[data-open=note-date-contracts]').click();
      await expect(
        reader.locator('[data-view-panel=note-date-contracts]'),
      ).toBeVisible();
    }
    expect(new URL(page.url()).pathname).toBe('/en/');
    await page.keyboard.press('Escape');
    await expect(reader).not.toBeVisible();
  }
  await page.locator('[data-menu-close]').click();
  await page.locator('.world-tools [data-open=help]').click();
  await expect(reader.locator('[data-view-panel=help]')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(reader).not.toBeVisible();
  await open(page, 'portfolio', 'projects');
  await reader.locator('[data-enter-world=assetflow]').click();
  await expect(reader).not.toBeVisible();
  await expect(page.locator('[data-studio]')).toHaveAttribute(
    'data-island',
    'assetflow',
  );
});

test('readable product introductions remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  await expect(page.locator('.world-nojs')).toBeVisible();
  await page.locator('.world-nojs a[href="/en/projects/"]').click();
  await expect(page.locator('.project-card')).toHaveCount(2);
  await page.goto('http://127.0.0.1:4321/en/projects/bookflow/');
  await expect(page.locator('.project-introduction > section')).toHaveCount(3);
  await context.close();
});

test('single and two finger dragging rotate the world and reader text keeps native scrolling', async ({
  page,
}) => {
  await page.goto('/en/');
  await ready(page);
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const canvas = page.locator('canvas'),
    box = (await canvas.boundingBox())!,
    y = box.height * 0.65;
  for (const count of [1, 2]) {
    const before = await canvas.screenshot();
    const points = Array.from({ length: count }, (_, i) => ({
      x: box.width * 0.44 + i * 38,
      y,
      id: i + 1,
    }));
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: points,
    });
    for (let step = 1; step <= 5; step++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: points.map((point) => ({
          ...point,
          x: point.x + step * 8,
        })),
      });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    expect((await canvas.screenshot()).equals(before)).toBe(false);
  }
  await open(page, 'about', 'about');
  expect(
    await page
      .locator('[data-reader-scroll]')
      .evaluate((el) => getComputedStyle(el).touchAction),
  ).toBe('auto');
  await client.detach();
});

test('phone rotation and short viewports keep controls, search and reading in reach', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/en/');
  await ready(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [430, 932],
    [844, 390],
    [667, 375],
    [390, 620],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    await expect(page.locator('[data-studio]')).toHaveCSS(
      'height',
      `${height}px`,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight + 1 &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const controls = await page
      .locator(
        '.world-tools button,[data-phase-choice],[data-menu-toggle],[data-world-locale]',
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            label: node.getAttribute('aria-label'),
            inside:
              r.left >= 0 &&
              r.top >= 0 &&
              r.right <= innerWidth &&
              r.bottom <= innerHeight,
          };
        }),
      );
    expect(
      controls.filter((control) => !control.inside),
      `${width}×${height}`,
    ).toEqual([]);
    await open(page, 'journal', 'note-date-contracts');
    await expect(
      page.locator('[data-view-panel=note-date-contracts]'),
    ).toBeVisible();
    const region = page.locator('[data-reader-scroll]');
    expect(
      await region.evaluate(
        (el) =>
          el.clientHeight > 40 &&
          el.getBoundingClientRect().bottom <= innerHeight,
      ),
    ).toBe(true);
    await region.evaluate((el) => (el.scrollTop = el.scrollHeight));
    expect(await region.evaluate((el) => el.scrollTop > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-reader]')).not.toBeVisible();
    await page.locator('[data-menu-close]').click();
    await page.locator('[data-overview]').click();
  }
  expect(errors).toEqual([]);
});
