import type { QualityTier } from '../lib/canvas-island/capability.ts';
import {
  blocks,
  blockIds,
  chromeGold,
  chromeSilver,
  clusterBlocks,
  paper,
  type BlockId,
  type Material,
} from '../lib/landing/blocks.ts';
import type { FormationId } from '../lib/landing/formations.ts';
import { layoutFormation, type Box, type Placed } from './formation-layout.ts';

export const CAMERA_Z = 18;
export const CAMERA_FOV = 30;

export type FormationSlot = Placed & { hex: string; family: Material };
export type BuildOptions = {
  count: number;
  aspect: number;
  tier: QualityTier;
  /** Block colour of each service card, in page order. */
  serviceBlocks: readonly BlockId[];
};

// Half the visible height at depth z, for the stage camera.
export function visibleHalfHeight(z: number): number {
  return Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * (CAMERA_Z - z);
}

export function familyOf(index: number): Material {
  if (index % 6 === 0) return 'chrome';
  if (index % 6 === 3) return 'pearl';
  return 'latex';
}

const seeds: Record<string, number> = {
  hero: 101,
  drift: 202,
  hidden: 101,
  release: 404,
};

function box(min: Box['min'], max: Box['max']): Box {
  return { min, max };
}

function shape(
  id: FormationId,
  { aspect, tier }: BuildOptions,
): { volume: Box; radius: [number, number]; keepOut: Box[] } {
  const halfHeight = visibleHalfHeight(0);
  const halfWidth = halfHeight * aspect;
  const portrait = aspect < 1;
  if (id === 'hero' || id === 'hidden') {
    // The headline sits in the lower part of the hero; front balloons stay
    // off its centre so the words stay readable.
    const headline = box(
      [-halfWidth * 0.55, -halfHeight, 0],
      [halfWidth * 0.55, -halfHeight * 0.15, 7],
    );
    const keepOut = [headline];
    if (tier === 'low')
      keepOut.push(
        box([-halfWidth, -halfHeight, -11], [halfWidth, -halfHeight * 0.15, 7]),
      );
    // 16 units deep, so 30 balloons reliably span at least 12 of them.
    return {
      volume: box(
        [-halfWidth * 1.05, -halfHeight * 0.95, -10],
        [halfWidth * 1.05, halfHeight * 0.95, 6],
      ),
      radius: portrait ? [0.35, 0.7] : [0.45, 0.95],
      keepOut,
    };
  }
  if (id === 'drift')
    return {
      volume: box(
        [-halfWidth * 1.2, -halfHeight, -16],
        [halfWidth * 1.2, halfHeight, -2],
      ),
      radius: [0.4, 0.8],
      keepOut: [],
    };
  if (id === 'release')
    return {
      volume: box(
        [-halfWidth, halfHeight * 1.6, -6],
        [halfWidth, halfHeight * 3, 4],
      ),
      radius: [0.4, 0.85],
      keepOut: [],
    };
  // Service clusters: between the copy and the photo, in front of the plane.
  const centreX = portrait ? halfWidth * 0.45 : 0;
  const centreY = portrait ? halfHeight * 0.6 : halfHeight * 0.25;
  const spread = portrait ? 1.6 : 2.4;
  return {
    volume: box(
      [centreX - spread, centreY - spread, 0.5],
      [centreX + spread, centreY + spread, 5.5],
    ),
    radius: portrait ? [0.25, 0.45] : [0.3, 0.55],
    keepOut: [],
  };
}

function latexColours(
  id: FormationId,
  serviceBlocks: readonly BlockId[],
): string[] {
  if (id.startsWith('service-')) {
    const index = Number(id.slice('service-'.length));
    const card = serviceBlocks[index] ?? blockIds[index % blockIds.length]!;
    return clusterBlocks[card].map((block) => blocks[block].hex);
  }
  if (id === 'release')
    return (['sunflower', 'cobalt', 'lilac'] as const).map(
      (block) => blocks[block].hex,
    );
  return blockIds.map((block) => blocks[block].hex);
}

export function buildFormation(
  id: FormationId,
  options: BuildOptions,
): FormationSlot[] {
  const { volume, radius, keepOut } = shape(id, options);
  const seed = seeds[id] ?? 300 + Number(id.slice('service-'.length));
  const placed = layoutFormation({
    count: options.count,
    volume,
    radius,
    keepOut,
    seed,
  });
  // Hidden reuses the hero layout, moved below the frame.
  const offsetY = id === 'hidden' ? -visibleHalfHeight(-10) * 2.2 : 0;
  const latex = latexColours(id, options.serviceBlocks);
  return placed.map((slot, index) => {
    const family = familyOf(index);
    const hex =
      family === 'chrome'
        ? index % 12 === 0
          ? chromeGold
          : chromeSilver
        : family === 'pearl'
          ? paper
          : latex[index % latex.length]!;
    return { ...slot, y: slot.y + offsetY, hex, family };
  });
}
