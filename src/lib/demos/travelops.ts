import { createTravelDemo, products, type Channel } from './travelops-model';

export function initTravelOps(root: HTMLElement) {
  const demo = createTravelDemo();
  const commands: { method: string; args: unknown[] }[] = [];
  const allowed = new Set([
    'checkout',
    'pay',
    'issue',
    'redeem',
    'requestRefund',
    'approveRefund',
    'confirmRefund',
    'resolve',
    'reset',
    'reconcile',
  ]);
  function execute(method: string, args: unknown[]) {
    if (!allowed.has(method) || args.length > 3) return '';
    if (
      method === 'checkout' &&
      !(
        typeof args[0] === 'string' &&
        typeof args[1] === 'number' &&
        ['online', 'pos'].includes(String(args[2]))
      )
    )
      return '';
    if (
      method === 'pay' &&
      !(
        typeof args[0] === 'string' &&
        typeof args[1] === 'string' &&
        typeof args[2] === 'number'
      )
    )
      return '';
    if (
      ['issue', 'requestRefund', 'approveRefund', 'confirmRefund'].includes(
        method,
      ) &&
      typeof args[0] !== 'string'
    )
      return '';
    if (
      ['redeem', 'resolve'].includes(method) &&
      !(typeof args[0] === 'string' && typeof args[1] === 'string')
    )
      return '';
    if (method === 'reset' && args.length && typeof args[0] !== 'boolean')
      return '';
    const result = Reflect.apply(
      Reflect.get(demo, method) as (...args: unknown[]) => unknown,
      demo,
      args,
    );
    if (method === 'reset') commands.length = 0;
    commands.push({ method, args });
    return result;
  }
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem('travelops-language') ?? 'null',
    );
    sessionStorage.removeItem('travelops-language');
    if (Array.isArray(saved) && saved.length <= 500)
      for (const command of saved) {
        if (
          command &&
          typeof command.method === 'string' &&
          Array.isArray(command.args)
        )
          execute(command.method, command.args);
      }
  } catch {
    /* Storage is optional; a fresh session remains operable. */
  }
  document
    .querySelectorAll('[data-reader-locale], [data-world-locale]')
    .forEach((link) =>
      link.addEventListener('click', () => {
        try {
          sessionStorage.setItem(
            'travelops-language',
            JSON.stringify(commands),
          );
        } catch {
          /* Private browsing may disable storage. */
        }
      }),
    );
  const en = root.dataset.locale === 'en';
  const t = (zh: string, english: string) => (en ? english : zh);
  const query = <T extends HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const checkout = query<HTMLFormElement>('[data-travel-checkout]');
  const select = query<HTMLSelectElement>('[data-travel-order]');
  const messages: Record<string, string> = {
    reserved: t(
      '已預留庫存並建立訂單。切換通路可測試共用庫存。',
      'Stock reserved and order created. Switch channels to test shared stock.',
    ),
    'sold-out': t(
      '庫存不足，未建立訂單。',
      'Insufficient stock. No order created.',
    ),
    invalid: t(
      '請確認商品與整數數量。',
      'Check the product and integer quantity.',
    ),
    paid: t(
      '付款已確認，開券工作已排入模擬佇列。',
      'Payment confirmed; issuance queued in local state.',
    ),
    duplicate: t(
      '相同通知已處理，未重複開券或扣庫存。',
      'Identical event already handled. No duplicate issuance or stock change.',
    ),
    'payload-conflict': t(
      '相同事件內容不同，拒絕處理。',
      'Same event with different contents rejected.',
    ),
    issued: t('已建立可核銷權益。', 'Redeemable entitlements created.'),
    redeemed: t(
      '權益已核銷，整筆退款將被拒絕。',
      'Entitlement used. Full refund will be blocked.',
    ),
    requested: t(
      '退款已申請，尚未核准。',
      'Refund requested; approval pending.',
    ),
    processing: t(
      '退款已核准，等待確認期間禁止核銷。',
      'Refund approved; redemption blocked while awaiting confirmation.',
    ),
    refunded: t(
      '退款確認，權益撤銷且庫存回補一次。',
      'Refund confirmed; entitlements revoked and stock restored once.',
    ),
    recorded: t(
      '已新增處置原因，帳冊與差異未改寫。',
      'Disposition recorded. Ledger facts and differences unchanged.',
    ),
    'refund-blocked': t(
      '當前狀態不允許退款。請檢查核銷或退款進度。',
      'Refund blocked by current redemption or refund state.',
    ),
    'redemption-blocked': t(
      '此權益不可核銷，請檢查退款與使用狀態。',
      'Redemption blocked. Check refund and entitlement state.',
    ),
    'issuance-blocked': t(
      '目前不可開券，請先確認付款，且不可重複開券。',
      'Issuance blocked. Confirm payment first; tickets cannot be issued twice.',
    ),
  };
  function list(selector: string, lines: string[]) {
    query(selector).replaceChildren(
      ...lines.map((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        return li;
      }),
    );
  }
  function render(result = '') {
    query('[data-travel-stock]').textContent = products
      .map((p) => `${en ? p.en : p.zh}: ${demo.stock[p.id]}`)
      .join(' · ');
    const value = select.value;
    select.replaceChildren(
      ...demo.orders.map(
        (o) =>
          new Option(`${o.id} · ${o.channel} · NT$ ${o.amount / 100}`, o.id),
      ),
    );
    select.value = demo.orders.some((o) => o.id === value)
      ? value
      : (demo.orders.at(-1)?.id ?? '');
    const order = demo.orders.find((o) => o.id === select.value);
    const state = query('[data-travel-order-state]');
    state.replaceChildren();
    if (order)
      for (const [name, value] of [
        [t('付款', 'Payment'), order.payment],
        [t('開券', 'Issuance'), order.issuance],
        [t('退款', 'Refund'), order.refund],
      ]) {
        const dt = document.createElement('dt'),
          dd = document.createElement('dd');
        dt.textContent = name!;
        dd.textContent = value!;
        state.append(dt, dd);
      }
    const tickets = query('[data-travel-tickets]');
    tickets.replaceChildren();
    order?.tickets.forEach((ticket) => {
      const li = document.createElement('li');
      li.textContent = `${ticket.id} · ${ticket.state} `;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = t('模擬核銷', 'Redeem');
      button.addEventListener('click', () => {
        render(execute('redeem', [order.id, ticket.id]) as string);
        root
          .querySelectorAll<HTMLButtonElement>('[data-travel-tickets] button')
          [order.tickets.indexOf(ticket)]?.focus();
      });
      li.append(button);
      tickets.append(li);
    });
    query('[data-travel-ledgers]').textContent =
      `${t('內部帳冊', 'Internal ledger')}: ${demo.internal.map((r) => `${r.reference} = ${r.amount}`).join(' · ')}\n${t('外部帳冊', 'External ledger')}: ${demo.external.map((r) => `${r.reference} = ${r.amount}`).join(' · ')}`;
    list(
      '[data-travel-resolutions]',
      demo.resolutions.map((r) => `${r.reference}: ${r.reason} (run ${r.run})`),
    );
    list(
      '[data-travel-events]',
      demo.events.map((e) => messages[e] ?? e),
    );
    if (result)
      query('[data-travel-status]').textContent = messages[result] ?? result;
  }
  checkout.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(checkout);
    select.value = '';
    render(
      execute('checkout', [
        String(data.get('product')),
        Number(data.get('quantity')),
        String(data.get('channel')) as Channel,
      ]) as string,
    );
  });
  select.addEventListener('change', () => render());
  root
    .querySelectorAll<HTMLButtonElement>('[data-travel-action]')
    .forEach((button) =>
      button.addEventListener('click', () => {
        const order = demo.orders.find((o) => o.id === select.value);
        const action = button.dataset.travelAction;
        if (action === 'last' || action === 'reset') {
          execute('reset', [action === 'last']);
          list('[data-travel-differences]', []);
          render(t('狀態已重設。', 'State reset.'));
          return;
        }
        if (action === 'reconcile') {
          list(
            '[data-travel-differences]',
            (execute('reconcile', []) as ReturnType<typeof demo.reconcile>).map(
              (d) =>
                `${d.reference} · ${d.kind} · ${d.internal ?? '—'} / ${d.external ?? '—'}`,
            ),
          );
          render(
            t(
              '對帳完成；差異依帳冊原始事實計算。',
              'Reconciled against original ledger facts.',
            ),
          );
          return;
        }
        if (!order) {
          render(t('請先建立訂單。', 'Create an order first.'));
          return;
        }
        let result = '';
        if (action === 'pay' || action === 'conflict')
          result = execute('pay', [
            order.id,
            `PAY-${order.id}`,
            order.amount + (action === 'conflict' ? 1 : 0),
          ]) as string;
        if (action === 'issue') result = execute('issue', [order.id]) as string;
        if (action === 'request')
          result = execute('requestRefund', [order.id]) as string;
        if (action === 'approve')
          result = execute('approveRefund', [order.id]) as string;
        if (action === 'confirm')
          result = execute('confirmRefund', [order.id]) as string;
        render(result);
      }),
    );
  query<HTMLFormElement>('[data-travel-resolution]').addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget as HTMLFormElement);
      render(
        execute('resolve', [
          String(data.get('reference')),
          String(data.get('reason')),
        ]) as string,
      );
    },
  );
  render();
}
