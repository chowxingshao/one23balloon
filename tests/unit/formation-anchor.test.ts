import { describe, expect, it } from 'vitest';
import { blockIds } from '../../src/lib/landing/blocks.ts';
import {
  BALLOON_STRETCH,
  separated,
} from '../../src/scenes/formation-layout.ts';
import {
  largestFreeRect,
  type Rect,
} from '../../src/scenes/formation-anchor.ts';
import {
  buildFormation,
  visibleHalfHeight,
  type ScreenRect,
} from '../../src/scenes/formations.ts';

describe('largestFreeRect', () => {
  const bounds: Rect = { left: 0, top: 0, right: 100, bottom: 100 };

  it('returns the whole bounds when nothing is in the way', () => {
    expect(largestFreeRect(bounds, [])).toEqual(bounds);
  });

  it('finds the band above an obstacle and never touches it', () => {
    const obstacle: Rect = { left: 0, top: 60, right: 100, bottom: 100 };
    const free = largestFreeRect(bounds, [obstacle], 10)!;
    expect(free).toEqual({ left: 0, top: 0, right: 100, bottom: 50 });
  });

  it('prefers a squarer pocket over a long thin strip', () => {
    // A 100 x 20 strip above the copy, or a 60 x 40 pocket beside the link.
    const obstacles: Rect[] = [
      { left: 0, top: 20, right: 100, bottom: 40 },
      { left: 0, top: 40, right: 40, bottom: 100 },
    ];
    expect(largestFreeRect(bounds, obstacles)).toEqual({
      left: 40,
      top: 40,
      right: 100,
      bottom: 100,
    });
  });

  it('returns undefined when no pocket is wide enough', () => {
    const wall: Rect = { left: 0, top: 0, right: 100, bottom: 100 };
    expect(largestFreeRect(bounds, [wall], 0)).toBeUndefined();
  });
});

describe('anchored service clusters', () => {
  // Free areas measured on the real cards, as fractions of the viewport.
  const cases: Array<[string, number, ScreenRect]> = [
    [
      '1440x900 above the copy',
      1440 / 900,
      { left: 0.05, top: 0.1, right: 0.46, bottom: 0.27 },
    ],
    [
      '1024x768 above the copy',
      1024 / 768,
      { left: 0.05, top: 0.1, right: 0.45, bottom: 0.3 },
    ],
    [
      '390x844 beside the link',
      390 / 844,
      { left: 0.54, top: 0.37, right: 0.96, bottom: 0.45 },
    ],
    [
      '390x844 thin strip under the header',
      390 / 844,
      { left: 0.04, top: 0.09, right: 0.96, bottom: 0.17 },
    ],
  ];

  it.each(cases)(
    '%s: no overlap, wholly inside the area',
    (_, aspect, anchor) => {
      for (const [count, tier] of [
        [30, 'high'],
        [14, 'low'],
      ] as const) {
        const slots = buildFormation('service-1', {
          count,
          aspect,
          tier,
          serviceBlocks: blockIds,
          anchor,
        });
        expect(slots).toHaveLength(count);
        for (let i = 0; i < slots.length; i++)
          for (let j = i + 1; j < slots.length; j++)
            expect(separated(slots[i]!, slots[j]!, 0.04)).toBe(true);
        for (const slot of slots) {
          const halfHeight = visibleHalfHeight(slot.z);
          const halfWidth = halfHeight * aspect;
          const r = slot.radius * BALLOON_STRETCH;
          // Project the balloon centre; the radius shrinks with depth too.
          const x = (slot.x / halfWidth + 1) / 2;
          const y = (1 - slot.y / halfHeight) / 2;
          const rx = r / halfWidth / 2;
          const ry = r / halfHeight / 2;
          expect(x - rx).toBeGreaterThanOrEqual(anchor.left - 1e-6);
          expect(x + rx).toBeLessThanOrEqual(anchor.right + 1e-6);
          expect(y - ry).toBeGreaterThanOrEqual(anchor.top - 1e-6);
          expect(y + ry).toBeLessThanOrEqual(anchor.bottom + 1e-6);
          expect(slot.z - r).toBeGreaterThan(0);
        }
      }
    },
  );

  it('keeps the cluster visible, not microscopic', () => {
    const slots = buildFormation('service-0', {
      count: 14,
      aspect: 390 / 844,
      tier: 'low',
      serviceBlocks: blockIds,
      anchor: { left: 0.54, top: 0.37, right: 0.96, bottom: 0.45 },
    });
    // On screen the smallest balloon spans at least 3% of the viewport height.
    for (const slot of slots) {
      const diameter =
        (2 * slot.radius * BALLOON_STRETCH) / (2 * visibleHalfHeight(slot.z));
      expect(diameter).toBeGreaterThan(0.03);
    }
  });
});
