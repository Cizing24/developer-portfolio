import { loadDemo } from './demos/load';
export function initProjectShowcase(panel: HTMLElement) {
  let updateAsset: ((value: string) => void) | undefined;
  let currentArea = 'demo';
  const booking = panel.querySelector<HTMLFormElement>('[data-booking-demo]');
  if (booking)
    loadDemo(booking, async () => {
      const { initBooking } = await import('./demos/bookflow');
      initBooking(booking);
    });
  const asset = panel.querySelector<HTMLElement>('[data-asset-demo]');
  if (asset)
    loadDemo(asset, async () => {
      const { initAsset } = await import('./demos/assetflow');
      updateAsset = initAsset(asset);
      updateAsset(currentArea);
    });

  const guide = panel.querySelector<HTMLElement>('[data-calendar-guide]');
  if (guide) {
    const steps = [...guide.querySelectorAll<HTMLElement>('[data-guide-step]')];
    const controls = [
      ...guide.querySelectorAll<HTMLButtonElement>('[data-guide-move]'),
    ];
    let index = 0;
    controls.forEach((control) =>
      control.addEventListener('click', () => {
        const move = Number(control.dataset.guideMove);
        index =
          move === 0
            ? 0
            : Math.max(0, Math.min(steps.length - 1, index + move));
        steps.forEach((step, i) => (step.hidden = i !== index));
        controls[0]!.disabled = index === 0;
        controls[1]!.disabled = index === steps.length - 1;
        if (control.disabled)
          steps[index]?.querySelector('h4')?.focus({ preventScroll: true });
      }),
    );
  }
  panel
    .querySelectorAll<HTMLImageElement>('.workflow-screens img')
    .forEach((image) => {
      function unavailable() {
        image.hidden = true;
        const fallback =
          image.parentElement?.querySelector<HTMLElement>('[data-shot-error]');
        if (fallback) fallback.hidden = false;
      }
      image.addEventListener('error', unavailable, { once: true });
      if (image.complete && image.currentSrc && !image.naturalWidth)
        unavailable();
    });
  return (area: string) => {
    currentArea = area;
    const region = area === 'secondary' ? 'demo' : area;
    panel
      .querySelectorAll<HTMLElement>('[data-showcase-region]')
      .forEach((item) => {
        item.hidden = !item.dataset.showcaseRegion!.split(' ').includes(area);
      });
    panel
      .querySelectorAll<HTMLElement>('[data-showcase-subnav]')
      .forEach((item) => {
        item.hidden = region !== 'demo';
      });
    panel
      .querySelectorAll<HTMLAnchorElement>(
        '[data-showcase-tab], [data-showcase-mode]',
      )
      .forEach((link) => {
        const current =
          link.dataset.showcaseTab === region ||
          link.dataset.showcaseMode === area;
        if (current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    if (region === 'demo') updateAsset?.(area);
  };
}
