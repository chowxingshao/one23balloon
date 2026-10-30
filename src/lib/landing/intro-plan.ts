import type { Capability } from '../canvas-island/capability.ts';
import { mulberry32 } from '../random.ts';

export const introStorageKey = 'one23balloon:intro-played';

// Low-tier devices (phones, few cores or little memory) skip the intro: its
// scene build blocks the main thread for seconds there, just as the page loads.
export function shouldPlayIntro(
  storage: Pick<Storage, 'getItem'> | undefined,
  capability: Capability,
): boolean {
  if (
    !capability.webgl ||
    capability.reducedMotion ||
    capability.tier === 'low' ||
    !storage
  )
    return false;
  try {
    return storage.getItem(introStorageKey) !== '1';
  } catch {
    return false;
  }
}

export function markIntroPlayed(
  storage: Pick<Storage, 'setItem'> | undefined,
): void {
  try {
    storage?.setItem(introStorageKey, '1');
  } catch {
    /* Storage can be unavailable in private modes; the intro then plays once per load. */
  }
}

export type IntroCell = {
  x: number;
  y: number;
  radius: number;
  slot: number;
  inflateAt: number;
  popAt: number;
};

// A grid of about `target` balloons whose cols/rows ratio follows the viewport aspect.
export function introGrid(
  target: number,
  aspect: number,
): { cols: number; rows: number } {
  const ratio = Math.max(0.1, Number.isFinite(aspect) ? aspect : 1);
  let rows = Math.max(3, Math.round(Math.sqrt(target / ratio)));
  let cols = Math.max(3, Math.round(target / rows));
  if (ratio >= 1 ? cols < rows : rows < cols) [cols, rows] = [rows, cols];
  return { cols, rows };
}

// A slightly jittered grid that inflates within 0.35 s and pops centre-out from 1.1 s.
export function introLayout(options: {
  cols: number;
  rows: number;
  halfWidth: number;
  halfHeight: number;
  seed: number;
  slots: number;
}): { cells: IntroCell[]; duration: number } {
  const { cols, rows, halfWidth, halfHeight, seed, slots } = options;
  const random = mulberry32(seed);
  const stepX = (halfWidth * 2) / (cols - 1);
  const stepY = (halfHeight * 2) / (rows - 1);
  const maxDistance = Math.hypot(halfWidth, halfHeight);
  const cells: IntroCell[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const x = -halfWidth + col * stepX + (random() - 0.5) * stepX * 0.25;
      const y = -halfHeight + row * stepY + (random() - 0.5) * stepY * 0.25;
      cells.push({
        x,
        y,
        radius: Math.max(stepX, stepY) * (0.58 + random() * 0.12),
        slot: Math.floor(random() * slots),
        inflateAt: random() * 0.35,
        popAt: 1.1 + (Math.hypot(x, y) / maxDistance) * 0.85 + random() * 0.08,
      });
    }
  return {
    cells,
    duration: Math.max(...cells.map((cell) => cell.popAt)) + 0.15,
  };
}
