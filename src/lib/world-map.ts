import type { IslandId } from './world-config';
import { segmentDistance, type NavigationDomain } from './navigation';
import type { Point } from './wander';

export const bridgePairs: [IslandId, IslandId][] = [
  ['portfolio', 'bookflow'],
  ['portfolio', 'assetflow'],
  ['portfolio', 'journal'],
  ['portfolio', 'contact'],
  ['portfolio', 'about'],
];
export const islandScale = (id: IslandId) =>
  id === 'bookflow' || id === 'assetflow'
    ? 0.64
    : id === 'zailongchang'
      ? 1.35
      : 1;
export const islandRadii = (id: IslandId): [number, number] =>
  id === 'bookflow' || id === 'assetflow'
    ? [4.05, 2.58]
    : id === 'zailongchang'
      ? [3.8, 3.8]
      : id === 'portfolio'
        ? [3.55, 3.55]
        : id === 'journal'
          ? [3.4, 3.4]
          : [2.8, 2.8];
export const reefIslands = [
  { x: -19, z: -7, r: 1.4 },
  { x: -18, z: 7, r: 1.6 },
  { x: -12, z: 19, r: 1.3 },
  { x: 15, z: -12, r: 1.5 },
  { x: 22, z: 16, r: 1.4 },
  { x: -20, z: 20, r: 1.7 },
];
export function islandLayout(portrait: boolean): Record<IslandId, Point> {
  const values: Record<IslandId, [number, number]> = portrait
    ? {
        portfolio: [0, 0],
        about: [0, -9.5],
        bookflow: [-9.2, 0],
        assetflow: [9.2, 0],
        journal: [-6.8, 9],
        contact: [6.8, 9],
        zailongchang: [0, 20],
      }
    : {
        portfolio: [0, 0],
        bookflow: [-9.5, -3.2],
        assetflow: [9.5, -3.2],
        journal: [-7.2, 8.5],
        contact: [6.8, 8],
        about: [0, -9.5],
        zailongchang: [15.5, 6],
      };
  return Object.fromEntries(
    Object.entries(values).map(([id, [x, z]]) => [id, { x, z }]),
  ) as Record<IslandId, Point>;
}
const rects: Partial<Record<IslandId, [number, number, number, number][]>> = {
  portfolio: [[0, 0, 1.72, 1.32]],
  journal: [[0, 0, 1.58, 0.7]],
  contact: [[0, 0, 1.25, 1]],
  about: [[1, 0.7, 1.05, 0.65]],
  zailongchang: [
    [0, -0.5, 1.3, 0.95],
    [-1.7, -1, 0.55, 0.7],
  ],
};
export function bridgeRoutes(centers: Record<IslandId, Point>) {
  return bridgePairs.flatMap(
    ([a, b]): {
      from: Point;
      to: Point;
      fromIsland?: IslandId;
      toIsland?: IslandId;
    }[] => {
      if (b === 'bookflow' || b === 'assetflow') {
        const via = {
          x: centers[b].x + (centers[a].x > centers[b].x ? 5.2 : -5.2),
          z: centers[b].z,
        };
        return [
          { from: centers[a], to: via, fromIsland: a },
          { from: via, to: centers[b], toIsland: b },
        ];
      }
      return [{ from: centers[a], to: centers[b], fromIsland: a, toIsland: b }];
    },
  );
}
export function createWorldDomain(
  centers: Record<IslandId, Point>,
): NavigationDomain {
  const ids = Object.keys(centers) as IslandId[];
  const routes = bridgeRoutes(centers);
  function onIsland(p: Point, id: IslandId, radius: number) {
    const c = centers[id],
      [rx, rz] = islandRadii(id);
    return (
      Math.hypot((p.x - c.x) / (rx - radius), (p.z - c.z) / (rz - radius)) <= 1
    );
  }
  function onBridge(p: Point, radius: number) {
    return routes.some(
      ({ from, to }) => segmentDistance(p, from, to) <= 0.78 - radius,
    );
  }
  function blocked(p: Point, id: IslandId, radius: number) {
    const c = centers[id],
      scale = islandScale(id);
    const x = (p.x - c.x) / scale,
      z = (p.z - c.z) / scale,
      r = radius / scale;
    if (Math.abs(x) > 7 + r || Math.abs(z) > 5 + r) return false;
    if (
      (rects[id] ?? []).some(
        ([cx, cz, w, d]) =>
          Math.hypot(
            Math.max(0, Math.abs(x - cx) - w),
            Math.max(0, Math.abs(z - cz) - d),
          ) < r,
      )
    )
      return true;
    if (id === 'bookflow' || id === 'assetflow') {
      if (
        [-4, 0, 4].some((cx) =>
          [-1.65, 1.7].some((cz) => Math.hypot(x - cx, z - cz) < 1.25 + r),
        )
      )
        return true;
      if (Math.abs(x) < 4.8 && z < -2.5 && z > -4.5) return true; // Rocky northern ridge.
      for (let i = 1; i < 22; i++) {
        if (i === 11) continue;
        const angle = (i / 22) * Math.PI * 2;
        const size = 0.65 + (i % 4) * 0.15;
        if (
          Math.hypot(x - Math.cos(angle) * 5.8, z - Math.sin(angle) * 3.6) <
          0.4 * size + r
        )
          return true;
      }
      if (
        [
          [-5.6, -2.4],
          [-4.9, -2.7],
          [4.9, -2.8],
          [5.5, -2.2],
          [-5.5, 2.5],
          [5.5, 2.5],
        ].some(([cx, cz]) => Math.hypot(x - cx!, z - cz!) < 0.45 + r)
      )
        return true;
    } else {
      const treeRadius =
        id === 'portfolio' ? 3.65 : id === 'journal' ? 3.5 : 2.85;
      for (let i = 0; i < 4; i++) {
        const angle = Math.PI / 4 + (i / 4) * Math.PI * 2;
        if (
          !isAccessLane(
            id,
            Math.cos(angle) * treeRadius,
            Math.sin(angle) * treeRadius,
          ) &&
          Math.hypot(
            x - Math.cos(angle) * treeRadius,
            z - Math.sin(angle) * treeRadius,
          ) <
            0.32 + r
        )
          return true;
      }
    }
    if (id === 'contact' && Math.hypot(x - 1.8, z + 0.5) < r + 0.15)
      return true;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const project = id === 'bookflow' || id === 'assetflow';
      const radius = project
        ? 5.5
        : id === 'portfolio'
          ? 3.85
          : id === 'journal'
            ? 3.7
            : 3.05;
      if (
        !isAccessLane(
          id,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * (project ? 0.61 : 1),
        ) &&
        Math.hypot(
          x - Math.cos(angle) * radius,
          z - Math.sin(angle) * radius * (project ? 0.61 : 1),
        ) <
          r + 0.12
      )
        return true;
    }
    return false;
  }
  return {
    contains(p, radius) {
      if (!ids.some((id) => onIsland(p, id, radius)) && !onBridge(p, radius))
        return false;
      return !ids.some((id) => blocked(p, id, radius));
    },
    height(p) {
      const project = (['bookflow', 'assetflow'] as const).find((id) =>
        onIsland(p, id, 0),
      );
      return project
        ? -0.1
        : onBridge(p, 0.2) && !ids.some((id) => onIsland(p, id, 0.1))
          ? 0.015
          : 0.025;
    },
  };
}

const accessLayouts = [false, true].map((portrait) => {
  const centers = islandLayout(portrait);
  return { centers, routes: bridgeRoutes(centers) };
});
const accessCache = new Map<string, boolean>();
export function isAccessLane(id: IslandId, x: number, z: number) {
  const key = `${id}:${x}:${z}`;
  if (accessCache.has(key)) return accessCache.get(key)!;
  const clear = accessLayouts.some(({ centers, routes }) => {
    const scale = islandScale(id);
    const point = {
      x: centers[id].x + x * scale,
      z: centers[id].z + z * scale,
    };
    return routes.some(
      ({ from, to }) => segmentDistance(point, from, to) < 1.15,
    );
  });
  accessCache.set(key, clear);
  return clear;
}

export function createSeaDomain(
  centers: Record<IslandId, Point>,
): NavigationDomain {
  return {
    contains(p, radius) {
      if (
        Math.abs(p.x) > 23 - radius ||
        p.z < -15 + radius ||
        p.z > 24 - radius
      )
        return false;
      if (
        reefIslands.some(
          (reef) =>
            Math.hypot(p.x - reef.x, p.z - reef.z) < reef.r + radius + 0.4,
        )
      )
        return false;
      const harbor = centers.zailongchang;
      if (
        [-0.945, 0.945].some(
          (z) =>
            Math.hypot(
              Math.max(3.24 - (p.x - harbor.x), 0, p.x - harbor.x - 5.67),
              Math.max(0, Math.abs(p.z - harbor.z - z) - 0.2025),
            ) < radius,
        )
      )
        return false;
      return !(Object.keys(centers) as IslandId[]).some((id) => {
        const c = centers[id],
          [rx, rz] = islandRadii(id);
        return (
          Math.hypot(
            (p.x - c.x) / (rx + radius + 0.7),
            (p.z - c.z) / (rz + radius + 0.7),
          ) < 1
        );
      });
    },
    height: () => -0.74,
  };
}
