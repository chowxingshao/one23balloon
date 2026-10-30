import { describe, expect, it } from 'vitest';
import { contrastRatio, luminance } from '../../src/lib/landing/contrast.ts';
import {
  defaultPaletteId,
  isPaletteId,
  paletteIds,
  palettes,
} from '../../src/lib/landing/palettes.ts';

const light = { ink: '#221B17', muted: '#5A4D45', rose: '#9C4F5C' };
const dark = { ink: '#F4EDE4', muted: '#C9BCB1', rose: '#E9A8B4' };

describe('contrast', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('rejects malformed colours', () => {
    expect(() => luminance('red')).toThrow();
  });
});

describe('celebration palettes', () => {
  it('defines five palettes with five valid colours each', () => {
    expect(paletteIds).toHaveLength(5);
    for (const id of paletteIds) {
      expect(palettes[id].colours, id).toHaveLength(5);
      for (const colour of palettes[id].colours) {
        expect(colour.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(['latex', 'pearl', 'chrome']).toContain(colour.material);
      }
    }
    expect(isPaletteId(defaultPaletteId)).toBe(true);
    expect(isPaletteId('neon')).toBe(false);
  });

  it.each(paletteIds)(
    'keeps text and links at WCAG AA on the %s tints',
    (id) => {
      for (const colour of Object.values(light))
        expect(
          contrastRatio(colour, palettes[id].tint),
          `${colour} on ${palettes[id].tint}`,
        ).toBeGreaterThanOrEqual(4.5);
      for (const colour of Object.values(dark))
        expect(
          contrastRatio(colour, palettes[id].tintDark),
          `${colour} on ${palettes[id].tintDark}`,
        ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('keeps links at WCAG AA on paper and surface in both schemes', () => {
    for (const background of ['#F7F1EA', '#EFE6DC'])
      expect(contrastRatio(light.rose, background)).toBeGreaterThanOrEqual(4.5);
    for (const background of ['#171311', '#241E1B'])
      expect(contrastRatio(dark.rose, background)).toBeGreaterThanOrEqual(4.5);
  });
});
