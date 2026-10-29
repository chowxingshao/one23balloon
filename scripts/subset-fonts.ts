import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { collectCjk, zhCharsetSources } from '../src/lib/fonts/charset.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const cacheDir = join(root, '.cache', 'fonts');
// Pinned google/fonts commit so every run subsets identical upstream files.
const commit = '9862abc066c9b83bf84c3e8ed1fc2d8d48f9bbf0';
const fonts = [
  {
    source: 'ofl/fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf',
    license: 'ofl/fraunces/OFL.txt',
    output: 'fraunces-latin.woff2',
    licenseOutput: 'OFL-Fraunces.txt',
    script: 'latin',
    axes: { SOFT: 0, WONK: 0 },
  },
  {
    source: 'ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
    license: 'ofl/notoserifsc/OFL.txt',
    output: 'noto-serif-sc-subset.woff2',
    licenseOutput: 'OFL-NotoSerifSC.txt',
    script: 'chinese',
    axes: { wght: 400 },
  },
  {
    source: 'ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    license: 'ofl/notosanssc/OFL.txt',
    output: 'noto-sans-sc-subset.woff2',
    licenseOutput: 'OFL-NotoSansSC.txt',
    script: 'chinese',
    axes: { wght: 400 },
  },
] as const;

async function upstream(path: string): Promise<Buffer> {
  const file = join(cacheDir, decodeURIComponent(path).replaceAll('/', '_'));
  if (!existsSync(file)) {
    const response = await fetch(
      `https://raw.githubusercontent.com/google/fonts/${commit}/${path}`,
    );
    if (!response.ok)
      throw new Error(`Download failed (${response.status}): ${path}`);
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
  }
  return readFile(file);
}

function range(from: number, to: number): string {
  return Array.from({ length: to - from + 1 }, (_, index) =>
    String.fromCodePoint(from + index),
  ).join('');
}

const latin = range(0x20, 0x7e) + range(0xa0, 0xff) + '–—‘’‚“”„•…€™';
const chinese = collectCjk(
  (
    await Promise.all(
      zhCharsetSources.map((path) => readFile(join(root, path), 'utf8')),
    )
  ).join('\n'),
).join('');

await writeFile(join(root, 'src/lib/fonts/zh-charset.txt'), chinese);
for (const font of fonts) {
  const subset = await subsetFont(
    await upstream(font.source),
    font.script === 'latin' ? latin : chinese,
    { targetFormat: 'woff2', variationAxes: font.axes },
  );
  await writeFile(join(root, 'public/fonts', font.output), subset);
  await writeFile(
    join(root, 'public/fonts', font.licenseOutput),
    await upstream(font.license),
  );
  console.log(`${font.output}: ${subset.length} bytes`);
}
console.log(`${[...chinese].length} Chinese characters`);
