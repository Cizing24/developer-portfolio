import type { Locale } from './i18n';
import type { StudioScene } from './studio-scene';
import { initReader } from './studio-reader';
import {
  dayPhases,
  directIslandView,
  isIsland,
  islandName,
  islandItems,
  phaseName,
  type IslandId,
  type DayPhase,
} from './world-config';

export function initStudio(root: HTMLElement) {
  const locale = root.dataset.language as Locale;
  const en = locale === 'en';
  const query = <T extends HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const nodes = [...root.querySelectorAll<HTMLButtonElement>('[data-station]')];
  const viewport = query<HTMLDivElement>('[data-viewport]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = query<HTMLButtonElement>('[data-motion]');
  const index = query<HTMLElement>('[data-index]');
  const menuButton = query<HTMLButtonElement>('[data-menu-toggle]');
  let active: IslandId | null = null;
  let phase: DayPhase = 'noon';
  let scene: StudioScene | undefined;
  const fallbackPanel = query('[data-fallback]');
  const retryButton = query<HTMLButtonElement>('[data-scene-retry]');
  let sceneModule: typeof import('./studio-scene') | undefined;
  let reloadOnRetry = false;
  let visible = false,
    attempt = 0,
    loadTimeout: number | undefined,
    attempted = false,
    disposed = false,
    userMotion = true,
    journey = 0;
  const reader = initReader(
    root,
    (value) => void navigate(value),
    () => visibility(),
  );

  function updateMotion() {
    const enabled = userMotion && !reduced.matches;
    root.dataset.ambient = enabled ? 'playing' : 'paused';
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(enabled));
    const label = reduced.matches
      ? en
        ? 'Reduced motion'
        : '已減少動態'
      : enabled
        ? en
          ? 'Pause motion'
          : '暫停動態'
        : en
          ? 'Resume motion'
          : '開啟動態';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    query('[data-motion-pause]').hidden = !enabled;
    query('[data-motion-play]').hidden = enabled;
    scene?.setMotion(enabled);
  }
  function persist() {
    const url = new URL(location.href);
    ['studio', 'topic', 'stage', 'scenario'].forEach((key) =>
      url.searchParams.delete(key),
    );
    if (active) url.searchParams.set('island', active);
    else url.searchParams.delete('island');
    if (phase !== 'noon') url.searchParams.set('time', phase);
    else url.searchParams.delete('time');
    history.replaceState(history.state, '', url);
    reader.syncLinks();
  }
  function updateSceneControls() {
    root
      .querySelectorAll<HTMLButtonElement>('[data-zoom], [data-avatar-focus]')
      .forEach(
        (button) => (button.disabled = root.dataset.renderer !== 'ready'),
      );
  }
  updateSceneControls();
  function updateIsland() {
    root.dataset.mode = active ? 'explore' : 'overview';
    root.dataset.island = active ?? '';
    root.dataset.system =
      active === 'bookflow' || active === 'assetflow' ? active : '';
    const items = active ? islandItems(active, locale) : [];
    nodes.forEach((node, i) => {
      node.hidden = !items[i];
      node.querySelector('[data-node-title]')!.textContent =
        items[i]?.title ?? '';
    });
    root
      .querySelectorAll<HTMLButtonElement>('[data-portal]')
      .forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.portal === active),
        );
      });
    root
      .querySelectorAll<HTMLButtonElement>('[data-island-go][aria-expanded]')
      .forEach((button) => {
        const selected = button.dataset.islandGo === active;
        button.setAttribute('aria-expanded', String(selected));
        if (selected) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
    root
      .querySelectorAll<HTMLElement>('[data-index-details]')
      .forEach(
        (detail) => (detail.hidden = detail.dataset.indexDetails !== active),
      );
  }
  function activateIsland(id: IslandId) {
    const view = directIslandView(id);
    if (view) reader.show(view);
    else void navigate(id);
  }
  async function navigate(
    id: IslandId | null,
    animated = true,
    save = true,
    avatar = false,
  ) {
    const token = ++journey;
    active = id;
    root.dataset.traveling = 'true';
    updateIsland();
    if (save) persist();
    if (avatar) await scene?.focusAvatar();
    else if (id) await scene?.focusIsland(id, animated);
    else await scene?.overview(animated);
    if (token !== journey) return;
    root.dataset.traveling = 'false';
    query('[data-scene-status]').textContent = id
      ? `${islandName(id, locale)}${en ? ' island' : '島'}`
      : en
        ? 'All islands'
        : '群島全景';
  }
  function select(index: number) {
    const item = active && islandItems(active, locale)[index];
    if (!item) return;
    nodes[index]?.focus({ preventScroll: true });
    reader.show(item.view);
  }
  function setPhase(value: DayPhase, animated = true, save = true) {
    phase = value;
    root.dataset.phase = phase;
    root
      .querySelectorAll<HTMLButtonElement>('[data-phase-choice]')
      .forEach((button) =>
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.phaseChoice === phase),
        ),
      );
    scene?.setPhase(phase, animated);
    if (save) persist();
    query('[data-scene-status]').textContent = phaseName(phase, locale);
  }
  function setMenu(open: boolean, focus = true) {
    root.dataset.menu = open ? 'open' : 'closed';
    index.inert = !open;
    index.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    if (focus)
      (open ? query<HTMLButtonElement>('[data-menu-close]') : menuButton).focus(
        { preventScroll: true },
      );
  }
  function restore(initial = false) {
    const params = new URL(location.href).searchParams;
    const id = params.get('island') ?? params.get('studio');
    const next = isIsland(id) ? id : null;
    const nextPhase =
      dayPhases.find((item) => item === params.get('time')) ?? 'noon';
    if (phase !== nextPhase || initial) setPhase(nextPhase, !initial, false);
    if (active !== next || initial) void navigate(next, !initial, false);
    reader.restore();
  }
  updateMotion();
  restore(true);
  motionButton.addEventListener('click', () => {
    userMotion = !userMotion;
    updateMotion();
  });
  nodes.forEach((node, i) => node.addEventListener('click', () => select(i)));
  root
    .querySelectorAll<HTMLButtonElement>('[data-portal], [data-island-go]')
    .forEach((button) =>
      button.addEventListener('click', () => {
        const id = button.dataset.portal ?? button.dataset.islandGo;
        if (isIsland(id ?? null)) activateIsland(id as IslandId);
      }),
    );
  root
    .querySelectorAll<HTMLButtonElement>('[data-world-home], [data-overview]')
    .forEach((button) =>
      button.addEventListener('click', () => void navigate(null)),
    );
  query('[data-avatar-focus]').addEventListener(
    'click',
    () => void navigate('about', true, true, true),
  );
  root
    .querySelectorAll<HTMLButtonElement>('[data-phase-choice]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        setPhase(button.dataset.phaseChoice as DayPhase),
      ),
    );
  menuButton.addEventListener('click', () =>
    setMenu(root.dataset.menu !== 'open'),
  );
  query('[data-menu-close]').addEventListener('click', () => setMenu(false));
  query<HTMLInputElement>('[data-island-search]').addEventListener(
    'input',
    (event) => {
      const value = (event.target as HTMLInputElement).value
        .trim()
        .toLocaleLowerCase();
      let matches = 0;
      root.querySelectorAll<HTMLElement>('[data-index-row]').forEach((row) => {
        row.hidden = !row.dataset.search!.toLocaleLowerCase().includes(value);
        if (!row.hidden) matches++;
      });
      query('[data-index-empty]').hidden = matches > 0;
    },
  );
  function keydown(event: KeyboardEvent) {
    if (
      event.key === 'Escape' &&
      !reader.isOpen() &&
      root.dataset.menu === 'open'
    )
      setMenu(false);
  }
  document.addEventListener('keydown', keydown);
  function fallback(reason: 'lost' | 'unavailable' | 'timeout' | 'download') {
    attempt++;
    clearTimeout(loadTimeout);
    scene?.dispose();
    scene = undefined;
    root.dataset.renderer = 'fallback';
    root.dataset.traveling = 'false';
    fallbackPanel.hidden = false;
    reloadOnRetry = !sceneModule;
    query('[data-fallback-message]').textContent = (
      en
        ? {
            lost: 'The browser lost its 3D connection.',
            unavailable: '3D is unavailable in this browser.',
            timeout: 'The 3D scene took too long to start.',
            download: 'The 3D scene files could not load.',
          }
        : {
            lost: '瀏覽器的 3D 場景連線已中斷。',
            unavailable: '目前的瀏覽器無法顯示 3D 場景。',
            timeout: '3D 場景未能及時載入。',
            download: '3D 場景檔案載入失敗。',
          }
    )[reason];
    viewport
      .querySelectorAll<HTMLElement>('[data-station], [data-portal]')
      .forEach((node) => {
        node.style.removeProperty('transform');
        node.style.removeProperty('visibility');
      });
    updateSceneControls();
  }
  async function loadScene() {
    if (disposed) return;
    attempted = true;
    const token = ++attempt;
    const restoreRetryFocus = document.activeElement === retryButton;
    root.dataset.renderer = 'loading';
    if (restoreRetryFocus) menuButton.focus({ preventScroll: true });
    fallbackPanel.hidden = true;
    loadTimeout = window.setTimeout(() => fallback('timeout'), 15000);
    try {
      const { createStudioScene } = (sceneModule ??=
        await import('./studio-scene'));
      if (disposed || token !== attempt) return;
      scene = createStudioScene(
        viewport,
        nodes,
        select,
        () => fallback('lost'),
        activateIsland,
      );
      scene.setPhase(phase, false);
      updateMotion();
      await navigate(active, false, false);
      if (disposed || token !== attempt) return;
      scene.firstFrame();
      clearTimeout(loadTimeout);
      root.dataset.renderer = 'ready';
      updateSceneControls();
      visibility();
    } catch {
      if (!disposed && token === attempt)
        fallback(sceneModule ? 'unavailable' : 'download');
    }
  }
  retryButton.addEventListener('click', () => {
    if (reloadOnRetry) location.reload();
    else void loadScene();
  });
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      visibility();
    },
    { threshold: 0.05 },
  );
  observer.observe(viewport);
  root
    .querySelectorAll<HTMLButtonElement>('[data-zoom]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        scene?.zoom(button.dataset.zoom === 'in' ? 0.85 : 1.18),
      ),
    );
  function visibility() {
    if (visible && !document.hidden && !reader.isOpen() && !attempted)
      void loadScene();
    if (root.dataset.renderer === 'ready')
      scene?.setVisible(visible && !document.hidden && !reader.isOpen());
  }
  function motion() {
    scene?.setReducedMotion(reduced.matches);
    updateMotion();
  }
  const popstate = () => restore();
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motion);
  window.addEventListener('popstate', popstate);
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      clearTimeout(loadTimeout);
      observer.disconnect();
      scene?.dispose();
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('keydown', keydown);
      reduced.removeEventListener('change', motion);
      window.removeEventListener('popstate', popstate);
    },
    { once: true },
  );
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) location.reload();
  });
}
