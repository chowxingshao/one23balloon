import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { collectCjk, zhCharsetSources } from '../../src/lib/fonts/charset.ts';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('collectCjk', () => {
  it('returns unique, sorted CJK characters and punctuation', () => {
    expect(collectCjk('Hi 你好，你好！abc「配色」')).toEqual(
      ['「', '」', '你', '好', '色', '配', '，', '！'].sort(),
    );
  });

  it('ignores Latin text and the Latin middle dot', () => {
    expect(collectCjk('one23balloon · KL')).toEqual([]);
  });
});

describe('Chinese font subsets', () => {
  it('cover every Chinese character used in content', () => {
    const needed = collectCjk(zhCharsetSources.map(read).join('\n'));
    const subset = new Set(read('src/lib/fonts/zh-charset.txt'));
    expect(needed.filter((character) => !subset.has(character))).toEqual([]);
  });

  it.each([
    'fraunces-latin.woff2',
    'noto-serif-sc-subset.woff2',
    'noto-sans-sc-subset.woff2',
  ])('ships %s under 400 KB', (file) => {
    const size = statSync(new URL(`public/fonts/${file}`, root)).size;
    expect(size).toBeGreaterThan(1_000);
    expect(size).toBeLessThan(400_000);
  });
});
