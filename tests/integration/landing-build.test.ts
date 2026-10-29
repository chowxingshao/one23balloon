import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFixture, exists } from '../helpers/build.ts';

let fixture: Awaited<ReturnType<typeof buildFixture>>;
beforeAll(async () => {
  fixture = await buildFixture({ preset: 'project' });
  expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
}, 300_000);
afterAll(async () => {
  await fixture?.dispose();
});
const read = (path: string) => readFile(join(fixture.outputDir, path), 'utf8');
const page = async (path: string) =>
  new JSDOM(await read(path)).window.document;
const origin = 'https://chowxingshao.github.io/one23balloon/';

describe('one23balloon site build', () => {
  it('publishes only the English and Chinese home pages', async () => {
    expect(await exists(fixture.outputDir, 'index.html')).toBe(true);
    expect(await exists(fixture.outputDir, 'zh/index.html')).toBe(true);
    for (const path of [
      'about/index.html',
      'contact/index.html',
      'blog/index.html',
      'projects/index.html',
      'rss.xml',
    ])
      expect(await exists(fixture.outputDir, path), path).toBe(false);
    const sitemap = await read('sitemap-0.xml');
    expect(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort(),
    ).toEqual([origin, `${origin}zh/`]);
  });

  it('sets document languages and reciprocal alternates under the project base', async () => {
    const expected = [
      ['en', origin],
      ['zh', `${origin}zh/`],
    ];
    for (const [path, lang] of [
      ['index.html', 'en'],
      ['zh/index.html', 'zh'],
    ] as const) {
      const document = await page(path);
      expect(document.documentElement.lang).toBe(lang);
      expect(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
          (link) => [link.getAttribute('hreflang'), link.getAttribute('href')],
        ),
      ).toEqual(expected);
    }
  });

  it('declares the LocalBusiness identity on both home pages', async () => {
    for (const path of ['index.html', 'zh/index.html']) {
      const document = await page(path);
      const data = JSON.parse(
        document.querySelector('script[type="application/ld+json"]')!
          .textContent!,
      );
      expect(data['@type'], path).toBe('LocalBusiness');
      expect(data.name).toBe('one23balloon');
      expect(data.telephone).toBe('+60 10-901 7633');
      expect(data.sameAs).toContain('https://www.instagram.com/one23balloon/');
    }
  });

  it('validates the Chinese landing content through the real collection loader', async () => {
    const zh = await readFile(
      new URL('../../src/content/landing/zh.yaml', import.meta.url),
      'utf8',
    );
    const invalid = await buildFixture({
      preset: 'project',
      content: {
        'src/content/landing/zh.yaml': zh.replace(
          'palette: rose-gold',
          'palette: neon',
        ),
      },
    });
    try {
      expect(invalid.exitCode).not.toBe(0);
      expect(invalid.stdout + invalid.stderr).toContain('palette');
    } finally {
      await invalid.dispose();
    }
  }, 300_000);
});
