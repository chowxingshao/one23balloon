import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  blockIds,
  blocks,
  clusterBlocks,
  ink,
  isBlockId,
  muted,
  paper,
  textOn,
} from '../../src/lib/landing/blocks.ts';
import { contrastRatio } from '../../src/lib/landing/contrast.ts';

const tokens = readFileSync(
  new URL('../../src/styles/tokens.css', import.meta.url),
  'utf8',
);
const token = (name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i')
    .exec(tokens)?.[1]
    ?.toUpperCase();

describe('colour blocks', () => {
  it.each(blockIds)('%s text meets WCAG AA', (id) => {
    expect(contrastRatio(textOn(id), blocks[id].hex)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it('keeps ink and muted text readable on paper', () => {
    expect(contrastRatio(ink, paper)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(muted, paper)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(blockIds)('tokens.css mirrors %s', (id) => {
    expect(token(`block-${id}`)).toBe(blocks[id].hex);
    expect(token(`block-${id}-text`)).toBe(textOn(id));
  });

  it('mirrors the canvas colours in tokens.css', () => {
    expect(token('color-page')).toBe(paper);
    expect(token('color-text')).toBe(ink);
    expect(token('color-muted')).toBe(muted);
  });

  it('declares exactly one light theme', () => {
    expect(tokens).not.toMatch(/prefers-color-scheme/);
    expect(tokens).toMatch(/color-scheme:\s*light;/);
  });

  it('pairs every block with two other blocks for 3D clusters', () => {
    for (const id of blockIds) {
      const pair = clusterBlocks[id];
      expect(pair).not.toContain(id);
      expect(new Set(pair).size).toBe(2);
    }
  });

  it('recognises block ids', () => {
    expect(isBlockId('cobalt')).toBe(true);
    expect(isBlockId('neon')).toBe(false);
  });
});
