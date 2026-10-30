// Colour block system (see design-direction.md). tokens.css mirrors these
// values; tests/unit/blocks.test.ts keeps the two in sync.
export type Material = 'latex' | 'pearl' | 'chrome';
export type StageColour = { hex: string; material: Material };

export const paper = '#F4F4F1';
export const ink = '#121212';
export const muted = '#55554F';
export const white = '#FFFFFF';
export const chromeSilver = '#C7CCD4';
export const chromeGold = '#D9B47A';

export const blockIds = [
  'pink',
  'cobalt',
  'sunflower',
  'emerald',
  'tangerine',
  'lilac',
] as const;
export type BlockId = (typeof blockIds)[number];

export const blocks: Record<BlockId, { hex: string; text: 'ink' | 'white' }> = {
  pink: { hex: '#FF3E8A', text: 'ink' },
  cobalt: { hex: '#2340FF', text: 'white' },
  sunflower: { hex: '#FFC21A', text: 'ink' },
  emerald: { hex: '#14B37D', text: 'ink' },
  tangerine: { hex: '#FF6A2B', text: 'ink' },
  lilac: { hex: '#B69CFF', text: 'ink' },
};

// Balloons beside a card wear two other block colours so they stay visible
// against the card itself.
export const clusterBlocks: Record<BlockId, readonly [BlockId, BlockId]> = {
  pink: ['sunflower', 'cobalt'],
  cobalt: ['pink', 'sunflower'],
  sunflower: ['cobalt', 'pink'],
  emerald: ['lilac', 'sunflower'],
  tangerine: ['cobalt', 'lilac'],
  lilac: ['emerald', 'tangerine'],
};

export function textOn(id: BlockId): string {
  return blocks[id].text === 'ink' ? ink : white;
}

export function isBlockId(value: string): value is BlockId {
  return (blockIds as readonly string[]).includes(value);
}
