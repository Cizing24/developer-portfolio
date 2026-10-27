export interface Point {
  x: number;
  z: number;
}

export interface WanderArea {
  sample(random: () => number): Point;
  contains(point: Point): boolean;
  allowsSegment(from: Point, to: Point): boolean;
}

export function ellipseArea(
  inner: number,
  outer: number,
  depth = 1,
): WanderArea {
  return {
    sample(random) {
      const angle = random() * Math.PI * 2;
      const radius = inner + random() * (outer - inner);
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius * depth,
      };
    },
    contains({ x, z }) {
      const radius = Math.hypot(x, z / depth);
      return radius >= inner - 1e-8 && radius <= outer + 1e-8;
    },
    allowsSegment(from, to) {
      const dx = to.x - from.x,
        dz = (to.z - from.z) / depth;
      const t = Math.max(
        0,
        Math.min(
          1,
          -(from.x * dx + (from.z / depth) * dz) / (dx * dx + dz * dz || 1),
        ),
      );
      return (
        this.contains(from) &&
        this.contains(to) &&
        Math.hypot(from.x + dx * t, from.z / depth + dz * t) >= inner
      );
    },
  };
}

export function rectangleArea(width: number, depth: number): WanderArea {
  return {
    sample: (random) => ({
      x: (random() * 2 - 1) * width,
      z: (random() * 2 - 1) * depth,
    }),
    contains: ({ x, z }) => Math.abs(x) <= width && Math.abs(z) <= depth,
    allowsSegment(from, to) {
      return this.contains(from) && this.contains(to);
    },
  };
}

// A destination is chosen only between trips. No per-frame random jitter, and
// the whole segment must stay in the permitted area (including annular shores).
export function createWander(
  area: WanderArea,
  options: {
    speed: number;
    pause: number;
    maxDistance: number;
  },
  random: () => number = Math.random,
) {
  const position = area.sample(random);
  let from = { ...position };
  let target = { ...position };
  let progress = 1;
  let duration = 1;
  let waiting = random() * options.pause;
  let heading = random() * Math.PI * 2;
  let moving = false;

  function chooseTarget() {
    for (let attempt = 0; attempt < 64; attempt++) {
      const candidate = area.sample(random);
      const distance = Math.hypot(
        candidate.x - position.x,
        candidate.z - position.z,
      );
      if (distance < 0.25 || distance > options.maxDistance) continue;
      if (!area.allowsSegment(position, candidate)) continue;
      from = { ...position };
      target = candidate;
      duration = distance / (options.speed * (0.8 + random() * 0.4));
      progress = 0;
      return true;
    }
    // Retry later rather than spinning forever in an unusually narrow area.
    waiting = 0.2;
    return false;
  }

  return {
    position,
    get heading() {
      return heading;
    },
    get moving() {
      return moving;
    },
    update(delta: number) {
      moving = false;
      if (delta <= 0 || !Number.isFinite(delta)) return;
      if (waiting > 0) {
        waiting = Math.max(0, waiting - delta);
        return;
      }
      if (progress >= 1 && !chooseTarget()) return;
      progress = Math.min(1, progress + delta / duration);
      const t = progress * progress * (3 - 2 * progress);
      position.x = from.x + (target.x - from.x) * t;
      position.z = from.z + (target.z - from.z) * t;
      const desired = Math.atan2(target.x - from.x, target.z - from.z);
      const turn = Math.atan2(
        Math.sin(desired - heading),
        Math.cos(desired - heading),
      );
      heading += turn * (1 - Math.exp(-delta * 8));
      moving = true;
      if (progress === 1) waiting = random() * options.pause;
    },
  };
}
