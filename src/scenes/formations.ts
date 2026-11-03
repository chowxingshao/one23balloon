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
import {
  BALLOON_STRETCH,
  layoutFormation,
  type Box,
  type Placed,
} from './formation-layout.ts';

export const CAMERA_Z = 18;
export const CAMERA_FOV = 30;

export type FormationSlot = Placed & { hex: string; family: Material };
export type BuildOptions = {
  count: number;
  aspect: number;
  tier: QualityTier;
  /** Block colour of each service card, in page order. */
  serviceBlocks: readonly BlockId[];
  /**
   * Service clusters only: the free screen area beside the active card's text,
   * as fractions of the viewport. Defaults to the band above the copy.
   */
  anchor?: ScreenRect;
};

export type ScreenRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const CLUSTER_Z = 2.5;
// Half-depths to try, deepest first.
const CLUSTER_DEPTHS = [2, 1.5, 1, 0.7, 0.5, 0.35];
// The default free area: above the copy on wide screens, to the right of the
// link on narrow ones. The stage measures the real area from the card.
const wideAnchor: ScreenRect = {
  left: 0.05,
  top: 0.1,
  right: 0.46,
  bottom: 0.27,
};
const narrowAnchor: ScreenRect = {
  left: 0.5,
  top: 0.36,
  right: 0.95,
  bottom: 0.46,
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

// The world box whose every depth slice projects inside a screen rectangle:
// the intersection of the rectangle mapped at the near and far depths. A thin
// rectangle far from the centre leaves little of that intersection, so the
// depth range shrinks until the box keeps most of the rectangle.
function boxInScreen(rect: ScreenRect, aspect: number): Box {
  const slice = (z: number) => {
    const halfHeight = visibleHalfHeight(z);
    const halfWidth = halfHeight * aspect;
    return {
      left: (rect.left * 2 - 1) * halfWidth,
      right: (rect.right * 2 - 1) * halfWidth,
      top: (1 - rect.top * 2) * halfHeight,
      bottom: (1 - rect.bottom * 2) * halfHeight,
    };
  };
  const middle = slice(CLUSTER_Z);
  let range = middle;
  let depth = CLUSTER_DEPTHS[CLUSTER_DEPTHS.length - 1]!;
  for (const half of CLUSTER_DEPTHS) {
    const near = slice(CLUSTER_Z + half);
    const far = slice(CLUSTER_Z - half);
    range = {
      left: Math.max(near.left, far.left),
      right: Math.min(near.right, far.right),
      bottom: Math.max(near.bottom, far.bottom),
      top: Math.min(near.top, far.top),
    };
    depth = half;
    if (
      range.right - range.left >= 0.8 * (middle.right - middle.left) &&
      range.top - range.bottom >= 0.8 * (middle.top - middle.bottom)
    )
      break;
  }
  if (range.right <= range.left || range.top <= range.bottom) range = middle;
  // Shrunk a little so a sphere's nearer surface stays inside as well.
  const inset = 0.96;
  const fit = (low: number, high: number): [number, number] => {
    const centre = (low + high) / 2;
    const half = ((high - low) / 2) * inset;
    return [centre - half, centre + half];
  };
  const [x0, x1] = fit(range.left, range.right);
  const [y0, y1] = fit(range.bottom, range.top);
  return box([x0, y0, CLUSTER_Z - depth], [x1, y1, CLUSTER_Z + depth]);
}

function shape(
  id: FormationId,
  { aspect, tier, anchor }: BuildOptions,
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
  // Service clusters: in the free area beside the card text, in front of the plane.
  const volume = boxInScreen(
    anchor ?? (portrait ? narrowAnchor : wideAnchor),
    aspect,
  );
  // Balloons must fit the box: cap the radius by its smallest face.
  const face = Math.min(
    volume.max[0] - volume.min[0],
    volume.max[1] - volume.min[1],
  );
  const largest = Math.min(
    portrait ? 0.45 : 0.55,
    (face / 2 / BALLOON_STRETCH) * 0.9,
  );
  return {
    volume,
    radius: [largest * 0.6, largest],
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
  let latexCount = 0;
  return placed.map((slot, index) => {
    const family = familyOf(index);
    const hex =
      family === 'chrome'
        ? index % 12 === 0
          ? chromeGold
          : chromeSilver
        : family === 'pearl'
          ? paper
          : latex[latexCount++ % latex.length]!;
    return { ...slot, y: slot.y + offsetY, hex, family };
  });
}
