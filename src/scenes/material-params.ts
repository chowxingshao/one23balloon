import type { Material } from '../lib/landing/palettes.ts';

export type SurfaceParams = {
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  envMapIntensity: number;
};

export const surface: Record<Material, SurfaceParams> = {
  latex: {
    metalness: 0,
    roughness: 0.36,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
    iridescence: 0,
    envMapIntensity: 1,
  },
  pearl: {
    metalness: 0.25,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    iridescence: 0.45,
    envMapIntensity: 1.1,
  },
  chrome: {
    metalness: 1,
    roughness: 0.12,
    clearcoat: 0,
    clearcoatRoughness: 0,
    iridescence: 0,
    envMapIntensity: 1.25,
  },
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function easeInOut(t: number): number {
  const k = clamp(t);
  return k * k * (3 - 2 * k);
}

export function mixSurface(
  from: SurfaceParams,
  to: SurfaceParams,
  t: number,
): SurfaceParams {
  const k = clamp(t);
  const mix = (key: keyof SurfaceParams) =>
    from[key] + (to[key] - from[key]) * k;
  return {
    metalness: mix('metalness'),
    roughness: mix('roughness'),
    clearcoat: mix('clearcoat'),
    clearcoatRoughness: mix('clearcoatRoughness'),
    iridescence: mix('iridescence'),
    envMapIntensity: mix('envMapIntensity'),
  };
}
