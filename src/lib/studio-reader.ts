import type { ProjectId as System } from './project-introductions';

export function initReader(
  root: HTMLElement,
  enter: (system: System) => void,
  reading: (open: boolean) => void,
) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-reader]')!;
  const panels = [...dialog.querySelectorAll<HTMLElement>('[data-view-panel]')];
  const scroll = dialog.querySelector<HTMLElement>('[data-reader-scroll]')!;
  const title = dialog.querySelector<HTMLElement>('[data-reader-title]')!;
  let returnFocus: HTMLElement | null = null;
  let currentView = '';
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

  function show(view: string, persist = true) {
    const panel = panels.find((panel) => panel.dataset.viewPanel === view);
    if (!panel) return;
    transition++;
    const wasOpen = dialog.open;
    const changed = currentView !== view;
    dialog.getAnimations().forEach((animation) => animation.cancel());
    if (!dialog.open)
      returnFocus = document.activeElement as HTMLElement | null;
    panels.forEach((other) => (other.hidden = other !== panel));
    title.textContent = panel.dataset.title ?? '';
    if (view !== currentView) scroll.scrollTop = 0;
    currentView = view;
    if (persist) {
      const url = new URL(location.href);
      url.searchParams.set('view', view);
      if (dialog.open) history.replaceState(history.state, '', url);
      else history.pushState({ ...history.state, studioReader: true }, '', url);
    }
    if (!dialog.open) dialog.showModal();
    if (!wasOpen) void animate(dialog);
    else if (changed) void animate(panel);
    root.querySelectorAll<HTMLElement>('[data-open]').forEach((button) => {
      if (button.closest('.world-dock')) {
        if (
          button.dataset.open === view ||
          (view.startsWith('project-') && button.dataset.open === 'projects') ||
          (view.startsWith('note-') && button.dataset.open === 'journal')
        )
          button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      }
    });
    reading(true);
    syncLinks();
  }
  async function hide() {
    const token = ++transition;
    await animate(dialog, true);
    if (token !== transition) return;
    dialog.close();
    currentView = '';
    reading(false);
    returnFocus?.focus({ preventScroll: true });
  }
  function close() {
    if (history.state?.studioReader) history.back();
    else {
      const url = new URL(location.href);
      url.searchParams.delete('view');
      history.replaceState(history.state, '', url);
      void hide();
      syncLinks();
    }
  }
  root.querySelectorAll<HTMLElement>('[data-open]').forEach((button) =>
    button.addEventListener('click', (event) => {
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
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (
      !link ||
      link.hasAttribute('data-open') ||
      link.hasAttribute('data-reader-locale') ||
      (link.hash && link.pathname === location.pathname)
    )
      return;
    const target = new URL(link.href);
    if (target.origin !== location.origin) return;
    const parts = target.pathname.split('/').filter(Boolean);
    let view = '';
    if (parts[1] === 'projects')
      view = parts[2] ? `project-${parts[2]}` : 'projects';
    else if (parts[1] === 'notes')
      view = parts[2] ? `note-${parts[2]}` : 'journal';
    else if (parts[1] === 'about' || parts[1] === 'contact') view = parts[1];
    if (view && panels.some((panel) => panel.dataset.viewPanel === view)) {
      event.preventDefault();
      show(view);
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
        history.replaceState(
          { ...history.state, studioReader: false },
          '',
          url,
        );
        void hide().then(() => enter(button.dataset.enterWorld as System));
        syncLinks();
      }),
    );
  dialog
    .querySelectorAll<HTMLAnchorElement>('[data-reader-anchor]')
    .forEach((link) =>
      link.addEventListener('click', (event) => {
        const destination = document.getElementById(
          decodeURIComponent(link.hash.slice(1)),
        );
        if (destination) {
          event.preventDefault();
          destination.scrollIntoView({
            block: 'start',
            behavior: reduced.matches ? 'instant' : 'smooth',
          });
        }
      }),
    );
  return {
    show,
    syncLinks,
    isOpen: () => dialog.open,
    restore() {
      const view = new URL(location.href).searchParams.get('view');
      if (view && panels.some((panel) => panel.dataset.viewPanel === view))
        show(view, false);
      else if (dialog.open) void hide();
      syncLinks();
    },
  };
}
