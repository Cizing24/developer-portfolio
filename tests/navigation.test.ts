import { describe, expect, it } from 'vitest';
import {
  createNavigation,
  createPedestrian,
  segmentDistance,
} from '../src/lib/navigation';
import {
  islandLayout,
  createWorldDomain,
  createSeaDomain,
  bridgePairs,
  bridgeDecks,
} from '../src/lib/world-map';

describe.each([false, true])('world navigation, portrait=%s', (portrait) => {
  it('shares both deck edges at the project-island bends', () => {
    const decks = bridgeDecks(islandLayout(portrait));
    for (const deck of decks.slice(0, 2)) {
      expect(deck.points).toHaveLength(3);
      expect(deck.outline).toHaveLength(6);
      for (const side of [deck.left, deck.right])
        expect(
          Math.hypot(
            side[1]!.x - deck.points[1]!.x,
            side[1]!.z - deck.points[1]!.z,
          ),
        ).toBeLessThan(1.2);
    }
  });
  it('connects every main island by walkable bridges and leaves the harbor island isolated', () => {
    const centers = islandLayout(portrait);
    const nav = createNavigation(createWorldDomain(centers), 0.17);
    const start = nav.nearest(centers.portfolio);
    for (const id of [
      'bookflow',
      'assetflow',
      'journal',
      'contact',
      'about',
    ] as const) {
      const route = nav.route(start, nav.nearest(centers[id]));
      expect(route.length, id).toBeGreaterThan(2);
      for (let i = 1; i < route.length; i++)
        expect(
          nav.validSegment(nav.nodes[route[i - 1]!]!, nav.nodes[route[i]!]!),
        ).toBe(true);
    }
    expect(nav.route(start, nav.nearest(centers.zailongchang))).toEqual([]);
    expect(bridgePairs.flat().includes('zailongchang')).toBe(false);
  }, 20000);

  it('gives the larger CIZING avatar a clear route across a bridge', () => {
    const centers = islandLayout(portrait);
    const nav = createNavigation(createWorldDomain(centers), 0.4);
    const from = nav.nearest(centers.about),
      to = nav.nearest(centers.portfolio);
    expect(nav.route(from, to).length).toBeGreaterThan(3);
    const person = createPedestrian(nav, from, 0.55, () => 0.2);
    person.goTo(to);
    for (let i = 0; i < 18000 && !person.arrived; i++) {
      person.update(1 / 30, []);
      expect(nav.domain.contains(person.position, person.radius)).toBe(true);
    }
    expect(
      person.arrived,
      JSON.stringify({
        position: person.position,
        distance: person.distance,
        target: nav.nodes[to],
      }),
    ).toBe(true);
    expect(person.distance).toBeGreaterThan(3);
  }, 20000);

  it('allows a boat to reach the harbor while keeping it away from land', () => {
    const centers = islandLayout(portrait);
    const nav = createNavigation(createSeaDomain(centers), 0.55, 0.4);
    const dock = { x: centers.zailongchang.x + 6.5, z: centers.zailongchang.z };
    const to = nav.nearest(dock);
    const route = nav.route(nav.nearest({ x: -18, z: -12 }), to);
    expect(route.length).toBeGreaterThan(2);
    for (const index of route)
      expect(nav.domain.contains(nav.nodes[index]!, 0.55)).toBe(true);
    expect(
      Math.hypot(nav.nodes[to]!.x - dock.x, nav.nodes[to]!.z - dock.z),
    ).toBeLessThan(0.6);
  }, 20000);
});

it('checks swept collisions so moving people cannot pass through each other', () => {
  const nav = createNavigation(
    {
      contains: ({ x, z }, r) => Math.abs(x) <= 3 - r && Math.abs(z) <= 1 - r,
      height: () => 0,
    },
    0.2,
  );
  const person = createPedestrian(
    nav,
    nav.nearest({ x: -2, z: 0 }),
    1,
    () => 0,
  );
  person.goTo(nav.nearest({ x: 2, z: 0 }));
  const peer = { position: { x: 0, z: 0 }, radius: 0.4 };
  let previous = { ...person.position };
  for (let i = 0; i < 300; i++) {
    person.update(1 / 30, [peer]);
    expect(
      segmentDistance(peer.position, previous, person.position),
    ).toBeGreaterThanOrEqual(0.625 - 1e-8);
    previous = { ...person.position };
  }
  expect(person.position.x).toBeLessThan(0);
});

it('keeps a group of pedestrians separated from one another and from scenery over a minute', () => {
  const centers = islandLayout(false);
  const nav = createNavigation(createWorldDomain(centers), 0.17);
  let seed = 128;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const people: ReturnType<typeof createPedestrian>[] = [];
  for (const id of (
    [
      'about',
      'portfolio',
      'journal',
      'contact',
      'bookflow',
      'assetflow',
      'zailongchang',
    ] as const
  ).flatMap((id) => Array.from({ length: id === 'about' ? 2 : 4 }, () => id))) {
    const start = nav.nearest(centers[id], (n) =>
      people.every(
        (p) => Math.hypot(n.x - p.position.x, n.z - p.position.z) > 0.6,
      ),
    );
    const local = nav.nodes.flatMap((node, index) =>
      Math.hypot(node.x - centers[id].x, node.z - centers[id].z) < 2.3
        ? [index]
        : [],
    );
    const person = createPedestrian(nav, start, 0.5, random, local);
    if (id !== 'zailongchang')
      person.goTo(nav.nearest(centers[id === 'about' ? 'contact' : 'about']));
    people.push(person);
  }
  let before: number[] = [];
  for (let i = 0; i < 1800; i++) {
    if (i === 1200) before = people.map((p) => p.distance);
    people.forEach((person) => person.update(1 / 30, people));
    people.forEach((person, a) => {
      expect(nav.domain.contains(person.position, person.radius)).toBe(true);
      people
        .slice(a + 1)
        .forEach((other) =>
          expect(
            Math.hypot(
              person.position.x - other.position.x,
              person.position.z - other.position.z,
            ),
          ).toBeGreaterThanOrEqual(0.365 - 1e-8),
        );
    });
  }
  expect(people.reduce((sum, p) => sum + p.distance, 0)).toBeGreaterThan(20);
  people.forEach((p, i) =>
    expect(
      p.distance - before[i]!,
      `person ${i} should keep making progress`,
    ).toBeGreaterThan(0.2),
  );
}, 40000);

it('lets oncoming groups find room to pass without overlaps or a persistent queue', () => {
  const nav = createNavigation(
    {
      contains: ({ x, z }, r) => Math.abs(x) < 4 - r && Math.abs(z) < 1.2 - r,
      height: () => 0,
    },
    0.17,
  );
  let seed = 17;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const people = [-1, 1].flatMap((side) =>
    [0, 1, 2].map((i) => {
      const person = createPedestrian(
        nav,
        nav.nearest({ x: side * (2 + i * 0.48), z: 0 }),
        0.6,
        random,
      );
      person.goTo(nav.nearest({ x: -side * 3, z: 0 }));
      return { person, side, crossed: false };
    }),
  );
  for (let frame = 0; frame < 1800; frame++) {
    people.forEach(({ person }) =>
      person.update(
        1 / 30,
        people.map((p) => p.person),
      ),
    );
    people.forEach((entry, i) => {
      if (entry.person.position.x * entry.side < -1) entry.crossed = true;
      for (const other of people.slice(i + 1))
        expect(
          Math.hypot(
            entry.person.position.x - other.person.position.x,
            entry.person.position.z - other.person.position.z,
          ),
        ).toBeGreaterThanOrEqual(0.365 - 1e-8);
    });
    if (people.every((entry) => entry.crossed)) break;
  }
  expect(people.map((entry) => entry.crossed)).toEqual(Array(6).fill(true));
}, 20000);
