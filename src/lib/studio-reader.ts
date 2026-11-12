import { projectShowcaseView, projectView } from './world-config';
import { initProjectShowcase } from './studio-showcase';
import type { IslandProjectId as System } from './project-introductions';

export function initReader(
  root: HTMLElement,
  enter: (system: System) => void,
  reading: (open: boolean) => void,
) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-reader]')!;
  const panels = [...dialog.querySelectorAll<HTMLElement>('[data-view-panel]')];
  const scroll = dialog.querySelector<HTMLElement>('[data-reader-scroll]')!;
  const title = dialog.querySelector<HTMLElement>('[data-reader-title]')!;
  const showcases = new WeakMap<
    HTMLElement,
    ReturnType<typeof initProjectShowcase>
  >();
  let returnFocus: HTMLElement | null = null;
  let currentView = '';
  let currentAnchor = '';
  let transition = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  async function animate(element: HTMLElement, leaving = false) {
    element.getAnimations().forEach((animation) => animation.cancel());
    if (reduced.matches) return;
    await element
      .animate(
        leaving
          ? [
              { opacity: 1, transform: 'translateY(0)' },
              { opacity: 0, transform: 'translateY(12px)' },
            ]
          : [
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
        { duration: leaving ? 180 : 320, easing: 'cubic-bezier(.2,.7,.2,1)' },
      )
      .finished.catch(() => undefined);
  }

  // Content collections share heading names; namespace the copies inside the reader.
  panels.forEach((panel) => {
    const prefix = panel.dataset.viewPanel!;
    const ids = new Map<string, string>();
    panel.querySelectorAll<HTMLElement>('[id]').forEach((element) => {
      const old = element.id;
      element.id = `${prefix}-${old}`;
      ids.set(old, element.id);
    });
    for (const attribute of [
      'for',
      'aria-labelledby',
      'aria-describedby',
      'aria-controls',
    ]) {
      panel
        .querySelectorAll<HTMLElement>(`[${attribute}]`)
        .forEach((element) => {
          const names = element.getAttribute(attribute)!.split(/\s+/);
          element.setAttribute(
            attribute,
            names.map((name) => ids.get(name) ?? name).join(' '),
          );
        });
    }
    panel
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((link) => {
        const id = decodeURIComponent(link.hash.slice(1));
        if (ids.has(id)) link.hash = ids.get(id)!;
      });
  });

  function syncLinks() {
    root
      .querySelectorAll<HTMLAnchorElement>(
        '[data-world-locale], [data-reader-locale]',
      )
      .forEach((link) => {
        const url = new URL(link.href);
        url.search = location.search;
        link.href = url.href;
      });
  }

  function readerDepth() {
    return (
      (history.state?.studioReaderDepth as number | undefined) ??
      Number(Boolean(history.state?.studioReader))
    );
  }

  function resolve(view: string, anchor = '') {
    const showcase = projectShowcaseView(view);
    const base = showcase ? projectView(showcase.id) : view;
    const caseKey = showcase ? projectView(showcase.id, '-case') : base;
    const key =
      anchor && document.getElementById(`${caseKey}-${anchor}`)
        ? caseKey
        : base;
    return {
      panel: panels.find((panel) => panel.dataset.viewPanel === key),
      showcase,
    };
  }

  function show(view: string, persist = true, anchor = '') {
    const { panel, showcase } = resolve(view, anchor);
    if (!panel) return;
    transition++;
    const wasOpen = dialog.open;
    const changed = currentView !== view || currentAnchor !== anchor;
    dialog.getAnimations().forEach((animation) => animation.cancel());
    if (!dialog.open)
      returnFocus = document.activeElement as HTMLElement | null;
    const changedPanel = panel.hidden;
    if (showcase && panel.hasAttribute('data-project-showcase')) {
      let update = showcases.get(panel);
      if (!update) {
        update = initProjectShowcase(panel);
        showcases.set(panel, update);
      }
      update(showcase.area);
    }
    panels.forEach((other) => (other.hidden = other !== panel));
    title.textContent = panel.dataset.title ?? '';
    if (changed) scroll.scrollTop = 0;
    currentView = view;
    currentAnchor = anchor;
    if (persist && (changed || !wasOpen)) {
      const url = new URL(location.href);
      url.searchParams.set('view', view);
      if (anchor) url.searchParams.set('section', anchor);
      else url.searchParams.delete('section');
      const depth = readerDepth();
      if (!wasOpen || depth > 0)
        history.pushState(
          { ...history.state, studioReaderDepth: depth + 1 },
          '',
          url,
        );
      else history.replaceState(history.state, '', url);
    }
    if (!dialog.open) dialog.showModal();
    if (!wasOpen) void animate(dialog);
    else if (changed && changedPanel) {
      void animate(panel);
      const heading = panel.querySelector<HTMLElement>('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    if (anchor) {
      const target = document.getElementById(
        `${panel.dataset.viewPanel}-${anchor}`,
      );
      if (target && panel.contains(target)) {
        const detail = target.closest('details');
        if (detail) detail.open = true;
        target.scrollIntoView({ block: 'start' });
      }
    }
    reading(true);
    syncLinks();
  }
  async function hide() {
    const token = ++transition;
    await animate(dialog, true);
    if (token !== transition) return;
    dialog.close();
    currentView = '';
    currentAnchor = '';
    reading(false);
    if (
      returnFocus &&
      returnFocus !== document.body &&
      returnFocus.getClientRects().length
    ) {
      returnFocus.focus({ preventScroll: true });
    } else {
      const selected =
        root.dataset.renderer === 'loading'
          ? null
          : root.querySelector<HTMLElement>('[data-portal][aria-pressed=true]');
      (
        selected ?? root.querySelector<HTMLElement>('[data-menu-toggle]')
      )?.focus({ preventScroll: true });
    }
  }
  function close() {
    const depth = readerDepth();
    if (depth > 0) history.go(-depth);
    else {
      const url = new URL(location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('section');
      history.replaceState(history.state, '', url);
      void hide();
      syncLinks();
    }
  }
  function modifiedClick(event: MouseEvent) {
    return (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    );
  }
  root.querySelectorAll<HTMLElement>('[data-open]').forEach((button) =>
    button.addEventListener('click', (event) => {
      if (button instanceof HTMLAnchorElement && modifiedClick(event)) return;
      event.preventDefault();
      show(button.dataset.open!);
    }),
  );
  dialog.querySelector('[data-reader-close]')!.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      modifiedClick(event) ||
      !(event.target instanceof Element)
    )
      return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (
      !link ||
      link.hasAttribute('data-open') ||
      link.hasAttribute('data-reader-locale')
    )
      return;
    const target = new URL(link.href);
    if (target.origin !== location.origin) return;
    if (target.hash && target.pathname === location.pathname) {
      const destination = document.getElementById(
        decodeURIComponent(target.hash.slice(1)),
      );
      if (destination && dialog.contains(destination)) {
        event.preventDefault();
        destination.scrollIntoView({
          block: 'start',
          behavior: reduced.matches ? 'instant' : 'smooth',
        });
      }
      return;
    }
    const parts = target.pathname.split('/').filter(Boolean);
    let view = '';
    if (parts[1] === 'projects')
      view = parts[2] ? `project-${parts[2]}` : 'projects';
    else if (parts[1] === 'notes')
      view = parts[2] ? `note-${parts[2]}` : 'journal';
    else if (parts[1] === 'about' || parts[1] === 'contact') view = parts[1];
    if (view === 'about' && target.hash === '#skills') view = 'skills';
    if (view && resolve(view).panel) {
      event.preventDefault();
      show(view, true, decodeURIComponent(target.hash.slice(1)));
    }
  });
  dialog
    .querySelectorAll<HTMLAnchorElement>('a[href^="https:"]')
    .forEach((link) => {
      if (new URL(link.href).origin !== location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
  dialog
    .querySelectorAll<HTMLButtonElement>('[data-reader-share]')
    .forEach((button) =>
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          button.textContent =
            root.dataset.language === 'en' ? 'Link copied' : '已複製連結';
        } catch {
          const text = document.createElement('input');
          text.readOnly = true;
          text.value = location.href;
          text.setAttribute(
            'aria-label',
            root.dataset.language === 'en' ? 'Link to copy' : '可複製的連結',
          );
          button.after(text);
          text.focus();
          text.select();
        }
      }),
    );
  dialog
    .querySelectorAll<HTMLButtonElement>('[data-enter-world]')
    .forEach((button) =>
      button.addEventListener('click', () => {
        // Replace the current reader entry with the world it leads to.
        const url = new URL(location.href);
        url.searchParams.delete('view');
        url.searchParams.delete('section');
        history.replaceState(
          { ...history.state, studioReader: false, studioReaderDepth: 0 },
          '',
          url,
        );
        void hide().then(() => enter(button.dataset.enterWorld as System));
        syncLinks();
      }),
    );
  return {
    show,
    syncLinks,
    isOpen: () => dialog.open,
    restore() {
      const params = new URL(location.href).searchParams;
      const view = params.get('view');
      if (view && resolve(view, params.get('section') ?? '').panel)
        show(view, false, params.get('section') ?? '');
      else if (dialog.open) void hide();
      syncLinks();
    },
  };
}
