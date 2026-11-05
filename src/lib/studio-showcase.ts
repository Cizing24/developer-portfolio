import { createAssetDemo, createBookingDemo } from './showcase-simulations';

function initBooking(form: HTMLFormElement) {
  const demo = createBookingDemo();
  const copy = JSON.parse(form.dataset.copy!) as Record<string, string>;
  const steps = [
    ...form.querySelectorAll<HTMLFieldSetElement>('[data-booking-step]'),
  ];
  const progress = form.querySelectorAll('ol li');
  const service = form.querySelector<HTMLSelectElement>('[name=service]')!;
  const date = form.querySelector<HTMLSelectElement>('[name=date]')!;
  const staff = form.querySelector<HTMLSelectElement>('[name=staff]')!;
  const time = form.querySelector<HTMLSelectElement>('[name=time]')!;
  const summary = form.querySelector<HTMLElement>('[data-booking-summary]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-booking-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-booking-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const status = form.querySelector<HTMLElement>('[data-demo-status]')!;
  let step = 0;

  function input() {
    return {
      service: service.value,
      date: date.value,
      staff: staff.value,
      time: time.value,
    };
  }
  function message(key: string, kind = 'error') {
    status.textContent = copy[key] ?? '';
    status.dataset.kind = kind;
  }
  function updateTimes() {
    const selected = time.value;
    const context = input();
    const slots = demo.slots(context);
    time.length = 1;
    for (const slot of slots) {
      const taken = demo.isTaken({ ...context, time: slot });
      time.add(new Option(taken ? `${slot} · ${copy.taken}` : slot, slot));
    }
    time.value = slots.includes(selected) ? selected : '';
    time.disabled = !slots.length;
    submit.disabled = !slots.length;
    summary.textContent = [service, date, staff]
      .map((field) => field.selectedOptions[0]?.text)
      .join(' · ');
    if (slots.length === 0) message('empty');
  }
  function go(index: number) {
    step = index;
    steps.forEach((group, i) => {
      group.hidden = i !== step;
      if (i === step) progress[i]?.setAttribute('aria-current', 'step');
      else progress[i]?.removeAttribute('aria-current');
    });
    back.hidden = step === 0;
    next.hidden = step === 2;
    submit.hidden = step !== 2;
    message('');
    if (step === 2) updateTimes();
    (
      steps[step]?.querySelector<HTMLSelectElement>('select:enabled') ?? back
    ).focus();
  }
  function forward() {
    if (step === 0 && !service.value) {
      message('service');
      service.focus();
    } else if (step === 1 && (!date.value || !staff.value)) {
      message('schedule');
      (!date.value ? date : staff).focus();
    } else go(step + 1);
  }
  next.addEventListener('click', forward);
  back.addEventListener('click', () => go(step - 1));
  form.addEventListener('change', (event) => {
    if (event.target !== time) time.value = '';
    message('');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (step < 2) {
      forward();
      return;
    }
    if (!time.value) {
      message(time.disabled ? 'empty' : 'slot');
      time.focus();
      return;
    }
    const result = demo.submit(input());
    if (result === 'confirmed') updateTimes();
    message(
      result === 'missing' ? 'slot' : result,
      result === 'confirmed' ? 'success' : 'error',
    );
  });
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    demo.reset();
    service.value = date.value = staff.value = time.value = '';
    go(0);
    message('reset', 'success');
  });
}

function initAsset(root: HTMLElement) {
  const demo = createAssetDemo();
  const copy = JSON.parse(root.dataset.copy!) as Record<string, string>;
  const rows = [
    ...root.querySelectorAll<HTMLTableRowElement>('[data-asset-row]'),
  ];
  const search = root.querySelector<HTMLInputElement>('[data-asset-search]')!;
  const filter = root.querySelector<HTMLSelectElement>('[data-asset-filter]')!;
  const empty = root.querySelector<HTMLElement>('[data-asset-empty]')!;
  const form = root.querySelector<HTMLFormElement>('[data-asset-form]')!;
  const action = form.querySelector<HTMLSelectElement>('[name=action]')!;
  const status = form.querySelector<HTMLElement>('[data-demo-status]')!;
  const audit = root.querySelector<HTMLOListElement>('[data-asset-audit]')!;
  const auditEmpty = root.querySelector<HTMLElement>(
    '[data-asset-audit-empty]',
  )!;
  const handover = root.querySelector<HTMLElement>('[data-handover-status]')!;
  const fields = root.querySelectorAll<HTMLElement>('[data-asset-extra]');
  let area = 'demo';

  function updateInventory() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    rows.forEach((row, index) => {
      const item = demo.assets[index]!;
      row.querySelector('[data-asset-status]')!.textContent =
        copy[item.status]!;
      row.querySelector('[data-asset-holder]')!.textContent = item.holder
        ? `${copy.employee} ${item.holder}`
        : copy.noHolder!;
      row.hidden =
        area === 'demo' &&
        (Boolean(filter.value && filter.value !== item.status) ||
          !row.textContent!.toLocaleLowerCase().includes(query));
      if (!row.hidden) visible++;
    });
    empty.hidden = visible > 0;
  }
  function updateAction() {
    fields.forEach(
      (field) => (field.hidden = field.dataset.assetExtra !== action.value),
    );
  }
  function updateHandover() {
    const next =
      copy[
        demo.assets.some(({ holder }) => holder === 'B') ? 'blocked' : 'cleared'
      ]!;
    if (handover.textContent !== next) handover.textContent = next;
  }
  function message(key: string, success = false) {
    status.textContent = copy[key] ?? '';
    status.dataset.kind = success ? 'success' : 'error';
  }
  search.addEventListener('input', updateInventory);
  filter.addEventListener('change', updateInventory);
  action.addEventListener('change', () => {
    updateAction();
    message('');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = demo.act(
      action.value as 'checkout' | 'checkin' | 'damaged',
      String(data.get('asset') ?? ''),
      String(data.get('employee') ?? ''),
      String(data.get('description') ?? ''),
    );
    message(result, result === 'updated');
    if (result !== 'updated') return;
    const change = demo.events[0]!;
    const item = document.createElement('li');
    item.textContent = [
      copy[change.action],
      change.asset,
      `${copy.employee} ${change.holder}`,
      copy[change.status],
      change.description,
    ]
      .filter(Boolean)
      .join(' · ');
    audit.prepend(item);
    auditEmpty.hidden = true;
    updateInventory();
    updateHandover();
  });
  form.addEventListener('reset', () => {
    demo.reset();
    audit.replaceChildren();
    auditEmpty.hidden = false;
    search.value = filter.value = '';
    updateInventory();
    updateHandover();
    message('reset', true);
    queueMicrotask(updateAction);
  });
  return (value: string) => {
    area = value;
    root.querySelectorAll<HTMLElement>('[data-asset-mode]').forEach((item) => {
      item.hidden = item.dataset.assetMode !== value;
    });
    updateInventory();
  };
}

export function initProjectShowcase(panel: HTMLElement) {
  const booking = panel.querySelector<HTMLFormElement>('[data-booking-demo]');
  if (booking) initBooking(booking);
  const asset = panel.querySelector<HTMLElement>('[data-asset-demo]');
  const updateAsset = asset ? initAsset(asset) : undefined;

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
