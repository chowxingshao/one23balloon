import { MeshBasicMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import {
  archLength,
  archPoint,
  garlandLayout,
  heroArch,
} from '../../src/scenes/garland-layout.ts';
import { buildSculpture } from '../../src/scenes/sculpture-mesh.ts';
import {
  cakeParts,
  dogParts,
  tulipParts,
} from '../../src/scenes/sculpture-parts.ts';

describe('archPoint', () => {
  it('walks up the left side, over the top, and down the right side', () => {
    const { centerX, baseY, halfWidth, height } = heroArch;
    expect(archPoint(0, heroArch)).toMatchObject({
      x: centerX - halfWidth,
      y: baseY,
      nx: -1,
      ny: 0,
    });
    const top = archPoint(
      height - halfWidth + (Math.PI * halfWidth) / 2,
      heroArch,
    );
    expect(top.x).toBeCloseTo(centerX);
    expect(top.y).toBeCloseTo(baseY + height);
    expect(top.ny).toBeCloseTo(1);
    const end = archPoint(archLength(heroArch), heroArch);
    expect(end.x).toBeCloseTo(centerX + halfWidth);
    expect(end.y).toBeCloseTo(baseY);
  });
});

describe('garlandLayout', () => {
  const options = { dims: heroArch, count: 120, seed: 7, slots: 5 };

  it('is deterministic for a seed', () => {
    expect(garlandLayout(options)).toEqual(garlandLayout(options));
  });

  it('keeps every balloon on the arch with sensible sizes and slots', () => {
    const outline = Array.from({ length: 200 }, (_, i) =>
      archPoint((i / 199) * archLength(heroArch), heroArch),
    );
    const spots = garlandLayout(options);
    expect(spots).toHaveLength(120);
    for (const spot of spots) {
      expect(spot.radius).toBeGreaterThanOrEqual(0.12);
      expect(spot.radius).toBeLessThanOrEqual(0.52 * 1.3 + 1e-9);
      expect(
        Number.isInteger(spot.slot) && spot.slot >= 0 && spot.slot < 5,
      ).toBe(true);
      const nearest = Math.min(
        ...outline.map((p) => Math.hypot(p.x - spot.x, p.y - spot.y)),
      );
      expect(nearest).toBeLessThan(0.45);
    }
  });

  it('leaves the middle of the right side bare, like the client’s asymmetric garlands', () => {
    const { centerX, baseY, halfWidth } = heroArch;
    const rightMiddle = garlandLayout(options).filter(
      (spot) =>
        spot.x > centerX + halfWidth * 0.5 &&
        spot.y > baseY + 1.2 &&
        spot.y < baseY + 2.1,
    );
    expect(rightMiddle).toHaveLength(0);
  });
});

describe('sculpture parts', () => {
  it('builds a symmetric chrome balloon dog from eleven segments', () => {
    expect(dogParts).toHaveLength(11);
    expect(dogParts.every((part) => part.role === 'accent')).toBe(true);
    const legs = dogParts.filter((part) => part.scale[1] > 0.6);
    expect(legs.map((leg) => leg.position[2]).sort()).toEqual([
      -0.22, -0.22, 0.22, 0.22,
    ]);
  });

  it('builds a tulip bouquet with stems, three petals per bloom, leaves and a bow', () => {
    const parts = tulipParts(5);
    expect(parts).toHaveLength(24);
    expect(parts.filter((part) => part.role === 'stem')).toHaveLength(7);
    expect(parts.filter((part) => part.role === 'accent')).toHaveLength(2);
    const petals = parts.filter((part) => part.role === 'body');
    expect(new Set(petals.map((part) => part.slot))).toEqual(
      new Set([0, 1, 2, 3, 4]),
    );
  });

  it('builds a three-tier cake topped by a candle', () => {
    const parts = cakeParts();
    const body = parts.filter((part) => part.role === 'body');
    expect(body).toHaveLength(90);
    expect(new Set(body.map((part) => part.slot))).toEqual(new Set([0, 1, 2]));
    expect(parts.every((part) => Math.abs(part.position[0]) <= 1.0001)).toBe(
      true,
    );
    const top = Math.max(...parts.map((part) => part.position[1]));
    expect(parts.find((part) => part.position[1] === top)?.role).toBe('accent');
  });

  it('turns parts into meshes that share one geometry', () => {
    const material = new MeshBasicMaterial();
    const built = buildSculpture(
      dogParts,
      { body: () => material, stem: material, accent: material },
      8,
    );
    expect(built.meshes).toHaveLength(11);
    expect(built.group.children).toHaveLength(11);
    expect(new Set(built.meshes.map((mesh) => mesh.geometry))).toEqual(
      new Set([built.geometry]),
    );
    expect(built.meshes[1].scale.toArray()).toEqual([0.3, 0.68, 0.3]);
  });
});
