export type Material = 'latex' | 'pearl' | 'chrome';
export type PaletteColour = { hex: string; material: Material };
export type Palette = {
  tint: string;
  tintDark: string;
  colours: readonly PaletteColour[];
};

export const paletteIds = [
  'blush-champagne',
  'chrome-blue',
  'sage-cream',
  'rose-gold',
  'jewel',
] as const;
export type PaletteId = (typeof paletteIds)[number];

const latex = (hex: string): PaletteColour => ({ hex, material: 'latex' });
const pearl = (hex: string): PaletteColour => ({ hex, material: 'pearl' });
const chrome = (hex: string): PaletteColour => ({ hex, material: 'chrome' });

// Colours follow the client's own setups; names are localized in content.
export const palettes: Record<PaletteId, Palette> = {
  'blush-champagne': {
    tint: '#F5ECE6',
    tintDark: '#2A201F',
    colours: [
      latex('#E8B4B2'),
      latex('#F3DCCB'),
      chrome('#D9B47A'),
      pearl('#FBF4EC'),
      latex('#C9898C'),
    ],
  },
  'chrome-blue': {
    tint: '#EDF0F4',
    tintDark: '#1C222B',
    colours: [
      chrome('#6F8FB8'),
      chrome('#C7CCD4'),
      pearl('#F4F6F8'),
      latex('#A9C3E0'),
      latex('#2E4A72'),
    ],
  },
  'sage-cream': {
    tint: '#EFF0E8',
    tintDark: '#1F231D',
    colours: [
      latex('#A7B79A'),
      latex('#E9E1CF'),
      pearl('#FAF6EE'),
      chrome('#CBB27C'),
      latex('#6F8466'),
    ],
  },
  'rose-gold': {
    tint: '#F6ECEA',
    tintDark: '#2B1D20',
    colours: [
      latex('#B5475B'),
      chrome('#D4AF6A'),
      latex('#E8A0A8'),
      pearl('#FFF5EE'),
      latex('#7D2338'),
    ],
  },
  jewel: {
    tint: '#F3EFE8',
    tintDark: '#1E2026',
    colours: [
      latex('#2F5D8C'),
      latex('#C94F6D'),
      latex('#E8B04B'),
      latex('#3E8E7E'),
      chrome('#C7CCD4'),
    ],
  },
};

export const defaultPaletteId: PaletteId = 'blush-champagne';

export function isPaletteId(value: string): value is PaletteId {
  return (paletteIds as readonly string[]).includes(value);
}
