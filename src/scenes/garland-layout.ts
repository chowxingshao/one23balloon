import { mulberry32 } from '../lib/random.ts';

export type ArchDims = {
  centerX: number;
  baseY: number;
  halfWidth: number;
  height: number;
};
export type GarlandSpot = {
  x: number;
  y: number;
  z: number;
  radius: number;
  slot: number;
  phase: number;
};

// The arched panel sits right of centre so the headline has room on wide screens.
export const heroArch: ArchDims = {
  centerX: 2.05,
  baseY: -2.9,
  halfWidth: 1.4,
  height: 4.4,
};

const straight = (dims: ArchDims) => dims.height - dims.halfWidth;

export function archLength(dims: ArchDims): number {
  return straight(dims) * 2 + Math.PI * dims.halfWidth;
}

// u is the distance along the outline: up the left side, over the top, down the right.
export function archPoint(
  u: number,
  dims: ArchDims,
): { x: number; y: number; nx: number; ny: number } {
  const side = straight(dims);
  const arc = Math.PI * dims.halfWidth;
  if (u < side)
    return {
      x: dims.centerX - dims.halfWidth,
      y: dims.baseY + u,
      nx: -1,
      ny: 0,
    };
  if (u < side + arc) {
    const angle = Math.PI - (u - side) / dims.halfWidth;
    return {
      x: dims.centerX + Math.cos(angle) * dims.halfWidth,
      y: dims.baseY + side + Math.sin(angle) * dims.halfWidth,
      nx: Math.cos(angle),
      ny: Math.sin(angle),
    };
  }
  const down = Math.min(u - side - arc, side);
  return {
    x: dims.centerX + dims.halfWidth,
    y: dims.baseY + side - down,
    nx: 1,
    ny: 0,
  };
}

// Most balloons sweep up the left and over the top; a cluster anchors the right foot.
export function garlandLayout(options: {
  dims: ArchDims;
  count: number;
  seed: number;
  slots: number;
}): GarlandSpot[] {
  const { dims, count, seed, slots } = options;
  const random = mulberry32(seed);
  const side = straight(dims);
  const total = archLength(dims);
  const sweepEnd = side + Math.PI * dims.halfWidth + side * 0.25;
  const footStart = total - side * 0.35;
  const footFrom = Math.round(count * 0.82);
  return Array.from({ length: count }, (_, index) => {
    const inFoot = index >= footFrom;
    const u = inFoot
      ? footStart + random() * (total - footStart)
      : random() * sweepEnd;
    const point = archPoint(u, dims);
    const offset = (random() - 0.35) * 0.62;
    let radius = 0.12 + random() ** 2 * 0.4;
    if (u < 1.4 || inFoot) radius *= 1.3;
    return {
      x: point.x + point.nx * offset,
      y: point.y + point.ny * offset,
      z: -0.25 + random() * 0.9,
      radius,
      slot: Math.floor(random() * slots),
      phase: random() * Math.PI * 2,
    };
  });
}
