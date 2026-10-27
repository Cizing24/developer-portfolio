import type { Point } from './wander';

export interface NavigationDomain {
  contains(point: Point, radius: number): boolean;
  height(point: Point): number;
}
export interface NavigationNode extends Point {
  y: number;
  links: number[];
  component: number;
}
export function segmentDistance(point: Point, from: Point, to: Point) {
  const dx = to.x - from.x,
    dz = to.z - from.z;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - from.x) * dx + (point.z - from.z) * dz) /
        (dx * dx + dz * dz || 1),
    ),
  );
  return Math.hypot(point.x - from.x - dx * t, point.z - from.z - dz * t);
}

// Build only on solid walkable ground. Diagonal links are checked along their
// whole length, so a path cannot cut a building corner or a bridge railing.
export function createNavigation(
  domain: NavigationDomain,
  radius: number,
  step = 0.24,
) {
  const nodes: NavigationNode[] = [];
  const grid = new Map<string, number>();
  const validSegment = (a: Point, b: Point) => {
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (step / 3)),
    );
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (
        !domain.contains(
          { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t },
          radius,
        )
      )
        return false;
    }
    return true;
  };
  for (let z = -110; z <= 110; z++)
    for (let x = -105; x <= 105; x++) {
      const point = { x: x * step, z: z * step };
      if (!domain.contains(point, radius)) continue;
      grid.set(`${x},${z}`, nodes.length);
      nodes.push({
        ...point,
        y: domain.height(point),
        links: [],
        component: -1,
      });
    }
  for (const [key, index] of grid) {
    const [x, z] = key.split(',').map(Number) as [number, number];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const other = grid.get(`${x + dx!},${z + dz!}`);
      if (other !== undefined && validSegment(nodes[index]!, nodes[other]!))
        nodes[index]!.links.push(other);
    }
  }
  const components: number[][] = [];
  nodes.forEach((node, index) => {
    if (node.component !== -1) return;
    const component = components.length;
    const queue = [index];
    node.component = component;
    for (let i = 0; i < queue.length; i++) {
      for (const next of nodes[queue[i]!]!.links)
        if (nodes[next]!.component === -1) {
          nodes[next]!.component = component;
          queue.push(next);
        }
    }
    components.push(queue);
  });
  function nearest(
    point: Point,
    allowed: (node: NavigationNode) => boolean = () => true,
  ) {
    let best = -1,
      distance = Infinity;
    nodes.forEach((node, index) => {
      const d = Math.hypot(node.x - point.x, node.z - point.z);
      if (d < distance && allowed(node)) {
        best = index;
        distance = d;
      }
    });
    return best;
  }
  function route(start: number, target: number) {
    if (
      !nodes[start] ||
      !nodes[target] ||
      nodes[start]!.component !== nodes[target]!.component
    )
      return [];
    const queue = [start];
    const parents = new Map<number, number>([[start, -1]]);
    for (let i = 0; i < queue.length && !parents.has(target); i++) {
      for (const next of nodes[queue[i]!]!.links)
        if (!parents.has(next)) {
          parents.set(next, queue[i]!);
          queue.push(next);
        }
    }
    const path = [target];
    while (path[0] !== start) path.unshift(parents.get(path[0]!)!);
    return path;
  }
  return { nodes, components, nearest, route, validSegment, domain, radius };
}
export type Navigation = ReturnType<typeof createNavigation>;
export interface Pedestrian {
  position: Point;
  radius: number;
}
export function createPedestrian(
  nav: Navigation,
  start: number,
  speed: number,
  random: () => number = Math.random,
) {
  const initial = nav.nodes[start];
  if (!initial) throw new Error('A pedestrian needs a walkable starting point');
  const position = { x: initial.x, z: initial.z };
  let node = start,
    path: number[] = [],
    waiting = random() * 2,
    blocked = 0,
    heading = 0;
  let moving = false,
    distance = 0;
  function goTo(target: number) {
    path = nav.route(node, target).slice(1);
    waiting = 0;
  }
  return {
    position,
    radius: nav.radius,
    get moving() {
      return moving;
    },
    get heading() {
      return heading;
    },
    get height() {
      return nav.domain.height(position);
    },
    get distance() {
      return distance;
    },
    get arrived() {
      return path.length === 0;
    },
    goTo,
    update(delta: number, peers: Pedestrian[]) {
      moving = false;
      if (delta <= 0 || !Number.isFinite(delta)) return;
      if (waiting > 0) {
        waiting = Math.max(0, waiting - delta);
        return;
      }
      if (!path.length) {
        const candidates = nav.components[nav.nodes[node]!.component]!;
        goTo(candidates[Math.floor(random() * candidates.length)]!);
        if (!path.length) {
          waiting = 0.5;
          return;
        }
      }
      const next = nav.nodes[path[0]!]!;
      const dx = next.x - position.x,
        dz = next.z - position.z;
      const length = Math.hypot(dx, dz);
      const travel = Math.min(length, speed * Math.min(delta, 0.07));
      const candidate = {
        x: position.x + (dx / (length || 1)) * travel,
        z: position.z + (dz / (length || 1)) * travel,
      };
      if (
        !nav.validSegment(position, candidate) ||
        peers.some(
          (peer) =>
            peer.position !== position &&
            segmentDistance(peer.position, position, candidate) <
              nav.radius + peer.radius + 0.025,
        )
      ) {
        blocked += delta;
        if (blocked > 1.2) {
          // Yield and back out of a narrow crossing before choosing another trip.
          path = nav.route(nav.nearest(position), node).slice(1);
          if (!path.length) {
            const exits = nav.nodes[node]!.links;
            path = exits.length
              ? [exits[Math.floor(random() * exits.length)]!]
              : [];
          }
          blocked = 0;
          waiting = random() * 0.6;
        }
        return;
      }
      blocked = 0;
      Object.assign(position, candidate);
      distance += travel;
      const desired = Math.atan2(dx, dz);
      heading +=
        Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading)) *
        (1 - Math.exp(-delta * 10));
      moving = travel > 0;
      if (length <= travel + 1e-8) {
        node = path.shift()!;
        if (!path.length) waiting = 0.3 + random() * 2.5;
      }
    },
  };
}
