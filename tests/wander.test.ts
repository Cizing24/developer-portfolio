import { describe, expect, it } from 'vitest';
import { createWander, ellipseArea, rectangleArea } from '../src/lib/wander';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('random scene travel', () => {
  it('rejects shortcuts across the island or through the inner shoreline', () => {
    const sea = ellipseArea(16, 22, 0.8);
    expect(sea.allowsSegment({ x: -18, z: 0 }, { x: 18, z: 0 })).toBe(false);
    expect(sea.allowsSegment({ x: 18, z: 0 }, { x: 18, z: 2 })).toBe(true);
  });

  it.each([
    ['visitors', rectangleArea(4.6, 0.28), 4, 0.5],
    ['island paths', ellipseArea(2.08, 2.38), 2.2, 0.5],
    ['boats', ellipseArea(16, 22, 0.8), 10, 0.5],
    ['birds', rectangleArea(18, 14), 18, 1.5],
  ] as const)(
    'keeps %s bounded, continuous and changing direction over ten minutes',
    (_, area, maxDistance, speed) => {
      const motion = createWander(
        area,
        { speed, pause: 2, maxDistance },
        seeded(27),
      );
      let previous = { ...motion.position };
      let distance = 0;
      let resting = 0;
      const directions = new Set<number>();
      for (let i = 0; i < 18000; i++) {
        motion.update(1 / 30);
        expect(area.contains(motion.position)).toBe(true);
        const step = Math.hypot(
          motion.position.x - previous.x,
          motion.position.z - previous.z,
        );
        expect(step).toBeLessThanOrEqual((speed * 1.8) / 30 + 1e-8);
        distance += step;
        if (motion.moving) directions.add(Math.round(motion.heading));
        else resting++;
        previous = { ...motion.position };
      }
      expect(distance).toBeGreaterThan(25);
      expect(directions.size).toBeGreaterThan(3);
      expect(resting).toBeGreaterThan(0);
    },
  );

  it('uses independent random journeys and does not move on a zero-time update', () => {
    const area = rectangleArea(5, 5);
    const options = { speed: 1, pause: 0, maxDistance: 5 };
    const first = createWander(area, options, seeded(1));
    const second = createWander(area, options, seeded(2));
    const initial = { ...first.position };
    first.update(0);
    expect(first.position).toEqual(initial);
    for (let i = 0; i < 300; i++) {
      first.update(1 / 30);
      second.update(1 / 30);
    }
    expect(first.position).not.toEqual(second.position);
  });
});
