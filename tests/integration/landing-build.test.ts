import { readdir, readFile } from 'node:fs/promises';
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

  it('preloads Latin fonts everywhere and Chinese subsets only on the Chinese page', async () => {
    const preloads = async (path: string) =>
      [
        ...(await page(path)).querySelectorAll(
          'link[rel="preload"][as="font"]',
        ),
      ].map((link) => link.getAttribute('href'));
    const latin = [
      '/one23balloon/fonts/source-sans-3-latin.woff2',
      '/one23balloon/fonts/fraunces-latin.woff2',
    ];
    expect(await preloads('index.html')).toEqual(latin);
    expect(await preloads('zh/index.html')).toEqual([
      ...latin,
      '/one23balloon/fonts/noto-serif-sc-subset.woff2',
      '/one23balloon/fonts/noto-sans-sc-subset.woff2',
    ]);
    expect(await read('index.html')).toContain(
      'unicode-range: U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF',
    );
  });

  it('hides single-link navigation and keeps the language switcher', async () => {
    const document = await page('index.html');
    expect(
      document.querySelector('.site-header nav[aria-label="Main navigation"]'),
    ).toBeNull();
    expect(
      [...document.querySelectorAll('.language-switcher a')].map((link) => [
        link.getAttribute('lang'),
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['en', '/one23balloon/'],
      ['zh', '/one23balloon/zh/'],
    ]);
  });

  it('keeps the site description in the footer of pages without a footer slot', async () => {
    expect(await read('404.html')).toContain(
      'Balloon installations for weddings, launches, openings',
    );
  });

  it('renders every landing section in static HTML', async () => {
    for (const path of ['index.html', 'zh/index.html']) {
      const document = await page(path);
      expect(document.querySelectorAll('h1'), path).toHaveLength(1);
      expect(document.querySelectorAll('.service'), path).toHaveLength(6);
      expect(document.querySelectorAll('.gallery-item img'), path).toHaveLength(
        12,
      );
      expect(
        document.querySelectorAll('.sculpture-photos img'),
        path,
      ).toHaveLength(2);
      expect(
        [...document.querySelectorAll('[data-island]')].map((island) =>
          island.getAttribute('data-island'),
        ),
        path,
      ).toEqual(['hero', 'sculptures', 'release']);
      for (const image of document.querySelectorAll('main img'))
        expect(image.getAttribute('alt'), path).toBeTruthy();
      expect(document.querySelectorAll('.faq details'), path).toHaveLength(2);
      expect(document.querySelector('.steps'), path).toBeNull();
      expect(
        document.querySelector('[data-palette-picker]')?.hasAttribute('hidden'),
        path,
      ).toBe(true);
    }
  });

  it('gives each band a fixed palette and lets only hero and closing follow the picker', async () => {
    for (const path of ['index.html', 'zh/index.html']) {
      const document = await page(path);
      expect(
        [...document.querySelectorAll('.landing > section')].map((section) => [
          section.classList[0],
          section.getAttribute('data-palette'),
          section.hasAttribute('data-palette-follow'),
        ]),
        path,
      ).toEqual([
        ['hero', null, true],
        ['services', null, false],
        ['gallery', 'chrome-blue', false],
        ['sculptures', 'blush-champagne', false],
        ['venues', 'sage-cream', false],
        ['faq', 'rose-gold', false],
        ['closing', null, true],
      ]);
      // Every service card keeps its own palette inside the neutral band.
      expect(
        document.querySelectorAll('.services .service[data-palette]'),
        path,
      ).toHaveLength(6);

      const css = [...document.querySelectorAll('style')]
        .map((style) => style.textContent ?? '')
        .find((text) => text.includes('--tint:'));
      expect(css, path).toBeDefined();
      const selectors = [...css!.matchAll(/([^{}]+)\{--tint:[^}]+\}/g)].map(
        (match) => match[1]!,
      );
      expect(selectors.length, path).toBeGreaterThan(0);
      const landing = document.querySelector<HTMLElement>('[data-landing]')!;
      const followers = [
        ...document.querySelectorAll('[data-palette-follow]'),
      ];
      for (const id of [
        'blush-champagne',
        'chrome-blue',
        'sage-cream',
        'rose-gold',
        'jewel',
      ]) {
        landing.setAttribute('data-palette', id);
        // The picker's choice on the root must never tint the root itself,
        // or it would cascade into every fixed band.
        for (const selector of selectors)
          expect(landing.matches(selector), `${path} ${selector}`).toBe(false);
        for (const follower of followers)
          expect(
            selectors.some(
              (selector) =>
                selector.includes(`'${id}'`) && follower.matches(selector),
            ),
            `${path} ${id}`,
          ).toBe(true);
      }
    }
  });

  it('links every call to action to WhatsApp with the localized message', async () => {
    const wa = (text: string) =>
      `https://wa.me/60109017633?text=${encodeURIComponent(text)}`;
    const en = await page('index.html');
    const links = [...en.querySelectorAll('a[href^="https://wa.me/"]')].map(
      (link) => link.getAttribute('href'),
    );
    expect(links).toHaveLength(9);
    expect(links).toContain(
      wa("Hi one23balloon, I'd like to plan a balloon setup."),
    );
    expect(links).toContain(
      wa("Hi one23balloon, I'd like to ask about a car handover setup."),
    );
    const zh = await page('zh/index.html');
    expect(
      zh
        .querySelector('.site-header a[href^="https://wa.me/"]')
        ?.getAttribute('href'),
    ).toBe(wa('你好 one23balloon，我想咨询气球布置。'));
    expect(zh.querySelector('.landing-footer')?.textContent).toContain(
      '小红书',
    );
  });

  it('fails the build when the Chinese landing structure drifts', async () => {
    const zh = await readFile(
      new URL('../../src/content/landing/zh.yaml', import.meta.url),
      'utf8',
    );
    const drifted = await buildFixture({
      preset: 'project',
      content: {
        'src/content/landing/zh.yaml': zh.replace(
          "whatsapp: '60109017633'",
          "whatsapp: '60123456789'",
        ),
      },
    });
    try {
      expect(drifted.exitCode).not.toBe(0);
      expect(drifted.stdout + drifted.stderr).toContain(
        'must match en in: whatsapp',
      );
    } finally {
      await drifted.dispose();
    }
  }, 300_000);

  it('keeps Three.js out of the initial page script but ships it as a lazy chunk', async () => {
    const document = await page('index.html');
    const scripts = [...document.querySelectorAll('script[type="module"]')];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const src = script.getAttribute('src');
      const code = src
        ? await read(src.replace(/^\/one23balloon\//, ''))
        : (script.textContent ?? '');
      expect(code, src ?? 'inline script').not.toContain('WebGLRenderer');
    }
    const chunks = (await readdir(join(fixture.outputDir, '_astro'))).filter(
      (file) => file.endsWith('.js'),
    );
    const withThree = await Promise.all(
      chunks.map(async (file) =>
        (await read(`_astro/${file}`)).includes('WebGLRenderer'),
      ),
    );
    expect(withThree).toContain(true);
  });
});
