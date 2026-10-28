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
      Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (step / 16)),
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
      [0, 1],
      [1, 1],
      [1, -1],
    ]) {
      const other = grid.get(`${x + dx!},${z + dz!}`);
      if (other !== undefined && validSegment(nodes[index]!, nodes[other]!)) {
        nodes[index]!.links.push(other);
        nodes[other]!.links.push(index);
      }
    }
  }
  const components: number[][] = [];
  const directionOrder = new Map(
    ['1,0', '-1,0', '0,1', '0,-1', '1,1', '-1,-1', '1,-1', '-1,1'].map(
      (key, index) => [key, index],
    ),
  );
  for (const node of nodes) {
    const rank = (index: number) =>
      directionOrder.get(
        `${Math.sign(nodes[index]!.x - node.x)},${Math.sign(nodes[index]!.z - node.z)}`,
      )!;
    node.links.sort((a, b) => rank(a) - rank(b));
  }
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
  function route(
    start: number,
    target: number,
    clear: (a: number, b: number) => boolean = () => true,
  ) {
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
        if (!parents.has(next) && clear(queue[i]!, next)) {
          parents.set(next, queue[i]!);
          queue.push(next);
        }
    }
    if (!parents.has(target)) return [];
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
  localDestinations?: number[],
) {
  const initial = nav.nodes[start];
  if (!initial) throw new Error('A pedestrian needs a walkable starting point');
  const position = { x: initial.x, z: initial.z };
  let node = start,
    path: number[] = [],
    waiting = random() * 2,
    blocked = 0,
    heading = 0,
    destination = start,
    detourCooldown = 0;
  let moving = false,
    distance = 0;
  function goTo(target: number) {
    destination = target;
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
      detourCooldown = Math.max(0, detourCooldown - delta);
      if (waiting > 0) {
        waiting = Math.max(0, waiting - delta);
        return;
      }
      if (!path.length) {
        const candidates =
          localDestinations?.length && random() < 0.75
            ? localDestinations
            : nav.components[nav.nodes[node]!.component]!;
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
        if (blocked > 0.35 && detourCooldown === 0) {
          // Reconnect from the actual position, then route around people rather
          // than repeatedly choosing an adjacent cell behind the same obstacle.
          const nearby = peers.filter(
            (peer) =>
              peer.position !== position &&
              Math.hypot(
                peer.position.x - position.x,
                peer.position.z - position.z,
              ) < 4,
          );
          const free = (a: Point, b: Point) =>
            nearby.every(
              (peer) =>
                segmentDistance(peer.position, a, b) >=
                nav.radius + peer.radius + 0.025,
            );
          const start = nav.nearest(
            position,
            (n) =>
              n.component === nav.nodes[node]!.component &&
              Math.hypot(n.x - position.x, n.z - position.z) < 0.8 &&
              free(position, n) &&
              nav.validSegment(position, n),
          );
          if (start !== -1) {
            const clear = (a: number, b: number) =>
              free(nav.nodes[a]!, nav.nodes[b]!);
            let alternative = nav.route(start, destination, clear);
            if (!alternative.length) {
              // A short retreat opens space for oncoming traffic. Keep this
              // choice for a while so both sides do not reverse every frame.
              const exits = nav.components[nav.nodes[start]!.component]!.filter(
                (index) => {
                  const n = nav.nodes[index]!;
                  const d = Math.hypot(n.x - position.x, n.z - position.z);
                  return d > 1 && d < 2.2 && free(n, n);
                },
              );
              for (
                let attempt = 0;
                attempt < Math.min(8, exits.length);
                attempt++
              ) {
                alternative = nav.route(
                  start,
                  exits[Math.floor(random() * exits.length)]!,
                  clear,
                );
                if (alternative.length) break;
              }
            }
            if (alternative.length) path = alternative;
          }
          detourCooldown = 0.9 + random() * 0.6;
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
