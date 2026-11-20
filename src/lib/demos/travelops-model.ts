// Browser-only, sequential teaching model; no database locks or real payments.
export const products = [
  {
    id: 'single',
    zh: '海岸館單館票',
    en: 'Coast venue ticket',
    price: 32000,
    stock: 4,
    venues: ['coast'],
  },
  {
    id: 'pass',
    zh: '山海雙館聯票',
    en: 'Mountain & coast pass',
    price: 58000,
    stock: 2,
    venues: ['coast', 'mountain'],
  },
] as const;
export type Channel = 'online' | 'pos';
export type Ticket = {
  id: string;
  venue: string;
  state: 'valid' | 'used' | 'revoked';
};
export type Order = {
  id: string;
  product: string;
  quantity: number;
  channel: Channel;
  amount: number;
  payment: 'pending' | 'paid' | 'refunded';
  issuance: 'waiting' | 'queued' | 'issued';
  refund: 'none' | 'requested' | 'processing' | 'confirmed';
  tickets: Ticket[];
};
export type LedgerRow = { reference: string; amount: number };
export type Difference = {
  reference: string;
  internal?: number;
  external?: number;
  kind: 'missing-external' | 'missing-internal' | 'amount';
};

export function reconcile(
  internal: readonly LedgerRow[],
  external: readonly LedgerRow[],
): Difference[] {
  return [
    ...new Set([...internal, ...external].map((row) => row.reference)),
  ].flatMap((reference) => {
    const a = internal.find((row) => row.reference === reference)?.amount;
    const b = external.find((row) => row.reference === reference)?.amount;
    if (a === b) return [];
    return [
      {
        reference,
        internal: a,
        external: b,
        kind:
          a === undefined
            ? 'missing-internal'
            : b === undefined
              ? 'missing-external'
              : 'amount',
      },
    ];
  });
}

export function createTravelDemo() {
  let stock: Record<string, number> = {};
  const orders: Order[] = [];
  const payments = new Map<string, string>();
  const events: string[] = [];
  const internal: LedgerRow[] = [];
  const external: LedgerRow[] = [];
  const resolutions: { reference: string; reason: string; run: number }[] = [];
  let run = 0;
  function reset(lastTicket = false) {
    stock = Object.fromEntries(
      products.map((p) => [p.id, lastTicket ? 1 : p.stock]),
    );
    orders.length = events.length = resolutions.length = 0;
    payments.clear();
    internal.splice(
      0,
      internal.length,
      { reference: 'DEMO-101', amount: 32000 },
      { reference: 'DEMO-102', amount: 58000 },
    );
    external.splice(
      0,
      external.length,
      { reference: 'DEMO-101', amount: 31000 },
      { reference: 'DEMO-103', amount: 32000 },
    );
    run = 0;
  }
  reset();
  function record(result: string) {
    events.unshift(result);
    return result;
  }
  return {
    orders,
    events,
    internal,
    external,
    resolutions,
    reset,
    get stock() {
      return { ...stock };
    },
    checkout(product: string, quantity: number, channel: Channel) {
      const item = products.find((p) => p.id === product);
      if (
        !item ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20 ||
        !['online', 'pos'].includes(channel)
      )
        return record('invalid');
      if (quantity > stock[product]!) return record('sold-out');
      stock[product]! -= quantity;
      const order: Order = {
        id: `ORDER-${orders.length + 1}`,
        product,
        quantity,
        channel,
        amount: item.price * quantity,
        payment: 'pending',
        issuance: 'waiting',
        refund: 'none',
        tickets: [],
      };
      orders.push(order);
      return record('reserved');
    },
    pay(id: string, event: string, amount: number) {
      const order = orders.find((o) => o.id === id);
      if (!order || !event.trim() || !Number.isSafeInteger(amount))
        return record('invalid');
      const payload = JSON.stringify([id, amount, 'TWD']);
      const prior = payments.get(event);
      if (prior)
        return record(prior === payload ? 'duplicate' : 'payload-conflict');
      if (amount !== order.amount) return record('amount-mismatch');
      if (order.payment !== 'pending') return record('payment-blocked');
      payments.set(event, payload);
      order.payment = 'paid';
      order.issuance = 'queued';
      internal.push({ reference: id, amount });
      external.push({ reference: id, amount });
      return record('paid');
    },
    issue(id: string) {
      const order = orders.find((o) => o.id === id);
      if (
        !order ||
        order.payment !== 'paid' ||
        order.issuance !== 'queued' ||
        order.refund !== 'none'
      )
        return record('issuance-blocked');
      const product = products.find((p) => p.id === order.product)!;
      order.tickets = Array.from({ length: order.quantity }, (_, i) =>
        product.venues.map((venue) => ({
          id: `${id}-${i + 1}-${venue}`,
          venue,
          state: 'valid' as const,
        })),
      ).flat();
      order.issuance = 'issued';
      return record('issued');
    },
    redeem(id: string, ticketId: string) {
      const order = orders.find((o) => o.id === id);
      const ticket = order?.tickets.find((t) => t.id === ticketId);
      if (
        !order ||
        !ticket ||
        ticket.state !== 'valid' ||
        order.payment !== 'paid' ||
        ['processing', 'confirmed'].includes(order.refund)
      )
        return record('redemption-blocked');
      ticket.state = 'used';
      return record('redeemed');
    },
    requestRefund(id: string) {
      const order = orders.find((o) => o.id === id);
      if (
        !order ||
        order.payment !== 'paid' ||
        order.issuance !== 'issued' ||
        order.refund !== 'none' ||
        order.tickets.some((t) => t.state === 'used')
      )
        return record('refund-blocked');
      order.refund = 'requested';
      return record('requested');
    },
    approveRefund(id: string) {
      const order = orders.find((o) => o.id === id);
      if (
        !order ||
        order.refund !== 'requested' ||
        order.tickets.some((t) => t.state === 'used')
      )
        return record('refund-blocked');
      order.refund = 'processing';
      return record('processing');
    },
    confirmRefund(id: string) {
      const order = orders.find((o) => o.id === id);
      if (!order || order.refund !== 'processing')
        return record('refund-blocked');
      order.refund = 'confirmed';
      order.payment = 'refunded';
      order.tickets.forEach((t) => (t.state = 'revoked'));
      stock[order.product]! += order.quantity;
      internal.push({ reference: `${id}-REFUND`, amount: -order.amount });
      external.push({ reference: `${id}-REFUND`, amount: -order.amount });
      return record('refunded');
    },
    reconcile() {
      run++;
      return reconcile(internal, external);
    },
    resolve(reference: string, reason: string) {
      if (
        !reason.trim() ||
        !reconcile(internal, external).some((d) => d.reference === reference)
      )
        return record('reason-required');
      resolutions.push({ reference, reason: reason.trim(), run });
      return record('recorded');
    },
  };
}
