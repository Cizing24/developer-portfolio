import { takeLanguageState, keepOnLanguageChange } from './language-state';
import { createAssetDemo } from './assetflow-model';
export function initAsset(root: HTMLElement) {
  const demo = createAssetDemo();
  const saved = takeLanguageState('assetflow-language');
  if (Array.isArray(saved) && saved.length < 100)
    for (const event of saved.toReversed()) {
      if (
        event &&
        ['checkout', 'checkin', 'damaged'].includes(event.action) &&
        ['asset', 'holder', 'description'].every(
          (key) => typeof event[key] === 'string',
        )
      )
        demo.act(event.action, event.asset, event.holder, event.description);
    }
  keepOnLanguageChange('assetflow-language', () => demo.events);
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
  for (const change of demo.events) {
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
    audit.append(item);
  }
  auditEmpty.hidden = demo.events.length > 0;
  updateHandover();
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
