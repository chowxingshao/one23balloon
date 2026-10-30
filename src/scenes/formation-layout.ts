import { mulberry32 } from '../lib/random.ts';

export type Vec3 = [number, number, number];
export type Box = { min: Vec3; max: Vec3 };
export type Placed = { x: number; y: number; z: number; radius: number };
export type LayoutOptions = {
  count: number;
  /** Balloons sit wholly inside this box. */
  volume: Box;
  radius: [number, number];
  /** Extra clearance as a fraction of the two bounding radii. */
  gap?: number;
  /** No balloon may touch these boxes. */
  keepOut?: Box[];
  seed: number;
  /** Candidates tried per balloon before the radii shrink. */
  attempts?: number;
};

// createBalloonGeometry stretches the sphere 1.1x vertically.
export const BALLOON_STRETCH = 1.1;

export function boundingRadius(radius: number): number {
  return radius * BALLOON_STRETCH;
}

export function separated(a: Placed, b: Placed, gap = 0.04): boolean {
  const min = (boundingRadius(a.radius) + boundingRadius(b.radius)) * (1 + gap);
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 >= min * min;
}

function touches(slot: Placed, box: Box): boolean {
  const r = boundingRadius(slot.radius);
  const dx = Math.max(box.min[0] - slot.x, 0, slot.x - box.max[0]);
  const dy = Math.max(box.min[1] - slot.y, 0, slot.y - box.max[1]);
  const dz = Math.max(box.min[2] - slot.z, 0, slot.z - box.max[2]);
  return dx * dx + dy * dy + dz * dz < r * r;
}

// Dart throwing with a fixed seed: the same formation every visit. If a
// balloon cannot be placed, every radius shrinks by 10% and the layout restarts.
export function layoutFormation(options: LayoutOptions): Placed[] {
  const {
    count,
    volume,
    keepOut = [],
    seed,
    gap = 0.04,
    attempts = 400,
  } = options;
  let [minRadius, maxRadius] = options.radius;
  for (let round = 0; round < 24; round++) {
    const random = mulberry32(seed + round * 7919);
    const placed: Placed[] = [];
    for (let index = 0; index < count; index++) {
      let found: Placed | undefined;
      for (let attempt = 0; attempt < attempts && !found; attempt++) {
        const radius = minRadius + random() * (maxRadius - minRadius);
        const r = boundingRadius(radius);
        const axis = (k: 0 | 1 | 2) =>
          volume.min[k] +
          r +
          random() * Math.max(0, volume.max[k] - volume.min[k] - 2 * r);
        const candidate = { x: axis(0), y: axis(1), z: axis(2), radius };
        if (keepOut.some((box) => touches(candidate, box))) continue;
        if (placed.every((other) => separated(other, candidate, gap)))
          found = candidate;
      }
      if (!found) break;
      placed.push(found);
    }
    if (placed.length === count) return placed;
    minRadius *= 0.9;
    maxRadius *= 0.9;
  }
  throw new Error(`Could not place ${count} balloons without overlap.`);
}
