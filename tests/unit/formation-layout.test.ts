import { describe, expect, it } from 'vitest';
import { blockIds } from '../../src/lib/landing/blocks.ts';
import type { FormationId } from '../../src/lib/landing/formations.ts';
import {
  boundingRadius,
  layoutFormation,
  separated,
  type Placed,
} from '../../src/scenes/formation-layout.ts';
import {
  buildFormation,
  familyOf,
  visibleHalfHeight,
} from '../../src/scenes/formations.ts';

const ids: FormationId[] = [
  'hero',
  'drift',
  'hidden',
  'release',
  ...blockIds.map((_, index) => `service-${index}` as FormationId),
];
const counts = [30, 14];
const aspects = [0.46, 1, 1.78];

function overlapping(slots: Placed[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++)
      if (!separated(slots[i]!, slots[j]!, 0)) pairs.push([i, j]);
  return pairs;
}

describe('layoutFormation', () => {
  const options = {
    count: 20,
    volume: { min: [-4, -3, -4], max: [4, 3, 4] } as const,
    radius: [0.4, 0.8] as [number, number],
    seed: 11,
  };

  it('places every balloon without any overlap', () => {
    const slots = layoutFormation({
      ...options,
      volume: { min: [-4, -3, -4], max: [4, 3, 4] },
    });
    expect(slots).toHaveLength(20);
    expect(overlapping(slots)).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    const volume = { min: [-4, -3, -4], max: [4, 3, 4] } as {
      min: [number, number, number];
      max: [number, number, number];
    };
    expect(layoutFormation({ ...options, volume })).toEqual(
      layoutFormation({ ...options, volume }),
    );
  });

  it('keeps balloons out of keep-out boxes', () => {
    const keepOut = { min: [-4, -1, -4], max: [4, 1, 4] } as {
      min: [number, number, number];
      max: [number, number, number];
    };
    const slots = layoutFormation({
      ...options,
      volume: { min: [-4, -3, -4], max: [4, 3, 4] },
      keepOut: [keepOut],
    });
    for (const slot of slots)
      expect(Math.abs(slot.y)).toBeGreaterThanOrEqual(
        1 + boundingRadius(slot.radius) - 1e-9,
      );
  });

  it('shrinks radii instead of failing when space is tight', () => {
    const slots = layoutFormation({
      count: 40,
      volume: { min: [-1.5, -1.5, -1.5], max: [1.5, 1.5, 1.5] },
      radius: [0.6, 0.9],
      seed: 3,
    });
    expect(slots).toHaveLength(40);
    expect(overlapping(slots)).toEqual([]);
  });
});

describe('buildFormation', () => {
  const serviceBlocks = blockIds;

  it.each(
    ids.flatMap((id) =>
      counts.flatMap((count) =>
        aspects.map((aspect) => [id, count, aspect] as const),
      ),
    ),
  )('%s with %i balloons at aspect %f never overlaps', (id, count, aspect) => {
    const tier = count === 30 ? 'high' : 'low';
    const slots = buildFormation(id, { count, aspect, tier, serviceBlocks });
    expect(slots).toHaveLength(count);
    expect(overlapping(slots)).toEqual([]);
  });

  it('spreads the hero at least 12 units deep', () => {
    const slots = buildFormation('hero', {
      count: 30,
      aspect: 1.78,
      tier: 'high',
      serviceBlocks,
    });
    const z = slots.map((slot) => slot.z);
    expect(Math.max(...z) - Math.min(...z)).toBeGreaterThanOrEqual(12);
  });

  it('keeps the drift behind the headline plane and services in front of it', () => {
    const base = {
      count: 30,
      aspect: 1.78,
      tier: 'high' as const,
      serviceBlocks,
    };
    for (const slot of buildFormation('drift', base))
      expect(slot.z + boundingRadius(slot.radius)).toBeLessThan(0);
    for (const slot of buildFormation('service-2', base))
      expect(slot.z - boundingRadius(slot.radius)).toBeGreaterThan(0);
  });

  it('parks hidden balloons below the frame and releases them above it', () => {
    const base = { count: 30, aspect: 1, tier: 'high' as const, serviceBlocks };
    for (const slot of buildFormation('hidden', base))
      expect(slot.y + boundingRadius(slot.radius)).toBeLessThan(
        -visibleHalfHeight(slot.z),
      );
    for (const slot of buildFormation('release', base))
      expect(slot.y - boundingRadius(slot.radius)).toBeGreaterThan(
        visibleHalfHeight(slot.z),
      );
  });

  it('colours service clusters with the card pair, never the card colour', () => {
    const slots = buildFormation('service-0', {
      count: 30,
      aspect: 1.78,
      tier: 'high',
      serviceBlocks: [
        'pink',
        'cobalt',
        'sunflower',
        'emerald',
        'tangerine',
        'lilac',
      ],
    });
    const latex = new Set(
      slots.filter((slot) => slot.family === 'latex').map((slot) => slot.hex),
    );
    expect(latex).toEqual(new Set(['#FFC21A', '#2340FF']));
  });

  it('assigns stable material families by index', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(familyOf)).toEqual([
      'chrome',
      'latex',
      'latex',
      'pearl',
      'latex',
      'latex',
      'chrome',
    ]);
  });
});
