# one23balloon Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the canvas-base demonstration with a bilingual (English and Simplified Chinese), WhatsApp-first, motion-heavy one-page landing site for one23balloon, with real-time Three.js balloons and photo fallbacks, hosted on GitHub Pages.

**Architecture:** Astro static output. Route and SEO identity stay in `src/content/pages/<locale>/home.md`; structured landing copy lives in a typed `landing` YAML data collection rendered by Astro components with all content in static HTML. Client scripts progressively enhance: a palette picker, GSAP motion, an engine-agnostic `canvas-island` lifecycle that lazily mounts Three.js scenes, and a once-per-session intro.

**Tech Stack:** Astro 7.3.7, TypeScript 6 strict, plain CSS, GSAP 3.15 + ScrollTrigger, Three.js 0.186.1, Vitest 5 + jsdom, sharp, subset-font 2.9.0.

**Spec:** `docs/superpowers/specs/2026-10-29-one23balloon-landing-design.md` (read it with this plan). Also read `brief.md` and `design-direction.md`.

## Global Constraints

- Static output only; strict TypeScript; plain CSS; no React; no new dependency beyond `three`, `@types/three`, `subset-font`.
- Exact dependency pins: `three@0.186.1`, `@types/three@0.186.0` (dev), `subset-font@2.9.0` (dev). Commit `pnpm-lock.yaml`.
- Every new dependency gets a README matrix row and a decision record.
- All content visible without JavaScript; reduced motion disables intro, 3D animation, pinning and marquee; no WebGL keeps photo fallbacks.
- UI copy lives in content (`src/content/landing/*.yaml`, `src/content/pages/*/home.md`, `src/content/ui.json`, `src/i18n/zh.json`); never hardcode copy in components.
- No prices. No client brand names or logos in copy or photos. No cartoon faces or licensed characters.
- Do not invent facts, reviews, statistics or FAQ answers. Unconfirmed steps and FAQ entries are `draft: true`.
- Config: `url: 'https://chowxingshao.github.io'`, `base: '/one23balloon/'`, locales `['en', 'zh']`, `deploy: 'github-pages'`, blog/projects/rss off.
- WhatsApp number in content: `'60109017633'` (pending client confirmation; recorded in `brief.md`).
- Conventional Commits; end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Gates before completion: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`. Do not publish, push, or change remote settings.
- Run all commands from the repository root. Shell examples use bash syntax.

## File map

| Path | Responsibility |
| --- | --- |
| `tests/helpers/demo.ts` | Canvas-base demo config and demo content for fixed-layer tests |
| `tests/fixtures/demo/*` | Moved demo pages, post, project, SVG; demo landing YAML and photo |
| `tests/helpers/build.ts` | `buildFixture` gains `preset: 'demo' \| 'project'` |
| `site.config.ts` | Client identity, locales, features |
| `src/i18n/zh.json` | Chinese UI dictionary |
| `src/content/pages/{en,zh}/home.md` | Route, SEO and LocalBusiness identity |
| `src/lib/contact/whatsapp.ts` | `wa.me` link builder |
| `src/lib/landing/palettes.ts` | Five celebration palettes (single source of truth for colours) |
| `src/lib/landing/contrast.ts` | WCAG contrast maths |
| `src/lib/landing/schema.ts` | Zod schema for landing YAML |
| `src/lib/landing/parity.ts` | Cross-locale structure comparison |
| `src/lib/landing/content.ts` | Loads landing data per locale with fallback and parity check |
| `src/lib/landing/events.ts` | Palette change event name |
| `src/lib/landing/intro-plan.ts` | Intro session rule and balloon-wall layout |
| `src/lib/random.ts` | Seeded RNG |
| `src/lib/fonts/charset.ts` | CJK character collection |
| `scripts/subset-fonts.ts` | Downloads and subsets fonts |
| `src/content/landing/{en,zh}.yaml` | Landing copy and photo references |
| `src/assets/work/*.jpg` | Client photos from Instagram |
| `docs/photo-sources.md` | Photo provenance and permission review |
| `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/landing.css` | Gala atelier styles |
| `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/PageView.astro` | Fonts, head slot, header CTA, footer slot, landing switch |
| `src/components/landing/*.astro` | Landing sections |
| `src/lib/canvas-island/{capability,lifecycle}.ts` | Engine-agnostic 3D island lifecycle |
| `src/scenes/*.ts` | Three.js balloon scenes |
| `src/scripts/{palette-picker,landing-motion,intro,landing}.ts` | Client behaviour |
| `tests/unit/*.test.ts`, `tests/integration/landing-build.test.ts` | Tests |

---

### Task 1: Keep template test coverage with a demo fixture preset

The fixed-layer tests assume the canvas-base demo config and demo content (about, contact, welcome post, example project). Move that content into test fixtures and make `buildFixture` default to a `demo` preset, so changing the real config and content later does not break template coverage.

**Files:**
- Move: `src/content/pages/en/about.md` → `tests/fixtures/demo/about.md`
- Move: `src/content/pages/en/contact.md` → `tests/fixtures/demo/contact.md`
- Move: `src/content/posts/en/welcome.mdx` → `tests/fixtures/demo/welcome.mdx`
- Move: `src/content/projects/en/example-project.md` → `tests/fixtures/demo/example-project.md`
- Move: `src/assets/example-project.svg` → `tests/fixtures/demo/example-project.svg`
- Create: `tests/helpers/demo.ts`
- Modify: `tests/helpers/build.ts`
- Modify: `tests/helpers/config.ts`

**Interfaces:**
- Produces: `demoSiteConfig` (canvas-base demo `SiteConfig`), `demoContent: Record<string, string>` (repo path → file contents), `projectOnlyPaths: string[]`; `buildFixture(options?: { config?; content?; preset?: 'demo' | 'project' })` where `preset` defaults to `'demo'`.

- [ ] **Step 1: Record the baseline**

Run: `pnpm test`
Expected: all tests pass. Note the count (the quality report lists 212 tests in 16 files at template release).

- [ ] **Step 2: Move the demo content into fixtures**

```bash
mkdir -p tests/fixtures/demo
git mv src/content/pages/en/about.md tests/fixtures/demo/about.md
git mv src/content/pages/en/contact.md tests/fixtures/demo/contact.md
git mv src/content/posts/en/welcome.mdx tests/fixtures/demo/welcome.mdx
git mv src/content/projects/en/example-project.md tests/fixtures/demo/example-project.md
git mv src/assets/example-project.svg tests/fixtures/demo/example-project.svg
touch src/content/posts/en/.gitkeep src/content/projects/en/.gitkeep
```

The `.gitkeep` files keep the collection directories so the glob loaders still find a base directory.

- [ ] **Step 3: Create `tests/helpers/demo.ts`**

```ts
import { readFileSync } from 'node:fs';
import type { SiteConfig } from '../../src/lib/config/schema.ts';

// The canvas-base demonstration identity. Fixed-layer tests build against it
// so they keep covering blog, projects, RSS and single-locale behaviour after
// the client configuration replaced those defaults.
export const demoSiteConfig = {
  name: 'Canvas Base',
  shortName: 'Canvas',
  description: 'A reusable static website starter.',
  url: 'https://example.com',
  base: '/',
  language: 'en',
  author: '',
  email: '',
  formEndpoint: '',
  social: {},
  analyticsId: '',
  defaultOgImage: '/og-default.png',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  features: {
    blog: true,
    projects: true,
    rss: true,
    motion: true,
    i18n: false,
    deploy: 'none',
  },
} satisfies SiteConfig;

const fixture = (name: string) =>
  readFileSync(new URL(`../fixtures/demo/${name}`, import.meta.url), 'utf8');

export const demoContent: Record<string, string> = {
  'src/content/pages/en/about.md': fixture('about.md'),
  'src/content/pages/en/contact.md': fixture('contact.md'),
  'src/content/posts/en/welcome.mdx': fixture('welcome.mdx'),
  'src/content/projects/en/example-project.md': fixture('example-project.md'),
  'src/assets/example-project.svg': fixture('example-project.svg'),
};

// Client-locale content that the single-locale demo config would reject.
export const projectOnlyPaths = [
  'src/content/pages/zh',
  'src/content/landing/zh.yaml',
  'src/i18n/zh.json',
];
```

- [ ] **Step 4: Add the preset to `buildFixture` in `tests/helpers/build.ts`**

Add the import below the existing `siteConfig` import:

```ts
import { demoContent, demoSiteConfig, projectOnlyPaths } from './demo.ts';
```

Change the options type of `buildFixture`:

```ts
export async function buildFixture(
  options: {
    config?: Partial<SiteConfig>;
    content?: Record<string, string>;
    preset?: 'demo' | 'project';
  } = {},
): Promise<{
```

Replace the block from `if (options.config) {` through the end of the `for (const [path, contents] of Object.entries(options.content ?? {})) { ... }` loop with:

```ts
    const preset = options.preset ?? 'demo';
    if (preset === 'demo')
      for (const path of projectOnlyPaths)
        await rm(resolveFixturePath(root, path), {
          recursive: true,
          force: true,
        });
    if (preset === 'demo' || options.config) {
      const config = deepMerge(
        preset === 'demo' ? demoSiteConfig : siteConfig,
        options.config ?? {},
      );
      await writeFile(
        join(root, 'site.config.ts'),
        `export const siteConfig = ${JSON.stringify(config, null, 2)};\n`,
      );
    }
    const content = {
      ...(preset === 'demo' ? demoContent : {}),
      ...options.content,
    };
    for (const [path, contents] of Object.entries(content)) {
      const target = resolveFixturePath(root, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, contents);
    }
```

- [ ] **Step 5: Point `withFeatures` at the demo config in `tests/helpers/config.ts`**

Replace the file with:

```ts
import {
  parseSiteConfig,
  type SiteConfig,
} from '../../src/lib/config/schema.ts';
import { demoSiteConfig } from './demo.ts';

export function withFeatures(
  flags: Partial<SiteConfig['features']>,
): SiteConfig {
  const fixture = structuredClone(demoSiteConfig);
  return parseSiteConfig({
    ...fixture,
    features: { ...fixture.features, ...flags },
  });
}
```

- [ ] **Step 6: Check nothing else referenced the moved files**

Run: `grep -rn "example-project.svg\|pages/en/about\|pages/en/contact\|welcome.mdx" src scripts docs/*.md README.md`
Expected: no matches in `src` or `scripts`. Documentation mentions (for example `docs/getting-started.md` naming `src/content/pages/en/contact.md`) are fixed in Task 19.

- [ ] **Step 7: Run the full suite**

Run: `pnpm test`
Expected: the same number of tests as Step 1, all passing.

- [ ] **Step 8: Commit**

```bash
git add -A tests src/content src/assets
git commit -m "test: run fixed-layer tests against a demo fixture preset

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Client identity, locales and GitHub Pages workflow

**Files:**
- Modify: `site.config.ts`
- Create (generated): `src/i18n/en.json`, `src/i18n/zh.json`, `.github/workflows/deploy.yml`
- Modify: `src/i18n/zh.json` (translate)
- Modify: `src/content/pages/en/home.md`, `src/content/pages/en/not-found.md`
- Create: `src/content/pages/zh/home.md`
- Create: `tests/integration/landing-build.test.ts`

**Interfaces:**
- Produces: `tests/integration/landing-build.test.ts` with a shared `project` build (`fixture`), and helpers `read(path)` and `page(path)` that later tasks append tests to.

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/landing-build.test.ts`:

```ts
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
const page = async (path: string) => new JSDOM(await read(path)).window.document;
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
        [
          ...document.querySelectorAll('link[rel="alternate"][hreflang]'),
        ].map((link) => [
          link.getAttribute('hreflang'),
          link.getAttribute('href'),
        ]),
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
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: FAIL (`zh/index.html` missing, alternates empty, no LocalBusiness data).

- [ ] **Step 3: Replace `site.config.ts`**

```ts
import type { SiteConfig } from './src/lib/config/schema.ts';

export const siteConfig = {
  name: 'one23balloon',
  shortName: 'one23balloon',
  description:
    'Balloon installations for weddings, launches, openings and milestone celebrations across Kuala Lumpur and Selangor.',
  url: 'https://chowxingshao.github.io',
  base: '/one23balloon/',
  language: 'en',
  author: 'one23balloon',
  email: '',
  formEndpoint: '',
  social: {
    instagram: 'https://www.instagram.com/one23balloon/',
    xiaohongshu: 'https://xhslink.com/m/625h2gZKgy6',
  },
  analyticsId: '',
  defaultOgImage: '/og-default.png',
  i18n: { defaultLocale: 'en', locales: ['en', 'zh'] },
  features: {
    blog: false,
    projects: false,
    rss: false,
    motion: true,
    i18n: true,
    deploy: 'github-pages',
  },
} satisfies SiteConfig;
```

(`defaultOgImage` changes to the client image in Task 6.)

- [ ] **Step 4: Generate the dictionaries and workflow**

Run: `pnpm configure:project`
Expected JSON output listing created `src/i18n/en.json`, `src/i18n/zh.json` and `.github/workflows/deploy.yml`. `brief.md` already exists and is preserved.

- [ ] **Step 5: Translate `src/i18n/zh.json`**

Replace the generated English copy with:

```json
{
  "starter": {
    "demoNotice": "演示数值：请在 site.config.ts 中替换网站标识与域名。",
    "nextStep": "请阅读 docs/getting-started.md 配置项目。"
  },
  "nav": {
    "home": "首页",
    "about": "关于",
    "contact": "联系",
    "blog": "博客",
    "projects": "作品"
  },
  "accessibility": {
    "skipContent": "跳到主要内容",
    "language": "语言",
    "theme": "颜色主题",
    "primaryNavigation": "主导航",
    "footerNavigation": "页脚导航"
  },
  "theme": {
    "light": "浅色",
    "dark": "深色",
    "system": "跟随系统"
  },
  "blog": {
    "title": "博客",
    "description": "文章与动态。",
    "empty": "暂无文章。"
  },
  "projects": {
    "title": "作品",
    "description": "精选作品与项目。",
    "empty": "暂无作品。"
  },
  "pagination": {
    "previous": "上一页",
    "next": "下一页"
  },
  "notFound": {
    "returnHome": "返回首页"
  },
  "contact": {
    "legend": "发送讯息",
    "required": "所有栏位均为必填。",
    "submit": "发送",
    "website": "网站",
    "unconfigured": "联系表单尚未设置。",
    "invalid": "请检查标示的栏位。",
    "spam": "无法提交此讯息。",
    "fields": {
      "name": {
        "label": "姓名",
        "required": "请输入姓名。"
      },
      "email": {
        "label": "电子邮件",
        "required": "请输入电子邮件地址。",
        "invalid": "请输入有效的电子邮件地址。"
      },
      "message": {
        "label": "讯息",
        "required": "请输入讯息。"
      }
    }
  }
}
```

The generated `.canvas/generated.json` ownership hash for `src/i18n/zh.json` no longer matches after translation. That is expected: the manifest is gitignored, and setup refuses to overwrite a modified dictionary.

- [ ] **Step 6: Replace `src/content/pages/en/home.md`**

```md
---
title: Balloon installations in Kuala Lumpur and Selangor
description: one23balloon designs custom balloon installations for weddings, grand openings, milestone birthdays, baby celebrations and car handovers across KL and Selangor.
slug: home
draft: false
structuredData:
  type: LocalBusiness
  name: one23balloon
  url: https://chowxingshao.github.io/one23balloon/
  telephone: '+60 10-901 7633'
  address: Kuala Lumpur and Selangor, Malaysia
  sameAs:
    - https://www.instagram.com/one23balloon/
    - https://xhslink.com/m/625h2gZKgy6
---
```

- [ ] **Step 7: Create `src/content/pages/zh/home.md`**

```md
---
title: 吉隆坡与雪兰莪气球布置
description: one23balloon 为婚礼、开业、生日、宝宝宴与提车仪式量身设计气球布置，服务吉隆坡与雪兰莪。
slug: home
draft: false
structuredData:
  type: LocalBusiness
  name: one23balloon
  url: https://chowxingshao.github.io/one23balloon/zh/
  telephone: '+60 10-901 7633'
  address: Kuala Lumpur and Selangor, Malaysia
  sameAs:
    - https://www.instagram.com/one23balloon/
    - https://xhslink.com/m/625h2gZKgy6
---
```

- [ ] **Step 8: Replace `src/content/pages/en/not-found.md`**

```md
---
title: Page not found
description: This page has floated away.
slug: not-found
draft: false
---

The page you were looking for is not here. Return to the home page to see our latest celebrations.
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 10: Run the full suite and commit**

Run: `pnpm test`
Expected: all pass (the demo preset isolates the template tests from the new config).

```bash
git add site.config.ts src/i18n src/content/pages .github/workflows/deploy.yml tests/integration/landing-build.test.ts
git commit -m "feat: configure one23balloon identity, en/zh locales and GitHub Pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: WhatsApp link helper

**Files:**
- Create: `src/lib/contact/whatsapp.ts`
- Test: `tests/unit/whatsapp.test.ts`

**Interfaces:**
- Produces: `whatsappUrl(number: string, message: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { whatsappUrl } from '../../src/lib/contact/whatsapp.ts';

describe('whatsappUrl', () => {
  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappUrl('60109017633', 'Hi, a setup in Rose & gold?')).toBe(
      'https://wa.me/60109017633?text=Hi%2C%20a%20setup%20in%20Rose%20%26%20gold%3F',
    );
  });

  it('encodes Chinese text and trims whitespace', () => {
    expect(whatsappUrl('60109017633', '  你好  ')).toBe(
      'https://wa.me/60109017633?text=%E4%BD%A0%E5%A5%BD',
    );
  });

  it.each(['+60109017633', '010-9017633', '601090', '6010901763312345'])(
    'rejects the number %s',
    (number) => {
      expect(() => whatsappUrl(number, 'Hi')).toThrow(/digits/);
    },
  );

  it('rejects an empty message', () => {
    expect(() => whatsappUrl('60109017633', '   ')).toThrow(/empty/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/whatsapp.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/contact/whatsapp.ts`**

```ts
const internationalDigits = /^\d{10,15}$/;

export function whatsappUrl(number: string, message: string): string {
  if (!internationalDigits.test(number))
    throw new Error(
      `WhatsApp numbers must be 10–15 digits starting with the country code: ${number}`,
    );
  const text = message.trim();
  if (!text) throw new Error('A WhatsApp message must not be empty.');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/unit/whatsapp.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/contact/whatsapp.ts tests/unit/whatsapp.test.ts
git commit -m "feat: add WhatsApp link builder

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Celebration palettes and contrast checks

**Files:**
- Create: `src/lib/landing/palettes.ts`
- Create: `src/lib/landing/contrast.ts`
- Test: `tests/unit/palettes.test.ts`

**Interfaces:**
- Produces: `paletteIds` (readonly tuple), `type PaletteId`, `type Material = 'latex' | 'pearl' | 'chrome'`, `type PaletteColour = { hex: string; material: Material }`, `type Palette = { tint: string; tintDark: string; colours: readonly PaletteColour[] }`, `palettes: Record<PaletteId, Palette>`, `defaultPaletteId: PaletteId`, `isPaletteId(value: string): value is PaletteId`; `luminance(hex: string): number`, `contrastRatio(a: string, b: string): number`.

- [ ] **Step 1: Write the failing test**

```ts
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
      expect(contrastRatio(light.rose, background)).toBeGreaterThanOrEqual(
        4.5,
      );
    for (const background of ['#171311', '#241E1B'])
      expect(contrastRatio(dark.rose, background)).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/palettes.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/landing/contrast.ts`**

```ts
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Expected a #RRGGBB colour: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Implement `src/lib/landing/palettes.ts`**

```ts
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
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm vitest run tests/unit/palettes.test.ts`
Expected: PASS. If any tint fails contrast, darken or lighten only that tint (keep the hue) and update `design-direction.md` to match.

- [ ] **Step 6: Commit**

```bash
git add src/lib/landing tests/unit/palettes.test.ts
git commit -m "feat: add celebration palettes with contrast checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Landing content schema, parity and loader

**Files:**
- Create: `src/lib/landing/schema.ts`
- Create: `src/lib/landing/parity.ts`
- Create: `src/lib/landing/content.ts`
- Create: `src/content/landing/.gitkeep`
- Modify: `src/content.config.ts`
- Test: `tests/unit/landing-schema.test.ts`

**Interfaces:**
- Consumes: `paletteIds` (Task 4).
- Produces: `serviceIds` = `['weddings', 'openings', 'birthdays', 'baby', 'cars', 'bouquets']`, `type ServiceId`, `sculptureIds` = `['dog', 'tulips', 'cake']`, `createLandingSchema(image)`; `type ParityInput`, `parityProblems(reference: ParityInput, other: ParityInput): string[]`; `type LandingData = CollectionEntry<'landing'>['data']`, `getLanding(locale: string): Promise<{ data: LandingData; locale: string }>`.

The schema shape (field names used by every later task):

```
whatsapp
meta { instagramLabel, xiaohongshuLabel, registration, rights }
intro { skip }
hero { eyebrow, title, lede, cta, message, photo }
palettes { label, items[5] { id, name, message } }
services { title, lede, cta, items[6] { id, title, body, palette, message, photo } }
gallery { title, lede, more, items[12] { image, alt, source, location, theme, colours[1..4] { hex, name } } }
sculptures { title, lede, pieces[3] { id, name }, photos[2] { image, alt, source, caption } }
venues { title, items[4+] }
steps { draft, title, items[3] { title, body } }
faq { title, items[] { question, answer, draft } }
closing { title, body, cta, message, photo }
photo = { image, alt, source }
```

- [ ] **Step 1: Write the failing test**

Create `tests/unit/landing-schema.test.ts`:

```ts
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { parityProblems } from '../../src/lib/landing/parity.ts';
import {
  createLandingSchema,
  sculptureIds,
  serviceIds,
} from '../../src/lib/landing/schema.ts';
import { paletteIds } from '../../src/lib/landing/palettes.ts';

const image = (() => z.string()) as unknown as SchemaContext['image'];
const schema = createLandingSchema(image);
const post = (n: number) => `https://www.instagram.com/p/POST${n}/`;
const photo = (n: number) => ({ image: `photo-${n}.jpg`, alt: 'A balloon arch', source: post(n) });

function valid() {
  return {
    whatsapp: '60109017633',
    meta: { instagramLabel: 'Instagram', xiaohongshuLabel: 'Xiaohongshu', registration: 'SSM CT0152510-K', rights: 'All rights reserved.' },
    intro: { skip: 'Skip intro' },
    hero: { eyebrow: 'KL', title: 'Title', lede: 'Lede', cta: 'WhatsApp us', message: 'Hi', photo: photo(0) },
    palettes: { label: 'Choose a palette', items: paletteIds.map((id) => ({ id, name: id, message: `Hi ${id}` })) },
    services: {
      title: 'Services', lede: 'Lede', cta: 'Ask',
      items: serviceIds.map((id, i) => ({ id, title: id, body: 'Body', palette: paletteIds[i % 5], message: `Hi ${id}`, photo: photo(10 + i) })),
    },
    gallery: {
      title: 'Work', lede: 'Lede', more: 'More',
      items: Array.from({ length: 12 }, (_, i) => ({ ...photo(20 + i), location: 'KL', theme: 'Birthday', colours: [{ hex: '#E8B4B2', name: 'Pink' }] })),
    },
    sculptures: {
      title: 'Sculptures', lede: 'Lede',
      pieces: sculptureIds.map((id) => ({ id, name: id })),
      photos: [ { ...photo(40), caption: 'Lion dance' }, { ...photo(41), caption: 'Roses' } ],
    },
    venues: { title: 'Venues', items: ['Hotels', 'Homes', 'KTV rooms', 'Restaurants'] },
    steps: { draft: true, title: 'How it works', items: [1, 2, 3].map((n) => ({ title: `Step ${n}`, body: 'Body' })) },
    faq: { title: 'FAQ', items: [{ question: 'Where?', answer: 'KL and Selangor.', draft: false }] },
    closing: { title: 'Compose', body: 'Body', cta: 'Start', message: 'Hi', photo: photo(50) },
  };
}

describe('landing schema', () => {
  it('accepts complete landing content', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });

  it.each([
    ['an empty alt', (d: ReturnType<typeof valid>) => { d.hero.photo.alt = ' '; }],
    ['an unknown palette', (d: ReturnType<typeof valid>) => { d.services.items[0].palette = 'neon' as never; }],
    ['a non-Instagram source', (d: ReturnType<typeof valid>) => { d.gallery.items[0].source = 'https://example.com/p/1/'; }],
    ['a formatted phone number', (d: ReturnType<typeof valid>) => { d.whatsapp = '010-9017633'; }],
    ['a missing gallery photo', (d: ReturnType<typeof valid>) => { d.gallery.items.pop(); }],
    ['a duplicated service', (d: ReturnType<typeof valid>) => { d.services.items[1].id = 'weddings'; }],
    ['a duplicated palette', (d: ReturnType<typeof valid>) => { d.palettes.items[1].id = 'blush-champagne'; }],
    ['too many colours', (d: ReturnType<typeof valid>) => { d.gallery.items[0].colours = Array(5).fill({ hex: '#FFFFFF', name: 'White' }); }],
    ['an unknown field', (d: ReturnType<typeof valid>) => { (d.hero as Record<string, unknown>).price = 'RM299'; }],
  ])('rejects %s', (_name, mutate) => {
    const data = valid();
    mutate(data);
    expect(schema.safeParse(data).success).toBe(false);
  });
});

describe('landing parity', () => {
  it('accepts translations with the same structure', () => {
    const zh = valid();
    zh.hero.title = '标题';
    expect(parityProblems(valid(), zh)).toEqual([]);
  });

  it('reports structural differences by section', () => {
    const zh = valid();
    zh.gallery.items.reverse();
    zh.faq.items[0].draft = true;
    zh.whatsapp = '60123456789';
    expect(parityProblems(valid(), zh)).toEqual(['whatsapp', 'gallery', 'faq']);
  });
});
```

Run `pnpm prettier --write tests/unit/landing-schema.test.ts` after creating it; the compact fixture lines above are reformatted by Prettier.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/landing-schema.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/landing/schema.ts`**

```ts
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { paletteIds } from './palettes.ts';

export const serviceIds = [
  'weddings',
  'openings',
  'birthdays',
  'baby',
  'cars',
  'bouquets',
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const sculptureIds = ['dog', 'tulips', 'cake'] as const;

const text = z.string().trim().min(1);
const instagramPost = z
  .string()
  .regex(
    /^https:\/\/www\.instagram\.com\/(?:[\w.]+\/)?(?:p|reel)\/[\w-]+\/$/,
    'Use the Instagram post URL the photo came from.',
  );
const unique =
  <T>(key: (item: T) => string, label: string) =>
  (items: T[], context: z.RefinementCtx) => {
    const seen = new Set(items.map(key));
    if (seen.size !== items.length)
      context.addIssue({ code: 'custom', message: `${label} must be unique.` });
  };

export function createLandingSchema(image: SchemaContext['image']) {
  const photo = z.strictObject({
    image: image(),
    alt: text,
    source: instagramPost,
  });
  const palette = z.enum(paletteIds);
  return z.strictObject({
    whatsapp: z.string().regex(/^\d{10,15}$/, 'Digits only, country code first.'),
    meta: z.strictObject({
      instagramLabel: text,
      xiaohongshuLabel: text,
      registration: text,
      rights: text,
    }),
    intro: z.strictObject({ skip: text }),
    hero: z.strictObject({
      eyebrow: text,
      title: text,
      lede: text,
      cta: text,
      message: text,
      photo,
    }),
    palettes: z.strictObject({
      label: text,
      items: z
        .array(z.strictObject({ id: palette, name: text, message: text }))
        .length(paletteIds.length)
        .superRefine(unique((item) => item.id, 'Palette ids')),
    }),
    services: z.strictObject({
      title: text,
      lede: text,
      cta: text,
      items: z
        .array(
          z.strictObject({
            id: z.enum(serviceIds),
            title: text,
            body: text,
            palette,
            message: text,
            photo,
          }),
        )
        .length(serviceIds.length)
        .superRefine(unique((item) => item.id, 'Service ids')),
    }),
    gallery: z.strictObject({
      title: text,
      lede: text,
      more: text,
      items: z
        .array(
          photo.extend({
            location: text,
            theme: text,
            colours: z
              .array(
                z.strictObject({
                  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
                  name: text,
                }),
              )
              .min(1)
              .max(4),
          }),
        )
        .length(12),
    }),
    sculptures: z.strictObject({
      title: text,
      lede: text,
      pieces: z
        .array(z.strictObject({ id: z.enum(sculptureIds), name: text }))
        .length(sculptureIds.length)
        .superRefine(unique((item) => item.id, 'Sculpture ids')),
      photos: z.array(photo.extend({ caption: text })).length(2),
    }),
    venues: z.strictObject({ title: text, items: z.array(text).min(4) }),
    steps: z.strictObject({
      draft: z.boolean(),
      title: text,
      items: z.array(z.strictObject({ title: text, body: text })).length(3),
    }),
    faq: z.strictObject({
      title: text,
      items: z.array(
        z.strictObject({ question: text, answer: text, draft: z.boolean() }),
      ),
    }),
    closing: z.strictObject({
      title: text,
      body: text,
      cta: text,
      message: text,
      photo,
    }),
  });
}
```

- [ ] **Step 4: Implement `src/lib/landing/parity.ts`**

```ts
type Photo = { source: string };

export type ParityInput = {
  whatsapp: string;
  hero: { photo: Photo };
  palettes: { items: Array<{ id: string }> };
  services: { items: Array<{ id: string; palette: string; photo: Photo }> };
  gallery: { items: Photo[] };
  sculptures: { pieces: Array<{ id: string }>; photos: Photo[] };
  venues: { items: string[] };
  steps: { draft: boolean; items: unknown[] };
  faq: { items: Array<{ draft: boolean }> };
  closing: { photo: Photo };
};

// Translations may change words, never structure, photos or the contact number.
function fingerprint(data: ParityInput): Record<string, string> {
  return {
    whatsapp: data.whatsapp,
    hero: data.hero.photo.source,
    palettes: JSON.stringify(data.palettes.items.map((item) => item.id)),
    services: JSON.stringify(
      data.services.items.map((item) => [item.id, item.palette, item.photo.source]),
    ),
    gallery: JSON.stringify(data.gallery.items.map((item) => item.source)),
    sculptures: JSON.stringify([
      data.sculptures.pieces.map((piece) => piece.id),
      data.sculptures.photos.map((photo) => photo.source),
    ]),
    venues: String(data.venues.items.length),
    steps: JSON.stringify([data.steps.draft, data.steps.items.length]),
    faq: JSON.stringify(data.faq.items.map((item) => item.draft)),
    closing: data.closing.photo.source,
  };
}

export function parityProblems(
  reference: ParityInput,
  other: ParityInput,
): string[] {
  const expected = fingerprint(reference);
  const actual = fingerprint(other);
  return Object.keys(expected).filter((key) => expected[key] !== actual[key]);
}
```

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `pnpm vitest run tests/unit/landing-schema.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 6: Implement `src/lib/landing/content.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import { getSiteConfig } from '../config/site.ts';
import { enabledLocales } from '../routing/paths.ts';
import { parityProblems } from './parity.ts';

export type LandingData = CollectionEntry<'landing'>['data'];
export type LocalizedLanding = { data: LandingData; locale: string };

let cache: Promise<Map<string, LandingData>> | undefined;

async function loadLanding(): Promise<Map<string, LandingData>> {
  const config = getSiteConfig();
  const { defaultLocale } = config.i18n;
  const entries = new Map(
    (await getCollection('landing')).map((entry) => [entry.id, entry.data]),
  );
  const reference = entries.get(defaultLocale);
  if (!reference)
    throw new Error(`Missing landing content for ${defaultLocale}.`);
  for (const locale of enabledLocales(config)) {
    const data = entries.get(locale);
    if (!data || locale === defaultLocale) continue;
    const problems = parityProblems(reference, data);
    if (problems.length)
      throw new Error(
        `Landing content for ${locale} must match ${defaultLocale} in: ${problems.join(', ')}.`,
      );
  }
  return entries;
}

export async function getLanding(locale: string): Promise<LocalizedLanding> {
  cache ??= loadLanding();
  const entries = await cache;
  const data = entries.get(locale);
  if (data) return { data, locale };
  const { defaultLocale } = getSiteConfig().i18n;
  console.warn(`Missing landing translation (${locale}); using ${defaultLocale}.`);
  return { data: entries.get(defaultLocale)!, locale: defaultLocale };
}
```

- [ ] **Step 7: Register the collection in `src/content.config.ts`**

Add the import:

```ts
import { createLandingSchema } from './lib/landing/schema.ts';
```

Add to `collections`:

```ts
  landing: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/landing' }),
    schema: ({ image }) => createLandingSchema(image),
  }),
```

Create the directory: `touch src/content/landing/.gitkeep`.

- [ ] **Step 8: Type-check and run the suite**

Run: `pnpm check`
Expected: 0 errors (Astro syncs the `landing` collection types; `LandingData` resolves).

Run: `pnpm test`
Expected: all pass. The landing collection is empty and unused until Task 10, so builds only warn.

- [ ] **Step 9: Commit**

```bash
git add src/lib/landing src/content.config.ts src/content/landing/.gitkeep tests/unit/landing-schema.test.ts
git commit -m "feat: add typed landing content collection with locale parity

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Select and save client photos from Instagram

This task uses the in-app browser, logged in to Instagram by the user, plus `curl` for downloads. The user explicitly asked for the photos to be chosen and saved from the client's Instagram.

**Files:**
- Create: `src/assets/work/*.jpg` (22 photos)
- Create: `public/og-one23balloon.jpg`
- Create: `docs/photo-sources.md`
- Modify: `site.config.ts` (`defaultOgImage`)

**Interfaces:**
- Produces: these exact file names in `src/assets/work/`, consumed by Task 7:
  `hero-arch.jpg`, `service-weddings.jpg`, `service-openings.jpg`, `service-birthdays.jpg`, `service-baby.jpg`, `service-cars.jpg`, `service-bouquets.jpg`, `gallery-01.jpg` … `gallery-12.jpg`, `sculpture-lion-dance.jpg`, `sculpture-roses.jpg`, `closing.jpg`.
- Produces: `docs/photo-sources.md` with one row per file (file, post URL, subject, faces, notes).

**Selection rules (reject a candidate if any fails):**
1. No recognisable customer face as the main subject. A small, incidental figure is acceptable but must be listed for client permission.
2. No client brand names or logos readable in the frame (shop signage, company names on backdrops, restaurant names). A car badge is acceptable on a car handover.
3. No licensed characters (Miffy, Sanrio, Kuromi, Hello Kitty, Disney, Pokémon, Minecraft).
4. No text overlays added in editing. Personal names printed on a backdrop are acceptable.
5. Sharp, well lit, the setup fills most of the frame; prefer width ≥ 1000px.

**Candidates (shortcode → slot; first is preferred, then backups in order):**

| Slot | Candidates |
| --- | --- |
| `hero-arch.jpg` | Dd0QfR4yIIR, DcsLChQyV8G, Dcc7YApSTZ2 |
| `service-weddings.jpg` | DaDTmrpSMZP, DLXYr0ayjBy, DKRvYfQScoT |
| `service-openings.jpg` | DR1lWIxEpdm, DS434OuklLZ, DL7cZiQyiVw |
| `service-birthdays.jpg` | De1fts-ya9W, DdMBn2dSqP2, DeOBzd-Sdfz |
| `service-baby.jpg` | DbkiXb0yeRf, Dcz-Q7pyh3y, DRXMjz0kkxn |
| `service-cars.jpg` | DSRfJm9ksre, DTF5wQHEo18 |
| `service-bouquets.jpg` | DJRXloTyrxN, DIZBcObyMMH, DKZkEhgy7Wi |
| `gallery-01` … `gallery-12` | In order: Dcc7YApSTZ2, DcsLChQyV8G, Dcpi_vnS3oh, DdMBn2dSqP2, DcXiOiHypZh, DeOBzd-Sdfz, DbCzWYSSPC-, Db0SD9-yMk-, DY9zUWASOrP, DS434OuklLZ, DRXMjz0kkxn, DL7cZiQyiVw. Backups: DLNCqtLSXox, DbLNJLBSwK6, DJ4DiyVSs6L, DKox12cytK8, Dcz-Q7pyh3y, DOJAUttEq3e |
| `sculpture-lion-dance.jpg` | DKwnkaHSwgy |
| `sculpture-roses.jpg` | DIOYWW3y1D_, DIZBcObyMMH |
| `closing.jpg` | DKmPFhHytgH, DL7cZiQyiVw |

A photo may fill only one slot. If a gallery candidate was used for a service, take the next backup.

- [ ] **Step 1: Resolve the highest-resolution image URL for every candidate**

Navigate the in-app browser to `https://www.instagram.com/one23balloon/` (logged in), then run in the page with the browser's JavaScript tool:

```js
async function bestImage(code) {
  const html = await (await fetch(`/p/${code}/`)).text();
  let match = html.match(/"image_versions2":\{"candidates":(\[[^\]]*\])/);
  let raw = match?.[1];
  if (!raw) {
    const escaped = html.match(/\\"image_versions2\\":\{\\"candidates\\":(\[[^\]]*\])/);
    if (escaped) raw = JSON.parse(`"${escaped[1]}"`);
  }
  if (!raw) {
    const og = html.match(/<meta property="og:image" content="([^"]+)"/);
    const t = document.createElement('textarea');
    t.innerHTML = og?.[1] ?? '';
    return { code, url: t.value, width: 0, height: 0, via: 'og:image' };
  }
  const best = JSON.parse(raw).reduce((a, b) => (b.width > a.width ? b : a));
  return { code, url: best.url, width: best.width, height: best.height, via: 'candidates' };
}
const codes = ['Dd0QfR4yIIR','DcsLChQyV8G','Dcc7YApSTZ2','DaDTmrpSMZP','DLXYr0ayjBy','DKRvYfQScoT','DR1lWIxEpdm','DS434OuklLZ','DL7cZiQyiVw','De1fts-ya9W','DdMBn2dSqP2','DeOBzd-Sdfz','DbkiXb0yeRf','Dcz-Q7pyh3y','DRXMjz0kkxn','DSRfJm9ksre','DTF5wQHEo18','DJRXloTyrxN','DIZBcObyMMH','DKZkEhgy7Wi','Dcpi_vnS3oh','DcXiOiHypZh','DbCzWYSSPC-','Db0SD9-yMk-','DY9zUWASOrP','DLNCqtLSXox','DbLNJLBSwK6','DJ4DiyVSs6L','DKox12cytK8','DOJAUttEq3e','DKwnkaHSwgy','DIOYWW3y1D_','DKmPFhHytgH'];
const results = [];
for (const code of codes) results.push(await bestImage(code));
JSON.stringify(results);
```

Copy the returned JSON into `$SCRATCH/photo-candidates.json`, where `$SCRATCH` is the session scratchpad directory (not the repository).

- [ ] **Step 2: Review each candidate against the selection rules**

For each slot in order, open the candidate `url` in the browser (navigate to it directly) and take a screenshot. Apply the five selection rules. Pick the first candidate that passes. Record any face, signage or doubt in your notes for `docs/photo-sources.md`.

- [ ] **Step 3: Download the chosen photos**

```bash
mkdir -p src/assets/work
curl -sSfL "<chosen url>" -o src/assets/work/hero-arch.jpg
```

Repeat for every slot with its chosen URL and file name. Quote each URL, because they contain `&`.

- [ ] **Step 4: Verify every file**

```bash
node --input-type=module -e "
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const files = readdirSync('src/assets/work').filter((f) => f.endsWith('.jpg')).sort();
for (const f of files) { const m = await sharp('src/assets/work/' + f).metadata(); console.log(f, m.width + 'x' + m.height, m.format); }
console.log(files.length, 'files');
"
```

Expected: 22 files, all `jpeg`, widths ≥ 640 (note any below 1000 in `docs/photo-sources.md`).

- [ ] **Step 5: Create the social sharing image**

```bash
node --input-type=module -e "
import sharp from 'sharp';
await sharp('src/assets/work/hero-arch.jpg').resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og-one23balloon.jpg');
"
```

In `site.config.ts`, set `defaultOgImage: '/og-one23balloon.jpg',`. Keep `public/og-default.png` (the demo fixture config uses it).

- [ ] **Step 6: Write `docs/photo-sources.md`**

```md
# Photo sources

All photos are the client's own work, downloaded from https://www.instagram.com/one23balloon/ on <date> at the highest resolution Instagram served. Before launch the client must confirm permission for every row marked in the Faces column.

| File | Post | Subject | Faces | Notes |
| --- | --- | --- | --- | --- |
| hero-arch.jpg | https://www.instagram.com/p/<code>/ | <one-line description> | none / incidental / main | <size, signage, caveats> |
```

Fill one row per file (22 rows) with the chosen shortcodes and your review notes. Add every "incidental" or "main" faces row to the pending checklist in `brief.md` under "Permission to show each photo with a recognisable customer face".

- [ ] **Step 7: Commit**

```bash
git add src/assets/work public/og-one23balloon.jpg docs/photo-sources.md site.config.ts brief.md
git commit -m "feat: add client photos selected from Instagram

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Landing copy in English and Chinese, and the demo landing fixture

**Files:**
- Create: `src/content/landing/en.yaml`, `src/content/landing/zh.yaml`
- Delete: `src/content/landing/.gitkeep`
- Create: `tests/fixtures/demo/landing.yaml`, `tests/fixtures/demo/photo.jpg`
- Modify: `tests/helpers/demo.ts`
- Modify: `tests/integration/landing-build.test.ts`

**Interfaces:**
- Consumes: schema field names (Task 5), photo file names (Task 6), `docs/photo-sources.md`.
- Produces: real landing content for `en` and `zh`; `demoContent['src/content/landing/en.yaml']`.

The YAML below assumes the preferred candidate filled every slot. Where Task 6 chose a backup, change that entry's `source` to the chosen post, and rewrite `alt`, `location`, `theme` and `colours` from the photo and the post caption. In every case, check each `alt` and `colours` entry against the actual photo and correct it. Locations are areas or venue types, never business names.

- [ ] **Step 1: Write the failing test**

Append to the `describe` block in `tests/integration/landing-build.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/integration/landing-build.test.ts -t "Chinese landing content"`
Expected: FAIL (`zh.yaml` does not exist).

- [ ] **Step 3: Create `src/content/landing/en.yaml`**

```yaml
whatsapp: '60109017633'
meta:
  instagramLabel: Instagram
  xiaohongshuLabel: Xiaohongshu
  registration: SSM CT0152510-K
  rights: All rights reserved.
intro:
  skip: Skip intro
hero:
  eyebrow: Kuala Lumpur and Selangor
  title: Celebrations, composed in colour
  lede: Custom balloon installations for weddings, grand openings, milestone birthdays and baby celebrations, designed around your palette and styled on site.
  cta: WhatsApp us
  message: Hi one23balloon, I'd like to plan a balloon setup.
  photo:
    image: ../../assets/work/hero-arch.jpg
    alt: A creamy beige balloon garland around an arched panel with an oversized pink satin bow.
    source: https://www.instagram.com/p/Dd0QfR4yIIR/
palettes:
  label: Choose a palette
  items:
    - id: blush-champagne
      name: Blush and champagne
      message: Hi one23balloon, I'd like a setup in Blush and champagne.
    - id: chrome-blue
      name: Chrome blue and silver
      message: Hi one23balloon, I'd like a setup in Chrome blue and silver.
    - id: sage-cream
      name: Sage and cream
      message: Hi one23balloon, I'd like a setup in Sage and cream.
    - id: rose-gold
      name: Rose and gold
      message: Hi one23balloon, I'd like a setup in Rose and gold.
    - id: jewel
      name: Jewel tones
      message: Hi one23balloon, I'd like a setup in Jewel tones.
services:
  title: Celebrations we style
  lede: Every setup starts from your occasion, your space and your colours.
  cta: Ask on WhatsApp
  items:
    - id: weddings
      title: Weddings and proposals
      body: Garlands, arches and bouquets for proposals, registrations, bride-to-be parties and the big day.
      palette: rose-gold
      message: Hi one23balloon, I'd like to ask about balloon styling for a wedding or proposal.
      photo:
        image: ../../assets/work/service-weddings.jpg
        alt: A wedding balloon setup with an arched backdrop.
        source: https://www.instagram.com/p/DaDTmrpSMZP/
    - id: openings
      title: Grand openings and corporate events
      body: Statement backdrops for openings, anniversaries, annual dinners, launches and live-stream rooms.
      palette: chrome-blue
      message: Hi one23balloon, I'd like to ask about balloon styling for an opening or corporate event.
      photo:
        image: ../../assets/work/service-openings.jpg
        alt: A grand opening backdrop with a black satin bow and white balloons.
        source: https://www.instagram.com/p/DR1lWIxEpdm/
    - id: birthdays
      title: Milestone birthdays
      body: Surprises in hotel suites, Airbnbs, KTV rooms, restaurants and at home, from 18th to 90th.
      palette: blush-champagne
      message: Hi one23balloon, I'd like to ask about a birthday balloon setup.
      photo:
        image: ../../assets/work/service-birthdays.jpg
        alt: A hotel room birthday setup in pastel blue, white and silver balloons with moon and star details.
        source: https://www.instagram.com/p/De1fts-ya9W/
    - id: baby
      title: Baby celebrations and gender reveals
      body: Full-month, 100-day and first-birthday parties, and gender reveals styled in soft, timeless palettes.
      palette: sage-cream
      message: Hi one23balloon, I'd like to ask about a baby celebration or gender reveal setup.
      photo:
        image: ../../assets/work/service-baby.jpg
        alt: A pearl white first-birthday setup with a traditional celebration corner.
        source: https://www.instagram.com/p/DbkiXb0yeRf/
    - id: cars
      title: Car handovers
      body: Bows, balloon clusters and a proper reveal for a new car, at home or at the showroom.
      palette: jewel
      message: Hi one23balloon, I'd like to ask about a car handover setup.
      photo:
        image: ../../assets/work/service-cars.jpg
        alt: A white car with a red bow surrounded by silver and white balloons.
        source: https://www.instagram.com/p/DSRfJm9ksre/
    - id: bouquets
      title: Bouquets and balloon sculptures
      body: Hand-twisted roses, tulips, giant balloon cakes and lion dancers, made to give.
      palette: blush-champagne
      message: Hi one23balloon, I'd like to ask about balloon bouquets or sculptures.
      photo:
        image: ../../assets/work/service-bouquets.jpg
        alt: A bouquet of white twisted-balloon tulips.
        source: https://www.instagram.com/p/DJRXloTyrxN/
gallery:
  title: Recent work
  lede: A few of the celebrations we have styled lately.
  more: See more on Instagram
  items:
    - image: ../../assets/work/gallery-01.jpg
      alt: A champagne gold and white balloon arch at a restaurant.
      source: https://www.instagram.com/p/Dcc7YApSTZ2/
      location: Restaurant, Kuala Lumpur
      theme: 21st birthday
      colours:
        - { hex: '#D9B47A', name: Champagne gold }
        - { hex: '#FBF4EC', name: White }
    - image: ../../assets/work/gallery-02.jpg
      alt: A pink and white balloon garland around a round arch.
      source: https://www.instagram.com/p/DcsLChQyV8G/
      location: Kuala Lumpur
      theme: 21st birthday
      colours:
        - { hex: '#E8A0A8', name: Pink }
        - { hex: '#FFF5EE', name: White }
    - image: ../../assets/work/gallery-03.jpg
      alt: Chrome blue and gold balloons for a family birthday dinner.
      source: https://www.instagram.com/p/Dcpi_vnS3oh/
      location: Family dinner
      theme: 90th birthday
      colours:
        - { hex: '#6F8FB8', name: Chrome blue }
        - { hex: '#D4AF6A', name: Chrome gold }
    - image: ../../assets/work/gallery-04.jpg
      alt: Pink number balloons and a large pink bow on a white backdrop.
      source: https://www.instagram.com/p/DdMBn2dSqP2/
      location: Kuala Lumpur
      theme: 22nd birthday
      colours:
        - { hex: '#E8B4B2', name: Pink }
        - { hex: '#FBF4EC', name: White }
    - image: ../../assets/work/gallery-05.jpg
      alt: A rainbow balloon setup with a soft fabric backdrop and an oversized white bow.
      source: https://www.instagram.com/p/DcXiOiHypZh/
      location: Live-stream room
      theme: First anniversary
      colours:
        - { hex: '#C9B6E4', name: Lilac }
        - { hex: '#A9C3E0', name: Sky blue }
        - { hex: '#F2D98B', name: Lemon }
        - { hex: '#FBF4EC', name: White }
    - image: ../../assets/work/gallery-06.jpg
      alt: Black, silver and white balloons on a hotel bed.
      source: https://www.instagram.com/p/DeOBzd-Sdfz/
      location: Hotel suite
      theme: 25th birthday surprise
      colours:
        - { hex: '#2B2B2B', name: Black }
        - { hex: '#C7CCD4', name: Silver }
        - { hex: '#F4F6F8', name: White }
    - image: ../../assets/work/gallery-07.jpg
      alt: A pink and white floral balloon setup with butterflies and a glowing sign.
      source: https://www.instagram.com/p/DbCzWYSSPC-/
      location: Kuala Lumpur
      theme: Butterfly birthday
      colours:
        - { hex: '#E8B4B2', name: Pink }
        - { hex: '#FBF4EC', name: White }
    - image: ../../assets/work/gallery-08.jpg
      alt: Black and silver balloons against a sequin backdrop.
      source: https://www.instagram.com/p/Db0SD9-yMk-/
      location: Kuala Lumpur
      theme: 21st birthday
      colours:
        - { hex: '#2B2B2B', name: Black }
        - { hex: '#C7CCD4', name: Silver }
    - image: ../../assets/work/gallery-09.jpg
      alt: Red and pink balloons with a draped fabric backdrop.
      source: https://www.instagram.com/p/DY9zUWASOrP/
      location: Seri Kembangan
      theme: 21st birthday
      colours:
        - { hex: '#B5475B', name: Red }
        - { hex: '#E8A0A8', name: Pink }
        - { hex: '#F3DCCB', name: Cream }
    - image: ../../assets/work/gallery-10.jpg
      alt: Chrome blue and silver balloon columns beside a grand opening panel.
      source: https://www.instagram.com/p/DS434OuklLZ/
      location: Klang
      theme: Grand opening
      colours:
        - { hex: '#6F8FB8', name: Chrome blue }
        - { hex: '#C7CCD4', name: Silver }
        - { hex: '#F4F6F8', name: Pearl }
    - image: ../../assets/work/gallery-11.jpg
      alt: A rose gold and champagne balloon arch for a gender reveal.
      source: https://www.instagram.com/p/DRXMjz0kkxn/
      location: Kuala Lumpur
      theme: Gender reveal
      colours:
        - { hex: '#C9898C', name: Rose gold }
        - { hex: '#F3DCCB', name: Champagne }
        - { hex: '#FBF4EC', name: White }
    - image: ../../assets/work/gallery-12.jpg
      alt: A white and rose gold balloon arch for a business anniversary.
      source: https://www.instagram.com/p/DL7cZiQyiVw/
      location: Mont Kiara
      theme: 10th anniversary
      colours:
        - { hex: '#FBF4EC', name: White }
        - { hex: '#C9898C', name: Rose gold }
sculptures:
  title: Balloon sculptures
  lede: Twisted by hand, one balloon at a time.
  pieces:
    - { id: dog, name: Balloon dog }
    - { id: tulips, name: Tulip bouquet }
    - { id: cake, name: Balloon cake }
  photos:
    - image: ../../assets/work/sculpture-lion-dance.jpg
      alt: A lion dance head sculpted from red and gold balloons.
      source: https://www.instagram.com/p/DKwnkaHSwgy/
      caption: Lion dance, for openings and festive wishes
    - image: ../../assets/work/sculpture-roses.jpg
      alt: A bouquet of red twisted-balloon roses.
      source: https://www.instagram.com/p/DIOYWW3y1D_/
      caption: Rose bouquet
venues:
  title: Where we set up
  items:
    - Hotel suites
    - Airbnbs
    - Homes
    - KTV rooms
    - Restaurants and private dining rooms
    - Offices and showrooms
    - Live-stream rooms
    - Event halls
steps:
  draft: true
  title: How it works
  items:
    - title: Message us on WhatsApp
      body: Share the date, venue, occasion and the palette you love.
    - title: Get a design and quote
      body: We suggest a setup that fits your space.
    - title: We style it on site
      body: Our team sets everything up at your venue.
faq:
  title: Questions
  items:
    - question: Which areas do you cover?
      answer: Kuala Lumpur and Selangor.
      draft: false
    - question: Can I choose my own colours?
      answer: Yes. Every setup is custom; tell us your palette or pick one above.
      draft: false
    - question: How far ahead should I book?
      answer: Pending confirmation from one23balloon.
      draft: true
    - question: How long does setup take?
      answer: Pending confirmation from one23balloon.
      draft: true
    - question: Do you take the decorations down afterwards?
      answer: Pending confirmation from one23balloon.
      draft: true
    - question: Do you require a deposit?
      answer: Pending confirmation from one23balloon.
      draft: true
closing:
  title: Compose your celebration
  body: Pick a palette, tell us the occasion, and we will take it from there.
  cta: Start on WhatsApp
  message: Hi one23balloon, I'd like to plan a celebration.
  photo:
    image: ../../assets/work/closing.jpg
    alt: A towering balloon cake in soft pink tiers.
    source: https://www.instagram.com/p/DKmPFhHytgH/
```

- [ ] **Step 4: Create `src/content/landing/zh.yaml`**

Same structure, image paths and sources as `en.yaml`, so parity holds:

```yaml
whatsapp: '60109017633'
meta:
  instagramLabel: Instagram
  xiaohongshuLabel: 小红书
  registration: SSM CT0152510-K
  rights: 版权所有。
intro:
  skip: 跳过动画
hero:
  eyebrow: 吉隆坡 · 雪兰莪
  title: 为每一场盛大时刻，精心布置
  lede: 婚礼、开业、生日与宝宝宴的定制气球布置。从配色出发，为你的场地量身打造。
  cta: WhatsApp 联系我们
  message: 你好 one23balloon，我想咨询气球布置。
  photo:
    image: ../../assets/work/hero-arch.jpg
    alt: 奶油米色气球环绕拱门背景板，配上一个超大的粉色缎面蝴蝶结。
    source: https://www.instagram.com/p/Dd0QfR4yIIR/
palettes:
  label: 选择配色
  items:
    - id: blush-champagne
      name: 腮红香槟
      message: 你好 one23balloon，我想要「腮红香槟」配色的布置。
    - id: chrome-blue
      name: 镜面蓝银
      message: 你好 one23balloon，我想要「镜面蓝银」配色的布置。
    - id: sage-cream
      name: 鼠尾草奶油
      message: 你好 one23balloon，我想要「鼠尾草奶油」配色的布置。
    - id: rose-gold
      name: 玫瑰金
      message: 你好 one23balloon，我想要「玫瑰金」配色的布置。
    - id: jewel
      name: 宝石色
      message: 你好 one23balloon，我想要「宝石色」配色的布置。
services:
  title: 我们布置的场合
  lede: 每一场布置都从你的场合、场地与配色开始。
  cta: WhatsApp 咨询
  items:
    - id: weddings
      title: 婚礼与求婚
      body: 求婚、注册、单身派对到婚礼当天的气球拱门与花束。
      palette: rose-gold
      message: 你好 one23balloon，我想咨询婚礼或求婚的气球布置。
      photo:
        image: ../../assets/work/service-weddings.jpg
        alt: 带拱形背景的婚礼气球布置。
        source: https://www.instagram.com/p/DaDTmrpSMZP/
    - id: openings
      title: 开业与企业活动
      body: 开业、周年庆、年会、新品发布与直播间的大气背景布置。
      palette: chrome-blue
      message: 你好 one23balloon，我想咨询开业或企业活动的气球布置。
      photo:
        image: ../../assets/work/service-openings.jpg
        alt: 配有黑色缎面蝴蝶结与白色气球的开业背景。
        source: https://www.instagram.com/p/DR1lWIxEpdm/
    - id: birthdays
      title: 生日惊喜
      body: 酒店、Airbnb、KTV、餐厅包厢与家中的生日布置，从18岁到90岁。
      palette: blush-champagne
      message: 你好 one23balloon，我想咨询生日气球布置。
      photo:
        image: ../../assets/work/service-birthdays.jpg
        alt: 粉蓝、白与银色气球的酒店生日布置，点缀月亮与星星。
        source: https://www.instagram.com/p/De1fts-ya9W/
    - id: baby
      title: 宝宝宴与性别揭晓
      body: 满月、百日宴、周岁宴与性别揭晓派对，温柔耐看的配色。
      palette: sage-cream
      message: 你好 one23balloon，我想咨询宝宝宴或性别揭晓的气球布置。
      photo:
        image: ../../assets/work/service-baby.jpg
        alt: 珍珠白的周岁布置，带传统抓周角落。
        source: https://www.instagram.com/p/DbkiXb0yeRf/
    - id: cars
      title: 提车仪式
      body: 大蝴蝶结、气球与满满仪式感的新车交付，在家或在展厅。
      palette: jewel
      message: 你好 one23balloon，我想咨询提车仪式的气球布置。
      photo:
        image: ../../assets/work/service-cars.jpg
        alt: 系着红色蝴蝶结的白色汽车，周围是银白色气球。
        source: https://www.instagram.com/p/DSRfJm9ksre/
    - id: bouquets
      title: 气球花束与造型
      body: 手工扭制的玫瑰、郁金香、巨型气球蛋糕与醒狮，送礼正合适。
      palette: blush-champagne
      message: 你好 one23balloon，我想咨询气球花束或气球造型。
      photo:
        image: ../../assets/work/service-bouquets.jpg
        alt: 一束白色扭扭气球郁金香。
        source: https://www.instagram.com/p/DJRXloTyrxN/
gallery:
  title: 近期作品
  lede: 最近布置的几场庆祝。
  more: 在 Instagram 查看更多
  items:
    - image: ../../assets/work/gallery-01.jpg
      alt: 餐厅里的香槟金与白色气球拱门。
      source: https://www.instagram.com/p/Dcc7YApSTZ2/
      location: 吉隆坡餐厅
      theme: 21岁生日
      colours:
        - { hex: '#D9B47A', name: 香槟金 }
        - { hex: '#FBF4EC', name: 白色 }
    - image: ../../assets/work/gallery-02.jpg
      alt: 环绕圆形拱门的粉白气球花环。
      source: https://www.instagram.com/p/DcsLChQyV8G/
      location: 吉隆坡
      theme: 21岁生日
      colours:
        - { hex: '#E8A0A8', name: 粉色 }
        - { hex: '#FFF5EE', name: 白色 }
    - image: ../../assets/work/gallery-03.jpg
      alt: 家庭生日晚宴上的镜面蓝与金色气球。
      source: https://www.instagram.com/p/Dcpi_vnS3oh/
      location: 家庭聚餐
      theme: 90岁寿宴
      colours:
        - { hex: '#6F8FB8', name: 镜面蓝 }
        - { hex: '#D4AF6A', name: 镜面金 }
    - image: ../../assets/work/gallery-04.jpg
      alt: 白色背景上的粉色数字气球与大蝴蝶结。
      source: https://www.instagram.com/p/DdMBn2dSqP2/
      location: 吉隆坡
      theme: 22岁生日
      colours:
        - { hex: '#E8B4B2', name: 粉色 }
        - { hex: '#FBF4EC', name: 白色 }
    - image: ../../assets/work/gallery-05.jpg
      alt: 彩虹色气球配柔软布艺背景与超大白色蝴蝶结。
      source: https://www.instagram.com/p/DcXiOiHypZh/
      location: 直播间
      theme: 一周年
      colours:
        - { hex: '#C9B6E4', name: 丁香紫 }
        - { hex: '#A9C3E0', name: 天空蓝 }
        - { hex: '#F2D98B', name: 柠檬黄 }
        - { hex: '#FBF4EC', name: 白色 }
    - image: ../../assets/work/gallery-06.jpg
      alt: 酒店床上的黑、银、白色气球。
      source: https://www.instagram.com/p/DeOBzd-Sdfz/
      location: 酒店套房
      theme: 25岁生日惊喜
      colours:
        - { hex: '#2B2B2B', name: 黑色 }
        - { hex: '#C7CCD4', name: 银色 }
        - { hex: '#F4F6F8', name: 白色 }
    - image: ../../assets/work/gallery-07.jpg
      alt: 粉白花艺气球布置，点缀蝴蝶与发光字牌。
      source: https://www.instagram.com/p/DbCzWYSSPC-/
      location: 吉隆坡
      theme: 蝴蝶主题生日
      colours:
        - { hex: '#E8B4B2', name: 粉色 }
        - { hex: '#FBF4EC', name: 白色 }
    - image: ../../assets/work/gallery-08.jpg
      alt: 亮片背景前的黑银气球。
      source: https://www.instagram.com/p/Db0SD9-yMk-/
      location: 吉隆坡
      theme: 21岁生日
      colours:
        - { hex: '#2B2B2B', name: 黑色 }
        - { hex: '#C7CCD4', name: 银色 }
    - image: ../../assets/work/gallery-09.jpg
      alt: 红粉色气球配垂坠布艺背景。
      source: https://www.instagram.com/p/DY9zUWASOrP/
      location: Seri Kembangan
      theme: 21岁成人礼
      colours:
        - { hex: '#B5475B', name: 红色 }
        - { hex: '#E8A0A8', name: 粉色 }
        - { hex: '#F3DCCB', name: 奶油色 }
    - image: ../../assets/work/gallery-10.jpg
      alt: 开业背景板旁的镜面蓝与银色气球柱。
      source: https://www.instagram.com/p/DS434OuklLZ/
      location: 巴生
      theme: 开业
      colours:
        - { hex: '#6F8FB8', name: 镜面蓝 }
        - { hex: '#C7CCD4', name: 银色 }
        - { hex: '#F4F6F8', name: 珍珠白 }
    - image: ../../assets/work/gallery-11.jpg
      alt: 玫瑰金与香槟色的性别揭晓气球拱门。
      source: https://www.instagram.com/p/DRXMjz0kkxn/
      location: 吉隆坡
      theme: 性别揭晓派对
      colours:
        - { hex: '#C9898C', name: 玫瑰金 }
        - { hex: '#F3DCCB', name: 香槟色 }
        - { hex: '#FBF4EC', name: 白色 }
    - image: ../../assets/work/gallery-12.jpg
      alt: 白色与玫瑰金的周年庆气球拱门。
      source: https://www.instagram.com/p/DL7cZiQyiVw/
      location: Mont Kiara
      theme: 10周年庆
      colours:
        - { hex: '#FBF4EC', name: 白色 }
        - { hex: '#C9898C', name: 玫瑰金 }
sculptures:
  title: 气球造型
  lede: 一颗一颗，手工扭制。
  pieces:
    - { id: dog, name: 气球狗 }
    - { id: tulips, name: 郁金香花束 }
    - { id: cake, name: 气球蛋糕 }
  photos:
    - image: ../../assets/work/sculpture-lion-dance.jpg
      alt: 用红色与金色气球扭成的醒狮头。
      source: https://www.instagram.com/p/DKwnkaHSwgy/
      caption: 气球醒狮，开业与节庆的好意头
    - image: ../../assets/work/sculpture-roses.jpg
      alt: 一束红色扭扭气球玫瑰。
      source: https://www.instagram.com/p/DIOYWW3y1D_/
      caption: 玫瑰花束
venues:
  title: 布置场地
  items:
    - 酒店套房
    - Airbnb
    - 家中
    - KTV 包厢
    - 餐厅与包厢
    - 办公室与展厅
    - 直播间
    - 宴会厅
steps:
  draft: true
  title: 预约流程
  items:
    - title: WhatsApp 联系我们
      body: 告诉我们日期、场地、场合和喜欢的配色。
    - title: 获取设计与报价
      body: 我们会根据场地建议布置方案。
    - title: 现场布置
      body: 我们的团队到场完成全部布置。
faq:
  title: 常见问题
  items:
    - question: 服务哪些地区？
      answer: 吉隆坡与雪兰莪。
      draft: false
    - question: 可以自选颜色吗？
      answer: 可以。每一场布置都是定制的，告诉我们你的配色，或在上方选择一款。
      draft: false
    - question: 需要提前多久预约？
      answer: 待 one23balloon 确认。
      draft: true
    - question: 布置需要多长时间？
      answer: 待 one23balloon 确认。
      draft: true
    - question: 活动结束后会帮忙拆除吗？
      answer: 待 one23balloon 确认。
      draft: true
    - question: 需要支付订金吗？
      answer: 待 one23balloon 确认。
      draft: true
closing:
  title: 开始你的庆祝
  body: 选一款配色，告诉我们场合，其余交给我们。
  cta: 在 WhatsApp 开始
  message: 你好 one23balloon，我想策划一场庆祝布置。
  photo:
    image: ../../assets/work/closing.jpg
    alt: 层层叠叠的粉色巨型气球蛋糕。
    source: https://www.instagram.com/p/DKmPFhHytgH/
```

Delete the placeholder: `git rm src/content/landing/.gitkeep`.

- [ ] **Step 5: Create the demo landing fixture**

Generate a lightweight photo (one image keeps demo fixture builds fast):

```bash
node --input-type=module -e "
import sharp from 'sharp';
await sharp({ create: { width: 1080, height: 1350, channels: 3, background: '#E8B4B2' } }).jpeg({ quality: 60 }).toFile('tests/fixtures/demo/photo.jpg');
"
```

Create `tests/fixtures/demo/landing.yaml` by copying `src/content/landing/en.yaml`, then:
1. Replace every `image:` value with `../../../tests/fixtures/demo/photo.jpg`.
2. Replace every `alt:` value with `A sample photo for template tests.`
3. Leave every other field as is, so the schema and copy structure match the real content.

Add to `demoContent` in `tests/helpers/demo.ts`:

```ts
  'src/content/landing/en.yaml': fixture('landing.yaml'),
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: PASS (4 tests; the invalid build fails on the `palette` field, as expected).

Run: `pnpm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/content/landing tests/fixtures/demo tests/helpers/demo.ts tests/integration/landing-build.test.ts
git commit -m "feat: add English and Chinese landing copy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Self-hosted fonts with Chinese subsetting

**Files:**
- Create: `src/lib/fonts/charset.ts`
- Create: `scripts/subset-fonts.ts`, `scripts/subset-font.d.ts`
- Create (generated): `src/lib/fonts/zh-charset.txt`, `public/fonts/fraunces-latin.woff2`, `public/fonts/noto-serif-sc-subset.woff2`, `public/fonts/noto-sans-sc-subset.woff2`, `public/fonts/OFL-Fraunces.txt`, `public/fonts/OFL-NotoSerifSC.txt`, `public/fonts/OFL-NotoSansSC.txt`
- Modify: `package.json` (devDependency and `fonts:subset` script)
- Modify: `src/layouts/BaseLayout.astro`
- Test: `tests/unit/fonts.test.ts`, `tests/integration/landing-build.test.ts`

**Interfaces:**
- Produces: `collectCjk(text: string): string[]`, `zhCharsetSources: string[]`, `cjkUnicodeRange: string`; `pnpm fonts:subset`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/fonts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/fonts.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/fonts/charset.ts`**

```ts
const cjk = /[　-〿㐀-䶿一-鿿＀-￯]/gu;

export const cjkUnicodeRange =
  'U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+FF00-FFEF';

// Every file whose Chinese text renders with the subset fonts.
export const zhCharsetSources = [
  'src/content/landing/zh.yaml',
  'src/content/pages/zh/home.md',
  'src/i18n/zh.json',
];

export function collectCjk(text: string): string[] {
  return [...new Set(text.match(cjk) ?? [])].sort();
}
```

- [ ] **Step 4: Install `subset-font` and add the script entry**

```bash
pnpm add -D --save-exact subset-font@2.9.0
```

In `package.json` `scripts`, add after `"build"`:

```json
    "fonts:subset": "node --experimental-strip-types scripts/subset-fonts.ts",
```

- [ ] **Step 5: Add the missing type declaration**

`subset-font` ships no TypeScript types. Create `scripts/subset-font.d.ts`:

```ts
declare module 'subset-font' {
  type Axis = number | { min: number; max: number; default?: number };
  export default function subsetFont(
    font: Uint8Array,
    text: string,
    options?: {
      targetFormat?: 'sfnt' | 'woff' | 'woff2' | 'truetype';
      preserveNameIds?: number[];
      variationAxes?: Record<string, Axis>;
      noLayoutClosure?: boolean;
    },
  ): Promise<Buffer>;
}
```

- [ ] **Step 6: Implement `scripts/subset-fonts.ts`**

```ts
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

const latin =
  range(0x20, 0x7e) +
  range(0xa0, 0xff) +
  '–—‘’‚“”„•…€™';
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
```

- [ ] **Step 7: Generate the fonts and run the unit test**

Run: `pnpm fonts:subset`
Expected: three `.woff2` sizes printed (each well under 400 KB) and a Chinese character count. Downloads cache under `.cache/fonts/` (gitignored).

Run: `pnpm vitest run tests/unit/fonts.test.ts`
Expected: PASS (6 tests).

Whenever Chinese copy changes later, rerun `pnpm fonts:subset`. The coverage test fails until you do.

- [ ] **Step 8: Write the failing integration test**

Append to the `describe` block in `tests/integration/landing-build.test.ts`:

```ts
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
```

Run: `pnpm vitest run tests/integration/landing-build.test.ts -t "preloads"`
Expected: FAIL (only Source Sans is preloaded).

- [ ] **Step 9: Declare and preload the fonts in `src/layouts/BaseLayout.astro`**

Add the import:

```ts
import { cjkUnicodeRange } from '../lib/fonts/charset.ts';
```

Replace `const fontPath = withBase('/fonts/source-sans-3-latin.woff2', site);` with:

```ts
type FontFace = {
  family: string;
  file: string;
  weight: string;
  chinese?: boolean;
};
const fonts: FontFace[] = [
  { family: 'Source Sans 3', file: 'source-sans-3-latin.woff2', weight: '200 900' },
  { family: 'Fraunces', file: 'fraunces-latin.woff2', weight: '100 900' },
  { family: 'Noto Serif SC', file: 'noto-serif-sc-subset.woff2', weight: '400', chinese: true },
  { family: 'Noto Sans SC', file: 'noto-sans-sc-subset.woff2', weight: '400', chinese: true },
];
const fontPath = (font: FontFace) => withBase(`/fonts/${font.file}`, site);
const chinesePage = locale.toLowerCase().startsWith('zh');
const preloads = fonts.filter((font) => !font.chinese || chinesePage);
// Chinese faces carry a unicode-range, so Latin pages never download them.
const fontFaces = fonts
  .map(
    (font) =>
      `@font-face { font-family: '${font.family}'; src: url(${JSON.stringify(encodeURI(fontPath(font)))}) format('woff2'); font-style: normal; font-weight: ${font.weight}; font-display: swap;${font.chinese ? ` unicode-range: ${cjkUnicodeRange};` : ''} }`,
  )
  .join(' ');
```

Replace the existing font `<link rel="preload" … />` and `<style is:inline … />` with:

```astro
    {preloads.map((font) => (
      <link
        rel="preload"
        href={fontPath(font)}
        as="font"
        type="font/woff2"
        crossorigin
      />
    ))}
    <style is:inline set:html={fontFaces} />
```

- [ ] **Step 10: Run the tests**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: PASS.

Run: `pnpm test`
Expected: all pass (the template test still finds the mounted Source Sans preload).

- [ ] **Step 11: Commit**

```bash
git add src/lib/fonts scripts/subset-fonts.ts scripts/subset-font.d.ts public/fonts package.json pnpm-lock.yaml src/layouts/BaseLayout.astro tests/unit/fonts.test.ts tests/integration/landing-build.test.ts
git commit -m "feat: self-host Fraunces and subset Noto SC fonts for Chinese pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Gala atelier tokens, header and footer

**Files:**
- Modify: `src/styles/tokens.css` (replace)
- Modify: `src/styles/global.css`
- Modify: `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/layouts/BaseLayout.astro`
- Test: `tests/integration/landing-build.test.ts`

**Interfaces:**
- Produces: `BaseLayout` prop `headerCta?: { href: string; label: string }` and named slots `head` and `footer`; `SiteHeader` prop `cta?: { href: string; label: string }` (rendered with `data-palette-link`); `SiteFooter` named slot `extra`; primary navigation class `nav-primary`. CSS custom properties `--font-display`, `--font-size-display`, `--weight-display`, `--tracking-eyebrow`, `--color-on-ink`, `--radius-arch`, `--radius-card`, `--space-2xl`, `--header-layer`, `--intro-layer`, `--tint`, `--ease-out`; utility class `.visually-hidden`.

- [ ] **Step 1: Write the failing tests**

Append to the `describe` block in `tests/integration/landing-build.test.ts`:

```ts
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
```

Run: `pnpm vitest run tests/integration/landing-build.test.ts -t "single-link"`
Expected: FAIL (a main navigation with a single "Home" link is rendered).

- [ ] **Step 2: Replace `src/styles/tokens.css`**

```css
/* Gala atelier (see design-direction.md). Palette tints come from src/lib/landing/palettes.ts. */
:root {
  color-scheme: light dark;
  --color-page: #f7f1ea;
  --color-surface: #efe6dc;
  --color-text: #221b17;
  --color-muted: #5a4d45;
  --color-link: #9c4f5c;
  --color-border: #d9cbbd;
  --color-focus: #7d2338;
  --color-on-ink: #f7f1ea;
  --font-body: 'Source Sans 3', 'Noto Sans SC', system-ui, sans-serif;
  --font-display: 'Fraunces', 'Noto Serif SC', Georgia, serif;
  --font-size-body: 1.125rem;
  --font-size-small: 1rem;
  --font-size-display: clamp(2.75rem, 7.5vw, 7.5rem);
  --font-size-title: clamp(2.25rem, 5.5vw, 4.5rem);
  --font-size-heading: clamp(1.75rem, 3.5vw, 3rem);
  --font-size-lead: clamp(1.2rem, 1.8vw, 1.45rem);
  --weight-body: 400;
  --weight-heading: 400;
  --weight-display: 300;
  --line-body: 1.65;
  --line-title: 1.04;
  --line-heading: 1.15;
  --tracking-title: -0.02em;
  --tracking-eyebrow: 0.16em;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-2xl: 4rem;
  --space-xl: clamp(5rem, 10vw, 9rem);
  --space-page: clamp(1rem, 5vw, 3rem);
  --width-site: 80rem;
  --width-reading: 44rem;
  --width-thumbnail: 16rem;
  --height-main: 50vh;
  --radius-arch: 999px 999px 0.75rem 0.75rem;
  --radius-card: 1.25rem;
  --border-width: 1px;
  --focus-width: 3px;
  --focus-offset: 4px;
  --link-underline: 0.08em;
  --link-offset: 0.18em;
  --skip-offset: 1rem;
  --skip-layer: 30;
  --header-layer: 5;
  --intro-layer: 20;
  --tint: var(--color-page);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-page: #171311;
    --color-surface: #241e1b;
    --color-text: #f4ede4;
    --color-muted: #c9bcb1;
    --color-link: #e9a8b4;
    --color-border: #4a3f39;
    --color-focus: #f3c6cf;
    --color-on-ink: #171311;
  }
}

@media (prefers-reduced-motion: no-preference) {
  [data-reveal] {
    will-change: transform, opacity;
  }
}
```

`--skip-layer` is 30 so the skip link stays above the intro overlay (20).

- [ ] **Step 3: Update `src/styles/global.css`**

Replace the `h1, h2, h3 { … }` rule with:

```css
h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: var(--weight-heading);
  line-height: var(--line-heading);
  overflow-wrap: anywhere;
}
```

Replace the `.site-header { … }` rule with:

```css
.site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--header-layer);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm) var(--space-md);
  padding-block: var(--space-sm);
  background: color-mix(in srgb, var(--color-page) 90%, transparent);
  backdrop-filter: blur(12px);
  border-block-end: var(--border-width) solid var(--color-border);
}
```

Replace the `.site-name { … }` rule with:

```css
.site-name {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  overflow-wrap: anywhere;
}
```

Change the selector `.site-header > nav` to `.site-header > .nav-primary`.

Replace the `.language-switcher { … }` rule with:

```css
.language-switcher {
  margin-inline-start: auto;
  font-size: var(--font-size-small);
}
.site-header > .nav-primary + .language-switcher {
  margin-inline-start: 0;
}
.header-cta {
  display: inline-flex;
  align-items: center;
  min-block-size: 2.75rem;
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  background: var(--color-text);
  color: var(--color-on-ink);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
}
.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

Add to the end of the file:

```css
.site-footer .nav-list {
  margin-block-start: var(--space-sm);
}
```

- [ ] **Step 4: Update `src/components/SiteHeader.astro`**

Change the props:

```ts
interface Props {
  locale: string;
  current?: RouteRecord;
  cta?: { href: string; label: string };
}
const { locale, current, cta } = Astro.props;
```

After `const locales = enabledLocales(site);` add:

```ts
// A lone "Home" link adds nothing on a one-page site.
const showNav = links.some((link) => link.route && link.route !== home);
```

Replace the `<nav …>…</nav>` element and everything after it inside `<header>` with:

```astro
  {showNav && (
    <nav class="nav-primary" aria-label={ui.accessibility.primaryNavigation}>
      <ul class="nav-list">
        {links.map(
          ({ route, label }) =>
            route && (
              <li>
                <a
                  href={route.path}
                  aria-current={current?.path === route.path ? 'page' : undefined}
                >
                  {label}
                </a>
              </li>
            ),
        )}
      </ul>
    </nav>
  )}
  {current && locales.length > 1 && (
    <LanguageSwitcher current={current} locales={locales} />
  )}
  {cta && (
    <a
      class="header-cta"
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      data-palette-link
    >
      {cta.label}
    </a>
  )}
```

- [ ] **Step 5: Update `src/components/SiteFooter.astro`**

After the `links` array add:

```ts
const hasExtra = Astro.slots.has('extra');
const hasLinks = links.some((link) => link.route);
```

Replace the markup with:

```astro
<footer class="site-footer shell">
  <p class="site-name">{site.name}</p>
  {!hasExtra && <p>{site.description}</p>}
  <slot name="extra" />
  {hasLinks && (
    <nav aria-label={ui.accessibility.footerNavigation}>
      <ul class="nav-list">
        {links.map(
          ({ route, label }) =>
            route && (
              <li>
                <a href={route.path}>{label}</a>
              </li>
            ),
        )}
      </ul>
    </nav>
  )}
</footer>
```

- [ ] **Step 6: Add the header CTA and slots to `src/layouts/BaseLayout.astro`**

Add `headerCta?: { href: string; label: string };` to `Props`, and `headerCta,` to the destructuring.

Inside `<head>`, after `<style is:inline set:html={fontFaces} />`, add:

```astro
    <slot name="head" />
```

Replace `<SiteHeader locale={locale} current={route} />` with:

```astro
    <SiteHeader locale={locale} current={route} cta={headerCta} />
```

Replace `<SiteFooter locale={locale} />` with:

```astro
    {Astro.slots.has('footer') ? (
      <SiteFooter locale={locale}>
        <slot name="footer" slot="extra" />
      </SiteFooter>
    ) : (
      <SiteFooter locale={locale} />
    )}
```

- [ ] **Step 7: Run the tests**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: PASS.

Run: `pnpm test && pnpm check`
Expected: all pass (the demo fixture still renders its full navigation, including the Malay "Utama" home link).

- [ ] **Step 8: Commit**

```bash
git add src/styles src/components/SiteHeader.astro src/components/SiteFooter.astro src/layouts/BaseLayout.astro tests/integration/landing-build.test.ts
git commit -m "feat: apply Gala atelier tokens, sticky header CTA and footer slot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Static landing sections

All landing content renders as static HTML. Scripts come later and only enhance.

**Files:**
- Create: `src/components/landing/LandingView.astro`, `HeroSection.astro`, `ServicesSection.astro`, `GallerySection.astro`, `SculpturesSection.astro`, `VenuesSection.astro`, `StepsSection.astro`, `FaqSection.astro`, `ClosingSection.astro`, `PalettePicker.astro`, `ArchPhoto.astro`, `WhatsAppLink.astro`, `PaletteStyles.astro`, `LandingFooter.astro`
- Create: `src/styles/landing.css`
- Modify: `src/components/PageView.astro`
- Test: `tests/integration/landing-build.test.ts`

**Interfaces:**
- Consumes: `getLanding`, `LandingData` (Task 5); `whatsappUrl` (Task 3); `palettes`, `paletteIds`, `defaultPaletteId` (Task 4); `BaseLayout` `headerCta` and the `head`/`footer` slots (Task 9).
- Produces these DOM contracts for Tasks 11–18:
  - Landing root: `<div class="landing" data-landing data-page-motion data-intro data-palette="<id>" data-whatsapp-number="<digits>" data-intro-skip="<label>">`.
  - Palette pickers: `[data-palette-picker][hidden][role=radiogroup]` containing `button[role=radio][data-palette-option=<id>][data-message=<text>]`.
  - Palette-aware links: `a[data-palette-link]` (hero, closing, header).
  - Islands: `[data-island="hero" | "sculptures" | "release"]`, each containing one `canvas.island-canvas[aria-hidden=true]`.
  - Gallery: `[data-gallery]` viewport containing `[data-gallery-track]`.
  - Marquee: `[data-marquee]` containing `.marquee-list` and `.marquee-list.marquee-copy[aria-hidden=true]`.
  - Sections that follow the selected palette: `[data-palette-follow]`; sections with a fixed palette: `[data-palette=<id>]`.

- [ ] **Step 1: Write the failing tests**

Append to the `describe` block in `tests/integration/landing-build.test.ts`:

```ts
  it('renders every landing section in static HTML', async () => {
    for (const path of ['index.html', 'zh/index.html']) {
      const document = await page(path);
      expect(document.querySelectorAll('h1'), path).toHaveLength(1);
      expect(document.querySelectorAll('.service'), path).toHaveLength(6);
      expect(document.querySelectorAll('.gallery-item img'), path).toHaveLength(12);
      expect(document.querySelectorAll('.sculpture-photos img'), path).toHaveLength(2);
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

  it('links every call to action to WhatsApp with the localized message', async () => {
    const wa = (text: string) =>
      `https://wa.me/60109017633?text=${encodeURIComponent(text)}`;
    const en = await page('index.html');
    const links = [...en.querySelectorAll('a[href^="https://wa.me/"]')].map(
      (link) => link.getAttribute('href'),
    );
    expect(links).toHaveLength(9);
    expect(links).toContain(wa("Hi one23balloon, I'd like to plan a balloon setup."));
    expect(links).toContain(
      wa("Hi one23balloon, I'd like to ask about a car handover setup."),
    );
    const zh = await page('zh/index.html');
    expect(
      zh
        .querySelector('.site-header a[href^="https://wa.me/"]')
        ?.getAttribute('href'),
    ).toBe(wa('你好 one23balloon，我想咨询气球布置。'));
    expect(zh.querySelector('.landing-footer')?.textContent).toContain('小红书');
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
```

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: FAIL (no `.service`, no WhatsApp links; the drifted build succeeds because nothing reads the landing collection yet).

- [ ] **Step 2: Create `src/components/landing/WhatsAppLink.astro`**

```astro
---
import { whatsappUrl } from '../../lib/contact/whatsapp.ts';
interface Props {
  number: string;
  message: string;
  label: string;
  accessibleLabel?: string;
  variant?: 'primary' | 'quiet';
  paletteLink?: boolean;
}
const {
  number,
  message,
  label,
  accessibleLabel,
  variant = 'quiet',
  paletteLink = false,
} = Astro.props;
---

<a
  class:list={['whatsapp', variant]}
  href={whatsappUrl(number, message)}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={accessibleLabel}
  data-palette-link={paletteLink ? '' : undefined}
>
  {label}
</a>
```

- [ ] **Step 3: Create `src/components/landing/ArchPhoto.astro`**

```astro
---
import type { ImageMetadata } from 'astro';
import { Image } from 'astro:assets';
interface Props {
  photo: { image: ImageMetadata; alt: string };
  sizes: string;
  loading?: 'eager' | 'lazy';
  shape?: 'arch' | 'card';
}
const { photo, sizes, loading = 'lazy', shape = 'arch' } = Astro.props;
---

<Image
  class:list={['photo', `photo-${shape}`]}
  src={photo.image}
  alt={photo.alt}
  widths={[480, 800, 1080]}
  sizes={sizes}
  format="webp"
  quality={78}
  loading={loading}
  fetchpriority={loading === 'eager' ? 'high' : undefined}
/>
```

- [ ] **Step 4: Create `src/components/landing/PalettePicker.astro`**

```astro
---
import type { LandingData } from '../../lib/landing/content.ts';
import { defaultPaletteId, palettes } from '../../lib/landing/palettes.ts';
interface Props {
  copy: LandingData['palettes'];
}
const { copy } = Astro.props;
---

<div
  class="palette-picker"
  role="radiogroup"
  aria-label={copy.label}
  data-palette-picker
  hidden
>
  <p class="picker-label" aria-hidden="true">{copy.label}</p>
  {copy.items.map((item) => (
    <button
      type="button"
      role="radio"
      class="palette-option"
      aria-checked={item.id === defaultPaletteId ? 'true' : 'false'}
      tabindex={item.id === defaultPaletteId ? 0 : -1}
      data-palette-option={item.id}
      data-message={item.message}
    >
      <span class="swatches" aria-hidden="true">
        {palettes[item.id].colours.slice(0, 4).map((colour) => (
          <span class="swatch" style={`--swatch: ${colour.hex}`} />
        ))}
      </span>
      <span>{item.name}</span>
    </button>
  ))}
</div>
```

The picker stays `hidden` without JavaScript, because its buttons only work with the script.

- [ ] **Step 5: Create `src/components/landing/PaletteStyles.astro`**

```astro
---
import { paletteIds, palettes } from '../../lib/landing/palettes.ts';
// One CSS source for tints, generated from palettes.ts so colours never drift.
const rules = (scheme: 'tint' | 'tintDark') =>
  paletteIds
    .map(
      (id) =>
        `[data-palette='${id}'],.landing[data-palette='${id}'] [data-palette-follow]{--tint:${palettes[id][scheme]}}`,
    )
    .join('');
const css = `${rules('tint')}@media (prefers-color-scheme: dark){${rules('tintDark')}}`;
---

<style is:inline set:html={css} />
```

- [ ] **Step 6: Create `src/components/landing/HeroSection.astro`**

```astro
---
import ArchPhoto from './ArchPhoto.astro';
import PalettePicker from './PalettePicker.astro';
import WhatsAppLink from './WhatsAppLink.astro';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section class="hero" data-palette-follow aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="eyebrow" data-reveal>{data.hero.eyebrow}</p>
    <h1 id="hero-title" class="display" data-reveal>{data.hero.title}</h1>
    <p class="lede" data-reveal>{data.hero.lede}</p>
    <div class="actions" data-reveal>
      <WhatsAppLink
        number={data.whatsapp}
        message={data.hero.message}
        label={data.hero.cta}
        variant="primary"
        paletteLink
      />
    </div>
    <PalettePicker copy={data.palettes} />
  </div>
  <div class="stage hero-stage" data-island="hero">
    <ArchPhoto
      photo={data.hero.photo}
      sizes="(min-width: 64rem) 50vw, 100vw"
      loading="eager"
    />
    <canvas class="island-canvas" aria-hidden="true"></canvas>
  </div>
</section>
```

- [ ] **Step 7: Create `src/components/landing/ServicesSection.astro`**

```astro
---
import ArchPhoto from './ArchPhoto.astro';
import WhatsAppLink from './WhatsAppLink.astro';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section class="services band" aria-labelledby="services-title">
  <div class="shell">
    <header class="section-head" data-reveal>
      <h2 id="services-title">{data.services.title}</h2>
      <p class="lede">{data.services.lede}</p>
    </header>
    <ul class="service-list">
      {data.services.items.map((service) => (
        <li class="service" data-palette={service.palette} data-reveal>
          <ArchPhoto
            photo={service.photo}
            sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw"
          />
          <h3>{service.title}</h3>
          <p>{service.body}</p>
          <WhatsAppLink
            number={data.whatsapp}
            message={service.message}
            label={data.services.cta}
            accessibleLabel={`${data.services.cta}: ${service.title}`}
          />
        </li>
      ))}
    </ul>
  </div>
</section>
```

- [ ] **Step 8: Create `src/components/landing/GallerySection.astro`**

```astro
---
import ArchPhoto from './ArchPhoto.astro';
import { getSiteConfig } from '../../lib/config/site.ts';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
const instagram = getSiteConfig().social.instagram;
---

<section class="gallery band" aria-labelledby="gallery-title">
  <header class="section-head shell" data-reveal>
    <h2 id="gallery-title">{data.gallery.title}</h2>
    <p class="lede">{data.gallery.lede}</p>
  </header>
  <div
    class="gallery-viewport"
    role="region"
    aria-labelledby="gallery-title"
    tabindex="0"
    data-gallery
  >
    <ol class="gallery-track" data-gallery-track>
      {data.gallery.items.map((item) => (
        <li class="gallery-item">
          <figure>
            <ArchPhoto
              photo={item}
              sizes="(min-width: 64rem) 26rem, 80vw"
              shape="card"
            />
            <figcaption>
              <span>{item.location}</span>
              <span class="sep" aria-hidden="true"></span>
              <span>{item.theme}</span>
              <span class="dots">
                <span class="visually-hidden">
                  {item.colours.map((colour) => colour.name).join(', ')}
                </span>
                {item.colours.map((colour) => (
                  <span
                    class="dot"
                    style={`--dot: ${colour.hex}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ol>
  </div>
  {instagram && (
    <p class="shell more">
      <a href={instagram} rel="noopener">
        {data.gallery.more}
      </a>
    </p>
  )}
</section>
```

- [ ] **Step 9: Create `src/components/landing/SculpturesSection.astro`**

```astro
---
import ArchPhoto from './ArchPhoto.astro';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section
  class="sculptures band"
  data-palette="blush-champagne"
  aria-labelledby="sculptures-title"
>
  <div class="shell sculptures-grid">
    <div>
      <header class="section-head" data-reveal>
        <h2 id="sculptures-title">{data.sculptures.title}</h2>
        <p class="lede">{data.sculptures.lede}</p>
      </header>
      <div class="sculpture-photos">
        {data.sculptures.photos.map((photo) => (
          <figure data-reveal>
            <ArchPhoto photo={photo} sizes="(min-width: 64rem) 18vw, 45vw" />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
    <div class="stage sculpture-stage" data-island="sculptures">
      <canvas class="island-canvas" aria-hidden="true"></canvas>
      <ul class="piece-names" aria-hidden="true">
        {data.sculptures.pieces.map((piece) => <li>{piece.name}</li>)}
      </ul>
    </div>
  </div>
</section>
```

The 3D stage is decorative; the real photos carry the content.

- [ ] **Step 10: Create `src/components/landing/VenuesSection.astro`**

```astro
---
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section class="venues" aria-labelledby="venues-title">
  <div class="shell">
    <h2 id="venues-title" data-reveal>{data.venues.title}</h2>
  </div>
  <div class="marquee" data-marquee>
    <ul class="marquee-list">
      {data.venues.items.map((venue) => <li>{venue}</li>)}
    </ul>
    <ul class="marquee-list marquee-copy" aria-hidden="true">
      {data.venues.items.map((venue) => <li>{venue}</li>)}
    </ul>
  </div>
</section>
```

- [ ] **Step 11: Create `StepsSection.astro` and `FaqSection.astro`**

`src/components/landing/StepsSection.astro`:

```astro
---
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  steps: LandingData['steps'];
}
const { steps } = Astro.props;
---

<section class="steps band" aria-labelledby="steps-title">
  <div class="shell">
    <h2 id="steps-title" data-reveal>{steps.title}</h2>
    <ol class="step-list">
      {steps.items.map((step) => (
        <li data-reveal>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  </div>
</section>
```

`src/components/landing/FaqSection.astro`:

```astro
---
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  faq: LandingData['faq'];
}
const { faq } = Astro.props;
const published = faq.items.filter((item) => !item.draft);
---

{published.length > 0 && (
  <section class="faq band" aria-labelledby="faq-title">
    <div class="shell">
      <h2 id="faq-title" data-reveal>{faq.title}</h2>
      {published.map((item) => (
        <details data-reveal>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 12: Create `src/components/landing/ClosingSection.astro`**

```astro
---
import ArchPhoto from './ArchPhoto.astro';
import PalettePicker from './PalettePicker.astro';
import WhatsAppLink from './WhatsAppLink.astro';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section class="closing" data-palette-follow aria-labelledby="closing-title">
  <div class="closing-copy">
    <h2 id="closing-title" class="display" data-reveal>{data.closing.title}</h2>
    <p class="lede" data-reveal>{data.closing.body}</p>
    <PalettePicker copy={data.palettes} />
    <div class="actions" data-reveal>
      <WhatsAppLink
        number={data.whatsapp}
        message={data.closing.message}
        label={data.closing.cta}
        variant="primary"
        paletteLink
      />
    </div>
  </div>
  <div class="stage closing-stage" data-island="release">
    <ArchPhoto photo={data.closing.photo} sizes="(min-width: 64rem) 45vw, 100vw" />
    <canvas class="island-canvas" aria-hidden="true"></canvas>
  </div>
</section>
```

- [ ] **Step 13: Create `src/components/landing/LandingFooter.astro`**

```astro
---
import { getSiteConfig } from '../../lib/config/site.ts';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
const site = getSiteConfig();
const links = [
  { href: site.social.instagram, label: data.meta.instagramLabel },
  { href: site.social.xiaohongshu, label: data.meta.xiaohongshuLabel },
].filter((link) => Boolean(link.href));
---

<div class="landing-footer">
  <ul class="nav-list">
    {links.map((link) => (
      <li>
        <a href={link.href} rel="noopener">
          {link.label}
        </a>
      </li>
    ))}
  </ul>
  <p>{data.meta.registration}</p>
  <p>© {new Date().getFullYear()} {site.name}. {data.meta.rights}</p>
</div>
```

- [ ] **Step 14: Create `src/components/landing/LandingView.astro`**

```astro
---
import ClosingSection from './ClosingSection.astro';
import FaqSection from './FaqSection.astro';
import GallerySection from './GallerySection.astro';
import HeroSection from './HeroSection.astro';
import SculpturesSection from './SculpturesSection.astro';
import ServicesSection from './ServicesSection.astro';
import StepsSection from './StepsSection.astro';
import VenuesSection from './VenuesSection.astro';
import { localeDirection } from '../../lib/i18n/ui.ts';
import type { LandingData } from '../../lib/landing/content.ts';
import { defaultPaletteId } from '../../lib/landing/palettes.ts';
import '../../styles/landing.css';
interface Props {
  data: LandingData;
  contentLocale: string;
}
const { data, contentLocale } = Astro.props;
---

<div
  class="landing"
  data-landing
  data-page-motion
  data-intro
  data-palette={defaultPaletteId}
  data-whatsapp-number={data.whatsapp}
  data-intro-skip={data.intro.skip}
  lang={contentLocale}
  dir={localeDirection(contentLocale)}
>
  <HeroSection data={data} />
  <ServicesSection data={data} />
  <GallerySection data={data} />
  <SculpturesSection data={data} />
  <VenuesSection data={data} />
  {!data.steps.draft && <StepsSection steps={data.steps} />}
  <FaqSection faq={data.faq} />
  <ClosingSection data={data} />
</div>
```

- [ ] **Step 15: Create `src/styles/landing.css`**

```css
.landing .band,
.landing .hero,
.landing .closing {
  background: var(--tint);
}
.landing .band {
  padding-block: var(--space-xl);
}
.eyebrow {
  margin-block: 0 var(--space-sm);
  color: var(--color-muted);
  font-size: var(--font-size-small);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}
.landing:lang(zh) .eyebrow {
  letter-spacing: 0.3em;
  text-transform: none;
}
.display {
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  letter-spacing: var(--tracking-title);
  line-height: var(--line-title);
}
.landing:lang(zh) .display {
  letter-spacing: 0.04em;
  line-height: 1.25;
}
.lede {
  max-inline-size: 36rem;
  color: var(--color-muted);
  font-size: var(--font-size-lead);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-block: var(--space-md);
}
.whatsapp {
  display: inline-flex;
  align-items: center;
  min-block-size: 2.75rem;
  padding: 0.7em 1.4em;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.3s var(--ease-out);
}
.whatsapp.primary {
  background: var(--color-text);
  color: var(--color-on-ink);
}
.whatsapp.quiet {
  border: var(--border-width) solid currentColor;
  color: var(--color-text);
}
.whatsapp:hover {
  transform: translateY(-2px);
}
.photo {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
.photo-arch {
  border-radius: var(--radius-arch);
}
.photo-card {
  border-radius: var(--radius-card);
}

/* Hero and closing share the copy-plus-stage layout. */
.hero,
.closing {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
}
.hero {
  min-block-size: min(100svh, 62rem);
}
.hero-copy,
.closing-copy {
  padding: var(--space-xl) var(--space-page) var(--space-lg);
}
.hero h1 {
  max-inline-size: 12ch;
  margin-block: 0 var(--space-md);
  font-size: var(--font-size-display);
}
.landing:lang(zh) .hero h1 {
  max-inline-size: 9em;
}
.closing h2 {
  margin-block: 0 var(--space-md);
  font-size: var(--font-size-title);
}
.stage {
  position: relative;
  aspect-ratio: 4 / 5;
  margin: 0 var(--space-page) var(--space-lg);
}
.stage > .photo {
  position: absolute;
  inset: 0;
  transition: opacity 0.8s var(--ease-out);
}
@media (min-width: 64rem) {
  .hero,
  .closing {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  }
  .hero-copy,
  .closing-copy {
    padding-inline-start: max(
      var(--space-page),
      calc((100vw - var(--width-site)) / 2 + var(--space-page))
    );
  }
  .hero .stage,
  .closing .stage {
    aspect-ratio: auto;
    block-size: 100%;
    min-block-size: 40rem;
    margin: 0;
  }
}

.palette-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-block: var(--space-md);
}
.palette-picker[hidden] {
  display: none;
}
.picker-label {
  flex-basis: 100%;
  margin: 0;
  color: var(--color-muted);
  font-size: var(--font-size-small);
}
.palette-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-block-size: 2.75rem;
  padding: 0.35rem 0.9rem 0.35rem 0.55rem;
  border: var(--border-width) solid var(--color-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-page) 75%, transparent);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-small);
  cursor: pointer;
}
.palette-option[aria-checked='true'] {
  border-color: var(--color-text);
  box-shadow: inset 0 0 0 1px var(--color-text);
}
.swatches {
  display: inline-flex;
}
.swatch {
  inline-size: 1rem;
  block-size: 1rem;
  margin-inline-start: -0.3rem;
  border: 1px solid rgb(0 0 0 / 0.12);
  border-radius: 50%;
  background: var(--swatch);
}
.swatch:first-child {
  margin-inline-start: 0;
}

.section-head {
  max-inline-size: 48rem;
  margin-block-end: var(--space-lg);
}
.section-head h2,
.venues h2,
.steps h2,
.faq h2 {
  margin-block: 0 var(--space-sm);
  font-size: var(--font-size-title);
}
.service-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-lg) var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;
}
.service {
  padding: var(--space-sm) var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  background: var(--tint);
}
.service .photo {
  aspect-ratio: 4 / 5;
}
.service h3 {
  margin-block: var(--space-md) var(--space-xs);
  font-size: 1.6rem;
}

.gallery-viewport {
  overflow-x: auto;
  padding-inline: var(--space-page);
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}
.gallery-viewport.is-pinned {
  overflow: hidden;
}
.gallery-track {
  display: flex;
  gap: var(--space-md);
  inline-size: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
}
.gallery-item {
  inline-size: clamp(16rem, 30vw, 26rem);
  scroll-snap-align: start;
}
.gallery-item .photo {
  aspect-ratio: 4 / 5;
}
.gallery figure,
.sculptures figure {
  margin: 0;
}
.gallery figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-block-start: var(--space-xs);
  font-size: var(--font-size-small);
}
.sep {
  inline-size: 1px;
  block-size: 1em;
  background: var(--color-muted);
}
.dots {
  display: inline-flex;
  gap: 0.25rem;
  margin-inline-start: auto;
}
.dot {
  inline-size: 0.75rem;
  block-size: 0.75rem;
  border: 1px solid rgb(0 0 0 / 0.15);
  border-radius: 50%;
  background: var(--dot);
}
.more {
  margin-block-start: var(--space-md);
}

.sculptures-grid {
  display: grid;
  gap: var(--space-lg);
}
.sculpture-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
}
.sculpture-photos .photo {
  aspect-ratio: 3 / 4;
}
.sculpture-photos figcaption {
  margin-block-start: var(--space-xs);
  color: var(--color-muted);
  font-size: var(--font-size-small);
}
.sculpture-stage {
  aspect-ratio: 3 / 5;
  margin: 0;
}
.sculpture-stage:not([data-island-state]),
.sculpture-stage[data-island-state='fallback'],
.sculpture-stage[data-island-state='disposed'] {
  display: none;
}
.piece-names {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  justify-content: space-around;
  margin: 0;
  padding: 0;
  color: var(--color-muted);
  font-family: var(--font-display);
  list-style: none;
}
@media (min-width: 40rem) {
  .sculpture-stage {
    aspect-ratio: 16 / 10;
  }
}
@media (min-width: 64rem) {
  .sculptures-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    align-items: center;
  }
}

.venues {
  padding-block: var(--space-xl) var(--space-lg);
}
.marquee {
  display: flex;
  overflow: hidden;
  padding-block: var(--space-md);
  border-block: var(--border-width) solid var(--color-border);
}
.marquee-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm) var(--space-lg);
  margin: 0;
  padding-inline: var(--space-page);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  list-style: none;
}
.marquee-copy {
  display: none;
}
.marquee.is-running .marquee-list {
  flex-shrink: 0;
  flex-wrap: nowrap;
  padding-inline: 0 var(--space-lg);
}
.marquee.is-running .marquee-copy {
  display: flex;
}

.step-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: var(--space-lg);
  padding: 0;
  list-style: none;
  counter-reset: step;
}
.step-list li::before {
  content: counter(step, decimal-leading-zero);
  counter-increment: step;
  color: var(--color-link);
  font-family: var(--font-display);
  font-size: var(--font-size-heading);
}

.faq details {
  max-inline-size: var(--width-reading);
  padding-block: var(--space-sm);
  border-block-end: var(--border-width) solid var(--color-border);
}
.faq summary {
  font-family: var(--font-display);
  font-size: 1.35rem;
  cursor: pointer;
}
.faq details p {
  margin-block: var(--space-xs) 0;
  color: var(--color-muted);
}

.landing-footer p {
  margin-block: var(--space-xs) 0;
}
```

- [ ] **Step 16: Render the landing from `src/components/PageView.astro`**

Add the imports:

```ts
import LandingFooter from './landing/LandingFooter.astro';
import LandingView from './landing/LandingView.astro';
import PaletteStyles from './landing/PaletteStyles.astro';
import { whatsappUrl } from '../lib/contact/whatsapp.ts';
import { getLanding } from '../lib/landing/content.ts';
```

After `const site = getSiteConfig();` add:

```ts
const landing =
  route.kind === 'page' && route.slug === 'home'
    ? await getLanding(route.locale)
    : undefined;
const headerCta = landing && {
  href: whatsappUrl(landing.data.whatsapp, landing.data.hero.message),
  label: landing.data.hero.cta,
};
```

Add `headerCta={headerCta}` to the `<BaseLayout …>` props. Then restructure the `BaseLayout` body:
1. Insert `{landing && <PaletteStyles slot="head" />}` as its first child.
2. Wrap the existing `<article class="page-content shell" …>…</article>` element, unchanged, as the else branch of `{landing ? (<LandingView data={landing.data} contentLocale={landing.locale} />) : ( … )}`.
3. Insert `{landing && <LandingFooter slot="footer" data={landing.data} />}` as its last child.

If `pnpm check` or the build reports that a named slot inside an expression is unsupported, use `<Fragment slot="head">{landing && <PaletteStyles />}</Fragment>` for the head. For the footer, add a `footer?: LandingData` prop to `BaseLayout` that renders `<LandingFooter>` inside `SiteFooter` instead of the slot.

- [ ] **Step 17: Run the tests**

Run: `pnpm vitest run tests/integration/landing-build.test.ts`
Expected: PASS.

Run: `pnpm test && pnpm check && pnpm lint`
Expected: all pass. Fix Prettier formatting with `pnpm format`.

- [ ] **Step 18: Look at it**

Run `pnpm build && pnpm preview`. Open `http://localhost:4321/one23balloon/` in the in-app browser at 1280px and 360px wide, and check that the sections stack sensibly and the photos load. Without scripts, the sculpture stage and the palette pickers are hidden; that is correct.

- [ ] **Step 19: Commit**

```bash
git add src/components src/styles/landing.css tests/integration/landing-build.test.ts
git commit -m "feat: render the one23balloon landing sections as static HTML

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Palette picker

**Files:**
- Create: `src/lib/landing/events.ts`
- Create: `src/scripts/palette-picker.ts`
- Test: `tests/unit/palette-picker.test.ts`

**Interfaces:**
- Consumes: DOM contracts from Task 10; `whatsappUrl` (Task 3); `isPaletteId`, `PaletteId` (Task 4).
- Produces: `paletteChangeEvent = 'one23balloon:palettechange'` (a bubbling `CustomEvent<{ id: PaletteId }>` dispatched from the landing root); `selectPalette(root: HTMLElement, id: PaletteId): void`; `initPalettePicker(root: HTMLElement): () => void`.

- [ ] **Step 1: Write the failing test**

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { paletteChangeEvent } from '../../src/lib/landing/events.ts';
import {
  initPalettePicker,
  selectPalette,
} from '../../src/scripts/palette-picker.ts';

let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM(
    `<div data-landing data-palette="blush-champagne" data-whatsapp-number="60109017633">
      <div data-palette-picker hidden role="radiogroup">
        <button role="radio" aria-checked="true" tabindex="0" data-palette-option="blush-champagne" data-message="Blush please">Blush</button>
        <button role="radio" aria-checked="false" tabindex="-1" data-palette-option="rose-gold" data-message="Rose & gold please">Rose</button>
      </div>
      <a data-palette-link href="https://wa.me/60109017633?text=Hi">Hero</a>
    </div>
    <a data-palette-link href="https://wa.me/60109017633?text=Hi">Header</a>`,
    { url: 'https://local.example.test/' },
  );
  vi.stubGlobal('CustomEvent', dom.window.CustomEvent);
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});
const document = () => dom.window.document;
const root = () => document().querySelector<HTMLElement>('[data-landing]')!;
const option = (id: string) =>
  document().querySelector<HTMLElement>(`[data-palette-option="${id}"]`)!;
const hrefs = () =>
  [...document().querySelectorAll('a[data-palette-link]')].map((link) =>
    link.getAttribute('href'),
  );
const key = (target: Element, name: string) =>
  target.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: name, bubbles: true }),
  );

describe('palette picker', () => {
  it('reveals the pickers and hides them again on dispose', () => {
    const picker = document().querySelector('[data-palette-picker]')!;
    const dispose = initPalettePicker(root());
    expect(picker.hasAttribute('hidden')).toBe(false);
    dispose();
    expect(picker.hasAttribute('hidden')).toBe(true);
  });

  it('selects on click, rewrites every palette link and announces the change', () => {
    initPalettePicker(root());
    const events: string[] = [];
    document().addEventListener(paletteChangeEvent, (event) =>
      events.push((event as CustomEvent<{ id: string }>).detail.id),
    );
    option('rose-gold').click();
    expect(root().dataset.palette).toBe('rose-gold');
    expect(option('rose-gold').getAttribute('aria-checked')).toBe('true');
    expect(option('blush-champagne').getAttribute('aria-checked')).toBe('false');
    expect(option('rose-gold').tabIndex).toBe(0);
    expect(option('blush-champagne').tabIndex).toBe(-1);
    expect(hrefs()).toEqual([
      'https://wa.me/60109017633?text=Rose%20%26%20gold%20please',
      'https://wa.me/60109017633?text=Rose%20%26%20gold%20please',
    ]);
    expect(events).toEqual(['rose-gold']);
  });

  it('moves the selection with arrow keys, wraps, and moves focus', () => {
    initPalettePicker(root());
    key(option('blush-champagne'), 'ArrowRight');
    expect(root().dataset.palette).toBe('rose-gold');
    expect(document().activeElement).toBe(option('rose-gold'));
    key(option('rose-gold'), 'ArrowRight');
    expect(root().dataset.palette).toBe('blush-champagne');
    key(option('blush-champagne'), 'End');
    expect(root().dataset.palette).toBe('rose-gold');
  });

  it('ignores clicks after dispose', () => {
    const dispose = initPalettePicker(root());
    dispose();
    option('rose-gold').click();
    expect(root().dataset.palette).toBe('blush-champagne');
  });

  it('leaves links untouched without a WhatsApp number', () => {
    root().removeAttribute('data-whatsapp-number');
    selectPalette(root(), 'rose-gold');
    expect(hrefs()[0]).toBe('https://wa.me/60109017633?text=Hi');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/palette-picker.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Create `src/lib/landing/events.ts`**

```ts
// Dispatched (bubbling) from the landing root when a visitor picks a palette.
export const paletteChangeEvent = 'one23balloon:palettechange';
```

- [ ] **Step 4: Implement `src/scripts/palette-picker.ts`**

```ts
import { whatsappUrl } from '../lib/contact/whatsapp.ts';
import { paletteChangeEvent } from '../lib/landing/events.ts';
import { isPaletteId, type PaletteId } from '../lib/landing/palettes.ts';

const optionSelector = '[data-palette-option]';
const moves: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

function options(scope: ParentNode): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(optionSelector)];
}

export function selectPalette(root: HTMLElement, id: PaletteId): void {
  root.dataset.palette = id;
  let message: string | undefined;
  for (const option of options(root)) {
    const selected = option.dataset.paletteOption === id;
    option.setAttribute('aria-checked', String(selected));
    option.tabIndex = selected ? 0 : -1;
    if (selected) message ??= option.dataset.message;
  }
  const number = root.dataset.whatsappNumber;
  if (number && message) {
    const href = whatsappUrl(number, message);
    // The header CTA sits outside the landing root, so search the document.
    for (const link of root.ownerDocument.querySelectorAll<HTMLAnchorElement>(
      'a[data-palette-link]',
    ))
      link.href = href;
  }
  root.dispatchEvent(
    new CustomEvent(paletteChangeEvent, { bubbles: true, detail: { id } }),
  );
}

export function initPalettePicker(root: HTMLElement): () => void {
  const pickers = [
    ...root.querySelectorAll<HTMLElement>('[data-palette-picker]'),
  ];
  if (!pickers.length) return () => undefined;
  for (const picker of pickers) picker.hidden = false;

  const onClick = (event: Event) => {
    const option = (event.target as Element | null)?.closest<HTMLElement>(
      optionSelector,
    );
    const id = option?.dataset.paletteOption;
    if (id && isPaletteId(id)) selectPalette(root, id);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const move = moves[event.key];
    const option = (event.target as Element | null)?.closest<HTMLElement>(
      optionSelector,
    );
    const picker = option?.closest<HTMLElement>('[data-palette-picker]');
    if (!move || !option || !picker) return;
    const group = options(picker);
    const next = group[move(group.indexOf(option), group.length)];
    const id = next?.dataset.paletteOption;
    if (!id || !isPaletteId(id)) return;
    event.preventDefault();
    selectPalette(root, id);
    next.focus();
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    for (const picker of pickers) picker.hidden = true;
  };
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm vitest run tests/unit/palette-picker.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/landing/events.ts src/scripts/palette-picker.ts tests/unit/palette-picker.test.ts
git commit -m "feat: add accessible palette picker that rewrites WhatsApp messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Engine-agnostic canvas-island lifecycle

This module must not import Three.js or mention balloons; it is the candidate to extract into canvas-base later.

**Files:**
- Create: `src/lib/canvas-island/capability.ts`
- Create: `src/lib/canvas-island/lifecycle.ts`
- Test: `tests/unit/canvas-island.test.ts`

**Interfaces:**
- Produces:
  - `type QualityTier = 'high' | 'low'`
  - `type Capability = { webgl: boolean; reducedMotion: boolean; tier: QualityTier; pixelRatio: number }`
  - `type CapabilityProbe = { matchMedia?: (query: string) => { matches: boolean }; devicePixelRatio?: number; hardwareConcurrency?: number; deviceMemory?: number; createCanvas?: () => { getContext(type: string): unknown } }`
  - `detectCapability(probe: CapabilityProbe): Capability`, `browserProbe(): CapabilityProbe`
  - `type IslandScene = { start(): void; stop(): void; resize(width: number, height: number): void; dispose(): void }`
  - `type SceneFactory = (canvas: HTMLCanvasElement, capability: Capability) => Promise<IslandScene>`
  - `type IslandState = 'idle' | 'loading' | 'live' | 'fallback' | 'disposed'`
  - `type Observe = (element: Element, onChange: (visible: boolean) => void) => () => void`
  - `type IslandOptions = { element: HTMLElement; load: () => Promise<SceneFactory>; capability: Capability; allowReducedMotion?: boolean; observe?: Observe; onState?: (state: IslandState) => void }`
  - `type Island = { readonly state: IslandState; dispose(): void }`
  - `observeIntersection: Observe`, `mountIsland(options: IslandOptions): Island`
  - Side effect: `element.dataset.islandState` mirrors the state.

- [ ] **Step 1: Write the failing test**

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectCapability,
  type Capability,
} from '../../src/lib/canvas-island/capability.ts';
import {
  mountIsland,
  type IslandScene,
  type Observe,
} from '../../src/lib/canvas-island/lifecycle.ts';

const media =
  (matches: Record<string, boolean>) =>
  (query: string) => ({ matches: Boolean(matches[query]) });
const canvasWith = (context: unknown) => () => ({ getContext: () => context });

describe('detectCapability', () => {
  it('reports WebGL, the high tier and a pixel ratio capped at 2', () => {
    const loseContext = vi.fn();
    expect(
      detectCapability({
        matchMedia: media({}),
        devicePixelRatio: 3,
        hardwareConcurrency: 8,
        deviceMemory: 8,
        createCanvas: canvasWith({ getExtension: () => ({ loseContext }) }),
      }),
    ).toEqual({ webgl: true, reducedMotion: false, tier: 'high', pixelRatio: 2 });
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it.each([
    { matchMedia: media({ '(pointer: coarse)': true }) },
    { hardwareConcurrency: 4 },
    { deviceMemory: 2 },
  ])('uses the low tier for %o', (probe) => {
    expect(
      detectCapability({ devicePixelRatio: 3, createCanvas: canvasWith({}), ...probe }),
    ).toMatchObject({ tier: 'low', pixelRatio: 1.5 });
  });

  it('reports reduced motion', () => {
    expect(
      detectCapability({
        matchMedia: media({ '(prefers-reduced-motion: reduce)': true }),
      }).reducedMotion,
    ).toBe(true);
  });

  it('treats missing or failing WebGL as unavailable', () => {
    expect(detectCapability({ createCanvas: canvasWith(null) }).webgl).toBe(false);
    expect(
      detectCapability({
        createCanvas: () => {
          throw new Error('blocked');
        },
      }).webgl,
    ).toBe(false);
    expect(detectCapability({}).webgl).toBe(false);
  });
});

describe('mountIsland', () => {
  let dom: JSDOM;
  beforeEach(() => {
    dom = new JSDOM('<div data-island="demo"><canvas></canvas></div>');
  });
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });

  const capable: Capability = { webgl: true, reducedMotion: false, tier: 'high', pixelRatio: 1 };
  const element = () => dom.window.document.querySelector<HTMLElement>('[data-island]')!;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const fakeScene = () => ({ start: vi.fn(), stop: vi.fn(), resize: vi.fn(), dispose: vi.fn() });
  function manualVisibility() {
    let notify: (visible: boolean) => void = () => undefined;
    const stop = vi.fn();
    const observe: Observe = (_element, onChange) => {
      notify = onChange;
      return stop;
    };
    return { observe, stop, show: (visible: boolean) => notify(visible) };
  }

  it('falls back without WebGL and never loads', () => {
    const load = vi.fn();
    const island = mountIsland({ element: element(), load, capability: { ...capable, webgl: false } });
    expect(island.state).toBe('fallback');
    expect(element().dataset.islandState).toBe('fallback');
    expect(load).not.toHaveBeenCalled();
  });

  it('falls back under reduced motion unless explicitly allowed', () => {
    const reduced = { ...capable, reducedMotion: true };
    expect(mountIsland({ element: element(), load: vi.fn(), capability: reduced }).state).toBe('fallback');
    expect(
      mountIsland({ element: element(), load: vi.fn(), capability: reduced, allowReducedMotion: true, observe: () => () => undefined }).state,
    ).toBe('idle');
  });

  it('loads when visible, starts, and stops when scrolled away', async () => {
    const scene = fakeScene();
    const factory = vi.fn(async () => scene);
    const visibility = manualVisibility();
    const island = mountIsland({ element: element(), load: async () => factory, capability: capable, observe: visibility.observe });
    expect(island.state).toBe('idle');
    visibility.show(true);
    await flush();
    expect(island.state).toBe('live');
    expect(factory).toHaveBeenCalledWith(element().querySelector('canvas'), capable);
    expect(scene.resize).toHaveBeenCalledOnce();
    expect(scene.start).toHaveBeenCalledOnce();
    visibility.show(false);
    expect(scene.stop).toHaveBeenCalledOnce();
  });

  it('pauses while the document is hidden', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    mountIsland({ element: element(), load: async () => async () => scene, capability: capable, observe: visibility.observe });
    visibility.show(true);
    await flush();
    Object.defineProperty(dom.window.document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    expect(scene.stop).toHaveBeenCalledOnce();
  });

  it('falls back when loading fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => {
        throw new Error('chunk failed');
      },
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    expect(island.state).toBe('fallback');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('disposes the scene and stops observing', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    const island = mountIsland({ element: element(), load: async () => async () => scene, capability: capable, observe: visibility.observe });
    visibility.show(true);
    await flush();
    island.dispose();
    expect(scene.stop).toHaveBeenCalled();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(visibility.stop).toHaveBeenCalledOnce();
    expect(island.state).toBe('disposed');
  });

  it('disposes a scene that finishes loading after the island was disposed', async () => {
    let resolve: (scene: IslandScene) => void = () => undefined;
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => () => new Promise<IslandScene>((done) => (resolve = done)),
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    island.dispose();
    const scene = fakeScene();
    resolve(scene);
    await flush();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(scene.start).not.toHaveBeenCalled();
  });

  it('falls back and releases the scene when the WebGL context is lost', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    const island = mountIsland({ element: element(), load: async () => async () => scene, capability: capable, observe: visibility.observe });
    visibility.show(true);
    await flush();
    element().querySelector('canvas')!.dispatchEvent(new dom.window.Event('webglcontextlost', { cancelable: true }));
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(island.state).toBe('fallback');
  });
});
```

Run `pnpm prettier --write tests/unit/canvas-island.test.ts` after creating it.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/canvas-island.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/canvas-island/capability.ts`**

```ts
export type QualityTier = 'high' | 'low';
export type Capability = {
  webgl: boolean;
  reducedMotion: boolean;
  tier: QualityTier;
  pixelRatio: number;
};
export type CapabilityProbe = {
  matchMedia?: (query: string) => { matches: boolean };
  devicePixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  createCanvas?: () => { getContext(type: string): unknown };
};
type ProbeContext = {
  getExtension?(name: string): { loseContext?(): void } | null;
} | null;

function webglAvailable(probe: CapabilityProbe): boolean {
  try {
    const canvas = probe.createCanvas?.();
    const context = (canvas?.getContext('webgl2') ??
      canvas?.getContext('webgl')) as ProbeContext | undefined;
    // Release the probe context immediately; browsers cap live contexts.
    context?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    return Boolean(context);
  } catch {
    return false;
  }
}

export function detectCapability(probe: CapabilityProbe): Capability {
  const matches = (query: string) => Boolean(probe.matchMedia?.(query).matches);
  const low =
    matches('(pointer: coarse)') ||
    (probe.hardwareConcurrency ?? 8) <= 4 ||
    (probe.deviceMemory ?? 8) <= 4;
  const tier: QualityTier = low ? 'low' : 'high';
  return {
    webgl: webglAvailable(probe),
    reducedMotion: matches('(prefers-reduced-motion: reduce)'),
    tier,
    pixelRatio: Math.min(probe.devicePixelRatio ?? 1, low ? 1.5 : 2),
  };
}

export function browserProbe(): CapabilityProbe {
  return {
    matchMedia: globalThis.matchMedia
      ? (query) => globalThis.matchMedia(query)
      : undefined,
    devicePixelRatio: globalThis.devicePixelRatio,
    hardwareConcurrency: globalThis.navigator?.hardwareConcurrency,
    deviceMemory: (globalThis.navigator as Navigator & { deviceMemory?: number })
      ?.deviceMemory,
    createCanvas: () => document.createElement('canvas'),
  };
}
```

- [ ] **Step 4: Implement `src/lib/canvas-island/lifecycle.ts`**

```ts
import type { Capability } from './capability.ts';

export type IslandScene = {
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  dispose(): void;
};
export type SceneFactory = (
  canvas: HTMLCanvasElement,
  capability: Capability,
) => Promise<IslandScene>;
export type IslandState = 'idle' | 'loading' | 'live' | 'fallback' | 'disposed';
export type Observe = (
  element: Element,
  onChange: (visible: boolean) => void,
) => () => void;
export type IslandOptions = {
  element: HTMLElement;
  load: () => Promise<SceneFactory>;
  capability: Capability;
  allowReducedMotion?: boolean;
  observe?: Observe;
  onState?: (state: IslandState) => void;
};
export type Island = { readonly state: IslandState; dispose(): void };

export const observeIntersection: Observe = (element, onChange) => {
  if (typeof IntersectionObserver === 'undefined') {
    onChange(true);
    return () => undefined;
  }
  // Start loading a little before the island scrolls into view.
  const observer = new IntersectionObserver(
    (entries) => onChange(entries.some((entry) => entry.isIntersecting)),
    { rootMargin: '200px 0px' },
  );
  observer.observe(element);
  return () => observer.disconnect();
};

export function mountIsland(options: IslandOptions): Island {
  const {
    element,
    load,
    capability,
    allowReducedMotion = false,
    observe = observeIntersection,
    onState,
  } = options;
  const doc = element.ownerDocument;
  const canvas = element.querySelector('canvas');
  const cleanups: Array<() => void> = [];
  let state: IslandState = 'idle';
  let scene: IslandScene | undefined;
  let visible = false;
  // Read through a function: async steps change state behind TypeScript's back.
  const current = () => state;
  const setState = (next: IslandState) => {
    state = next;
    element.dataset.islandState = next;
    onState?.(next);
  };
  const release = () => {
    const active = scene;
    scene = undefined;
    active?.stop();
    active?.dispose();
  };
  const dispose = () => {
    if (current() === 'disposed') return;
    for (const cleanup of cleanups.splice(0)) cleanup();
    release();
    setState('disposed');
  };
  const island: Island = {
    get state() {
      return current();
    },
    dispose,
  };

  if (
    !canvas ||
    !capability.webgl ||
    (capability.reducedMotion && !allowReducedMotion)
  ) {
    setState('fallback');
    return island;
  }
  setState('idle');

  const sync = () => {
    if (!scene) return;
    if (visible && doc.visibilityState !== 'hidden') scene.start();
    else scene.stop();
  };
  const resize = () => scene?.resize(canvas.clientWidth, canvas.clientHeight);
  const ensureLoaded = async () => {
    if (current() !== 'idle') return;
    setState('loading');
    try {
      const factory = await load();
      if (current() !== 'loading') return;
      const created = await factory(canvas, capability);
      if (current() !== 'loading') {
        created.dispose();
        return;
      }
      scene = created;
      resize();
      setState('live');
      sync();
    } catch (error) {
      if (current() === 'disposed') return;
      console.warn('3D scene unavailable; showing the photo instead.', error);
      release();
      setState('fallback');
    }
  };

  cleanups.push(
    observe(element, (isVisible) => {
      visible = isVisible;
      if (isVisible) void ensureLoaded();
      sync();
    }),
  );
  const onVisibility = () => sync();
  doc.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => doc.removeEventListener('visibilitychange', onVisibility));
  const onContextLost = (event: Event) => {
    event.preventDefault();
    release();
    if (current() !== 'disposed') setState('fallback');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  cleanups.push(() =>
    canvas.removeEventListener('webglcontextlost', onContextLost),
  );
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    cleanups.push(() => observer.disconnect());
  }
  return island;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm vitest run tests/unit/canvas-island.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/canvas-island tests/unit/canvas-island.test.ts
git commit -m "feat: add engine-agnostic canvas-island lifecycle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Three.js scene foundation

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (`three`, `@types/three`)
- Create: `src/lib/random.ts`
- Create: `src/scenes/material-params.ts`, `materials.ts`, `balloon-motion.ts`, `balloon.ts`, `confetti.ts`, `environment.ts`, `renderer.ts`, `loop.ts`, `picking.ts`, `palette-source.ts`
- Test: `tests/unit/scene-foundation.test.ts`

**Interfaces:**
- Consumes: `palettes`, `PaletteId`, `PaletteColour`, `Material`, `defaultPaletteId`, `isPaletteId` (Task 4); `paletteChangeEvent` (Task 11); `Capability` (Task 12).
- Produces:
  - `mulberry32(seed: number): () => number`
  - `type SurfaceParams = { metalness; roughness; clearcoat; clearcoatRoughness; iridescence; envMapIntensity }` (all numbers), `surface: Record<Material, SurfaceParams>`, `mixSurface(from, to, t): SurfaceParams`, `easeInOut(t: number): number`
  - `type Slot = number | 'chrome'`, `paletteColour(id: PaletteId, slot: Slot): PaletteColour`, `class PaletteMaterials { constructor(paletteId: PaletteId, random?: () => number); readonly palette: PaletteId; create(slot: Slot): MeshPhysicalMaterial; shared(slot: Slot): MeshPhysicalMaterial; transitionTo(id: PaletteId, now: number): void; update(now: number): void; dispose(): void }`
  - `POP_DURATION = 0.07`, `INFLATE_DURATION = 0.7`, `REINFLATE_DELAY = 2.4`, `popScale(elapsed: number): number | null`, `inflateScale(elapsed: number): number`
  - `type BalloonState = 'idle' | 'popping' | 'hidden' | 'inflating'`, `createBalloonGeometry(widthSegments: number): SphereGeometry`, `class Balloon { constructor(mesh: Mesh, reinflate: boolean); static create(geometry, material, radius: number, reinflate: boolean): Balloon; readonly mesh: Mesh; state: BalloonState; pop(now: number): boolean; inflate(now: number): void; update(now: number): void; readonly poppable: boolean }` (sets `mesh.userData.balloon = this`)
  - `class Confetti { constructor(parent: Object3D, random: () => number); burst(origin: Vector3, colour: Color, options: { count: number; size: number; speed: number; now: number }): void; update(now: number, delta: number): void; readonly active: number; dispose(): void }`
  - `studioEnvironment(renderer: WebGLRenderer): { texture: Texture; dispose(): void }`
  - `createRenderer(canvas: HTMLCanvasElement, capability: Capability): WebGLRenderer`, `fitCamera(camera: PerspectiveCamera, renderer: WebGLRenderer, width: number, height: number): void`
  - `class FrameLoop { constructor(renderer: WebGLRenderer, tick: (time: number, delta: number) => void); start(): void; stop(): void }`
  - `createPicker(canvas: HTMLCanvasElement, camera: Camera, targets: () => Object3D[], onPick: (balloon: Balloon) => void): () => void`
  - `currentPalette(doc: Document): PaletteId`, `onPaletteChange(doc: Document, listener: (id: PaletteId) => void): () => void`

- [ ] **Step 1: Install Three.js**

```bash
pnpm add --save-exact three@0.186.1
pnpm add -D --save-exact @types/three@0.186.0
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/scene-foundation.test.ts`:

```ts
import { JSDOM } from 'jsdom';
import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { paletteChangeEvent } from '../../src/lib/landing/events.ts';
import { palettes } from '../../src/lib/landing/palettes.ts';
import { mulberry32 } from '../../src/lib/random.ts';
import { Balloon } from '../../src/scenes/balloon.ts';
import {
  INFLATE_DURATION,
  REINFLATE_DELAY,
  inflateScale,
  popScale,
} from '../../src/scenes/balloon-motion.ts';
import { Confetti } from '../../src/scenes/confetti.ts';
import { easeInOut, mixSurface, surface } from '../../src/scenes/material-params.ts';
import { PaletteMaterials, paletteColour } from '../../src/scenes/materials.ts';
import { currentPalette, onPaletteChange } from '../../src/scenes/palette-source.ts';

const hex = (color: Color) => `#${color.getHexString()}`;

describe('mulberry32', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('material parameters', () => {
  it('eases and mixes surfaces', () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(2)).toBe(1);
    expect(mixSurface(surface.latex, surface.chrome, 0.5).metalness).toBe(0.5);
  });
});

describe('balloon motion', () => {
  it('swells briefly, then disappears when popped', () => {
    expect(popScale(0)).toBe(1);
    expect(popScale(0.035)).toBeCloseTo(1.14, 5);
    expect(popScale(0.07)).toBeNull();
  });

  it('inflates from zero to one with a small overshoot and never goes negative', () => {
    const samples = Array.from({ length: 71 }, (_, i) => inflateScale(i / 100));
    expect(samples[0]).toBe(0);
    expect(inflateScale(INFLATE_DURATION)).toBe(1);
    expect(Math.max(...samples)).toBeGreaterThan(1);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
  });
});

describe('Balloon', () => {
  it('pops, hides, re-inflates and settles at its radius', () => {
    const balloon = Balloon.create(new BoxGeometry(), new MeshBasicMaterial(), 0.5, true);
    expect(balloon.mesh.userData.balloon).toBe(balloon);
    expect(balloon.pop(1)).toBe(true);
    expect(balloon.pop(1)).toBe(false);
    balloon.update(1.035);
    expect(balloon.mesh.scale.x).toBeGreaterThan(0.5);
    balloon.update(1.08);
    expect(balloon.state).toBe('hidden');
    expect(balloon.mesh.visible).toBe(false);
    expect(balloon.poppable).toBe(false);
    // Small margins keep floating-point subtraction on the right side of each threshold.
    const inflatedAt = 1.08 + REINFLATE_DELAY + 0.01;
    balloon.update(inflatedAt);
    expect(balloon.state).toBe('inflating');
    expect(balloon.mesh.visible).toBe(true);
    balloon.update(inflatedAt + INFLATE_DURATION + 0.01);
    expect(balloon.state).toBe('idle');
    expect(balloon.mesh.scale.x).toBeCloseTo(0.5);
  });

  it('keeps a non-uniform base scale and can stay popped', () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    mesh.scale.set(1, 2, 1);
    const balloon = new Balloon(mesh, false);
    balloon.pop(0);
    balloon.update(0.1);
    balloon.update(10);
    expect(balloon.state).toBe('hidden');
    balloon.inflate(10);
    balloon.update(10 + INFLATE_DURATION + 0.01);
    expect(mesh.scale.toArray()).toEqual([1, 2, 1]);
  });
});

describe('Confetti', () => {
  it('adds particles, removes them after their lifetime, and disposes', () => {
    const parent = new Group();
    const confetti = new Confetti(parent, mulberry32(1));
    confetti.burst(new Vector3(), new Color('#ff0000'), { count: 5, size: 0.1, speed: 1, now: 0 });
    expect(parent.children).toHaveLength(5);
    confetti.update(1, 0.016);
    expect(confetti.active).toBe(5);
    confetti.update(2, 0.016);
    expect(parent.children).toHaveLength(0);
    confetti.burst(new Vector3(), new Color('#00ff00'), { count: 3, size: 0.1, speed: 1, now: 2 });
    confetti.dispose();
    expect(parent.children).toHaveLength(0);
  });
});

describe('PaletteMaterials', () => {
  it('creates palette materials and transitions them to another palette', () => {
    const materials = new PaletteMaterials('blush-champagne', () => 0);
    const latex = materials.create(0);
    const chrome = materials.create('chrome');
    expect(hex(latex.color)).toBe('#e8b4b2');
    expect(latex.metalness).toBe(0);
    expect(chrome.metalness).toBe(1);
    expect(hex(chrome.color)).toBe('#d9b47a');
    materials.transitionTo('rose-gold', 10);
    expect(materials.palette).toBe('rose-gold');
    materials.update(10.45);
    expect(hex(latex.color)).not.toBe('#e8b4b2');
    materials.update(11);
    expect(hex(latex.color)).toBe('#b5475b');
    expect(hex(chrome.color)).toBe('#d4af6a');
    expect(materials.shared(1)).toBe(materials.shared(1));
  });

  it('wraps slot numbers onto the palette', () => {
    expect(paletteColour('jewel', 7)).toEqual(palettes.jewel.colours[2]);
    expect(paletteColour('jewel', -1)).toEqual(palettes.jewel.colours[4]);
    expect(paletteColour('jewel', 'chrome').material).toBe('chrome');
  });
});

describe('palette source', () => {
  let dom: JSDOM;
  afterEach(() => dom?.window.close());

  it('reads the current palette and forwards valid changes only', () => {
    dom = new JSDOM('<div data-landing data-palette="sage-cream"></div>');
    const doc = dom.window.document;
    expect(currentPalette(doc)).toBe('sage-cream');
    const listener = vi.fn();
    const stop = onPaletteChange(doc, listener);
    const send = (id: string) =>
      doc.querySelector('[data-landing]')!.dispatchEvent(
        new dom.window.CustomEvent(paletteChangeEvent, { bubbles: true, detail: { id } }),
      );
    send('jewel');
    send('neon');
    stop();
    send('rose-gold');
    expect(listener.mock.calls).toEqual([['jewel']]);
  });

  it('falls back to the default palette', () => {
    dom = new JSDOM('<div></div>');
    expect(currentPalette(dom.window.document)).toBe('blush-champagne');
  });
});
```

Run `pnpm prettier --write tests/unit/scene-foundation.test.ts`.

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/scene-foundation.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 4: Implement `src/lib/random.ts`**

```ts
// mulberry32: tiny and deterministic, so layouts look the same on every load.
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 5: Implement `src/scenes/material-params.ts`**

```ts
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
  latex: { metalness: 0, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.22, iridescence: 0, envMapIntensity: 1 },
  pearl: { metalness: 0.25, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.12, iridescence: 0.45, envMapIntensity: 1.1 },
  chrome: { metalness: 1, roughness: 0.12, clearcoat: 0, clearcoatRoughness: 0, iridescence: 0, envMapIntensity: 1.25 },
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
  const mix = (key: keyof SurfaceParams) => from[key] + (to[key] - from[key]) * k;
  return {
    metalness: mix('metalness'),
    roughness: mix('roughness'),
    clearcoat: mix('clearcoat'),
    clearcoatRoughness: mix('clearcoatRoughness'),
    iridescence: mix('iridescence'),
    envMapIntensity: mix('envMapIntensity'),
  };
}
```

- [ ] **Step 6: Implement `src/scenes/materials.ts`**

```ts
import { Color, MeshPhysicalMaterial } from 'three';
import {
  palettes,
  type PaletteColour,
  type PaletteId,
} from '../lib/landing/palettes.ts';
import {
  easeInOut,
  mixSurface,
  surface,
  type SurfaceParams,
} from './material-params.ts';

export type Slot = number | 'chrome';
type Look = SurfaceParams & { color: Color };
type Tracked = {
  material: MeshPhysicalMaterial;
  slot: Slot;
  from?: Look;
  to?: Look;
  start: number;
};

const TRANSITION = 0.9;
const fallbackChrome: PaletteColour = { hex: '#C7CCD4', material: 'chrome' };

export function paletteColour(id: PaletteId, slot: Slot): PaletteColour {
  const { colours } = palettes[id];
  if (slot === 'chrome')
    return colours.find((colour) => colour.material === 'chrome') ?? fallbackChrome;
  return colours[((slot % colours.length) + colours.length) % colours.length];
}

function look(colour: PaletteColour): Look {
  return { ...surface[colour.material], color: new Color(colour.hex) };
}

function snapshot(material: MeshPhysicalMaterial): Look {
  return {
    color: material.color.clone(),
    metalness: material.metalness,
    roughness: material.roughness,
    clearcoat: material.clearcoat,
    clearcoatRoughness: material.clearcoatRoughness,
    iridescence: material.iridescence,
    envMapIntensity: material.envMapIntensity,
  };
}

function apply(material: MeshPhysicalMaterial, value: Look): void {
  material.color.copy(value.color);
  material.metalness = value.metalness;
  material.roughness = value.roughness;
  material.clearcoat = value.clearcoat;
  material.clearcoatRoughness = value.clearcoatRoughness;
  material.iridescence = value.iridescence;
  material.envMapIntensity = value.envMapIntensity;
}

export class PaletteMaterials {
  private readonly tracked: Tracked[] = [];
  private readonly sharedBySlot = new Map<Slot, MeshPhysicalMaterial>();

  constructor(
    private paletteId: PaletteId,
    private readonly random: () => number = Math.random,
  ) {}

  get palette(): PaletteId {
    return this.paletteId;
  }

  create(slot: Slot): MeshPhysicalMaterial {
    const material = new MeshPhysicalMaterial();
    apply(material, look(paletteColour(this.paletteId, slot)));
    this.tracked.push({ material, slot, start: -1 });
    return material;
  }

  shared(slot: Slot): MeshPhysicalMaterial {
    let material = this.sharedBySlot.get(slot);
    if (!material) {
      material = this.create(slot);
      this.sharedBySlot.set(slot, material);
    }
    return material;
  }

  // Each material starts at a random offset so the change sweeps through the scene.
  transitionTo(id: PaletteId, now: number): void {
    this.paletteId = id;
    for (const entry of this.tracked) {
      entry.from = snapshot(entry.material);
      entry.to = look(paletteColour(id, entry.slot));
      entry.start = now + this.random() * 0.5;
    }
  }

  update(now: number): void {
    for (const entry of this.tracked) {
      if (entry.start < 0 || now < entry.start || !entry.from || !entry.to)
        continue;
      const k = easeInOut((now - entry.start) / TRANSITION);
      apply(entry.material, {
        ...mixSurface(entry.from, entry.to, k),
        color: entry.from.color.clone().lerp(entry.to.color, k),
      });
      if (k >= 1) entry.start = -1;
    }
  }

  dispose(): void {
    for (const entry of this.tracked) entry.material.dispose();
    this.tracked.length = 0;
    this.sharedBySlot.clear();
  }
}
```

With the random offset `() => 0` used in the test, every material starts at `now`, so `update(11)` is past the 0.9 s transition.

- [ ] **Step 7: Implement `src/scenes/balloon-motion.ts`**

```ts
export const POP_DURATION = 0.07;
export const INFLATE_DURATION = 0.7;
export const REINFLATE_DELAY = 2.4;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// A popping balloon swells 28% before vanishing; null means hidden.
export function popScale(elapsed: number): number | null {
  if (elapsed >= POP_DURATION) return null;
  return 1 + (0.28 * Math.max(0, elapsed)) / POP_DURATION;
}

// Damped overshoot, like latex settling after inflation.
export function inflateScale(elapsed: number): number {
  const t = clamp(elapsed / INFLATE_DURATION);
  if (t >= 1) return 1;
  return 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2);
}
```

- [ ] **Step 8: Implement `src/scenes/balloon.ts`**

```ts
import {
  Mesh,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  type Vector3,
} from 'three';
import {
  INFLATE_DURATION,
  REINFLATE_DELAY,
  inflateScale,
  popScale,
} from './balloon-motion.ts';

export type BalloonState = 'idle' | 'popping' | 'hidden' | 'inflating';

export function createBalloonGeometry(widthSegments: number): SphereGeometry {
  const geometry = new SphereGeometry(
    1,
    widthSegments,
    Math.max(8, Math.round(widthSegments * 0.66)),
  );
  geometry.scale(1, 1.1, 1);
  return geometry;
}

export class Balloon {
  state: BalloonState = 'idle';
  private changedAt = 0;
  private readonly base: Vector3;

  constructor(
    readonly mesh: Mesh,
    private readonly reinflate: boolean,
  ) {
    this.base = mesh.scale.clone();
    mesh.userData.balloon = this;
  }

  static create(
    geometry: BufferGeometry,
    material: Material,
    radius: number,
    reinflate: boolean,
  ): Balloon {
    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(radius);
    return new Balloon(mesh, reinflate);
  }

  get poppable(): boolean {
    return (
      this.mesh.visible && (this.state === 'idle' || this.state === 'inflating')
    );
  }

  pop(now: number): boolean {
    if (!this.poppable) return false;
    this.state = 'popping';
    this.changedAt = now;
    return true;
  }

  inflate(now: number): void {
    this.state = 'inflating';
    this.changedAt = now;
    this.mesh.visible = true;
    this.setScale(0.001);
  }

  update(now: number): void {
    const elapsed = now - this.changedAt;
    if (this.state === 'popping') {
      const scale = popScale(elapsed);
      if (scale === null) {
        this.state = 'hidden';
        this.changedAt = now;
        this.mesh.visible = false;
      } else this.setScale(scale);
    } else if (this.state === 'hidden') {
      if (this.reinflate && elapsed >= REINFLATE_DELAY) this.inflate(now);
    } else if (this.state === 'inflating') {
      this.setScale(Math.max(0.001, inflateScale(elapsed)));
      if (elapsed >= INFLATE_DURATION) {
        this.state = 'idle';
        this.setScale(1);
      }
    }
  }

  private setScale(factor: number): void {
    this.mesh.scale.copy(this.base).multiplyScalar(factor);
  }
}
```

- [ ] **Step 9: Implement `src/scenes/confetti.ts`**

```ts
import {
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type Color,
  type Object3D,
} from 'three';

type Particle = { mesh: Mesh; velocity: Vector3; spin: Vector3; born: number };
const LIFETIME = 1.6;
const GRAVITY = 2.2;

export class Confetti {
  private readonly geometry = new PlaneGeometry(1, 0.55);
  private readonly materials = new Map<string, MeshStandardMaterial>();
  private particles: Particle[] = [];

  constructor(
    private readonly parent: Object3D,
    private readonly random: () => number,
  ) {}

  get active(): number {
    return this.particles.length;
  }

  burst(
    origin: Vector3,
    colour: Color,
    options: { count: number; size: number; speed: number; now: number },
  ): void {
    const key = colour.getHexString();
    let material = this.materials.get(key);
    if (!material) {
      material = new MeshStandardMaterial({
        color: colour.clone(),
        metalness: 0.8,
        roughness: 0.3,
        side: DoubleSide,
      });
      this.materials.set(key, material);
    }
    for (let index = 0; index < options.count; index++) {
      const mesh = new Mesh(this.geometry, material);
      mesh.scale.setScalar(options.size);
      mesh.position.copy(origin);
      this.parent.add(mesh);
      const angle = this.random() * Math.PI * 2;
      const lift = this.random() * 1.4 - 0.4;
      const speed = options.speed * (0.6 + this.random());
      this.particles.push({
        mesh,
        born: options.now,
        velocity: new Vector3(
          Math.cos(angle) * Math.cos(lift) * speed,
          Math.sin(lift) * speed + 0.6,
          Math.sin(angle) * Math.cos(lift) * speed * 0.5,
        ),
        spin: new Vector3(this.random() * 9, this.random() * 9, 0),
      });
    }
  }

  update(now: number, delta: number): void {
    for (let index = this.particles.length - 1; index >= 0; index--) {
      const particle = this.particles[index];
      particle.velocity.y -= GRAVITY * delta;
      particle.velocity.multiplyScalar(Math.pow(0.4, delta));
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += particle.spin.x * delta;
      particle.mesh.rotation.y += particle.spin.y * delta;
      if (now - particle.born > LIFETIME) {
        this.parent.remove(particle.mesh);
        this.particles.splice(index, 1);
      }
    }
  }

  dispose(): void {
    for (const particle of this.particles) this.parent.remove(particle.mesh);
    this.particles = [];
    this.geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }
}
```

- [ ] **Step 10: Implement the WebGL helpers**

`src/scenes/environment.ts`:

```ts
import { PMREMGenerator, type Texture, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A soft studio room gives latex its sheen and chrome its reflections.
export function studioEnvironment(renderer: WebGLRenderer): {
  texture: Texture;
  dispose(): void;
} {
  const generator = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const target = generator.fromScene(room, 0.04);
  room.dispose();
  generator.dispose();
  return { texture: target.texture, dispose: () => target.dispose() };
}
```

`src/scenes/renderer.ts`:

```ts
import {
  ACESFilmicToneMapping,
  WebGLRenderer,
  type PerspectiveCamera,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';

export function createRenderer(
  canvas: HTMLCanvasElement,
  capability: Capability,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: capability.tier === 'high',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(capability.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function fitCamera(
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  width: number,
  height: number,
): void {
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
```

`src/scenes/loop.ts`:

```ts
import type { WebGLRenderer } from 'three';

// Scene time only advances while running, so paused scenes resume where they left off.
export class FrameLoop {
  private running = false;
  private last = 0;
  private time = 0;

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly tick: (time: number, delta: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop((timestamp: number) => {
      const delta = Math.min(0.05, (timestamp - this.last) / 1000);
      this.last = timestamp;
      this.time += Math.max(0, delta);
      this.tick(this.time, Math.max(0, delta));
    });
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }
}
```

`src/scenes/picking.ts`:

```ts
import { Raycaster, Vector2, type Camera, type Object3D } from 'three';
import type { Balloon } from './balloon.ts';

export function createPicker(
  canvas: HTMLCanvasElement,
  camera: Camera,
  targets: () => Object3D[],
  onPick: (balloon: Balloon) => void,
): () => void {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const handle = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(targets(), false)[0];
    const balloon = hit?.object.userData.balloon as Balloon | undefined;
    if (balloon?.poppable) onPick(balloon);
  };
  canvas.addEventListener('pointerdown', handle);
  return () => canvas.removeEventListener('pointerdown', handle);
}
```

`src/scenes/palette-source.ts`:

```ts
import { paletteChangeEvent } from '../lib/landing/events.ts';
import {
  defaultPaletteId,
  isPaletteId,
  type PaletteId,
} from '../lib/landing/palettes.ts';

export function currentPalette(doc: Document): PaletteId {
  const value = doc.querySelector<HTMLElement>('[data-landing]')?.dataset.palette;
  return value && isPaletteId(value) ? value : defaultPaletteId;
}

export function onPaletteChange(
  doc: Document,
  listener: (id: PaletteId) => void,
): () => void {
  const handle = (event: Event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id && isPaletteId(id)) listener(id);
  };
  doc.addEventListener(paletteChangeEvent, handle);
  return () => doc.removeEventListener(paletteChangeEvent, handle);
}
```

- [ ] **Step 11: Run the tests and type-check**

Run: `pnpm vitest run tests/unit/scene-foundation.test.ts`
Expected: PASS (11 tests).

Run: `pnpm check && pnpm lint`
Expected: 0 errors. If `three/addons/environments/RoomEnvironment.js` does not resolve types, import from `three/examples/jsm/environments/RoomEnvironment.js` instead.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/random.ts src/scenes tests/unit/scene-foundation.test.ts
git commit -m "feat: add Three.js balloon, material and confetti foundations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Hero garland scene

**Files:**
- Create: `src/scenes/garland-layout.ts`, `src/scenes/sculpture-parts.ts`, `src/scenes/sculpture-mesh.ts`, `src/scenes/hero.ts`
- Test: `tests/unit/scene-layouts.test.ts`

**Interfaces:**
- Consumes: Task 13 modules; `IslandScene`, `Capability` (Task 12).
- Produces:
  - `type ArchDims = { centerX: number; baseY: number; halfWidth: number; height: number }`, `heroArch: ArchDims`, `archLength(dims): number`, `archPoint(u, dims): { x; y; nx; ny }`, `type GarlandSpot = { x; y; z; radius; slot; phase }`, `garlandLayout(options: { dims: ArchDims; count: number; seed: number; slots: number }): GarlandSpot[]`
  - `type PartRole = 'body' | 'stem' | 'accent'`, `type Part = { position: readonly [number, number, number]; scale: readonly [number, number, number]; rotationZ: number; role: PartRole; slot: number }`, `dogParts: readonly Part[]`, `tulipParts(count: number): Part[]`, `cakeParts(): Part[]`
  - `type SculptureMaterials = { body: (slot: number) => Material; stem: Material; accent: Material }`, `type BuiltSculpture = { group: Group; meshes: Mesh[]; geometry: SphereGeometry }`, `buildSculpture(parts, materials, segments): BuiltSculpture`
  - `createHeroScene(canvas: HTMLCanvasElement, capability: Capability): Promise<IslandScene>`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/scene-layouts.test.ts`:

```ts
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
    expect(archPoint(0, heroArch)).toMatchObject({ x: centerX - halfWidth, y: baseY, nx: -1, ny: 0 });
    const top = archPoint(height - halfWidth + (Math.PI * halfWidth) / 2, heroArch);
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
      expect(Number.isInteger(spot.slot) && spot.slot >= 0 && spot.slot < 5).toBe(true);
      const nearest = Math.min(...outline.map((p) => Math.hypot(p.x - spot.x, p.y - spot.y)));
      expect(nearest).toBeLessThan(0.45);
    }
  });

  it('leaves the middle of the right side bare, like the client’s asymmetric garlands', () => {
    const { centerX, baseY, halfWidth } = heroArch;
    const rightMiddle = garlandLayout(options).filter(
      (spot) => spot.x > centerX + halfWidth * 0.5 && spot.y > baseY + 1.2 && spot.y < baseY + 2.1,
    );
    expect(rightMiddle).toHaveLength(0);
  });
});

describe('sculpture parts', () => {
  it('builds a symmetric chrome balloon dog from eleven segments', () => {
    expect(dogParts).toHaveLength(11);
    expect(dogParts.every((part) => part.role === 'accent')).toBe(true);
    const legs = dogParts.filter((part) => part.scale[1] > 0.6);
    expect(legs.map((leg) => leg.position[2]).sort()).toEqual([-0.22, -0.22, 0.22, 0.22]);
  });

  it('builds a tulip bouquet with stems, three petals per bloom, leaves and a bow', () => {
    const parts = tulipParts(5);
    expect(parts).toHaveLength(24);
    expect(parts.filter((part) => part.role === 'stem')).toHaveLength(7);
    expect(parts.filter((part) => part.role === 'accent')).toHaveLength(2);
    const petals = parts.filter((part) => part.role === 'body');
    expect(new Set(petals.map((part) => part.slot))).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it('builds a three-tier cake topped by a candle', () => {
    const parts = cakeParts();
    const body = parts.filter((part) => part.role === 'body');
    expect(body).toHaveLength(90);
    expect(new Set(body.map((part) => part.slot))).toEqual(new Set([0, 1, 2]));
    expect(parts.every((part) => Math.abs(part.position[0]) <= 1.0001)).toBe(true);
    const top = Math.max(...parts.map((part) => part.position[1]));
    expect(parts.find((part) => part.position[1] === top)?.role).toBe('accent');
  });

  it('turns parts into meshes that share one geometry', () => {
    const material = new MeshBasicMaterial();
    const built = buildSculpture(dogParts, { body: () => material, stem: material, accent: material }, 8);
    expect(built.meshes).toHaveLength(11);
    expect(built.group.children).toHaveLength(11);
    expect(new Set(built.meshes.map((mesh) => mesh.geometry))).toEqual(new Set([built.geometry]));
    expect(built.meshes[1].scale.toArray()).toEqual([0.3, 0.68, 0.3]);
  });
});
```

Run `pnpm prettier --write tests/unit/scene-layouts.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/scene-layouts.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/scenes/garland-layout.ts`**

```ts
import { mulberry32 } from '../lib/random.ts';

export type ArchDims = {
  centerX: number;
  baseY: number;
  halfWidth: number;
  height: number;
};
export type GarlandSpot = {
  x: number;
  y: number;
  z: number;
  radius: number;
  slot: number;
  phase: number;
};

// The arched panel sits right of centre so the headline has room on wide screens.
export const heroArch: ArchDims = { centerX: 2.05, baseY: -2.9, halfWidth: 1.4, height: 4.4 };

const straight = (dims: ArchDims) => dims.height - dims.halfWidth;

export function archLength(dims: ArchDims): number {
  return straight(dims) * 2 + Math.PI * dims.halfWidth;
}

// u is the distance along the outline: up the left side, over the top, down the right.
export function archPoint(
  u: number,
  dims: ArchDims,
): { x: number; y: number; nx: number; ny: number } {
  const side = straight(dims);
  const arc = Math.PI * dims.halfWidth;
  if (u < side)
    return { x: dims.centerX - dims.halfWidth, y: dims.baseY + u, nx: -1, ny: 0 };
  if (u < side + arc) {
    const angle = Math.PI - (u - side) / dims.halfWidth;
    return {
      x: dims.centerX + Math.cos(angle) * dims.halfWidth,
      y: dims.baseY + side + Math.sin(angle) * dims.halfWidth,
      nx: Math.cos(angle),
      ny: Math.sin(angle),
    };
  }
  const down = Math.min(u - side - arc, side);
  return { x: dims.centerX + dims.halfWidth, y: dims.baseY + side - down, nx: 1, ny: 0 };
}

// Most balloons sweep up the left and over the top; a cluster anchors the right foot.
export function garlandLayout(options: {
  dims: ArchDims;
  count: number;
  seed: number;
  slots: number;
}): GarlandSpot[] {
  const { dims, count, seed, slots } = options;
  const random = mulberry32(seed);
  const side = straight(dims);
  const total = archLength(dims);
  const sweepEnd = side + Math.PI * dims.halfWidth + side * 0.25;
  const footStart = total - side * 0.35;
  const footFrom = Math.round(count * 0.82);
  return Array.from({ length: count }, (_, index) => {
    const inFoot = index >= footFrom;
    const u = inFoot ? footStart + random() * (total - footStart) : random() * sweepEnd;
    const point = archPoint(u, dims);
    const offset = (random() - 0.35) * 0.62;
    let radius = 0.12 + random() ** 2 * 0.4;
    if (u < 1.4 || inFoot) radius *= 1.3;
    return {
      x: point.x + point.nx * offset,
      y: point.y + point.ny * offset,
      z: -0.25 + random() * 0.9,
      radius,
      slot: Math.floor(random() * slots),
      phase: random() * Math.PI * 2,
    };
  });
}
```

- [ ] **Step 4: Implement `src/scenes/sculpture-parts.ts`**

```ts
export type PartRole = 'body' | 'stem' | 'accent';
export type Part = {
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  rotationZ: number;
  role: PartRole;
  slot: number;
};

const part = (
  position: readonly [number, number, number],
  scale: readonly [number, number, number],
  rotationZ: number,
  role: PartRole,
  slot = 0,
): Part => ({ position, scale, rotationZ, role, slot });

// A classic twisted balloon dog: body, four legs, neck, head, snout, two ears, tail.
export const dogParts: readonly Part[] = [
  part([0, 0, 0], [1, 0.36, 0.36], 0, 'accent'),
  part([-0.72, -0.62, 0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([-0.72, -0.62, -0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([0.72, -0.62, 0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([0.72, -0.62, -0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([-0.88, 0.45, 0], [0.28, 0.55, 0.28], -0.35, 'accent'),
  part([-1.08, 0.98, 0], [0.36, 0.33, 0.33], 0, 'accent'),
  part([-1.52, 0.88, 0], [0.48, 0.25, 0.25], 0, 'accent'),
  part([-0.92, 1.42, 0.18], [0.22, 0.52, 0.22], 0.3, 'accent'),
  part([-0.92, 1.42, -0.18], [0.22, 0.52, 0.22], 0.3, 'accent'),
  part([1.08, 0.42, 0], [0.24, 0.5, 0.24], -0.6, 'accent'),
];

// Stems fan out from a tied base; each bloom is three petals in one palette slot.
export function tulipParts(count: number): Part[] {
  const parts: Part[] = [];
  for (let index = 0; index < count; index++) {
    const angle = (index - (count - 1) / 2) * 0.22;
    const tipX = Math.sin(angle) * 2;
    const tipY = -1.2 + Math.cos(angle) * 2;
    parts.push(part([Math.sin(angle), -1.2 + Math.cos(angle), 0], [0.06, 1, 0.06], -angle, 'stem'));
    for (const [dx, dz, tilt] of [
      [-0.09, 0, 0.25],
      [0.09, 0, -0.25],
      [0, 0.06, 0],
    ] as const)
      parts.push(part([tipX + dx, tipY, dz], [0.2, 0.3, 0.2], -angle + tilt, 'body', index));
  }
  parts.push(
    part([-0.35, -0.6, 0.1], [0.12, 0.55, 0.12], 0.6, 'stem'),
    part([0.35, -0.6, 0.1], [0.12, 0.55, 0.12], -0.6, 'stem'),
    part([-0.25, -1.15, 0.2], [0.22, 0.12, 0.12], 0.5, 'accent'),
    part([0.25, -1.15, 0.2], [0.22, 0.12, 0.12], -0.5, 'accent'),
  );
  return parts;
}

// Three tiers of balloon rings, each tier in its own palette slot, with a candle.
export function cakeParts(): Part[] {
  const tiers = [
    { radius: 1, y: -0.9 },
    { radius: 0.75, y: -0.3 },
    { radius: 0.5, y: 0.25 },
  ];
  const parts: Part[] = [];
  tiers.forEach((tier, slot) => {
    const count = Math.max(6, Math.round((2 * Math.PI * tier.radius) / 0.32));
    for (const lift of [0, 0.22])
      for (let index = 0; index < count; index++) {
        const angle = (index / count) * Math.PI * 2 + lift * 3;
        parts.push(
          part(
            [Math.cos(angle) * tier.radius, tier.y + lift, Math.sin(angle) * tier.radius],
            [0.2, 0.2, 0.2],
            0,
            'body',
            slot,
          ),
        );
      }
  });
  parts.push(
    part([0, 0.75, 0], [0.06, 0.35, 0.06], 0, 'accent'),
    part([0, 1.12, 0], [0.08, 0.12, 0.08], 0, 'accent'),
  );
  return parts;
}
```

- [ ] **Step 5: Implement `src/scenes/sculpture-mesh.ts`**

```ts
import { Group, Mesh, SphereGeometry, type Material } from 'three';
import type { Part } from './sculpture-parts.ts';

export type SculptureMaterials = {
  body: (slot: number) => Material;
  stem: Material;
  accent: Material;
};
export type BuiltSculpture = { group: Group; meshes: Mesh[]; geometry: SphereGeometry };

export function buildSculpture(
  parts: readonly Part[],
  materials: SculptureMaterials,
  segments: number,
): BuiltSculpture {
  const geometry = new SphereGeometry(1, segments, Math.max(8, Math.round(segments * 0.6)));
  const group = new Group();
  const meshes = parts.map((part) => {
    const material =
      part.role === 'body'
        ? materials.body(part.slot)
        : part.role === 'stem'
          ? materials.stem
          : materials.accent;
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...part.position);
    mesh.scale.set(...part.scale);
    mesh.rotation.z = part.rotationZ;
    group.add(mesh);
    return mesh;
  });
  return { group, meshes, geometry };
}
```

- [ ] **Step 6: Run the layout tests**

Run: `pnpm vitest run tests/unit/scene-layouts.test.ts`
Expected: PASS (8 tests). If "leaves the middle of the right side bare" fails, print the offending spots: the sweep must stop at `side * 0.25` down the right side, and the foot must start at `side * 0.35` above the base.

- [ ] **Step 7: Implement `src/scenes/hero.ts`**

```ts
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { garlandLayout, heroArch } from './garland-layout.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { createRenderer, fitCamera } from './renderer.ts';
import { buildSculpture } from './sculpture-mesh.ts';
import { dogParts } from './sculpture-parts.ts';

type Drifting = { balloon: Balloon; base: Vector3; phase: number };
// x, y, z, radius of single balloons floating around the arch.
const floaterSpots = [
  [-1.6, 2.1, -1.5, 0.36],
  [-3.6, -0.6, -2.4, 0.3],
  [4.3, 2.2, -2, 0.34],
  [-0.4, 2.5, -3, 0.28],
  [3.6, -1.2, 1.2, 0.26],
  [-2.8, 1.6, 0.3, 0.22],
] as const;

function archPanel(curveSegments: number): ExtrudeGeometry {
  const { halfWidth, height } = heroArch;
  const shape = new Shape();
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(-halfWidth, height - halfWidth);
  shape.absarc(0, height - halfWidth, halfWidth, Math.PI, 0, true);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(-halfWidth, 0);
  return new ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    curveSegments,
  });
}

export async function createHeroScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.55));
  const key = new DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9);

  const random = mulberry32(123);
  const materials = new PaletteMaterials(currentPalette(doc));
  const geometry = createBalloonGeometry(high ? 48 : 24);
  const knot = new ConeGeometry(0.09, 0.14, 12);
  const panelGeometry = archPanel(high ? 48 : 24);
  const panelMaterial = new MeshPhysicalMaterial({ color: new Color('#FBF7F1'), roughness: 0.75 });
  const stringMaterial = new LineBasicMaterial({ color: 0xb8ada4 });
  const strings: BufferGeometry[] = [];
  const stage = new Group();
  scene.add(stage);
  const panel = new Mesh(panelGeometry, panelMaterial);
  panel.position.set(heroArch.centerX, heroArch.baseY, -0.75);
  stage.add(panel);

  const garland: Drifting[] = garlandLayout({
    dims: heroArch,
    count: high ? 120 : 70,
    seed: 7,
    slots: 5,
  }).map((spot) => {
    const balloon = Balloon.create(geometry, materials.create(spot.slot), spot.radius, true);
    balloon.mesh.position.set(spot.x, spot.y, spot.z);
    balloon.mesh.rotation.set(random(), random(), random());
    stage.add(balloon.mesh);
    return { balloon, base: new Vector3(spot.x, spot.y, spot.z), phase: spot.phase };
  });

  const floaters: Drifting[] = floaterSpots.map(([x, y, z, radius]) => {
    const material = materials.create(Math.floor(random() * 5));
    const balloon = Balloon.create(geometry, material, radius, true);
    const tie = new Mesh(knot, material);
    tie.position.y = -1.14;
    balloon.mesh.add(tie);
    const string = new BufferGeometry().setFromPoints([
      new Vector3(0, -1.2, 0),
      new Vector3(0.15, -3.2, 0),
      new Vector3(-0.1, -5.5, 0),
    ]);
    strings.push(string);
    balloon.mesh.add(new Line(string, stringMaterial));
    balloon.mesh.position.set(x, y, z);
    stage.add(balloon.mesh);
    return { balloon, base: new Vector3(x, y, z), phase: random() * Math.PI * 2 };
  });

  const chrome = materials.create('chrome');
  const dog = buildSculpture(dogParts, { body: () => chrome, stem: chrome, accent: chrome }, high ? 40 : 20);
  dog.group.scale.setScalar(0.42);
  dog.group.position.set(-0.35, -2.05, 0.9);
  stage.add(dog.group);

  const confetti = new Confetti(scene, random);
  const pointer = { x: 0, y: 0 };
  let now = 0;
  let portrait = false;
  const balloons = [...garland, ...floaters].map((entry) => entry.balloon);
  const stopPicking = createPicker(
    canvas,
    camera,
    () => balloons.filter((balloon) => balloon.poppable).map((balloon) => balloon.mesh),
    (balloon) => {
      if (!balloon.pop(now)) return;
      confetti.burst(
        balloon.mesh.getWorldPosition(new Vector3()),
        (balloon.mesh.material as MeshPhysicalMaterial).color,
        { count: 16, size: 0.09, speed: 1.6, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) => materials.transitionTo(id, now));
  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };
  if (high) canvas.addEventListener('pointermove', onPointerMove);

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    camera.position.x += ((portrait ? 0 : pointer.x * 0.35) - camera.position.x) * 0.04;
    camera.position.y += (0.2 - pointer.y * 0.2 - camera.position.y) * 0.04;
    camera.lookAt(portrait ? 0 : 0.7, -0.1, 0);
    for (const { balloon, base, phase } of garland) {
      balloon.mesh.position.set(
        base.x + Math.sin(time * 0.7 + phase) * 0.015,
        base.y + Math.cos(time * 0.6 + phase) * 0.02,
        base.z,
      );
      balloon.update(time);
    }
    for (const { balloon, base, phase } of floaters) {
      balloon.mesh.position.y = base.y + Math.sin(time * 0.55 + phase) * 0.14;
      balloon.mesh.rotation.z = Math.sin(time * 0.4 + phase) * 0.08;
      balloon.update(time);
    }
    dog.group.rotation.y = Math.sin(time * 0.35) * 0.6 + 0.4;
    materials.update(time);
    confetti.update(time, delta);
    renderer.render(scene, camera);
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      // Portrait screens stack the copy above the stage, so centre the arch.
      portrait = camera.aspect < 1;
      stage.position.x = portrait ? -heroArch.centerX : 0;
      camera.position.z = portrait ? 12 : 9;
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      canvas.removeEventListener('pointermove', onPointerMove);
      confetti.dispose();
      materials.dispose();
      for (const item of [geometry, knot, panelGeometry, panelMaterial, stringMaterial, dog.geometry, ...strings])
        item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 8: Type-check, lint and commit**

Run: `pnpm check && pnpm lint`
Expected: 0 errors (run `pnpm format` first if Prettier complains).

```bash
git add src/scenes tests/unit/scene-layouts.test.ts
git commit -m "feat: add the 3D hero garland scene with a chrome balloon dog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

The scene is exercised in the browser in Task 18, once the lifecycle is wired.

---

### Task 15: Sculpture and balloon-release scenes

**Files:**
- Create: `src/scenes/sculptures.ts`, `src/scenes/release.ts`

**Interfaces:**
- Consumes: Tasks 13 and 14 modules.
- Produces: `createSculptureScene(canvas, capability): Promise<IslandScene>`, `createReleaseScene(canvas, capability): Promise<IslandScene>`.

These are WebGL scenes built only from tested parts. They are verified in the browser in Task 18 and by type-checking here.

- [ ] **Step 1: Implement `src/scenes/sculptures.ts`**

```ts
import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { createRenderer, fitCamera } from './renderer.ts';
import { buildSculpture } from './sculpture-mesh.ts';
import { cakeParts, dogParts, tulipParts } from './sculpture-parts.ts';

export async function createSculptureScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const segments = capability.tier === 'high' ? 40 : 20;
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.55));
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 6, 7);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);

  const random = mulberry32(31);
  const materials = new PaletteMaterials(currentPalette(doc));
  const stem = new MeshPhysicalMaterial({ color: new Color('#6F8466'), roughness: 0.4, clearcoat: 0.6 });
  const accent = materials.create('chrome');
  const pedestalGeometry = new CylinderGeometry(0.95, 1.05, 0.3, segments);
  const pedestalMaterial = new MeshPhysicalMaterial({ color: new Color('#FBF7F1'), roughness: 0.6, clearcoat: 0.3 });

  const pieces = [
    { parts: dogParts, scale: 0.85, lift: 0.95 },
    { parts: tulipParts(5), scale: 0.8, lift: 1.25 },
    { parts: cakeParts(), scale: 0.85, lift: 1.1 },
  ].map(({ parts, scale, lift }, index) => {
    const built = buildSculpture(parts, { body: (slot) => materials.shared(slot), stem, accent }, segments);
    built.group.scale.setScalar(scale);
    built.group.position.y = lift;
    const holder = new Group();
    holder.add(built.group, new Mesh(pedestalGeometry, pedestalMaterial));
    scene.add(holder);
    return {
      holder,
      built,
      phase: index * 2.1,
      balloons: built.meshes.map((mesh) => new Balloon(mesh, true)),
    };
  });
  const balloons = pieces.flatMap((piece) => piece.balloons);

  const layout = (portrait: boolean) => {
    pieces.forEach((piece, index) =>
      piece.holder.position.set(
        portrait ? 0 : (index - 1) * 3.4,
        portrait ? (1 - index) * 3.1 - 0.6 : -0.9,
        0,
      ),
    );
    camera.position.set(0, portrait ? 0 : 0.6, portrait ? 17 : 11);
    camera.lookAt(0, portrait ? -0.3 : 0.1, 0);
  };
  layout(false);

  const confetti = new Confetti(scene, random);
  let now = 0;
  const stopPicking = createPicker(
    canvas,
    camera,
    () => balloons.filter((balloon) => balloon.poppable).map((balloon) => balloon.mesh),
    (balloon) => {
      if (!balloon.pop(now)) return;
      confetti.burst(
        balloon.mesh.getWorldPosition(new Vector3()),
        (balloon.mesh.material as MeshPhysicalMaterial).color,
        { count: 10, size: 0.07, speed: 1.2, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) => materials.transitionTo(id, now));

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    for (const piece of pieces) piece.built.group.rotation.y = time * 0.35 + piece.phase;
    for (const balloon of balloons) balloon.update(time);
    materials.update(time);
    confetti.update(time, delta);
    renderer.render(scene, camera);
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      layout(camera.aspect < 1);
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      confetti.dispose();
      materials.dispose();
      for (const piece of pieces) piece.built.geometry.dispose();
      for (const item of [pedestalGeometry, pedestalMaterial, stem]) item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 2: Implement `src/scenes/release.ts`**

```ts
import {
  BufferGeometry,
  ConeGeometry,
  DirectionalLight,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { createRenderer, fitCamera } from './renderer.ts';

type Rising = { balloon: Balloon; x: number; y: number; z: number; speed: number; phase: number };

// Balloons drift up through the closing section and are released again from below.
export async function createReleaseScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.6));
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 5, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const random = mulberry32(57);
  const materials = new PaletteMaterials(currentPalette(doc));
  const geometry = createBalloonGeometry(high ? 32 : 18);
  const knot = new ConeGeometry(0.09, 0.14, 12);
  const stringMaterial = new LineBasicMaterial({ color: 0xb8ada4 });
  const string = new BufferGeometry().setFromPoints([
    new Vector3(0, -1.2, 0),
    new Vector3(0.12, -2.6, 0),
    new Vector3(-0.08, -4.2, 0),
  ]);
  let halfWidth = 2.5;
  const spread = () => (random() * 2 - 1) * halfWidth;

  const rising: Rising[] = Array.from({ length: high ? 18 : 10 }, (_, index) => {
    const material = materials.create(index % 5);
    const balloon = Balloon.create(geometry, material, 0.22 + random() * 0.18, false);
    const tie = new Mesh(knot, material);
    tie.position.y = -1.14;
    balloon.mesh.add(tie, new Line(string, stringMaterial));
    scene.add(balloon.mesh);
    return {
      balloon,
      x: 0,
      y: -4 - random() * 8,
      z: -1 + random() * 2,
      speed: 0.35 + random() * 0.3,
      phase: random() * Math.PI * 2,
    };
  });
  const confetti = new Confetti(scene, random);
  let now = 0;
  let placed = false;

  const stopPicking = createPicker(
    canvas,
    camera,
    () => rising.map((entry) => entry.balloon).filter((balloon) => balloon.poppable).map((balloon) => balloon.mesh),
    (balloon) => {
      if (!balloon.pop(now)) return;
      confetti.burst(
        balloon.mesh.getWorldPosition(new Vector3()),
        (balloon.mesh.material as MeshPhysicalMaterial).color,
        { count: 12, size: 0.08, speed: 1.4, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) => materials.transitionTo(id, now));

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    for (const entry of rising) {
      entry.y += entry.speed * delta;
      if (entry.y > 5 || entry.balloon.state === 'hidden') {
        entry.x = spread();
        entry.y = -4.5;
        entry.balloon.inflate(time);
      }
      entry.balloon.mesh.position.set(
        entry.x + Math.sin(time * 0.6 + entry.phase) * 0.25,
        entry.y,
        entry.z,
      );
      entry.balloon.mesh.rotation.z = Math.sin(time * 0.5 + entry.phase) * 0.1;
      entry.balloon.update(time);
    }
    materials.update(time);
    confetti.update(time, delta);
    renderer.render(scene, camera);
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      halfWidth = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect * 0.85;
      if (!placed) {
        for (const entry of rising) entry.x = spread();
        placed = true;
      }
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      confetti.dispose();
      materials.dispose();
      for (const item of [geometry, knot, string, stringMaterial]) item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 3: Type-check, lint and commit**

Run: `pnpm format && pnpm check && pnpm lint`
Expected: 0 errors.

```bash
git add src/scenes/sculptures.ts src/scenes/release.ts
git commit -m "feat: add balloon sculpture and closing release scenes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Balloon-pop intro

**Files:**
- Create: `src/lib/landing/intro-plan.ts`
- Create: `src/scenes/intro.ts`
- Create: `src/scripts/intro.ts`
- Test: `tests/unit/intro.test.ts`

**Interfaces:**
- Consumes: `mulberry32`; `Capability`, `mountIsland`, `Island`, `SceneFactory` (Task 12); Task 13 modules.
- Produces:
  - `introStorageKey = 'one23balloon:intro-played'`, `shouldPlayIntro(storage: Pick<Storage, 'getItem'> | undefined, capability: Capability): boolean`, `markIntroPlayed(storage: Pick<Storage, 'setItem'> | undefined): void`, `type IntroCell = { x; y; radius; slot; inflateAt; popAt }`, `introLayout(options: { cols; rows; halfWidth; halfHeight; seed; slots }): { cells: IntroCell[]; duration: number }`
  - `createIntroScene(canvas, capability, options: { onDone: () => void }): Promise<IslandScene>`
  - `type IntroLoader = (onDone: () => void) => Promise<SceneFactory>`, `playIntro(options: { root: HTMLElement; capability: Capability; storage: Storage | undefined; load: IntroLoader }): () => void` (returns a function that ends the intro)

- [ ] **Step 1: Write the failing test**

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import {
  introLayout,
  introStorageKey,
  markIntroPlayed,
  shouldPlayIntro,
} from '../../src/lib/landing/intro-plan.ts';
import { playIntro } from '../../src/scripts/intro.ts';

const capable: Capability = { webgl: true, reducedMotion: false, tier: 'high', pixelRatio: 1 };
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  } as unknown as Storage;
}
const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('shouldPlayIntro', () => {
  it('plays once per session with WebGL and motion allowed', () => {
    const storage = memoryStorage();
    expect(shouldPlayIntro(storage, capable)).toBe(true);
    markIntroPlayed(storage);
    expect(storage.getItem(introStorageKey)).toBe('1');
    expect(shouldPlayIntro(storage, capable)).toBe(false);
  });

  it('never plays without WebGL, with reduced motion, or without storage', () => {
    expect(shouldPlayIntro(memoryStorage(), { ...capable, webgl: false })).toBe(false);
    expect(shouldPlayIntro(memoryStorage(), { ...capable, reducedMotion: true })).toBe(false);
    expect(shouldPlayIntro(undefined, capable)).toBe(false);
    expect(shouldPlayIntro(throwing, capable)).toBe(false);
    expect(() => markIntroPlayed(throwing)).not.toThrow();
  });
});

describe('introLayout', () => {
  const options = { cols: 13, rows: 8, halfWidth: 1.47, halfHeight: 0.95, seed: 5, slots: 5 };

  it('fills the grid deterministically and finishes within about two seconds', () => {
    const layout = introLayout(options);
    expect(layout).toEqual(introLayout(options));
    expect(layout.cells).toHaveLength(104);
    expect(layout.duration).toBeGreaterThan(1.5);
    expect(layout.duration).toBeLessThanOrEqual(2.3);
    for (const cell of layout.cells) {
      expect(cell.inflateAt).toBeLessThan(0.35);
      expect(cell.popAt).toBeGreaterThan(1.1);
    }
  });

  it('pops from the centre outwards', () => {
    const { cells } = introLayout(options);
    const distance = (cell: { x: number; y: number }) => Math.hypot(cell.x, cell.y);
    const max = Math.hypot(options.halfWidth, options.halfHeight);
    for (const a of cells)
      for (const b of cells)
        if (distance(a) - distance(b) > 0.15 * max) expect(a.popAt).toBeGreaterThan(b.popAt);
  });
});

describe('playIntro', () => {
  let dom: JSDOM;
  beforeEach(() => {
    dom = new JSDOM('<div data-landing data-intro data-intro-skip="Skip intro"></div>');
  });
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });
  const root = () => dom.window.document.querySelector<HTMLElement>('[data-landing]')!;
  const overlay = () => dom.window.document.querySelector('.intro');
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const pending = () => new Promise<never>(() => undefined);

  it('does nothing when the intro already played this session', () => {
    const storage = memoryStorage();
    markIntroPlayed(storage);
    const load = vi.fn();
    playIntro({ root: root(), capability: capable, storage, load });
    expect(overlay()).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('adds a decorative canvas and a labelled skip button, and marks the session', () => {
    const storage = memoryStorage();
    playIntro({ root: root(), capability: capable, storage, load: pending });
    expect(overlay()?.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(overlay()?.querySelector('button')?.textContent).toBe('Skip intro');
    expect(storage.getItem(introStorageKey)).toBe('1');
  });

  it('ends on skip', () => {
    playIntro({ root: root(), capability: capable, storage: memoryStorage(), load: pending });
    overlay()!.querySelector('button')!.click();
    expect(overlay()).toBeNull();
  });

  it('ends on Escape', () => {
    playIntro({ root: root(), capability: capable, storage: memoryStorage(), load: pending });
    dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay()).toBeNull();
  });

  it('ends when the scene reports it is done', async () => {
    const scene = { start: vi.fn(), stop: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: async (onDone) => async () => {
        setTimeout(onDone, 0);
        return scene;
      },
    });
    await flush();
    await flush();
    expect(overlay()).toBeNull();
    expect(scene.dispose).toHaveBeenCalledOnce();
  });

  it('ends if the scene cannot load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: async () => {
        throw new Error('chunk failed');
      },
    });
    await flush();
    expect(overlay()).toBeNull();
  });
});
```

Run `pnpm prettier --write tests/unit/intro.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/intro.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/landing/intro-plan.ts`**

```ts
import type { Capability } from '../canvas-island/capability.ts';
import { mulberry32 } from '../random.ts';

export const introStorageKey = 'one23balloon:intro-played';

export function shouldPlayIntro(
  storage: Pick<Storage, 'getItem'> | undefined,
  capability: Capability,
): boolean {
  if (!capability.webgl || capability.reducedMotion || !storage) return false;
  try {
    return storage.getItem(introStorageKey) !== '1';
  } catch {
    return false;
  }
}

export function markIntroPlayed(storage: Pick<Storage, 'setItem'> | undefined): void {
  try {
    storage?.setItem(introStorageKey, '1');
  } catch {
    /* Storage can be unavailable in private modes; the intro then plays once per load. */
  }
}

export type IntroCell = {
  x: number;
  y: number;
  radius: number;
  slot: number;
  inflateAt: number;
  popAt: number;
};

// A slightly jittered grid that inflates within 0.35 s and pops centre-out from 1.1 s.
export function introLayout(options: {
  cols: number;
  rows: number;
  halfWidth: number;
  halfHeight: number;
  seed: number;
  slots: number;
}): { cells: IntroCell[]; duration: number } {
  const { cols, rows, halfWidth, halfHeight, seed, slots } = options;
  const random = mulberry32(seed);
  const stepX = (halfWidth * 2) / (cols - 1);
  const stepY = (halfHeight * 2) / (rows - 1);
  const maxDistance = Math.hypot(halfWidth, halfHeight);
  const cells: IntroCell[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const x = -halfWidth + col * stepX + (random() - 0.5) * stepX * 0.25;
      const y = -halfHeight + row * stepY + (random() - 0.5) * stepY * 0.25;
      cells.push({
        x,
        y,
        radius: Math.max(stepX, stepY) * (0.58 + random() * 0.12),
        slot: Math.floor(random() * slots),
        inflateAt: random() * 0.35,
        popAt: 1.1 + (Math.hypot(x, y) / maxDistance) * 0.85 + random() * 0.08,
      });
    }
  return { cells, duration: Math.max(...cells.map((cell) => cell.popAt)) + 0.15 };
}
```

- [ ] **Step 4: Implement `src/scripts/intro.ts`**

```ts
import type { Capability } from '../lib/canvas-island/capability.ts';
import {
  mountIsland,
  type Island,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';
import { markIntroPlayed, shouldPlayIntro } from '../lib/landing/intro-plan.ts';

export type IntroLoader = (onDone: () => void) => Promise<SceneFactory>;

// The page is already rendered and interactive underneath; the overlay only decorates.
export function playIntro(options: {
  root: HTMLElement;
  capability: Capability;
  storage: Storage | undefined;
  load: IntroLoader;
}): () => void {
  const { root, capability, storage, load } = options;
  if (!shouldPlayIntro(storage, capability)) return () => undefined;
  markIntroPlayed(storage);

  const doc = root.ownerDocument;
  const overlay = doc.createElement('div');
  overlay.className = 'intro';
  const canvas = doc.createElement('canvas');
  canvas.className = 'island-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const skip = doc.createElement('button');
  skip.type = 'button';
  skip.className = 'intro-skip';
  skip.textContent = root.dataset.introSkip ?? 'Skip';
  overlay.append(canvas, skip);
  doc.body.append(overlay);

  let island: Island | undefined;
  let finished = false;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') finish();
  };
  function finish() {
    if (finished) return;
    finished = true;
    doc.removeEventListener('keydown', onKeyDown);
    island?.dispose();
    const fade = overlay.animate?.([{ opacity: 1 }, { opacity: 0 }], {
      duration: 400,
      easing: 'ease-out',
    });
    if (fade) fade.finished.then(() => overlay.remove(), () => overlay.remove());
    else overlay.remove();
  }

  // A click anywhere, including the skip button, ends the intro.
  overlay.addEventListener('click', finish);
  doc.addEventListener('keydown', onKeyDown);
  island = mountIsland({
    element: overlay,
    capability,
    observe: (_element, onChange) => {
      onChange(true);
      return () => undefined;
    },
    load: () => load(finish),
    onState: (state) => {
      if (state === 'fallback') finish();
    },
  });
  return finish;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/intro.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 6: Implement `src/scenes/intro.ts`**

```ts
import {
  DirectionalLight,
  HemisphereLight,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { introLayout, type IntroCell } from '../lib/landing/intro-plan.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette } from './palette-source.ts';
import { createRenderer, fitCamera } from './renderer.ts';

type Cell = { balloon: Balloon; cell: IntroCell; inflated: boolean };
const DEPTH = 3;

export async function createIntroScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
  options: { onDone: () => void },
): Promise<IslandScene> {
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.6));
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 4, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 9);
  const materials = new PaletteMaterials(currentPalette(canvas.ownerDocument));
  const geometry = createBalloonGeometry(high ? 32 : 18);
  const confetti = new Confetti(scene, mulberry32(99));
  let cells: Cell[] = [];
  let duration = 0;
  let done = false;

  // The wall is laid out once, on the first resize, when the aspect ratio is known.
  const build = () => {
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * DEPTH;
    const halfWidth = halfHeight * camera.aspect;
    const cols = high ? 13 : 8;
    const rows = Math.max(5, Math.round(cols * (halfHeight / halfWidth)));
    const layout = introLayout({ cols, rows, halfWidth, halfHeight, seed: 5, slots: 5 });
    duration = layout.duration;
    cells = layout.cells.map((cell) => {
      const balloon = Balloon.create(geometry, materials.shared(cell.slot), cell.radius, false);
      balloon.mesh.position.set(cell.x, cell.y, camera.position.z - DEPTH);
      balloon.mesh.visible = false;
      scene.add(balloon.mesh);
      return { balloon, cell, inflated: false };
    });
  };

  const loop = new FrameLoop(renderer, (time, delta) => {
    for (const entry of cells) {
      if (!entry.inflated && time >= entry.cell.inflateAt) {
        entry.inflated = true;
        entry.balloon.inflate(time);
      }
      if (time >= entry.cell.popAt && entry.balloon.pop(time))
        confetti.burst(
          entry.balloon.mesh.position,
          (entry.balloon.mesh.material as MeshPhysicalMaterial).color,
          { count: 8, size: 0.035, speed: 0.9, now: time },
        );
      entry.balloon.update(time);
    }
    confetti.update(time, delta);
    renderer.render(scene, camera);
    if (!done && duration && time >= duration + 0.4) {
      done = true;
      // Finish outside the animation callback, which disposes this renderer.
      setTimeout(options.onDone, 0);
    }
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      if (!cells.length) build();
    },
    dispose: () => {
      loop.stop();
      confetti.dispose();
      materials.dispose();
      geometry.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 7: Type-check, lint and commit**

Run: `pnpm format && pnpm check && pnpm lint`
Expected: 0 errors.

```bash
git add src/lib/landing/intro-plan.ts src/scenes/intro.ts src/scripts/intro.ts tests/unit/intro.test.ts
git commit -m "feat: add once-per-session balloon-pop intro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: GSAP landing motion (pinned gallery and marquee)

**Files:**
- Create: `src/scripts/landing-motion.ts`
- Test: `tests/unit/landing-motion.test.ts`

**Interfaces:**
- Consumes: `motionEnabled`, `registerMotion` (`src/lib/motion/index.ts`); DOM contracts from Task 10.
- Produces: `initLandingMotion(root: HTMLElement): () => void`.

- [ ] **Step 1: Write the failing test**

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Run = () => (() => void) | void;
let dom: JSDOM;

function setup({ motion = true } = {}) {
  const added: Array<{ query: string; run: Run }> = [];
  const revert = vi.fn();
  const to = vi.fn();
  vi.resetModules();
  vi.doMock('../../src/lib/config/site.ts', () => ({
    getSiteConfig: () => ({ features: { motion } }),
  }));
  vi.doMock('gsap', () => ({
    gsap: {
      to,
      registerPlugin: vi.fn(),
      context: vi.fn(() => ({ add: vi.fn(), revert: vi.fn() })),
      matchMedia: () => ({
        add: (query: string, run: Run) => added.push({ query, run }),
        revert,
      }),
    },
  }));
  vi.doMock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }));
  return { added, revert, to, load: () => import('../../src/scripts/landing-motion.ts') };
}

beforeEach(() => {
  dom = new JSDOM(`<div data-landing>
    <div data-gallery><ol data-gallery-track></ol></div>
    <div data-marquee><ul class="marquee-list"></ul><ul class="marquee-list marquee-copy"></ul></div>
  </div>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('../../src/lib/config/site.ts');
  vi.doUnmock('gsap');
  vi.doUnmock('gsap/ScrollTrigger');
  dom.window.close();
});
const root = () => dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLandingMotion', () => {
  it('does nothing when motion is disabled', async () => {
    const motion = setup({ motion: false });
    const { initLandingMotion } = await motion.load();
    initLandingMotion(root())();
    expect(motion.added).toHaveLength(0);
    expect(motion.to).not.toHaveBeenCalled();
  });

  it('runs the marquee, pins the gallery on wide screens, and cleans up', async () => {
    const motion = setup();
    const { initLandingMotion } = await motion.load();
    const dispose = initLandingMotion(root());
    expect(motion.added.map((entry) => entry.query)).toEqual([
      '(prefers-reduced-motion: no-preference)',
      '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
    ]);
    const cleanups = motion.added.map((entry) => entry.run());
    const marquee = root().querySelector('[data-marquee]')!;
    const gallery = root().querySelector('[data-gallery]')!;
    expect(marquee.classList.contains('is-running')).toBe(true);
    expect(gallery.classList.contains('is-pinned')).toBe(true);
    expect(motion.to.mock.calls[0][0]).toHaveLength(2);
    expect(motion.to.mock.calls[1][0]).toBe(root().querySelector('[data-gallery-track]'));
    expect(motion.to.mock.calls[1][1].scrollTrigger).toMatchObject({ trigger: gallery, pin: true, scrub: 1 });
    for (const cleanup of cleanups) cleanup?.();
    expect(marquee.classList.contains('is-running')).toBe(false);
    expect(gallery.classList.contains('is-pinned')).toBe(false);
    dispose();
    expect(motion.revert).toHaveBeenCalledOnce();
  });
});
```

Run `pnpm prettier --write tests/unit/landing-motion.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/landing-motion.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/scripts/landing-motion.ts`**

```ts
import { gsap } from 'gsap';
import { motionEnabled, registerMotion } from '../lib/motion/index.ts';

const motionQuery = '(prefers-reduced-motion: no-preference)';

export function initLandingMotion(root: HTMLElement): () => void {
  if (!motionEnabled()) return () => undefined;
  registerMotion();
  const media = gsap.matchMedia();

  media.add(
    motionQuery,
    () => {
      const marquee = root.querySelector<HTMLElement>('[data-marquee]');
      if (!marquee) return;
      // Two identical lists side by side loop seamlessly at -100%.
      marquee.classList.add('is-running');
      gsap.to(marquee.querySelectorAll('.marquee-list'), {
        xPercent: -100,
        duration: 40,
        ease: 'none',
        repeat: -1,
      });
      return () => marquee.classList.remove('is-running');
    },
    root,
  );

  media.add(
    `(min-width: 64rem) and ${motionQuery}`,
    () => {
      const viewport = root.querySelector<HTMLElement>('[data-gallery]');
      const track = viewport?.querySelector<HTMLElement>('[data-gallery-track]');
      if (!viewport || !track) return;
      viewport.classList.add('is-pinned');
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => viewport.classList.remove('is-pinned');
    },
    root,
  );

  return () => media.revert();
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm vitest run tests/unit/landing-motion.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/landing-motion.ts tests/unit/landing-motion.test.ts
git commit -m "feat: pin the gallery and run the venue marquee with GSAP

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Wire the landing lifecycle

**Files:**
- Create: `src/scripts/landing.ts`
- Modify: `src/components/landing/LandingView.astro` (script)
- Modify: `src/styles/landing.css` (island and intro states)
- Test: `tests/unit/landing.test.ts`, `tests/integration/landing-build.test.ts`

**Interfaces:**
- Consumes: `initPalettePicker` (Task 11); `detectCapability`, `browserProbe`, `mountIsland`, `SceneFactory`, `Capability` (Task 12); `createHeroScene` (Task 14); `createSculptureScene`, `createReleaseScene` (Task 15); `playIntro`, `IntroLoader`, `createIntroScene` (Task 16); `initLandingMotion` (Task 17).
- Produces: `type SceneLoaders = Record<string, () => Promise<SceneFactory>>`, `sceneLoaders`, `introLoader: IntroLoader`, `type LandingOptions = { capability?: Capability; storage?: Storage; loaders?: SceneLoaders; intro?: IntroLoader; motion?: (root: HTMLElement) => () => void }`, `initLanding(root: HTMLElement, options?: LandingOptions): () => void`, `installLandingLifecycle(doc: Document): () => void`.

- [ ] **Step 1: Write the failing unit test**

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import { initLanding } from '../../src/scripts/landing.ts';

const capable: Capability = { webgl: true, reducedMotion: false, tier: 'high', pixelRatio: 1 };
let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM(`<div data-landing data-intro data-intro-skip="Skip">
    <div data-palette-picker hidden></div>
    <div data-island="hero"><canvas></canvas></div>
    <div data-island="unknown"><canvas></canvas></div>
  </div>`);
  vi.stubGlobal('CustomEvent', dom.window.CustomEvent);
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});
const doc = () => dom.window.document;
const root = () => doc().querySelector<HTMLElement>('[data-landing]')!;
const hero = () => doc().querySelector<HTMLElement>('[data-island="hero"]')!;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  } as unknown as Storage;
}

describe('initLanding', () => {
  it('mounts known islands, enhances pickers, starts motion and the intro, then disposes everything', async () => {
    const scene = { start: vi.fn(), stop: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
    const motionDispose = vi.fn();
    const motion = vi.fn(() => motionDispose);
    const intro = vi.fn(() => new Promise<never>(() => undefined));
    const dispose = initLanding(root(), {
      capability: capable,
      storage: memoryStorage(),
      loaders: { hero: async () => async () => scene },
      intro,
      motion,
    });
    await flush();
    expect(hero().dataset.islandState).toBe('live');
    expect(doc().querySelector('[data-island="unknown"]')!.hasAttribute('data-island-state')).toBe(false);
    expect(doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden).toBe(false);
    expect(motion).toHaveBeenCalledWith(root());
    expect(intro).toHaveBeenCalledOnce();
    expect(doc().querySelector('.intro')).not.toBeNull();

    dispose();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(motionDispose).toHaveBeenCalledOnce();
    expect(hero().dataset.islandState).toBe('disposed');
    expect(doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden).toBe(true);
    expect(doc().querySelector('.intro')).toBeNull();
  });

  it('keeps photo fallbacks and skips the intro without WebGL', () => {
    const load = vi.fn();
    const intro = vi.fn();
    initLanding(root(), {
      capability: { ...capable, webgl: false },
      storage: memoryStorage(),
      loaders: { hero: load },
      intro,
      motion: () => () => undefined,
    });
    expect(hero().dataset.islandState).toBe('fallback');
    expect(load).not.toHaveBeenCalled();
    expect(intro).not.toHaveBeenCalled();
  });
});
```

Run `pnpm prettier --write tests/unit/landing.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/landing.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/scripts/landing.ts`**

```ts
import {
  browserProbe,
  detectCapability,
  type Capability,
} from '../lib/canvas-island/capability.ts';
import { mountIsland, type SceneFactory } from '../lib/canvas-island/lifecycle.ts';
import { playIntro, type IntroLoader } from './intro.ts';
import { initLandingMotion } from './landing-motion.ts';
import { initPalettePicker } from './palette-picker.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  capability?: Capability;
  storage?: Storage;
  loaders?: SceneLoaders;
  intro?: IntroLoader;
  motion?: (root: HTMLElement) => () => void;
};

// Dynamic imports keep Three.js out of the initial page script.
export const sceneLoaders: SceneLoaders = {
  hero: async () => (await import('../scenes/hero.ts')).createHeroScene,
  sculptures: async () => (await import('../scenes/sculptures.ts')).createSculptureScene,
  release: async () => (await import('../scenes/release.ts')).createReleaseScene,
};

export const introLoader: IntroLoader = async (onDone) => {
  const { createIntroScene } = await import('../scenes/intro.ts');
  return (canvas, capability) => createIntroScene(canvas, capability, { onDone });
};

function sessionStore(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function initLanding(root: HTMLElement, options: LandingOptions = {}): () => void {
  const capability = options.capability ?? detectCapability(browserProbe());
  const loaders = options.loaders ?? sceneLoaders;
  const cleanups: Array<() => void> = [
    initPalettePicker(root),
    (options.motion ?? initLandingMotion)(root),
  ];
  for (const element of root.querySelectorAll<HTMLElement>('[data-island]')) {
    const load = loaders[element.dataset.island ?? ''];
    if (!load) continue;
    const island = mountIsland({ element, load, capability });
    cleanups.push(() => island.dispose());
  }
  if (root.hasAttribute('data-intro'))
    cleanups.push(
      playIntro({
        root,
        capability,
        storage: options.storage ?? sessionStore(),
        load: options.intro ?? introLoader,
      }),
    );
  return () => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  };
}

export function installLandingLifecycle(doc: Document): () => void {
  let disposePage: () => void = () => undefined;
  let disposed = false;
  const initialize = () => {
    disposePage();
    const root = doc.querySelector<HTMLElement>('[data-landing]');
    disposePage = root ? initLanding(root) : () => undefined;
  };
  const dispose = () => {
    disposePage();
    disposePage = () => undefined;
  };
  doc.addEventListener('astro:page-load', initialize);
  doc.addEventListener('astro:before-swap', dispose);
  initialize();
  return () => {
    if (disposed) return;
    disposed = true;
    dispose();
    doc.removeEventListener('astro:page-load', initialize);
    doc.removeEventListener('astro:before-swap', dispose);
  };
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `pnpm vitest run tests/unit/landing.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing integration test**

Add `readdir` to the `node:fs/promises` import at the top of `tests/integration/landing-build.test.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
```

Append to the `describe` block:

```ts
  it('keeps Three.js out of the initial page script but ships it as a lazy chunk', async () => {
    const document = await page('index.html');
    const scripts = [...document.querySelectorAll('script[type="module"]')];
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const src = script.getAttribute('src');
      const code = src
        ? await read(src.replace(/^\/one23balloon\//, ''))
        : script.textContent ?? '';
      expect(code, src ?? 'inline script').not.toContain('WebGLRenderer');
    }
    const chunks = (await readdir(join(fixture.outputDir, '_astro'))).filter((file) => file.endsWith('.js'));
    const withThree = await Promise.all(
      chunks.map(async (file) => (await read(`_astro/${file}`)).includes('WebGLRenderer')),
    );
    expect(withThree).toContain(true);
  });
```

Run: `pnpm vitest run tests/integration/landing-build.test.ts -t "lazy chunk"`
Expected: FAIL (no landing script yet, so no chunk contains `WebGLRenderer`).

- [ ] **Step 6: Add the script to `src/components/landing/LandingView.astro`**

Append after the closing `</div>`:

```astro
<script>
  import { installLandingLifecycle } from '../../scripts/landing.ts';

  installLandingLifecycle(document);
</script>
```

- [ ] **Step 7: Add island and intro states to `src/styles/landing.css`**

Append:

```css
/* 3D islands: the photo stays in the DOM; the canvas fades in over it once live. */
.island-canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s var(--ease-out);
}
[data-island-state='live'] > .island-canvas {
  opacity: 1;
  pointer-events: auto;
}
[data-island-state='live'] > .photo {
  opacity: 0;
}
.intro {
  position: fixed;
  inset: 0;
  z-index: var(--intro-layer);
  background: var(--color-page);
}
.intro .island-canvas {
  opacity: 1;
  pointer-events: auto;
}
.intro-skip {
  position: absolute;
  inset-block-end: var(--space-md);
  inset-inline-end: var(--space-md);
  min-block-size: 2.75rem;
  padding: 0.5rem 1.2rem;
  border: var(--border-width) solid var(--color-text);
  border-radius: 999px;
  background: var(--color-page);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .intro {
    display: none;
  }
}
```

- [ ] **Step 8: Run all gates**

Run: `pnpm format && pnpm lint && pnpm check && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 9: Check it in the browser**

Run `pnpm preview` in the background and open `http://localhost:4321/one23balloon/` in the in-app browser:

1. A fresh session plays the intro: the balloon wall pops centre-out and reveals the hero in about 2 seconds. Reloading in the same tab does not replay it. "Skip intro" and Escape end it at once.
2. The hero garland fades in over the photo, sways, and pops on click, with confetti and re-inflation.
3. Each palette button recolours the hero, sculpture and closing scenes in a sweep, changes the hero and closing section tints, and updates the header, hero and closing WhatsApp links.
4. The sculpture stage shows the dog, tulips and cake rotating on pedestals.
5. On a wide window the gallery pins and scrolls sideways; the venue names move in a marquee.
6. Balloons rise in the closing section.
7. `/one23balloon/zh/` shows the same in Chinese with the Noto SC fonts.

If a scene renders too dark, too bright or off-centre, adjust lights, `toneMappingExposure` or camera positions in that scene file only, then repeat.

- [ ] **Step 10: Commit**

```bash
git add src/scripts/landing.ts src/components/landing/LandingView.astro src/styles/landing.css tests/unit/landing.test.ts tests/integration/landing-build.test.ts
git commit -m "feat: wire palette picker, 3D islands, intro and motion into the landing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Documentation, decision records and changelog

**Files:**
- Create: `docs/decisions/0006-three-for-3d-balloons.md`, `docs/decisions/0007-cjk-font-subsetting.md`
- Modify: `README.md`, `CHANGELOG.md`, `docs/architecture.md`, `docs/content.md`, `docs/getting-started.md`

- [ ] **Step 1: Write `docs/decisions/0006-three-for-3d-balloons.md`**

```md
# 0006: Three.js for real-time 3D balloons

Status: Accepted (one23balloon client project)

The one23balloon direction calls for glossy latex, pearl and mirror-chrome balloons that recolour live when a visitor picks a palette, pop on click, and rotate as sculptures. SVG and CSS cannot render physically based reflections. Pre-rendered images cannot recolour or rotate. Lottie adds a similar weight without 3D lighting.

Use exact `three@0.186.1` (runtime) and `@types/three@0.186.0` (types). Three.js is imported only by `src/scenes/` and loaded with dynamic `import()` from `src/scripts/landing.ts`, so it never blocks first paint. `src/lib/canvas-island/` owns the engine-agnostic lifecycle (lazy mount, off-screen pause, quality tiers, context loss, photo fallback) and is the candidate to extract into canvas-base once a second project needs 3D. Three.js itself stays out of the template.

Consequences: a lazy chunk of roughly 150 KB gzipped (record the measured size in the quality report); scenes must be disposed on navigation; Three.js releases often, so review its changelog before upgrading.
```

- [ ] **Step 2: Write `docs/decisions/0007-cjk-font-subsetting.md`**

```md
# 0007: Subset Chinese fonts at authoring time

Status: Accepted (one23balloon client project)

The Chinese locale needs a serif display face and a sans text face. Full Noto Serif SC and Noto Sans SC files are several megabytes each. Use exact dev dependency `subset-font@2.9.0` in `pnpm fonts:subset` (`scripts/subset-fonts.ts`) to write WOFF2 subsets containing only the characters used in `src/content/landing/zh.yaml`, `src/content/pages/zh/home.md` and `src/i18n/zh.json`, plus a Latin subset of Fraunces. Sources come from a pinned google/fonts commit, and their OFL licences are copied beside the fonts.

`src/lib/fonts/zh-charset.txt` records the subset; `tests/unit/fonts.test.ts` fails when Chinese copy uses a character the subset lacks, so rerun `pnpm fonts:subset` after editing Chinese text. The Chinese faces use `unicode-range`, so English pages never download them.
```

- [ ] **Step 3: Update `README.md`**

At the top, below the main heading, add:

```md
> **Client site:** this repository is the one23balloon landing page (KL and Selangor balloon decoration), built from Canvas Base. See [brief.md](brief.md), [design-direction.md](design-direction.md) and the [design spec](docs/superpowers/specs/2026-10-29-one23balloon-landing-design.md). Run `pnpm fonts:subset` after editing Chinese copy.
```

Add these rows to the dependency matrix table:

```md
| `three`                    | 0.186.1       | Render the lazy-loaded real-time 3D balloon scenes ([decision](docs/decisions/0006-three-for-3d-balloons.md)). |
| `@types/three`             | 0.186.0       | Type the Three.js scene code.                                                                       |
| `subset-font`              | 2.9.0         | Subset Fraunces and Noto SC fonts at authoring time ([decision](docs/decisions/0007-cjk-font-subsetting.md)). |
```

Then run `pnpm prettier --write README.md` to realign the table.

- [ ] **Step 4: Update `CHANGELOG.md`**

Under `## [Unreleased]`, add an `### Added` entry at the top of the existing Added list:

```md
- one23balloon client landing page: bilingual en/zh one-page site with WhatsApp calls to action, typed `landing` content collection with locale parity, Gala atelier styling, self-hosted Fraunces and subset Noto SC fonts, real client photos, palette picker, GSAP pinned gallery and marquee, and lazy Three.js balloon scenes (hero garland, sculptures, closing release, once-per-session intro) behind the engine-agnostic `canvas-island` lifecycle with photo fallbacks.
- Fixed-layer tests now build against a `demo` fixture preset (`tests/helpers/demo.ts`), so client configuration and content no longer affect template coverage.
```

- [ ] **Step 5: Update `docs/architecture.md`**

Append:

```md
## one23balloon landing (client layer)

The home route renders `src/components/landing/LandingView.astro` from the typed `landing` data collection (`src/content/landing/<locale>.yaml`, schema in `src/lib/landing/schema.ts`). `getLanding()` checks that every locale matches the default locale's structure, photos and contact number, and fails the build otherwise. All copy, photos and WhatsApp links are static HTML.

Client scripts progressively enhance from `src/scripts/landing.ts`: the palette picker, GSAP motion, a once-per-session intro and three 3D islands. `src/lib/canvas-island/` is engine-agnostic. It detects capability, mounts a scene when its island nears the viewport, pauses it off-screen or in hidden tabs, and falls back to the photo on reduced motion, missing WebGL, load failure or context loss. It is a candidate for extraction into canvas-base. `src/scenes/` holds the Three.js scenes, loaded by dynamic import.

Fixed-layer tests use the `demo` preset of `buildFixture`, which builds with the canvas-base demonstration config and content from `tests/fixtures/demo/`. Client tests use the `project` preset.
```

- [ ] **Step 6: Update `docs/content.md` and `docs/getting-started.md`**

In `docs/content.md`, append:

```md
## Client landing collection

This project adds a `landing` data collection: one YAML file per locale in `src/content/landing/`, validated by `src/lib/landing/schema.ts`. Every photo needs `alt` text and the Instagram post it came from. Translations must keep the same ids, photos, palettes, counts and draft flags as the default locale.
```

In `docs/getting-started.md`, replace the sentence `Contact page prose lives in \`src/content/pages/en/contact.md\`.` with:

```md
The demonstration contact page now lives in `tests/fixtures/demo/contact.md` for template tests; the one23balloon site uses WhatsApp links instead of the form.
```

- [ ] **Step 7: Check and commit**

Run: `pnpm lint`
Expected: pass.

```bash
git add README.md CHANGELOG.md docs
git commit -m "docs: record one23balloon dependencies, architecture and changelog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Verification and quality evidence

**Files:**
- Modify: `docs/quality-report.md`

- [ ] **Step 1: Run every gate from a clean state**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test
pnpm build
```

Expected: all pass. Record the test count and the build page count.

- [ ] **Step 2: Measure the bundle**

```bash
ls -l dist/_astro/*.js
gzip -c dist/_astro/<three chunk>.js | wc -c
```

Record the initial script size and the gzipped Three.js chunk size.

- [ ] **Step 3: Validate the generated workflow and container**

If `actionlint` is installed, run `actionlint .github/workflows/deploy.yml .github/workflows/ci.yml` and record the result. If Docker is available, run `docker compose up --build -d`, then `pnpm verify:container one23balloon`, then `docker compose down`. Record any tool that is unavailable as a limitation, not a pass.

- [ ] **Step 4: Browser acceptance**

Serve with `pnpm preview` in the background. In the in-app browser, check `/one23balloon/` and `/one23balloon/zh/` at 360, 768 and 1280px widths, in light and dark preference, with:
- normal motion: intro, 3D islands, palette recolouring, pinned gallery (1280 only), marquee, closing release;
- reduced motion: no intro, photos instead of 3D, no pinning, no marquee, static venue list;
- JavaScript disabled: all text, photos, FAQ and WhatsApp links present; palette pickers hidden;
- keyboard only: the skip link reaches main; focus is visible on every link and palette option; arrow keys move between palette options;
- no horizontal page overflow at 360px; one h1 per page; no console errors.

The WebGL-unavailable path is covered by unit tests (`tests/unit/canvas-island.test.ts`, `tests/unit/landing.test.ts`). Note in the report that it was not exercised in a real browser unless you can disable WebGL there.

- [ ] **Step 5: Lighthouse (ask first)**

Lighthouse is not a project dependency. Ask the user before downloading it (for example `pnpm dlx lighthouse@13.5.0`). If approved, audit both pages with the mobile and desktop presets against `pnpm preview`, and record performance, accessibility, best-practices and SEO scores. Targets: mobile performance ≥ 80, accessibility ≥ 95, best practices ≥ 95, SEO ≥ 95. If not approved, record that Lighthouse was not run.

- [ ] **Step 6: Write the results into `docs/quality-report.md`**

Add a section at the top:

```md
## one23balloon client acceptance (<date>)

Environment: <OS>, Node <version>, pnpm <version>, browser <name and version>.

| Check | Result |
| --- | --- |
| lint / check / test / build | <pass or fail, test count, page count> |
| Initial script size / Three.js chunk (gzip) | <bytes> / <bytes> |
| actionlint | <result or "not installed"> |
| Docker verify | <result or "Docker unavailable"> |
| Browser matrix (360/768/1280, light/dark, motion/reduced/no-JS, keyboard) | <findings> |
| Lighthouse mobile / desktop | <scores or "not run"> |

Limitations: <for example WebGL-off verified by unit tests only; emulated widths, not physical devices; pending client confirmations listed in brief.md>.

Governance review for this client copy (CONTRIBUTING checklist) is still open: CODEOWNERS, CONTRIBUTING, CODE_OF_CONDUCT and SECURITY describe the upstream template and need a client decision; the MIT notice and font licences (`public/fonts/OFL*.txt`) are retained.
```

Fill every placeholder with measured values. Do not record checks that were not run as passes.

- [ ] **Step 7: Commit**

```bash
git add docs/quality-report.md
git commit -m "docs: record one23balloon acceptance results

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Report**

Summarise for the user: what was built, the gate results, measured sizes and scores, limitations, and the open items from the brief's pending-confirmation checklist and the governance review. Do not push, open a pull request, enable GitHub Pages or deploy without the user's explicit instruction.
