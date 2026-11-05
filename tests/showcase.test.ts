import { expect, it } from 'vitest';
import {
  bookingDates,
  createAssetDemo,
  createBookingDemo,
} from '../src/lib/showcase-simulations';
import { islandItems, projectShowcaseView } from '../src/lib/world-config';

it('updates availability, rejects duplicate reservations and resets booking state', () => {
  const demo = createBookingDemo();
  const input = {
    date: bookingDates[0]!,
    service: 'consult',
    staff: 'north',
    time: '10:00',
  };
  expect(demo.slots({ ...input, date: bookingDates[2]! })).toEqual([]);
  expect(demo.submit({ ...input, service: '' })).toBe('missing');
  expect(demo.submit(input)).toBe('confirmed');
  expect(demo.isTaken({ ...input, service: 'session' })).toBe(true);
  expect(demo.submit({ ...input, service: 'session' })).toBe('conflict');
  expect(demo.slots({ ...input, staff: 'south' })).toEqual(['14:00']);
  demo.reset();
  expect(demo.isTaken(input)).toBe(false);
  expect(demo.submit(input)).toBe('confirmed');
});

it('validates asset transitions and clears all changes on reset', () => {
  const demo = createAssetDemo();
  expect(demo.act('checkout', 'LT-104', 'B', '')).toBe('offboardingEmployee');
  expect(demo.act('checkout', 'LT-104', 'A', '')).toBe('updated');
  expect(demo.act('checkout', 'LT-104', 'A', '')).toBe('unavailable');
  expect(demo.act('checkin', 'LT-104', '', '')).toBe('updated');
  expect(demo.assets[0]).toMatchObject({ status: 'available', holder: '' });
  expect(demo.act('damaged', 'DT-207', '', '   ')).toBe('descriptionRequired');
  expect(demo.act('damaged', 'DT-207', '', 'Screen cracked')).toBe('updated');
  expect(demo.assets[1]).toMatchObject({ status: 'maintenance', holder: '' });
  expect(demo.act('checkin', 'DT-207', '', '')).toBe('notAssigned');
  expect(demo.events).toHaveLength(3);
  expect(demo.events[0]).toMatchObject({
    holder: 'B',
    description: 'Screen cracked',
  });
  demo.reset();
  expect(demo.events).toEqual([]);
  expect(demo.assets[1]).toMatchObject({ status: 'assigned', holder: 'B' });
});

it('routes the shared facilities and both legacy topic aliases', () => {
  for (const id of ['bookflow', 'assetflow'] as const) {
    expect(
      islandItems(id, 'en').map(({ view }) => projectShowcaseView(view)),
    ).toEqual(
      ['demo', 'secondary', 'architecture'].map((area) => ({ id, area })),
    );
    expect(projectShowcaseView(`project-${id}-purpose`)).toEqual({
      id,
      area: 'demo',
    });
    expect(projectShowcaseView(`project-${id}-features`)).toEqual({
      id,
      area: 'secondary',
    });
  }
});
