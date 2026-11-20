import { describe, expect, it } from 'vitest';
import { createTravelDemo, reconcile } from '../src/lib/demos/travelops-model';

function issued() {
  const demo = createTravelDemo();
  demo.checkout('pass', 1, 'online');
  demo.pay('ORDER-1', 'EVENT-1', 58000);
  demo.issue('ORDER-1');
  return demo;
}
describe('TravelOps browser model', () => {
  it.each(['online', 'pos'] as const)(
    'last ticket: %s reserves first',
    (channel) => {
      const d = createTravelDemo();
      d.reset(true);
      expect(d.checkout('single', 1, channel)).toBe('reserved');
      expect(
        d.checkout('single', 1, channel === 'online' ? 'pos' : 'online'),
      ).toBe('sold-out');
      expect(d.stock.single).toBe(0);
      expect(d.orders).toHaveLength(1);
    },
  );
  it('validates quantities without changing stock', () => {
    const d = createTravelDemo();
    for (const q of [0, -1, 1.5, NaN, Infinity, 21])
      expect(d.checkout('single', q, 'online')).toBe('invalid');
    expect(d.stock.single).toBe(4);
  });
  it('deduplicates payment and rejects conflicting contents and wrong amounts', () => {
    const d = createTravelDemo();
    d.checkout('single', 2, 'pos');
    expect(d.pay('ORDER-1', 'E', 1)).toBe('amount-mismatch');
    expect(d.pay('ORDER-1', 'E', 64000)).toBe('paid');
    expect(d.pay('ORDER-1', 'E', 64000)).toBe('duplicate');
    expect(d.pay('ORDER-1', 'E', 32000)).toBe('payload-conflict');
    expect(d.issue('ORDER-1')).toBe('issued');
    expect(d.issue('ORDER-1')).toBe('issuance-blocked');
    expect(d.orders[0]!.tickets).toHaveLength(2);
  });
  it('blocks use during approved refund and restores stock exactly once', () => {
    const d = issued(),
      ticket = d.orders[0]!.tickets[0]!.id;
    expect(d.requestRefund('ORDER-1')).toBe('requested');
    expect(d.approveRefund('ORDER-1')).toBe('processing');
    expect(d.redeem('ORDER-1', ticket)).toBe('redemption-blocked');
    expect(d.stock.pass).toBe(1);
    expect(d.confirmRefund('ORDER-1')).toBe('refunded');
    expect(d.confirmRefund('ORDER-1')).toBe('refund-blocked');
    expect(d.stock.pass).toBe(2);
    expect(d.orders[0]!.tickets.every((t) => t.state === 'revoked')).toBe(true);
  });
  it('rechecks used entitlements at approval, including use after request', () => {
    const d = issued();
    d.requestRefund('ORDER-1');
    expect(d.redeem('ORDER-1', d.orders[0]!.tickets[0]!.id)).toBe('redeemed');
    expect(d.approveRefund('ORDER-1')).toBe('refund-blocked');
    const other = issued();
    other.redeem('ORDER-1', other.orders[0]!.tickets[1]!.id);
    expect(other.requestRefund('ORDER-1')).toBe('refund-blocked');
  });
  it('keeps ledger facts and differences intact after disposition and reruns', () => {
    const d = createTravelDemo(),
      before = JSON.stringify([d.internal, d.external]);
    const differences = d.reconcile();
    expect(differences).toHaveLength(3);
    expect(d.resolve('DEMO-101', '')).toBe('reason-required');
    expect(d.resolve('DEMO-101', 'Contact provider')).toBe('recorded');
    expect(d.reconcile()).toEqual(differences);
    expect(JSON.stringify([d.internal, d.external])).toBe(before);
    expect(reconcile([{ reference: 'X', amount: 0 }], [])).toEqual([
      {
        reference: 'X',
        internal: 0,
        external: undefined,
        kind: 'missing-external',
      },
    ]);
    d.reset();
    expect(d.orders).toEqual([]);
    expect(d.resolutions).toEqual([]);
  });
});
