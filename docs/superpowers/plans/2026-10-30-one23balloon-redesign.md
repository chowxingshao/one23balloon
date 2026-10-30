# one23balloon showcase redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the one23balloon landing page as a colourful, single-theme showcase with very large Unbounded type, six section-level GSAP chapters and one travelling 3D balloon cluster with real depth and no overlaps.

**Architecture:** Astro static pages keep the existing routing, manifest, SEO and i18n. A new typed `landing` YAML schema feeds six chapter components that render fully without JavaScript. Motion lives in one module per chapter under `src/scripts/chapters/`, registered through one `gsap.matchMedia()`. 3D is one `BalloonStage` (Three.js, dynamically imported) on fixed canvases outside the smooth-scroll wrapper. Chapters announce formations through a DOM event, and the stage springs balloons between collision-free layouts.

**Tech Stack:** Astro 7, TypeScript (strict), plain CSS, GSAP 3.15 (ScrollTrigger, SplitText, ScrollSmoother), Three.js 0.186, Vitest 5 with jsdom, sharp, subset-font, pnpm 12.

**Spec:** `docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md` (read it before any task). Repository rules: `CLAUDE.md`, `CONTRIBUTING.md`, `docs/architecture.md`.

## Global Constraints

- Branch `redesign-showcase`. Commit after every task. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push, tag, open a PR or deploy without the user saying so in chat.
- No new npm dependencies. GSAP plugins come from the existing `gsap@3.15.0`: `gsap/ScrollTrigger`, `gsap/SplitText`, `gsap/ScrollSmoother`.
- Static output, strict TypeScript, plain CSS. All content is visible without JavaScript.
- One theme: no `prefers-color-scheme` rules, `color-scheme: light`, no palette picker.
- Colours, copied exactly: paper `#F4F4F1`, ink `#121212`, muted `#55554F`, pink `#FF3E8A`, cobalt `#2340FF`, sunflower `#FFC21A`, emerald `#14B37D`, tangerine `#FF6A2B`, lilac `#B69CFF`. Text on cobalt is white `#FFFFFF`; text on every other block is ink.
- Display font Unbounded 900. Chinese display font Noto Sans SC 900. Body font Source Sans 3 (en) and Noto Sans SC 400 (zh). No serif anywhere.
- Photos are rectangles with `--radius-photo: 1.25rem` or full bleed. Buttons and statement photo pills are full pills. Nothing is overlaid on a photo; captions go below.
- No em dash (U+2014) or en dash (U+2013) in any visible string, alt text or caption.
- Motion runs only under `(prefers-reduced-motion: no-preference)`. No `scroll` event listeners: scroll is read through ScrollTrigger only. Pins use `start: 'top top'`.
- ScrollSmoother only under `(prefers-reduced-motion: no-preference) and (min-width: 64rem) and (pointer: fine)`.
- Three.js is reached only by dynamic `import()`. Capability tiers stay `high | low` (`src/lib/canvas-island/capability.ts`). Balloon counts: 30 on `high`, 14 on `low`.
- Resting formations never overlap: every balloon pair keeps a centre distance of at least `(1.1 * r1 + 1.1 * r2) * 1.04` (1.1 is the balloon's vertical stretch).
- Gates before every commit that touches code: `pnpm lint`, `pnpm check`, `pnpm test` (2.5 to 5 min), `pnpm build`. Run `pnpm fonts:subset` after any change to Chinese text, or `tests/unit/fonts.test.ts` fails.
- Photo selection rules (unchanged): no recognisable customer face as the main subject, no customer brands or logos, no licensed characters, no editing text overlays, sharp, at least 1000px wide. Every photo file has a row in `docs/photo-sources.md`.

## Deliberate refinements of the spec

The plan settles details the spec left open. Task 1 records them in the spec so the two documents agree:

1. The hero display size is `clamp(2.75rem, 10vw, 12rem)`, not 12vw. Unbounded is very wide, so "Every party," at 12vw overflows a 1440px viewport. The exact coefficient is confirmed in the Task 5 browser check.
2. The footer wordmark is about 8.5vw, not 18vw, for the same reason, and is confirmed in Task 5.
3. The celebrations grid has four column lists at 64rem and wider, two multi-columns from 40rem, and one below. The 1024px three-column step is dropped because per-column parallax needs real column elements.
4. The depth-of-field (bokeh) pass is dropped. It needs `EffectComposer`, which conflicts with the two-pass front/back rendering. Depth reads through the narrow field of view, fog and scale.
5. The back pass runs whenever the formation has balloons behind the headline plane (hero, drift), not only in the hero. That is what lets the drift formation sit behind the statement text.
6. On the low tier, `drift` resolves to `hidden`, because without a back canvas the drifting balloons would cover the statement text.
7. Service clusters use the two contrasting block colours from `clusterBlocks` plus chrome and pearl, not the card's own colour, which would vanish against the card. The release formation uses sunflower, cobalt and lilac against the pink flood.
8. The header's one-line fit at 360px is checked in the browser (Task 5 and Task 15), because jsdom cannot measure layout. The schema caps the header pill label at 12 characters.

## File Structure

Created:

| File | Responsibility |
| --- | --- |
| `src/lib/landing/blocks.ts` | Colour block ids, hex values, text colour per block, 3D cluster colour pairs, material types. |
| `src/lib/landing/formations.ts` | Chapter ids, formation ids, chapter to formation mapping, tier resolution, the formation DOM event. |
| `src/scenes/formation-layout.ts` | Deterministic, collision-free 3D placement (Poisson-disk dart throwing). |
| `src/scenes/formations.ts` | Formation volumes, radii and colours per formation, for a given balloon count and aspect. |
| `src/scenes/stage.ts` | `createStageScene`: renderer, instanced balloons, springs, colour tweens, front/back passes. |
| `src/scripts/chapters/types.ts` | `ChapterSetup` and `ChapterContext` types. |
| `src/scripts/chapters/{hero,statement,services,signature,celebrations,closing}.ts` | One GSAP module per chapter. |
| `src/scripts/chapters/index.ts` | Chapter registry. |
| `src/scripts/formation-triggers.ts` | ScrollTriggers that announce formations. |
| `src/components/landing/{HeroChapter,StatementChapter,ServicesChapter,SignatureChapter,CelebrationsChapter,ClosingChapter,LandingStage}.astro` | Static chapter markup and the stage canvases. |
| `src/assets/stage/hero-poster.webp` | Transparent poster still of the hero cluster. |
| `tests/unit/blocks.test.ts`, `tests/unit/formations.test.ts`, `tests/unit/formation-layout.test.ts`, `tests/unit/formation-triggers.test.ts` | New unit tests. |
| `.claude/launch.json` | Dev server entry for the built-in browser. |

Rewritten: `src/styles/tokens.css`, `src/styles/landing.css`, `src/lib/landing/schema.ts`, `src/lib/landing/parity.ts`, `src/content/landing/en.yaml`, `src/content/landing/zh.yaml`, `src/components/landing/LandingView.astro`, `src/components/landing/LandingFooter.astro`, `src/scripts/landing-motion.ts`, `src/scripts/landing.ts`, `design-direction.md`, `tests/unit/landing-schema.test.ts`, `tests/unit/landing-motion.test.ts`, `tests/unit/landing.test.ts`.

Modified: `scripts/subset-fonts.ts`, `src/layouts/BaseLayout.astro`, `src/components/PageView.astro`, `src/components/SiteHeader.astro`, `src/components/landing/WhatsAppLink.astro`, `src/scenes/material-params.ts`, `src/scenes/balloon.ts`, `tests/unit/fonts.test.ts`, `tests/unit/scene-foundation.test.ts`, `tests/integration/landing-build.test.ts`, `docs/photo-sources.md`, `brief.md`, `CHANGELOG.md`, `docs/quality-report.md`, `docs/decisions/0006-font-subsetting.md`, `public/og-one23balloon.jpg`.

Deleted (in the task named): Task 2 Fraunces and Noto Serif SC font files. Task 4 `ArchPhoto`, `FaqSection`, `GallerySection`, `HeroSection`, `PalettePicker`, `PaletteStyles`, `SculpturesSection`, `ServicesSection`, `StepsSection`, `VenuesSection`, `ClosingSection` components. Task 12: `src/scripts/intro.ts`, `src/scripts/palette-picker.ts`, `src/lib/landing/palettes.ts`, `src/lib/landing/events.ts`, `src/lib/landing/intro-plan.ts`, `src/scenes/{hero,intro,confetti,release,sculptures,sculpture-mesh,sculpture-parts,garland-layout,picking,palette-source,materials,balloon-motion}.ts`, `tests/unit/{intro,palette-picker,palettes,scene-layouts}.test.ts`.

---

### Task 1: Colour blocks and a single theme

**Files:**
- Create: `src/lib/landing/blocks.ts`
- Create: `tests/unit/blocks.test.ts`
- Rewrite: `src/styles/tokens.css`
- Modify: `src/layouts/BaseLayout.astro:79` (color-scheme meta)
- Rewrite: `design-direction.md`
- Modify: `docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md` (record the eight refinements)

**Interfaces:**
- Consumes: `contrastRatio(first: string, second: string): number` from `src/lib/landing/contrast.ts`.
- Produces: `blockIds`, `BlockId`, `blocks: Record<BlockId, { hex: string; text: 'ink' | 'white' }>`, `ink`, `paper`, `muted`, `white`, `chromeSilver`, `chromeGold`, `textOn(id: BlockId): string`, `isBlockId(value: string): value is BlockId`, `clusterBlocks: Record<BlockId, readonly [BlockId, BlockId]>`, `type Material = 'latex' | 'pearl' | 'chrome'`, `type StageColour = { hex: string; material: Material }`. CSS tokens `--block-<id>`, `--block-<id>-text`, `--radius-photo`, `--font-size-hero`, `--gutter`, `--stage-back-layer`, `--content-layer`, `--stage-layer`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/blocks.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/blocks.test.ts`
Expected: FAIL, cannot resolve `../../src/lib/landing/blocks.ts`.

- [ ] **Step 3: Create `src/lib/landing/blocks.ts`**

```ts
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

export const blocks: Record<BlockId, { hex: string; text: 'ink' | 'white' }> =
  {
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
```

- [ ] **Step 4: Rewrite `src/styles/tokens.css`**

Every custom property that `src/styles/global.css`, `src/components/*.astro` and `src/layouts/*.astro` read is kept by name. Only values change and new tokens are added. `--radius-arch`, `--intro-layer` and `--tint` are removed.

```css
/* Colour block (see design-direction.md). Block values mirror src/lib/landing/blocks.ts; tests/unit/blocks.test.ts keeps them in sync. */
:root {
  color-scheme: light;
  --color-page: #f4f4f1;
  --color-surface: #e9e9e4;
  --color-text: #121212;
  --color-muted: #55554f;
  --color-link: #121212;
  --color-border: #d6d6d0;
  --color-focus: #2340ff;
  --color-on-ink: #f4f4f1;
  --block-pink: #ff3e8a;
  --block-pink-text: #121212;
  --block-cobalt: #2340ff;
  --block-cobalt-text: #ffffff;
  --block-sunflower: #ffc21a;
  --block-sunflower-text: #121212;
  --block-emerald: #14b37d;
  --block-emerald-text: #121212;
  --block-tangerine: #ff6a2b;
  --block-tangerine-text: #121212;
  --block-lilac: #b69cff;
  --block-lilac-text: #121212;
  --font-body: 'Source Sans 3', 'Noto Sans SC', system-ui, sans-serif;
  --font-display: 'Unbounded', 'Noto Sans SC', system-ui, sans-serif;
  --font-size-body: clamp(1.125rem, 1.4vw, 1.375rem);
  --font-size-small: 1rem;
  --font-size-hero: clamp(2.75rem, 10vw, 12rem);
  --font-size-display: clamp(2.75rem, 7vw, 7.5rem);
  --font-size-title: clamp(2rem, 4.5vw, 4.5rem);
  --font-size-heading: clamp(1.5rem, 2.6vw, 2.25rem);
  --font-size-lead: clamp(1.2rem, 1.6vw, 1.5rem);
  --weight-body: 400;
  --weight-heading: 900;
  --weight-display: 900;
  --line-body: 1.55;
  --line-title: 0.95;
  --line-heading: 1.1;
  --tracking-title: -0.02em;
  --tracking-eyebrow: 0.14em;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-2xl: 4rem;
  --space-xl: clamp(5rem, 10vw, 9rem);
  --space-page: clamp(1rem, 4vw, 3.5rem);
  --gutter: max(1rem, 4vw);
  --width-site: 90rem;
  --width-reading: 40rem;
  --width-thumbnail: 16rem;
  --height-main: 50vh;
  --radius-photo: 1.25rem;
  --radius-card: 1.25rem;
  --border-width: 1px;
  --focus-width: 3px;
  --focus-offset: 4px;
  --link-underline: 0.08em;
  --link-offset: 0.18em;
  --skip-offset: 1rem;
  --stage-back-layer: 0;
  --content-layer: 1;
  --stage-layer: 2;
  --header-layer: 5;
  --skip-layer: 30;
  --header-height: 4rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Then run `grep -rn "radius-arch\|intro-layer\|var(--tint" src` and remove every remaining use (they are all in `landing.css`, which Task 5 rewrites. If `pnpm check` or the build complains before then, replace them with `var(--radius-photo)`, `var(--skip-layer)` and `var(--color-page)`).

- [ ] **Step 5: Set the colour-scheme meta to light**

In `src/layouts/BaseLayout.astro` change `<meta name="color-scheme" content="light dark" />` to `<meta name="color-scheme" content="light" />`.

- [ ] **Step 6: Run the test**

Run: `pnpm vitest run tests/unit/blocks.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 7: Rewrite `design-direction.md`**

Replace the file with a "Colour block" direction that states: the date (2026-10-30) and that it replaces Gala atelier at the client's request; the concept (balloons and events as the colour, a quiet off-white canvas, very large inflated type); the colour table from Global Constraints with each pairing's contrast (ink on paper 17.0, muted on paper 6.8, ink on pink 5.6, white on cobalt 6.5, ink on sunflower 11.6, ink on emerald 6.9, ink on tangerine 6.6, ink on lilac 8.2); the type scale from `tokens.css`; the shape rules (one photo radius, pill buttons and statement pills, no arches or ovals, nothing on photos); the six chapters and their motion in one line each (copy from the spec's Page structure); the 3D rules (one stage, depth, no overlaps, poster still); and accessibility (one theme, reduced motion static, no-JS complete). No em or en dashes.

- [ ] **Step 8: Record the refinements in the spec**

In `docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md`, add a section "## Refinements from planning (2026-10-30)" after "Decisions", listing the eight items from this plan's "Deliberate refinements of the spec" section verbatim, and edit the matching sentences:

- In "Typography", change "hero `clamp(3.5rem, 12vw, 13rem)`" to "hero `clamp(2.75rem, 10vw, 12rem)`".
- In "5. Recent celebrations", change "four columns (three at 1024px, two at 768px, one below)" to "four column lists at 64rem and wider, two multi-columns from 40rem, one below".
- In "Depth", delete the bullet "High tier only: a bokeh depth-of-field pass. Mid and low tiers rely on fog and scale."
- In "Front and back layers", replace "Outside the hero the back canvas is hidden and only the front pass runs." with "The back pass runs whenever the formation has balloons behind the headline plane (hero and drift)." and change "high and mid tiers" to "high tier".
- In "Formations", change the `service-n` colours to "Two contrasting block colours (`clusterBlocks`) plus chrome and pearl" and the `release` colours to "Sunflower, cobalt, lilac and chrome".
- In "6. Closing and footer", change "about 18vw" to "about 8.5vw, confirmed in the browser".

Run `pnpm exec prettier --write design-direction.md docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md`.

- [ ] **Step 9: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`
Expected: all pass. The page looks unstyled in places until Task 5; that is expected.

```bash
git add src/lib/landing/blocks.ts tests/unit/blocks.test.ts src/styles/tokens.css src/layouts/BaseLayout.astro design-direction.md docs/superpowers/specs/2026-10-30-one23balloon-redesign-design.md
git commit -m "feat(theme): introduce the colour block palette and a single light theme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Unbounded and Noto Sans SC Black fonts

**Files:**
- Modify: `scripts/subset-fonts.ts:11-38` (font list)
- Modify: `src/layouts/BaseLayout.astro:40-60` (font faces)
- Modify: `tests/unit/fonts.test.ts`
- Modify: `tests/integration/landing-build.test.ts:93-113` (preload expectations)
- Delete: `public/fonts/fraunces-latin.woff2`, `public/fonts/OFL-Fraunces.txt`, `public/fonts/noto-serif-sc-subset.woff2`, `public/fonts/OFL-NotoSerifSC.txt`
- Create: `public/fonts/unbounded-latin.woff2`, `public/fonts/OFL-Unbounded.txt`, `public/fonts/noto-sans-sc-black-subset.woff2` (generated)
- Modify: `docs/decisions/0006-font-subsetting.md` (amendment)

**Interfaces:**
- Consumes: `--font-display` from Task 1 (`'Unbounded', 'Noto Sans SC', system-ui, sans-serif`).
- Produces: font families `Unbounded` (weight 900) and `Noto Sans SC` (weights 400 and 900), self-hosted.

- [ ] **Step 1: Update the failing test first**

In `tests/unit/fonts.test.ts`, replace the `it.each([...])` list with:

```ts
  it.each([
    'source-sans-3-latin.woff2',
    'unbounded-latin.woff2',
    'noto-sans-sc-subset.woff2',
    'noto-sans-sc-black-subset.woff2',
  ])('ships %s under 400 KB', (file) => {
    const size = statSync(new URL(`public/fonts/${file}`, root)).size;
    expect(size).toBeGreaterThan(1_000);
    expect(size).toBeLessThan(400_000);
  });

  it.each([
    'fraunces-latin.woff2',
    'OFL-Fraunces.txt',
    'noto-serif-sc-subset.woff2',
    'OFL-NotoSerifSC.txt',
  ])('no longer ships %s', (file) => {
    expect(existsSync(new URL(`public/fonts/${file}`, root))).toBe(false);
  });
```

Change the import line to `import { existsSync, readFileSync, statSync } from 'node:fs';`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/fonts.test.ts`
Expected: FAIL, `unbounded-latin.woff2` is missing and `fraunces-latin.woff2` still exists.

- [ ] **Step 3: Change the subset pipeline**

In `scripts/subset-fonts.ts`, replace the `fonts` array with:

```ts
const fonts = [
  {
    source: 'ofl/unbounded/Unbounded%5Bwght%5D.ttf',
    license: 'ofl/unbounded/OFL.txt',
    output: 'unbounded-latin.woff2',
    licenseOutput: 'OFL-Unbounded.txt',
    script: 'latin',
    axes: { wght: 900 },
  },
  {
    source: 'ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    license: 'ofl/notosanssc/OFL.txt',
    output: 'noto-sans-sc-subset.woff2',
    licenseOutput: 'OFL-NotoSansSC.txt',
    script: 'chinese',
    axes: { wght: 400 },
  },
  {
    source: 'ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    license: 'ofl/notosanssc/OFL.txt',
    output: 'noto-sans-sc-black-subset.woff2',
    licenseOutput: 'OFL-NotoSansSC.txt',
    script: 'chinese',
    axes: { wght: 900 },
  },
] as const;
```

Both upstream paths exist at the pinned commit `9862abc066c9b83bf84c3e8ed1fc2d8d48f9bbf0` (checked: HTTP 200).

- [ ] **Step 4: Regenerate fonts and delete the old ones**

```bash
pnpm fonts:subset
git rm public/fonts/fraunces-latin.woff2 public/fonts/OFL-Fraunces.txt public/fonts/noto-serif-sc-subset.woff2 public/fonts/OFL-NotoSerifSC.txt
```

Expected output: three lines `<file>: <bytes> bytes`, all under 400000, then `<n> Chinese characters`.

- [ ] **Step 5: Update the font faces in `BaseLayout.astro`**

Replace the `fonts` array with:

```ts
const fonts: FontFace[] = [
  {
    family: 'Source Sans 3',
    file: 'source-sans-3-latin.woff2',
    weight: '200 900',
  },
  { family: 'Unbounded', file: 'unbounded-latin.woff2', weight: '900' },
  {
    family: 'Noto Sans SC',
    file: 'noto-sans-sc-subset.woff2',
    weight: '400',
    chinese: true,
  },
  {
    family: 'Noto Sans SC',
    file: 'noto-sans-sc-black-subset.woff2',
    weight: '900',
    chinese: true,
  },
];
```

- [ ] **Step 6: Update the integration preload expectations**

In `tests/integration/landing-build.test.ts`, test "preloads Latin fonts everywhere and Chinese subsets only on the Chinese page": set `latin` to `['/one23balloon/fonts/source-sans-3-latin.woff2', '/one23balloon/fonts/unbounded-latin.woff2']` and the Chinese additions to `['/one23balloon/fonts/noto-sans-sc-subset.woff2', '/one23balloon/fonts/noto-sans-sc-black-subset.woff2']`.

- [ ] **Step 7: Run the unit test**

Run: `pnpm vitest run tests/unit/fonts.test.ts`
Expected: PASS.

- [ ] **Step 8: Amend ADR 0006**

Append to `docs/decisions/0006-font-subsetting.md`:

```markdown
## Amendment, 2026-10-30

The showcase redesign replaces Fraunces and Noto Serif SC with Unbounded (OFL, weight 900, subset to the same Latin set) and adds Noto Sans SC at weight 900 for Chinese display, subset from the same `zh` sources as the 400 weight. The pipeline shape is unchanged: one pinned google/fonts commit, `subset-font`, licence files copied next to the output. Alimama FangYuanTi was considered as a rounder Chinese match for Unbounded and rejected because its licence is not OFL.
```

Then `grep -rn "Fraunces\|Noto Serif" README.md docs src --include=*.md --include=*.ts --include=*.astro --include=*.css` and update every remaining mention outside `docs/superpowers/` and the ADR history (for example the README font notes) to the new fonts.

- [ ] **Step 9: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`
Expected: all pass.

```bash
git add -A scripts/subset-fonts.ts src/layouts/BaseLayout.astro tests/unit/fonts.test.ts tests/integration/landing-build.test.ts public/fonts src/lib/fonts/zh-charset.txt docs/decisions/0006-font-subsetting.md README.md
git commit -m "feat(fonts): self-host Unbounded and Noto Sans SC Black

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Collect colourful celebration photos

This task needs the built-in browser (`mcp__Claude_Browser__*`), where the user is already logged in to Instagram. It is not code; its deliverable is image files plus their source rows.

**Files:**
- Create: `src/assets/work/gallery-13.jpg` onwards (25 to 35 files, numbered without gaps)
- Modify: `docs/photo-sources.md` (one row per new file)

**Interfaces:**
- Produces: the list of celebration photo files and, for each, its Instagram post URL, a descriptive alt text and an occasion label, as rows in `docs/photo-sources.md`. Task 4 copies them into the YAML.

- [ ] **Step 1: Review what is already used and rejected**

Read `docs/photo-sources.md`. Every post URL in its table and every post named in a "Replaces ..." note is out of scope: do not pick them again.

- [ ] **Step 2: Browse and shortlist**

Open `https://www.instagram.com/one23balloon/` in the built-in browser. Scroll the grid back through at least 2025 and 2026. Shortlist 40 or more candidates that are strongly colourful (saturated balloons, flowers, bold backdrops) and varied in occasion: weddings, proposals, grand openings, corporate events, birthdays, 100-day and full-month celebrations, gender reveals, car handovers, bouquets. Prefer square or landscape frames where a post offers them (carousel photos are often 4:5 or 1:1). Apply the selection rules in Global Constraints to each candidate and drop any that fail. Note why for each drop.

- [ ] **Step 3: Download each kept photo at full resolution**

For each kept post, open it, then read the largest image URL with `mcp__Claude_Browser__javascript_tool`:

```js
[...document.querySelectorAll('article img[srcset], main img[srcset]')]
  .map((img) => img.srcset.split(',').map((s) => s.trim().split(' ')))
  .flat()
  .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))[0]?.[0]
```

For Reels, use the cover frame: take the `og:image` meta content only if no larger `srcset` candidate exists, and drop the post if the cover is under 1000px wide. Download into the scratchpad, never straight into the repository:

```bash
curl -sL "<image url>" -o "<scratchpad>/photos/raw-<post id>.jpg"
```

- [ ] **Step 4: Inspect every download**

Open each file with the Read tool. Reject it if it shows a customer's face as the main subject, a brand or logo, a licensed character, editing text overlays, or blur. Keep 25 to 35. If fewer than 25 qualify, keep what qualifies and report the count to the controller; the grid works from 30 photos in total (existing 14 plus new).

- [ ] **Step 5: Normalise into the repository**

For each kept file, in order, run (n continues from 13):

```bash
node --input-type=module -e "import sharp from 'sharp'; const [src, dest] = process.argv.slice(1); const meta = await sharp(src).metadata(); const image = sharp(src).rotate(); if (meta.width > 1440) image.resize({ width: 1440 }); await image.jpeg({ quality: 86, mozjpeg: true }).toFile(dest);" "<scratchpad>/photos/raw-<post id>.jpg" "src/assets/work/gallery-<nn>.jpg"
```

- [ ] **Step 6: Record every file**

Add one row per new file to the table in `docs/photo-sources.md`, in the existing format: file, post URL, subject, faces (`none` or `incidental`), notes (original size, any downscale, printed names, anything the client must approve). Add a final column note "Occasion: <label>" in Notes, using one of these labels, which Task 4 reuses exactly:

| en | zh |
| --- | --- |
| Wedding | 婚礼 |
| Proposal | 求婚 |
| Grand opening | 开业典礼 |
| Corporate event | 企业活动 |
| Birthday | 生日派对 |
| 18th birthday | 18岁生日 |
| 21st birthday | 21岁生日 |
| 22nd birthday | 22岁生日 |
| 90th birthday | 90岁寿宴 |
| Children's birthday | 儿童生日派对 |
| First birthday | 周岁生日 |
| 100-day celebration | 百日宴 |
| Full-month celebration | 满月宴 |
| Baby shower | 迎婴派对 |
| Gender reveal | 性别揭晓派对 |
| Car handover | 新车交车 |
| Balloon bouquet | 气球花束 |
| Anniversary | 周年纪念 |

If a photo needs a label not in this table, add the pair to the table in `docs/photo-sources.md` under a new heading "Occasion labels" and use it consistently.

- [ ] **Step 7: Commit**

```bash
git add src/assets/work/gallery-*.jpg docs/photo-sources.md
git commit -m "feat(photos): add colourful celebration photos from the client's Instagram

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Showcase content model and static chapters

**Files:**
- Rewrite: `src/lib/landing/schema.ts`, `src/lib/landing/parity.ts`
- Rewrite: `src/content/landing/en.yaml`, `src/content/landing/zh.yaml`
- Rewrite: `tests/unit/landing-schema.test.ts`
- Create: `src/components/landing/HeroChapter.astro`, `StatementChapter.astro`, `ServicesChapter.astro`, `SignatureChapter.astro`, `CelebrationsChapter.astro`, `ClosingChapter.astro`
- Rewrite: `src/components/landing/LandingView.astro`, `src/components/landing/LandingFooter.astro`
- Modify: `src/components/landing/WhatsAppLink.astro`, `src/components/PageView.astro`, `src/components/SiteHeader.astro`
- Delete: `src/components/landing/{ArchPhoto,FaqSection,GallerySection,HeroSection,PalettePicker,PaletteStyles,SculpturesSection,ServicesSection,StepsSection,VenuesSection,ClosingSection}.astro`
- Modify: `tests/integration/landing-build.test.ts`

**Interfaces:**
- Consumes: `blockIds`, `BlockId` (Task 1); photo files and occasion labels (Task 3).
- Produces: `createLandingSchema(image)`, `serviceIds`, `pieceIds`, `parityProblems(reference, other)`, `LandingData` (unchanged export from `content.ts`). Markup hooks used by later tasks:
  - `[data-landing]` root with `data-formation="hero"`.
  - `section[data-chapter="hero|statement|services|signature|celebrations|closing"]`.
  - `[data-hero-line]` (one per headline line), `.hero-lede`.
  - `[data-statement]` paragraph, `.statement-pill` images.
  - `[data-service-card]` with `data-block="<BlockId>"`, `.service-copy`, `.service-dim`.
  - `[data-marquee]` containing two `.marquee-run`, `[data-piece]` figures.
  - `[data-celebrations-plane]`, `[data-celebrations-column]` (four lists).
  - `[data-closing-flood]`, `.closing-actions`.
  - `[data-wordmark]` in the footer.

- [ ] **Step 1: Write the failing schema test**

Replace `tests/unit/landing-schema.test.ts` with:

```ts
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { parityProblems } from '../../src/lib/landing/parity.ts';
import {
  createLandingSchema,
  pieceIds,
  serviceIds,
} from '../../src/lib/landing/schema.ts';
import { blockIds } from '../../src/lib/landing/blocks.ts';

const image = (() => z.string()) as unknown as SchemaContext['image'];
const schema = createLandingSchema(image);
const post = (n: number) => `https://www.instagram.com/p/POST${n}/`;
const photo = (n: number) => ({
  image: `photo-${n}.jpg`,
  alt: 'A balloon arch',
  source: post(n),
});

function valid() {
  return {
    whatsapp: '60109017633',
    meta: {
      instagramLabel: 'Instagram',
      xiaohongshuLabel: 'Xiaohongshu',
      registration: 'SSM CT0152510-K',
      rights: 'All rights reserved.',
    },
    header: { whatsapp: 'WhatsApp' },
    hero: { title: ['Every party,', 'bigger.'], lede: 'Balloon setups.' },
    statement: {
      parts: [
        { text: 'We style' },
        { word: 'weddings,', photo: photo(1) },
        { word: 'openings,', photo: photo(2) },
        { word: 'birthdays', photo: photo(3) },
        { text: 'and' },
        { word: '100-day parties', photo: photo(4) },
        { text: 'across KL.' },
      ],
    },
    services: {
      title: 'What we do',
      items: serviceIds.map((id, index) => ({
        id,
        colour: blockIds[index],
        title: `Service ${id}`,
        body: 'Body',
        linkLabel: 'Ask on WhatsApp',
        message: 'Hi',
        photo: photo(10 + index),
      })),
    },
    signature: {
      marquee: ['Arches', 'Garlands', 'Columns', 'Sculptures', 'Bouquets'],
      pieces: pieceIds.map((id, index) => ({
        id,
        caption: 'Caption',
        photo: photo(20 + index),
      })),
    },
    celebrations: {
      title: 'Recent celebrations',
      items: Array.from({ length: 30 }, (_, index) => ({
        id: `c${String(index + 1).padStart(2, '0')}`,
        occasion: 'Birthday',
        photo: photo(100 + index),
      })),
    },
    closing: {
      title: "Let's make yours.",
      whatsapp: 'WhatsApp us',
      message: 'Hi',
    },
  };
}

describe('landing schema', () => {
  it('accepts complete showcase content', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });

  it.each(['intro', 'palettes', 'venues', 'steps', 'faq', 'gallery'])(
    'rejects the removed %s section',
    (key) => {
      expect(schema.safeParse({ ...valid(), [key]: {} }).success).toBe(false);
    },
  );

  it('requires a two-line hero title', () => {
    const data = valid();
    data.hero.title = ['Only one line'] as unknown as [string, string];
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('caps the header pill label at 12 characters', () => {
    const data = valid();
    data.header.whatsapp = 'Message us on WhatsApp';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('requires exactly four photo pills in the statement', () => {
    const data = valid();
    data.statement.parts.splice(1, 1);
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('gives every service a different block colour', () => {
    const data = valid();
    data.services.items[1]!.colour = data.services.items[0]!.colour;
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('rejects unknown block colours', () => {
    const data = valid() as unknown as {
      services: { items: Array<{ colour: string }> };
    };
    data.services.items[0]!.colour = 'neon';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('keeps between 30 and 50 celebrations with unique ids', () => {
    const short = valid();
    short.celebrations.items.pop();
    expect(schema.safeParse(short).success).toBe(false);
    const duplicate = valid();
    duplicate.celebrations.items[1]!.id = 'c01';
    expect(schema.safeParse(duplicate).success).toBe(false);
  });

  it('rejects em and en dashes in visible text', () => {
    const data = valid();
    data.hero.lede = 'Balloons — for you';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('only accepts Instagram post URLs as photo sources', () => {
    const data = valid();
    data.celebrations.items[0]!.photo.source = 'https://example.com/a.jpg';
    expect(schema.safeParse(data).success).toBe(false);
  });
});

describe('landing parity', () => {
  it('accepts translated words with the same structure', () => {
    const zh = valid();
    zh.hero.title = ['每一场派对，', '更盛大。'];
    zh.statement.parts[0] = { text: '我们为' };
    zh.celebrations.items[0]!.occasion = '生日派对';
    expect(parityProblems(valid(), zh)).toEqual([]);
  });

  it.each([
    [
      'celebrations',
      (data: ReturnType<typeof valid>) =>
        (data.celebrations.items[3]!.photo = photo(999)),
    ],
    [
      'services',
      (data: ReturnType<typeof valid>) =>
        (data.services.items[0]!.colour = 'lilac'),
    ],
    [
      'statement',
      (data: ReturnType<typeof valid>) =>
        (data.statement.parts[1] = { word: 'x', photo: photo(77) }),
    ],
    [
      'signature',
      (data: ReturnType<typeof valid>) => data.signature.marquee.pop(),
    ],
    [
      'whatsapp',
      (data: ReturnType<typeof valid>) => (data.whatsapp = '60123456789'),
    ],
  ])('reports drift in %s', (key, mutate) => {
    const other = valid();
    mutate(other);
    expect(parityProblems(valid(), other)).toContain(key);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/landing-schema.test.ts`
Expected: FAIL, `pieceIds` is not exported and the old schema rejects the new shape.

- [ ] **Step 3: Rewrite `src/lib/landing/schema.ts`**

```ts
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { blockIds } from './blocks.ts';

export const serviceIds = [
  'weddings',
  'openings',
  'birthdays',
  'baby',
  'cars',
  'bouquets',
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const pieceIds = ['lion-dance', 'rose'] as const;

// Visible copy never uses em or en dashes (see design-direction.md).
const text = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/[–—]/.test(value), 'Use a hyphen, not a dash.');
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
  const part = z.union([
    z.strictObject({ text }),
    z.strictObject({ word: text, photo }),
  ]);
  return z.strictObject({
    whatsapp: z
      .string()
      .regex(/^\d{10,15}$/, 'Digits only, country code first.'),
    meta: z.strictObject({
      instagramLabel: text,
      xiaohongshuLabel: text,
      registration: text,
      rights: text,
    }),
    header: z.strictObject({ whatsapp: text.pipe(z.string().max(12)) }),
    hero: z.strictObject({
      title: z.tuple([text, text]),
      lede: text.refine(
        (value) => value.split(/\s+/).length <= 20,
        'Keep the hero lede to 20 words.',
      ),
    }),
    statement: z.strictObject({
      parts: z
        .array(part)
        .min(5)
        .superRefine((parts, context) => {
          if (parts.filter((item) => 'photo' in item).length !== 4)
            context.addIssue({
              code: 'custom',
              message: 'The statement needs exactly four photo pills.',
            });
        }),
    }),
    services: z.strictObject({
      title: text,
      items: z
        .array(
          z.strictObject({
            id: z.enum(serviceIds),
            colour: z.enum(blockIds),
            title: text,
            body: text,
            linkLabel: text,
            message: text,
            photo,
          }),
        )
        .length(serviceIds.length)
        .superRefine(unique((item) => item.id, 'Service ids'))
        .superRefine(unique((item) => item.colour, 'Service colours')),
    }),
    signature: z.strictObject({
      marquee: z.array(text).length(5),
      pieces: z
        .array(
          z.strictObject({ id: z.enum(pieceIds), caption: text, photo }),
        )
        .length(pieceIds.length)
        .superRefine(unique((item) => item.id, 'Piece ids')),
    }),
    celebrations: z.strictObject({
      title: text,
      items: z
        .array(
          z.strictObject({
            id: z.string().regex(/^c\d{2}$/),
            occasion: text,
            photo,
          }),
        )
        .min(30)
        .max(50)
        .superRefine(unique((item) => item.id, 'Celebration ids'))
        .superRefine(
          unique((item) => item.photo.source, 'Celebration sources'),
        ),
    }),
    closing: z.strictObject({
      title: text,
      whatsapp: text,
      message: text,
    }),
  });
}
```

If `text.pipe(z.string().max(12))` does not type-check with the zod version behind `astro/zod`, use `text.refine((value) => value.length <= 12, 'Keep the header label to 12 characters.')` instead.

- [ ] **Step 4: Rewrite `src/lib/landing/parity.ts`**

```ts
type Photo = { source: string; image: unknown };

// Strings in unit tests; Astro's processed ImageMetadata (with src) at runtime.
function imageKey(image: unknown): string {
  if (typeof image === 'string') return image;
  const src = (image as { src?: unknown } | null | undefined)?.src;
  return typeof src === 'string' ? src : String(image);
}

const photoKey = (photo: Photo) => [photo.source, imageKey(photo.image)];

export type ParityInput = {
  whatsapp: string;
  statement: { parts: Array<{ text: string } | { word: string; photo: Photo }> };
  services: { items: Array<{ id: string; colour: string; photo: Photo }> };
  signature: {
    marquee: string[];
    pieces: Array<{ id: string; photo: Photo }>;
  };
  celebrations: { items: Array<{ id: string; photo: Photo }> };
};

// Translations may change words, never structure, photos or the contact number.
function fingerprint(data: ParityInput): Record<string, string> {
  return {
    whatsapp: data.whatsapp,
    statement: JSON.stringify(
      data.statement.parts.flatMap((part) =>
        'photo' in part ? [photoKey(part.photo)] : [],
      ),
    ),
    services: JSON.stringify(
      data.services.items.map((item) => [
        item.id,
        item.colour,
        ...photoKey(item.photo),
      ]),
    ),
    signature: JSON.stringify([
      data.signature.marquee.length,
      data.signature.pieces.map((piece) => [piece.id, ...photoKey(piece.photo)]),
    ]),
    celebrations: JSON.stringify(
      data.celebrations.items.map((item) => [item.id, ...photoKey(item.photo)]),
    ),
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

- [ ] **Step 5: Run the schema test**

Run: `pnpm vitest run tests/unit/landing-schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Rewrite `src/content/landing/en.yaml`**

Use this exact content for every key except `celebrations.items`, and copy each service's `title`, `body`, `message` and `photo` (image, alt, source) verbatim from the current `services.items[n]` of the same id. Photo paths are relative to the YAML file (`../../assets/work/...`).

```yaml
whatsapp: '60109017633'
meta:
  instagramLabel: Instagram
  xiaohongshuLabel: Xiaohongshu
  registration: SSM CT0152510-K
  rights: All rights reserved.
header:
  whatsapp: WhatsApp
hero:
  title:
    - Every party,
    - bigger.
  lede: Balloon installations for weddings, openings, birthdays and baby celebrations across Kuala Lumpur and Selangor.
statement:
  parts:
    - text: We style
    - word: weddings,
      photo: <copy services weddings photo>
    - word: grand openings,
      photo: <copy services openings photo>
    - word: birthdays
      photo: <copy services birthdays photo>
    - text: and
    - word: 100-day parties
      photo: <copy the current gallery item whose image is gallery-10.jpg (image, alt, source)>
    - text: across KL and Selangor.
services:
  title: What we do
  items:
    - id: weddings
      colour: pink
      linkLabel: Ask about weddings
    - id: openings
      colour: cobalt
      linkLabel: Ask about openings
    - id: birthdays
      colour: sunflower
      linkLabel: Ask about birthdays
    - id: baby
      colour: emerald
      linkLabel: Ask about baby parties
    - id: cars
      colour: tangerine
      linkLabel: Ask about car reveals
    - id: bouquets
      colour: lilac
      linkLabel: Ask about bouquets
signature:
  marquee:
    - Arches
    - Garlands
    - Columns
    - Sculptures
    - Bouquets
  pieces:
    - id: lion-dance
      caption: A lion dance head, sculpted in balloons
      photo: <copy current sculptures.photos[0] image, alt, source>
    - id: rose
      caption: A single hand-twisted rose
      photo: <copy current sculptures.photos[1] image, alt, source>
celebrations:
  title: Recent celebrations
  items: <see below>
closing:
  title: Let's make yours.
  whatsapp: WhatsApp us
  message: Hi one23balloon, I'd like to plan a balloon setup.
```

The `<copy ...>` markers name existing YAML blocks to paste in place; none may remain in the file. `celebrations.items` lists, in this order: the twelve current gallery photos (`gallery-01.jpg` to `gallery-12.jpg`), then `closing.jpg`, then `hero-arch.jpg`, then every Task 3 photo in file order. Ids run `c01`, `c02`, ... without gaps. Each item:

```yaml
    - id: c01
      occasion: 21st birthday
      photo:
        image: ../../assets/work/gallery-01.jpg
        alt: <current gallery alt for this file, or the Task 3 subject rewritten as one sentence>
        source: <post URL from docs/photo-sources.md>
```

The `occasion` is the en label from the Task 3 table. For existing photos use: gallery-01 21st birthday, gallery-02 21st birthday, gallery-03 90th birthday, gallery-04 22nd birthday, gallery-05 100-day celebration, gallery-06 Birthday, gallery-07 Birthday, gallery-08 Birthday, gallery-09 Birthday, gallery-10 100-day celebration, gallery-11 21st birthday, gallery-12 Children's birthday, closing 18th birthday, hero-arch Birthday. Alt text for `closing.jpg` and `hero-arch.jpg` comes from the current `closing.photo.alt` and `hero.photo.alt`.

- [ ] **Step 7: Rewrite `src/content/landing/zh.yaml`**

Same structure, same ids, colours, photos and order. Copy each service's `title`, `body`, `message` and photo alt from the current `zh.yaml` service of the same id, and each celebration's alt from the current zh gallery alt where one exists (write a Chinese alt for new photos). Text values:

```yaml
whatsapp: '60109017633'
meta:
  instagramLabel: Instagram
  xiaohongshuLabel: 小红书
  registration: SSM CT0152510-K
  rights: 版权所有。
header:
  whatsapp: WhatsApp
hero:
  title:
    - 每一场派对，
    - 更盛大。
  lede: 为婚礼、开业、生日与宝宝庆典打造气球布置，服务吉隆坡与雪兰莪。
statement:
  parts:
    - text: 我们为
    - word: 婚礼、
    - word: 开业典礼、
    - word: 生日派对
    - text: 与
    - word: 百日宴
    - text: 布置气球，遍及吉隆坡与雪兰莪。
services:
  title: 我们的服务
  items: (linkLabel per id) weddings 咨询婚礼布置 / openings 咨询开业布置 / birthdays 咨询生日布置 / baby 咨询宝宝庆典 / cars 咨询新车交车 / bouquets 咨询气球花束
signature:
  marquee:
    - 拱门
    - 花环
    - 气球柱
    - 造型雕塑
    - 气球花束
  pieces:
    - id: lion-dance
      caption: 用气球扭出的舞狮头
    - id: rose
      caption: 一枝手工扭制的玫瑰
celebrations:
  title: 近期作品
closing:
  title: 让我们为你布置。
  whatsapp: WhatsApp 联系我们
  message: 你好 one23balloon，我想咨询气球布置。
```

Each zh statement `word` part carries the same photo as the en part at the same position. Each zh celebration `occasion` is the zh label from the Task 3 table.

- [ ] **Step 8: Write the chapter components**

`src/components/landing/HeroChapter.astro`:

```astro
---
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section class="chapter hero" data-chapter="hero" aria-labelledby="hero-title">
  <h1 id="hero-title" class="hero-title">
    <span class="hero-line" data-hero-line>{data.hero.title[0]}</span>{' '}
    <span class="hero-line" data-hero-line>{data.hero.title[1]}</span>
  </h1>
  <p class="hero-lede">{data.hero.lede}</p>
</section>
```

`src/components/landing/StatementChapter.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
  contentLocale: string;
}
const { data, contentLocale } = Astro.props;
// Chinese runs on without spaces between words.
const joiner = contentLocale.toLowerCase().startsWith('zh') ? '' : ' ';
const parts = data.statement.parts;
---

<section class="chapter statement" data-chapter="statement">
  <p class="statement-text" data-statement>
    {
      parts.map((part, index) => (
        <>
          {'photo' in part ? (
            <span class="statement-word">
              <Image
                class="statement-pill"
                src={part.photo.image}
                alt=""
                width={240}
                height={136}
                fit="cover"
                loading="lazy"
              />
              {part.word}
            </span>
          ) : (
            <span>{part.text}</span>
          )}
          {index < parts.length - 1 && joiner}
        </>
      ))
    }
  </p>
</section>
```

If `fit="cover"` is not accepted by this Astro version's `<Image>`, drop it; CSS `object-fit: cover` crops the pill.

`src/components/landing/ServicesChapter.astro`:

```astro
---
import { Image } from 'astro:assets';
import WhatsAppLink from './WhatsAppLink.astro';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
---

<section
  class="chapter services"
  data-chapter="services"
  aria-labelledby="services-title"
>
  <h2 id="services-title" class="chapter-title services-title">
    {data.services.title}
  </h2>
  <ol class="service-stack">
    {
      data.services.items.map((service) => (
        <li
          class="service-card"
          data-service-card
          data-block={service.colour}
          style={`--block: var(--block-${service.colour}); --block-text: var(--block-${service.colour}-text);`}
        >
          <div class="service-copy">
            <h3>{service.title}</h3>
            <p>{service.body}</p>
            <WhatsAppLink
              number={data.whatsapp}
              message={service.message}
              label={service.linkLabel}
            />
          </div>
          <Image
            class="service-photo"
            src={service.photo.image}
            alt={service.photo.alt}
            widths={[480, 800, 1200]}
            sizes="(min-width: 48rem) 45vw, 92vw"
            loading="lazy"
          />
          <span class="service-dim" aria-hidden="true" />
        </li>
      ))
    }
  </ol>
</section>
```

`src/components/landing/SignatureChapter.astro`:

```astro
---
import { Image } from 'astro:assets';
import { blockIds } from '../../lib/landing/blocks.ts';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
const words = data.signature.marquee;
---

<section
  class="chapter signature"
  data-chapter="signature"
  aria-labelledby="signature-title"
>
  <h2 id="signature-title" class="visually-hidden">{words.join(', ')}</h2>
  <div class="signature-marquee" data-marquee aria-hidden="true">
    {
      [0, 1].map(() => (
        <p class="marquee-run">
          {words.map((word, index) => (
            <>
              <span>{word}</span>
              <span
                class="marquee-sep"
                style={`--sep: var(--block-${blockIds[index % blockIds.length]})`}
              />
            </>
          ))}
        </p>
      ))
    }
  </div>
  <ul class="signature-pieces">
    {
      data.signature.pieces.map((piece) => (
        <li>
          <figure data-piece>
            <Image
              src={piece.photo.image}
              alt={piece.photo.alt}
              widths={[480, 800, 1100]}
              sizes="(min-width: 48rem) 40vw, 92vw"
              loading="lazy"
            />
            <figcaption>{piece.caption}</figcaption>
          </figure>
        </li>
      ))
    }
  </ul>
</section>
```

`src/components/landing/CelebrationsChapter.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
// Four column lists so each column can scroll at its own speed on wide screens.
const columns = [0, 1, 2, 3].map((column) =>
  data.celebrations.items.filter((_, index) => index % 4 === column),
);
---

<section
  class="chapter celebrations"
  data-chapter="celebrations"
  aria-labelledby="celebrations-title"
>
  <div class="celebrations-plane" data-celebrations-plane>
    <h2 id="celebrations-title" class="chapter-title">
      {data.celebrations.title}
    </h2>
    <div class="celebrations-grid">
      {
        columns.map((items) => (
          <ul class="celebrations-column" data-celebrations-column>
            {items.map((item) => (
              <li>
                <figure>
                  <Image
                    src={item.photo.image}
                    alt={item.photo.alt}
                    widths={[360, 720, 1080]}
                    sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 45vw, 92vw"
                    loading="lazy"
                  />
                  <figcaption>{item.occasion}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ))
      }
    </div>
  </div>
</section>
```

`src/components/landing/ClosingChapter.astro`:

```astro
---
import WhatsAppLink from './WhatsAppLink.astro';
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

<section
  class="chapter closing"
  data-chapter="closing"
  aria-labelledby="closing-title"
>
  <div class="closing-flood" data-closing-flood>
    <h2 id="closing-title" class="chapter-title">{data.closing.title}</h2>
    <div class="closing-actions">
      <WhatsAppLink
        number={data.whatsapp}
        message={data.closing.message}
        label={data.closing.whatsapp}
        variant="primary"
      />
      {
        links.map((link) => (
          <a class="button-outline" href={link.href} rel="noopener">
            {link.label}
          </a>
        ))
      }
    </div>
  </div>
</section>
```

- [ ] **Step 9: Rewrite `LandingView.astro` and `LandingFooter.astro`**

`src/components/landing/LandingView.astro`:

```astro
---
import CelebrationsChapter from './CelebrationsChapter.astro';
import ClosingChapter from './ClosingChapter.astro';
import HeroChapter from './HeroChapter.astro';
import ServicesChapter from './ServicesChapter.astro';
import SignatureChapter from './SignatureChapter.astro';
import StatementChapter from './StatementChapter.astro';
import { localeDirection } from '../../lib/i18n/ui.ts';
import type { LandingData } from '../../lib/landing/content.ts';
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
  data-formation="hero"
  data-whatsapp-number={data.whatsapp}
  lang={contentLocale}
  dir={localeDirection(contentLocale)}
>
  <HeroChapter data={data} />
  <StatementChapter data={data} contentLocale={contentLocale} />
  <ServicesChapter data={data} />
  <SignatureChapter data={data} />
  <CelebrationsChapter data={data} />
  <ClosingChapter data={data} />
</div>

<script>
  import { installLandingLifecycle } from '../../scripts/landing.ts';

  installLandingLifecycle(document);
</script>
```

`src/components/landing/LandingFooter.astro`:

```astro
---
import { getSiteConfig } from '../../lib/config/site.ts';
import type { LandingData } from '../../lib/landing/content.ts';
interface Props {
  data: LandingData;
}
const { data } = Astro.props;
const site = getSiteConfig();
---

<div class="landing-footer">
  <p class="wordmark" data-wordmark aria-hidden="true">ONE23BALLOON</p>
  <div class="landing-footer-meta">
    <p>{data.meta.registration}</p>
    <p>© {new Date().getFullYear()} {site.name}. {data.meta.rights}</p>
  </div>
</div>
```

- [ ] **Step 10: Update `WhatsAppLink`, `PageView` and `SiteHeader`**

In `WhatsAppLink.astro`, remove the `paletteLink` prop and the `data-palette-link` attribute.

In `PageView.astro`: delete the `PaletteStyles` import and the `{landing && <PaletteStyles slot="head" />}` line, and change `headerCta` to:

```ts
const headerCta = landing && {
  href: whatsappUrl(landing.data.whatsapp, landing.data.closing.message),
  label: landing.data.header.whatsapp,
};
```

In `SiteHeader.astro`, remove `data-palette-link` from the CTA anchor.

- [ ] **Step 11: Delete the old section components**

```bash
git rm src/components/landing/ArchPhoto.astro src/components/landing/FaqSection.astro src/components/landing/GallerySection.astro src/components/landing/HeroSection.astro src/components/landing/PalettePicker.astro src/components/landing/PaletteStyles.astro src/components/landing/SculpturesSection.astro src/components/landing/ServicesSection.astro src/components/landing/StepsSection.astro src/components/landing/VenuesSection.astro src/components/landing/ClosingSection.astro
```

`src/scripts/landing.ts`, the palette picker script, the intro script and the old scenes stay until Task 12. With no `[data-island]`, `[data-intro]` or picker in the markup, they do nothing.

- [ ] **Step 12: Update the integration tests**

In `tests/integration/landing-build.test.ts`:

1. In "validates the Chinese landing content through the real collection loader", mutate `'colour: cobalt'` to `'colour: neon'` and expect the output to contain `'colour'`.
2. Delete "gives each band a fixed palette and lets only hero and closing follow the picker".
3. Replace "renders every landing section in static HTML" with:

```ts
  it('renders every chapter and photo in static HTML, without removed sections', async () => {
    for (const path of ['index.html', 'zh/index.html']) {
      const document = await page(path);
      expect(
        [...document.querySelectorAll('[data-chapter]')].map(
          (section) => (section as HTMLElement).dataset.chapter,
        ),
        path,
      ).toEqual([
        'hero',
        'statement',
        'services',
        'signature',
        'celebrations',
        'closing',
      ]);
      expect(document.querySelectorAll('[data-hero-line]')).toHaveLength(2);
      expect(document.querySelectorAll('.statement-pill')).toHaveLength(4);
      expect(document.querySelectorAll('[data-service-card]')).toHaveLength(6);
      expect(document.querySelectorAll('[data-celebrations-column]')).toHaveLength(4);
      const celebrations = document.querySelectorAll(
        '[data-celebrations-column] img',
      ).length;
      expect(celebrations).toBeGreaterThanOrEqual(30);
      expect(celebrations).toBeLessThanOrEqual(50);
      for (const image of document.querySelectorAll('.landing img'))
        expect(image.hasAttribute('alt'), path).toBe(true);
      for (const removed of [
        '[data-palette]',
        '[data-intro]',
        '.faq',
        '.venues',
        '.steps',
        '[data-gallery]',
      ])
        expect(document.querySelector(removed), `${path} ${removed}`).toBeNull();
      expect(document.body.textContent).not.toMatch(/[–—]/);
    }
  });
```

4. In "links every call to action to WhatsApp with the localized message", change `toHaveLength(9)` to `toHaveLength(8)` (header, six services, closing), and remove the `.landing-footer` 小红书 assertion; instead assert `zh.querySelector('.closing-actions')?.textContent` contains `'小红书'`.

- [ ] **Step 13: Regenerate Chinese subsets and run the gates**

```bash
pnpm fonts:subset
pnpm lint && pnpm check && pnpm test && pnpm build
```

Expected: all pass. The page is unstyled in places until Task 5.

- [ ] **Step 14: Commit**

```bash
git add -A src/lib/landing src/content/landing src/components tests public/fonts src/lib/fonts/zh-charset.txt
git commit -m "feat(landing): replace the landing content model with the six showcase chapters

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Static chapter styles, header and footer

**Files:**
- Rewrite: `src/styles/landing.css`
- Create: `.claude/launch.json`

**Interfaces:**
- Consumes: tokens (Task 1), markup hooks (Task 4).
- Produces: the static (no-JS, reduced-motion) look of every chapter; header class `is-over-hero` (transparent background), which Task 10 toggles; stage layer classes `.stage`, `.stage-canvas`, `.stage-back`, `.stage-front`, used by Task 12.

- [ ] **Step 1: Create the dev server entry**

`.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "port": 4321
    }
  ]
}
```

An `astro dev` from an earlier session may still hold port 4321 (PID 41768). Check with `Get-NetTCPConnection -LocalPort 4321` in PowerShell. If it belongs to this repository, reuse it by opening `http://localhost:4321/one23balloon/` with `mcp__Claude_Browser__preview_start` and `url`; otherwise start `dev`.

- [ ] **Step 2: Rewrite `src/styles/landing.css`**

```css
/* Colour block landing (see design-direction.md). One theme; colours come from tokens.css. */

/* Page chrome on the landing page */
.site-main:has(> .landing) {
  min-block-size: 0;
}
.site-header {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: var(--header-layer);
  background: var(--color-page);
  transition: background-color 0.35s var(--ease-out);
}
.site-header.is-over-hero {
  background: transparent;
}
.site-header .site-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.site-header .header-cta {
  border-radius: 999px;
  background: var(--color-text);
  color: var(--color-on-ink);
  padding: 0.5rem 1.05rem;
  font-weight: 700;
  white-space: nowrap;
  text-decoration: none;
}
.site-footer:has(.landing-footer) {
  background: var(--block-pink);
  color: var(--block-pink-text);
  overflow: clip;
}

/* Stage layers: back canvas behind content, front canvas above it. */
.stage-canvas {
  position: fixed;
  inset: 0;
  inline-size: 100vw;
  block-size: 100dvh;
  pointer-events: none;
}
.stage-back {
  z-index: var(--stage-back-layer);
}
.stage {
  position: fixed;
  inset: 0;
  z-index: var(--stage-layer);
  pointer-events: none;
}
.stage .stage-canvas {
  position: absolute;
}
#smooth-wrapper,
.landing {
  position: relative;
  z-index: var(--content-layer);
}

/* Shared chapter type */
.landing {
  overflow-x: clip;
}
.chapter {
  position: relative;
}
.chapter-title {
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  font-size: var(--font-size-display);
  line-height: var(--line-title);
  letter-spacing: var(--tracking-title);
  margin: 0;
}
.landing:lang(zh) .chapter-title,
.landing:lang(zh) .hero-title,
.landing:lang(zh) .statement-text {
  line-height: 1.12;
  letter-spacing: 0;
}

/* 1. Hero */
.hero {
  min-block-size: 100dvh;
  display: grid;
  align-content: end;
  gap: var(--space-md);
  padding: calc(var(--header-height) + var(--space-lg)) var(--gutter)
    var(--space-2xl);
  isolation: isolate;
}
.hero-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--font-size-hero);
  line-height: 0.92;
  letter-spacing: -0.03em;
  margin: 0;
}
.hero-line {
  display: block;
  white-space: nowrap;
}
.hero-line + .hero-line {
  text-align: end;
}
.hero-lede {
  max-inline-size: 30rem;
  font-size: var(--font-size-lead);
  color: var(--color-muted);
  margin: 0;
}

/* 2. Statement */
.statement {
  min-block-size: 100dvh;
  display: grid;
  align-items: center;
  padding: var(--space-xl) var(--gutter);
}
.statement-text {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--font-size-display);
  line-height: 1.08;
  letter-spacing: -0.02em;
  max-inline-size: 18ch;
  margin: 0;
}
.statement-word {
  white-space: nowrap;
}
.statement-pill {
  display: inline-block;
  inline-size: 1.7em;
  block-size: 0.92em;
  margin-inline-end: 0.18em;
  border-radius: 999px;
  object-fit: cover;
  vertical-align: -0.06em;
}

/* 3. Services */
.services-title {
  padding: var(--space-xl) var(--gutter) var(--space-lg);
}
.service-stack {
  list-style: none;
  margin: 0;
  padding: 0;
}
.service-card {
  position: relative;
  min-block-size: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-lg);
  padding: calc(var(--header-height) + var(--space-lg)) var(--gutter)
    var(--space-lg);
  background: var(--block);
  color: var(--block-text);
  transform-origin: 50% 0;
}
.service-card[data-block='cobalt'] {
  --color-focus: #ffffff;
}
.service-copy h3 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--font-size-title);
  line-height: 0.98;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-md);
}
.service-copy p {
  font-size: var(--font-size-lead);
  max-inline-size: 28rem;
  margin: 0 0 var(--space-md);
}
.service-copy .whatsapp {
  color: inherit;
  font-weight: 700;
  text-underline-offset: 0.2em;
}
.service-photo {
  inline-size: 100%;
  block-size: min(72dvh, 46rem);
  object-fit: cover;
  border-radius: var(--radius-photo);
}
.service-dim {
  position: absolute;
  inset: 0;
  background: var(--color-text);
  opacity: 0;
  pointer-events: none;
}
@media (max-width: 47.99rem) {
  .service-card {
    grid-template-columns: minmax(0, 1fr);
    align-content: center;
  }
  .service-photo {
    block-size: 46dvh;
  }
}

/* 4. Signature */
.signature {
  padding-block: var(--space-xl);
  overflow: clip;
}
.signature-marquee {
  display: flex;
  inline-size: max-content;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4rem, 14vw, 16rem);
  line-height: 1;
  letter-spacing: -0.03em;
}
.marquee-run {
  display: flex;
  align-items: center;
  gap: 0.3em;
  padding-inline-end: 0.3em;
  margin: 0;
  white-space: nowrap;
}
.marquee-sep {
  inline-size: 0.32em;
  block-size: 0.38em;
  border-radius: 50%;
  background: var(--sep);
  flex: none;
}
.signature-pieces {
  list-style: none;
  margin: -6vw 0 0;
  padding: 0 var(--gutter);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-lg);
  position: relative;
}
.signature-pieces li:nth-child(2) {
  margin-block-start: var(--space-xl);
}
.signature-pieces img {
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: var(--radius-photo);
}
.signature-pieces figure,
.celebrations figure {
  margin: 0;
}
.signature-pieces figcaption,
.celebrations figcaption {
  margin-block-start: var(--space-xs);
  font-size: var(--font-size-small);
  color: var(--color-muted);
}
@media (max-width: 47.99rem) {
  .signature-pieces {
    grid-template-columns: minmax(0, 1fr);
    margin-block-start: var(--space-lg);
  }
  .signature-pieces li:nth-child(2) {
    margin-block-start: 0;
  }
}

/* 5. Celebrations */
.celebrations {
  padding: var(--space-xl) var(--gutter);
}
.celebrations-plane {
  transform-origin: 50% 0;
}
.celebrations .chapter-title {
  margin-block-end: var(--space-lg);
}
.celebrations-grid {
  column-gap: var(--space-md);
}
.celebrations-column {
  display: contents;
  list-style: none;
}
.celebrations-column li {
  break-inside: avoid;
  margin-block-end: var(--space-md);
}
.celebrations img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  border-radius: var(--radius-photo);
}
@media (min-width: 40rem) {
  .celebrations-grid {
    columns: 2;
  }
}
@media (min-width: 64rem) {
  .celebrations-grid {
    columns: auto;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-md);
    align-items: start;
  }
  .celebrations-column {
    display: grid;
    gap: var(--space-md);
    margin: 0;
    padding: 0;
  }
  .celebrations-column li {
    margin: 0;
  }
  .celebrations-column:nth-child(even) {
    margin-block-start: var(--space-2xl);
  }
}

/* 6. Closing and footer */
.closing-flood {
  min-block-size: 100dvh;
  display: grid;
  align-content: center;
  gap: var(--space-lg);
  padding: var(--space-xl) var(--gutter);
  background: var(--block-pink);
  color: var(--block-pink-text);
}
.closing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}
.whatsapp.primary,
.button-outline {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.9rem 1.6rem;
  font-weight: 700;
  font-size: var(--font-size-lead);
  text-decoration: none;
  white-space: nowrap;
}
.whatsapp.primary {
  background: var(--color-text);
  color: var(--color-on-ink);
}
.button-outline {
  border: 2px solid currentColor;
  color: inherit;
}
.whatsapp.primary:active,
.button-outline:active,
.header-cta:active {
  transform: translateY(1px);
}
.landing-footer .wordmark {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 8.5vw;
  line-height: 0.85;
  letter-spacing: -0.03em;
  white-space: nowrap;
  margin: 0;
}
.landing-footer-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-sm);
  font-size: var(--font-size-small);
}
```

Then read `src/components/SiteFooter.astro` and `src/styles/global.css` (`.site-footer`). If the footer's default text colour or link colour conflicts with the pink background (contrast below 4.5:1), override it in `landing.css` under `.site-footer:has(.landing-footer)`.

- [ ] **Step 3: Check the static page in the browser**

With JavaScript and motion still inactive (no motion code exists yet), open `http://localhost:4321/one23balloon/` and `/one23balloon/zh/` and use `mcp__Claude_Browser__resize_window` at 360x780, 768x1024, 1280x800 and 1440x900. At each size confirm, using `mcp__Claude_Browser__javascript_tool`, that nothing overflows horizontally:

```js
({ overflow: document.documentElement.scrollWidth - innerWidth, header: document.querySelector('.site-header').getBoundingClientRect().height, lines: [...document.querySelectorAll('.hero-line')].map((l) => l.scrollWidth - l.clientWidth), wordmark: document.querySelector('.wordmark').scrollWidth - innerWidth })
```

Expected: `overflow` is 0, `header` is at most 64 at every width, every `lines` value is at most 0, `wordmark` is at most 0. If a hero line overflows, lower the vw coefficient in `--font-size-hero` (in steps of 0.5vw) until it fits at 1440 and 360. Do the same for the wordmark `font-size`. Record the final values in `design-direction.md`. Take one screenshot per chapter at 1440 and 360 (en) for later evidence and keep them in the scratchpad.

- [ ] **Step 4: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/styles/landing.css .claude/launch.json design-direction.md
git commit -m "feat(landing): style the six chapters, header and wordmark footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Motion foundation: smooth scroll, chapter registry and formation triggers

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (smooth wrapper, `stage` slot)
- Modify: `src/components/PageView.astro` (pass `smooth`)
- Create: `src/lib/landing/formations.ts`, `tests/unit/formations.test.ts`
- Create: `src/scripts/chapters/types.ts`, `src/scripts/chapters/index.ts`, and one file per chapter with an empty setup (`hero.ts`, `statement.ts`, `services.ts`, `signature.ts`, `celebrations.ts`, `closing.ts`)
- Create: `src/scripts/formation-triggers.ts`, `tests/unit/formation-triggers.test.ts`
- Rewrite: `src/scripts/landing-motion.ts`, `tests/unit/landing-motion.test.ts`

**Interfaces:**
- Consumes: markup hooks (Task 4).
- Produces:
  - `src/lib/landing/formations.ts`: `chapterIds`, `ChapterId`, `type FormationId = 'hero' | 'drift' | 'hidden' | 'release' | \`service-${number}\``, `formationFor(chapter: ChapterId, serviceIndex?: number): FormationId`, `resolveFormation(id: FormationId, tier: QualityTier): FormationId`, `isFormationId(value: string): value is FormationId`, `formationEvent = 'one23balloon:formation'`, `announceFormation(root: HTMLElement, id: FormationId): void`.
  - `src/scripts/chapters/types.ts`: `type ChapterContext = { root: HTMLElement; desktop: boolean }`, `type ChapterSetup = (section: HTMLElement, context: ChapterContext) => void | (() => void)`.
  - `src/scripts/chapters/index.ts`: `chapters: Record<ChapterId, ChapterSetup>`.
  - `src/scripts/formation-triggers.ts`: `initFormationTriggers(root: HTMLElement): () => void`.
  - `src/scripts/landing-motion.ts`: `motionQueries`, `initLandingMotion(root: HTMLElement): () => void`.
  - DOM: `#smooth-wrapper > #smooth-content` around main and footer on landing pages; the `stage` slot renders before the wrapper.

- [ ] **Step 1: Write the failing formation tests**

`tests/unit/formations.test.ts`:

```ts
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  announceFormation,
  chapterIds,
  formationEvent,
  formationFor,
  isFormationId,
  resolveFormation,
} from '../../src/lib/landing/formations.ts';

describe('formationFor', () => {
  it('maps every chapter to its formation', () => {
    expect(chapterIds.map((id) => formationFor(id))).toEqual([
      'hero',
      'drift',
      'service-0',
      'drift',
      'hidden',
      'release',
    ]);
    expect(formationFor('services', 4)).toBe('service-4');
  });
});

describe('resolveFormation', () => {
  it('hides the drift on the low tier, where there is no back canvas', () => {
    expect(resolveFormation('drift', 'low')).toBe('hidden');
    expect(resolveFormation('drift', 'high')).toBe('drift');
    expect(resolveFormation('service-2', 'low')).toBe('service-2');
  });
});

describe('isFormationId', () => {
  it('accepts known formations and service indices only', () => {
    for (const id of ['hero', 'drift', 'hidden', 'release', 'service-5'])
      expect(isFormationId(id)).toBe(true);
    for (const id of ['service-', 'service-x', 'garland', ''])
      expect(isFormationId(id)).toBe(false);
  });
});

describe('announceFormation', () => {
  it('records the formation and dispatches one bubbling event per change', () => {
    const { document } = new JSDOM('<div data-landing></div>').window;
    const root = document.querySelector<HTMLElement>('[data-landing]')!;
    const seen: string[] = [];
    document.addEventListener(formationEvent, (event) =>
      seen.push((event as CustomEvent<{ id: string }>).detail.id),
    );
    announceFormation(root, 'drift');
    announceFormation(root, 'drift');
    announceFormation(root, 'service-1');
    expect(root.dataset.formation).toBe('service-1');
    expect(seen).toEqual(['drift', 'service-1']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/formations.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/lib/landing/formations.ts`**

```ts
import type { QualityTier } from '../canvas-island/capability.ts';

export const chapterIds = [
  'hero',
  'statement',
  'services',
  'signature',
  'celebrations',
  'closing',
] as const;
export type ChapterId = (typeof chapterIds)[number];
export type FormationId =
  | 'hero'
  | 'drift'
  | 'hidden'
  | 'release'
  | `service-${number}`;

// Dispatched (bubbling) from the landing root when the balloons should regroup.
export const formationEvent = 'one23balloon:formation';

export function formationFor(
  chapter: ChapterId,
  serviceIndex = 0,
): FormationId {
  switch (chapter) {
    case 'hero':
      return 'hero';
    case 'statement':
    case 'signature':
      return 'drift';
    case 'services':
      return `service-${serviceIndex}`;
    case 'celebrations':
      return 'hidden';
    case 'closing':
      return 'release';
  }
}

// Without a back canvas (low tier) drifting balloons would cover the text.
export function resolveFormation(
  id: FormationId,
  tier: QualityTier,
): FormationId {
  return tier === 'low' && id === 'drift' ? 'hidden' : id;
}

export function isFormationId(value: string): value is FormationId {
  return (
    ['hero', 'drift', 'hidden', 'release'].includes(value) ||
    /^service-\d+$/.test(value)
  );
}

export function announceFormation(root: HTMLElement, id: FormationId): void {
  if (root.dataset.formation === id) return;
  root.dataset.formation = id;
  root.dispatchEvent(
    new root.ownerDocument.defaultView!.CustomEvent(formationEvent, {
      bubbles: true,
      detail: { id },
    }),
  );
}
```

- [ ] **Step 4: Run the formation tests**

Run: `pnpm vitest run tests/unit/formations.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing trigger test**

`tests/unit/formation-triggers.test.ts`:

```ts
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

type Created = {
  trigger: Element;
  onToggle: (self: { isActive: boolean }) => void;
};

afterEach(() => {
  vi.doUnmock('gsap/ScrollTrigger');
  vi.resetModules();
});

describe('initFormationTriggers', () => {
  it('announces each chapter and each service card, and kills its triggers', async () => {
    const created: Created[] = [];
    const kill = vi.fn();
    vi.doMock('gsap/ScrollTrigger', () => ({
      ScrollTrigger: {
        create: (options: Created) => {
          created.push(options);
          return { kill };
        },
      },
    }));
    const { initFormationTriggers } = await import(
      '../../src/scripts/formation-triggers.ts'
    );
    const { document } = new JSDOM(`<div data-landing data-formation="hero">
      <section data-chapter="hero"></section>
      <section data-chapter="statement"></section>
      <section data-chapter="services">
        <div data-service-card></div><div data-service-card></div>
      </section>
      <section data-chapter="celebrations"></section>
      <section data-chapter="closing"></section>
    </div>`).window;
    const root = document.querySelector<HTMLElement>('[data-landing]')!;
    const dispose = initFormationTriggers(root);
    expect(created).toHaveLength(6);
    const toggle = (selector: string, index = 0) =>
      created
        .filter((entry) => entry.trigger.matches(selector))
        [index]!.onToggle({ isActive: true });
    toggle('[data-service-card]', 1);
    expect(root.dataset.formation).toBe('service-1');
    toggle('[data-chapter="closing"]');
    expect(root.dataset.formation).toBe('release');
    created[0]!.onToggle({ isActive: false });
    expect(root.dataset.formation).toBe('release');
    dispose();
    expect(kill).toHaveBeenCalledTimes(6);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `pnpm vitest run tests/unit/formation-triggers.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 7: Create `src/scripts/formation-triggers.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  announceFormation,
  chapterIds,
  formationFor,
  type FormationId,
} from '../lib/landing/formations.ts';

// Whichever chapter (or service card) crosses the middle of the screen owns
// the balloons. Services announce per card so the cluster recolours per card.
export function initFormationTriggers(root: HTMLElement): () => void {
  const triggers: ScrollTrigger[] = [];
  const watch = (trigger: Element, id: FormationId) =>
    triggers.push(
      ScrollTrigger.create({
        trigger,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) announceFormation(root, id);
        },
      }),
    );
  for (const chapter of chapterIds) {
    const section = root.querySelector(`[data-chapter="${chapter}"]`);
    if (!section) continue;
    if (chapter === 'services') {
      section
        .querySelectorAll('[data-service-card]')
        .forEach((card, index) => watch(card, formationFor(chapter, index)));
      continue;
    }
    watch(section, formationFor(chapter));
  }
  return () => {
    for (const trigger of triggers.splice(0)) trigger.kill();
  };
}
```

- [ ] **Step 8: Run the trigger test**

Run: `pnpm vitest run tests/unit/formation-triggers.test.ts`
Expected: PASS.

- [ ] **Step 9: Create the chapter registry with empty chapters**

`src/scripts/chapters/types.ts`:

```ts
export type ChapterContext = {
  /** The landing root ([data-landing]). */
  root: HTMLElement;
  /** True at 64rem and wider: pins, tilts and long travel are allowed. */
  desktop: boolean;
};

// Runs inside gsap.matchMedia, so tweens and ScrollTriggers it creates are
// reverted automatically. Return a cleanup only for anything else.
export type ChapterSetup = (
  section: HTMLElement,
  context: ChapterContext,
) => void | (() => void);
```

For each of `hero`, `statement`, `services`, `signature`, `celebrations`, `closing`, create `src/scripts/chapters/<id>.ts` exporting a named setup that does nothing yet, for example `src/scripts/chapters/hero.ts`:

```ts
import type { ChapterSetup } from './types.ts';

export const hero: ChapterSetup = () => undefined;
```

`src/scripts/chapters/index.ts`:

```ts
import type { ChapterId } from '../../lib/landing/formations.ts';
import { celebrations } from './celebrations.ts';
import { closing } from './closing.ts';
import { hero } from './hero.ts';
import { services } from './services.ts';
import { signature } from './signature.ts';
import { statement } from './statement.ts';
import type { ChapterSetup } from './types.ts';

export const chapters: Record<ChapterId, ChapterSetup> = {
  hero,
  statement,
  services,
  signature,
  celebrations,
  closing,
};
```

- [ ] **Step 10: Write the failing motion test**

Replace `tests/unit/landing-motion.test.ts` with:

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Run = (context: {
  conditions?: Record<string, boolean>;
}) => (() => void) | void;
let dom: JSDOM;

function setup({ motion = true } = {}) {
  const added: Array<{ query: unknown; run: Run }> = [];
  const revert = vi.fn();
  const registerPlugin = vi.fn();
  const smootherKill = vi.fn();
  const create = vi.fn(() => ({ kill: smootherKill }));
  const chapterCalls: string[] = [];
  vi.resetModules();
  vi.doMock('../../src/lib/config/site.ts', () => ({
    getSiteConfig: () => ({ features: { motion } }),
  }));
  vi.doMock('gsap', () => ({
    gsap: {
      registerPlugin,
      matchMedia: () => ({
        add: (query: unknown, run: Run) => added.push({ query, run }),
        revert,
      }),
    },
  }));
  vi.doMock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: { refresh: vi.fn(), create: vi.fn(() => ({ kill: vi.fn() })) },
  }));
  vi.doMock('gsap/ScrollSmoother', () => ({ ScrollSmoother: { create } }));
  vi.doMock('gsap/SplitText', () => ({ SplitText: {} }));
  vi.doMock('../../src/scripts/chapters/index.ts', () => ({
    chapters: Object.fromEntries(
      ['hero', 'statement', 'services', 'signature', 'celebrations', 'closing'].map(
        (id) => [
          id,
          (section: HTMLElement, context: { desktop: boolean }) => {
            chapterCalls.push(`${section.dataset.chapter}:${context.desktop}`);
          },
        ],
      ),
    ),
  }));
  return {
    added,
    revert,
    registerPlugin,
    create,
    smootherKill,
    chapterCalls,
    load: () => import('../../src/scripts/landing-motion.ts'),
  };
}

beforeEach(() => {
  dom = new JSDOM(`<div id="smooth-wrapper"><div id="smooth-content">
    <div data-landing>
      <section data-chapter="hero"></section>
      <section data-chapter="closing"></section>
    </div></div></div>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const path of [
    '../../src/lib/config/site.ts',
    'gsap',
    'gsap/ScrollTrigger',
    'gsap/ScrollSmoother',
    'gsap/SplitText',
    '../../src/scripts/chapters/index.ts',
  ])
    vi.doUnmock(path);
});

const root = () => dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLandingMotion', () => {
  it('does nothing when motion is off', async () => {
    const harness = setup({ motion: false });
    const { initLandingMotion } = await harness.load();
    initLandingMotion(root())();
    expect(harness.added).toHaveLength(0);
  });

  it('creates the smoother first, only on its own media query', async () => {
    const harness = setup();
    const { initLandingMotion, motionQueries } = await harness.load();
    initLandingMotion(root());
    expect(harness.registerPlugin).toHaveBeenCalled();
    expect(harness.added[0]!.query).toBe(motionQueries.smooth);
    const cleanup = harness.added[0]!.run({});
    expect(harness.create).toHaveBeenCalledTimes(1);
    (cleanup as () => void)();
    expect(harness.smootherKill).toHaveBeenCalled();
  });

  it('runs every present chapter with the desktop flag, then reverts on dispose', async () => {
    const harness = setup();
    const { initLandingMotion } = await harness.load();
    const dispose = initLandingMotion(root());
    harness.added[1]!.run({ conditions: { motion: true, desktop: true } });
    expect(harness.chapterCalls).toEqual(['hero:true', 'closing:true']);
    dispose();
    expect(harness.revert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 11: Run to verify it fails**

Run: `pnpm vitest run tests/unit/landing-motion.test.ts`
Expected: FAIL, `motionQueries` is not exported.

- [ ] **Step 12: Rewrite `src/scripts/landing-motion.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { motionEnabled, refreshOnLoad } from '../lib/motion/index.ts';
import { chapters } from './chapters/index.ts';
import { initFormationTriggers } from './formation-triggers.ts';

const motion = '(prefers-reduced-motion: no-preference)';
export const motionQueries = {
  motion,
  desktop: `${motion} and (min-width: 64rem)`,
  smooth: `${motion} and (min-width: 64rem) and (pointer: fine)`,
} as const;

export function initLandingMotion(root: HTMLElement): () => void {
  if (!motionEnabled()) return () => undefined;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  const doc = root.ownerDocument;
  const media = gsap.matchMedia();

  // Added first so pins created below measure against the smoothed scroller.
  media.add(motionQueries.smooth, () => {
    const wrapper = doc.querySelector<HTMLElement>('#smooth-wrapper');
    const content = doc.querySelector<HTMLElement>('#smooth-content');
    if (!wrapper || !content) return;
    const smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: 1.1,
      effects: false,
    });
    return () => smoother.kill();
  });

  media.add(
    { motion: motionQueries.motion, desktop: motionQueries.desktop },
    (context) => {
      const { motion: allowed, desktop } = context.conditions as {
        motion: boolean;
        desktop: boolean;
      };
      if (!allowed) return;
      const cleanups: Array<() => void> = [];
      for (const [id, setup] of Object.entries(chapters)) {
        const section = root.querySelector<HTMLElement>(
          `[data-chapter="${id}"]`,
        );
        if (!section) continue;
        const cleanup = setup(section, { root, desktop });
        if (cleanup) cleanups.push(cleanup);
      }
      cleanups.push(initFormationTriggers(root));
      return () => {
        for (const cleanup of cleanups.reverse()) cleanup();
      };
    },
  );

  const stopRefresh = refreshOnLoad(root);
  return () => {
    stopRefresh();
    media.revert();
  };
}
```

- [ ] **Step 13: Run the motion test**

Run: `pnpm vitest run tests/unit/landing-motion.test.ts`
Expected: PASS.

- [ ] **Step 14: Add the smooth wrapper and stage slot to `BaseLayout.astro`**

Create `src/components/SmoothWrapper.astro`, which wraps its content only when enabled, so the layout keeps a single copy of `main` and the footer:

```astro
---
interface Props {
  enabled: boolean;
}
const { enabled } = Astro.props;
---

{
  enabled ? (
    <div id="smooth-wrapper">
      <div id="smooth-content">
        <slot />
      </div>
    </div>
  ) : (
    <slot />
  )
}
```

In `BaseLayout.astro`, import it, add `smooth?: boolean;` to `Props` and destructure `smooth = false`. Replace the body content after `<SiteHeader ... />` with:

```astro
    <slot name="stage" />
    <SmoothWrapper enabled={smooth}>
      <main id="main-content" class="site-main" tabindex="-1">
        <slot />
      </main>
      {
        Astro.slots.has('footer') ? (
          <SiteFooter locale={locale}>
            <slot name="footer" slot="extra" />
          </SiteFooter>
        ) : (
          <SiteFooter locale={locale} />
        )
      }
    </SmoothWrapper>
```

In `PageView.astro`, pass `smooth={Boolean(landing)}` to `BaseLayout`. After `pnpm build`, confirm `dist/index.html` contains exactly one `<main` and one `id="smooth-wrapper"`, and `dist/404.html` contains no `smooth-wrapper`.

- [ ] **Step 15: Check in the browser**

Reload the dev page at 1440x900. Scroll top to bottom: scrolling is smoothed, the page still reaches the footer, the header stays fixed, and the console (`mcp__Claude_Browser__read_console_messages` with `onlyErrors`) is empty. At 390x844 (touch emulation via the `mobile` preset) scrolling is native.

- [ ] **Step 16: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add -A src/lib/landing/formations.ts src/scripts src/layouts src/components/PageView.astro tests/unit
git commit -m "feat(motion): add smooth scrolling, the chapter registry and formation triggers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Hero and statement chapters

**Files:**
- Modify: `src/scripts/chapters/hero.ts`, `src/scripts/chapters/statement.ts`

**Interfaces:**
- Consumes: `ChapterSetup` (Task 6); `[data-hero-line]`, `.hero-lede`, `[data-statement]`, `.statement-pill` (Task 4); header class `is-over-hero` (Task 5).
- Produces: header toggling `is-over-hero` while the hero is under it.

These modules drive GSAP against real layout, which jsdom cannot measure, so they are verified in the browser rather than with unit tests. The registry test (Task 6) already covers that they are called and reverted.

- [ ] **Step 1: Implement `src/scripts/chapters/hero.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// The headline splits apart from its middle as the balloons push forward.
export const hero: ChapterSetup = (section, { root, desktop }) => {
  const header = root.ownerDocument.querySelector<HTMLElement>('.site-header');
  if (header)
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top+=64',
      toggleClass: { targets: header, className: 'is-over-hero' },
    });
  const lines = [...section.querySelectorAll<HTMLElement>('[data-hero-line]')];
  if (!lines.length) return;
  const splits = lines.map((line) =>
    SplitText.create(line, { type: 'chars', charsClass: 'hero-char' }),
  );
  const chars = splits.flatMap((split) => split.chars);
  gsap.from(chars, {
    y: '0.35em',
    autoAlpha: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.03,
  });
  const travel = () => innerWidth * (desktop ? 0.55 : 0.3);
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: desktop ? '+=100%' : 'bottom top',
      pin: desktop,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  for (const split of splits) {
    const half = Math.ceil(split.chars.length / 2);
    timeline
      .to(
        split.chars.slice(0, half),
        { x: () => -travel(), stagger: { each: 0.02, from: 'end' } },
        0,
      )
      .to(
        split.chars.slice(half),
        { x: () => travel(), stagger: { each: 0.02, from: 'start' } },
        0,
      );
  }
  timeline.to(section.querySelector('.hero-lede'), { autoAlpha: 0, y: -40 }, 0);
  return () => {
    for (const split of splits) split.revert();
  };
};
```

- [ ] **Step 2: Implement `src/scripts/chapters/statement.ts`**

```ts
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// Words fill in reading order; each photo pill pops in with its word.
export const statement: ChapterSetup = (section) => {
  const text = section.querySelector<HTMLElement>('[data-statement]');
  if (!text) return;
  const split = SplitText.create(text, {
    type: 'words',
    wordsClass: 'statement-split',
  });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        end: 'bottom 65%',
        scrub: 0.5,
      },
    })
    .fromTo(
      split.words,
      { opacity: 0.16 },
      { opacity: 1, stagger: 0.1, ease: 'none' },
      0,
    )
    .fromTo(
      text.querySelectorAll('.statement-pill'),
      { scale: 0, rotate: -12 },
      { scale: 1, rotate: 0, stagger: 0.35, ease: 'back.out(2)' },
      0,
    );
  return () => split.revert();
};
```

- [ ] **Step 3: Verify in the browser**

At 1440x900 (en and zh) and 390x844: on load the hero characters rise in; scrolling pins the hero on desktop while the left halves move left and the right halves move right, the lede fades, then the page releases; the header is transparent over the hero and paper-coloured after it. In the statement, words fill from faint to ink in order and the pills pop. The console shows no errors (`mcp__Claude_Browser__read_console_messages` with `onlyErrors`). Reduced motion is checked in Task 15. Screenshot the mid-split frame at 1440.

- [ ] **Step 4: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/scripts/chapters/hero.ts src/scripts/chapters/statement.ts
git commit -m "feat(motion): split the hero headline and fill the statement on scroll

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Services stack

**Files:**
- Modify: `src/scripts/chapters/services.ts`

**Interfaces:**
- Consumes: `[data-service-card]`, `.service-copy`, `.service-dim` (Task 4).
- Produces: pinned stacking cards. Formation triggers (Task 6) already announce `service-<n>` per card.

- [ ] **Step 1: Implement `src/scripts/chapters/services.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ChapterSetup } from './types.ts';

// Each card pins at the top; the next one slides over it while it shrinks,
// tilts back and dims.
export const services: ChapterSetup = (section, { desktop }) => {
  const cards = gsap.utils.toArray<HTMLElement>(
    section.querySelectorAll('[data-service-card]'),
  );
  const last = cards.at(-1);
  cards.forEach((card, index) => {
    gsap.from(card.querySelectorAll('.service-copy > *'), {
      y: 60,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 60%' },
    });
    const next = cards[index + 1];
    if (!next || !last) return;
    ScrollTrigger.create({
      trigger: card,
      start: 'top top',
      endTrigger: last,
      end: 'top top',
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
    });
    const scroll = {
      trigger: next,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    };
    gsap.to(card, {
      scale: 0.9,
      rotateX: desktop ? 8 : 0,
      transformPerspective: 1600,
      transformOrigin: '50% 0%',
      ease: 'none',
      scrollTrigger: scroll,
    });
    gsap.to(card.querySelector('.service-dim'), {
      opacity: 0.35,
      ease: 'none',
      scrollTrigger: scroll,
    });
  });
};
```

- [ ] **Step 2: Verify in the browser**

At 1440x900 and 390x844: each card pins at the top; the next card slides up over it while the previous one scales down, tilts back (desktop only) and dims; the last card scrolls away normally into the signature chapter; no card flashes or jumps when a pin starts (`anticipatePin`). Tab through the WhatsApp links: focus outlines are visible on every card, white on cobalt. Screenshot the moment two cards overlap at 1440.

- [ ] **Step 3: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/scripts/chapters/services.ts
git commit -m "feat(motion): stack the service cards with pinned, tilting transitions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Signature marquee and tilted celebrations

**Files:**
- Modify: `src/scripts/chapters/signature.ts`, `src/scripts/chapters/celebrations.ts`

**Interfaces:**
- Consumes: `[data-marquee]`, `.marquee-run`, `[data-piece]`, `[data-celebrations-plane]`, `[data-celebrations-column]` (Task 4).

- [ ] **Step 1: Implement `src/scripts/chapters/signature.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ChapterSetup } from './types.ts';

// The page's only marquee. It follows scroll direction and speeds up with
// scroll velocity; the two sculptures cross it at different speeds.
export const signature: ChapterSetup = (section, { desktop }) => {
  const runs = section.querySelectorAll<HTMLElement>(
    '[data-marquee] .marquee-run',
  );
  if (runs.length) {
    const loop = gsap.to(runs, {
      xPercent: -100,
      duration: 26,
      ease: 'none',
      repeat: -1,
    });
    // Start far from zero so reversing never runs into the beginning.
    loop.totalTime(loop.duration() * 100);
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 800);
        gsap.to(loop, {
          timeScale: self.direction * boost,
          duration: 0.3,
          overwrite: true,
          onComplete: () => {
            gsap.to(loop, { timeScale: self.direction, duration: 0.8 });
          },
        });
      },
    });
  }
  section.querySelectorAll<HTMLElement>('[data-piece]').forEach((piece, index) => {
    const reach = desktop ? 30 + index * 25 : 12;
    gsap.fromTo(
      piece,
      { yPercent: reach },
      {
        yPercent: -reach,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });
};
```

- [ ] **Step 2: Implement `src/scripts/chapters/celebrations.ts`**

```ts
import { gsap } from 'gsap';
import type { ChapterSetup } from './types.ts';

// The whole wall arrives tilted back in perspective and flattens as it
// reaches the top; on wide screens alternate columns drift at other speeds.
export const celebrations: ChapterSetup = (section, { desktop }) => {
  const plane = section.querySelector<HTMLElement>('[data-celebrations-plane]');
  if (plane)
    gsap.fromTo(
      plane,
      {
        rotateX: desktop ? 18 : 8,
        skewY: desktop ? 3 : 0,
        yPercent: 4,
        transformPerspective: 1400,
        transformOrigin: '50% 0%',
      },
      {
        rotateX: 0,
        skewY: 0,
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      },
    );
  if (!desktop) return;
  section
    .querySelectorAll<HTMLElement>('[data-celebrations-column]')
    .forEach((column, index) => {
      const fast = index % 2 === 1;
      gsap.fromTo(
        column,
        { yPercent: fast ? 6 : -2 },
        {
          yPercent: fast ? -10 : 2,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    });
};
```

- [ ] **Step 3: Verify in the browser**

At 1440x900: the marquee runs left while scrolling down and right while scrolling up, faster when scrolling fast, and pauses off screen; the lion dance and rose photos cross the marquee at different speeds. The celebrations wall enters tilted and is flat when its top reaches the top of the viewport; at 64rem and wider alternate columns drift; at 768 and 390 the grid is plain multi-column with only the lighter tilt. Screenshot the tilted entry at 1440.

- [ ] **Step 4: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/scripts/chapters/signature.ts src/scripts/chapters/celebrations.ts
git commit -m "feat(motion): add the signature marquee and the tilted celebrations wall

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Closing flood and wordmark drop

**Files:**
- Modify: `src/scripts/chapters/closing.ts`

**Interfaces:**
- Consumes: `[data-closing-flood]`, `.closing-actions`, `[data-wordmark]` (Task 4).

- [ ] **Step 1: Implement `src/scripts/chapters/closing.ts`**

```ts
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// A pink curtain rises over the page, then the wordmark drops in letter by letter.
export const closing: ChapterSetup = (section, { root }) => {
  const flood = section.querySelector<HTMLElement>('[data-closing-flood]');
  if (flood)
    gsap.fromTo(
      flood,
      { clipPath: 'inset(100% 0% 0% 0% round 3rem 3rem 0rem 0rem)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0rem 0rem 0rem 0rem)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      },
    );
  gsap.from(section.querySelectorAll('.chapter-title, .closing-actions > *'), {
    y: 80,
    autoAlpha: 0,
    stagger: 0.08,
    duration: 1,
    ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 40%' },
  });
  const wordmark = root.ownerDocument.querySelector<HTMLElement>(
    '[data-wordmark]',
  );
  if (!wordmark) return;
  const split = SplitText.create(wordmark, { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: -130,
    rotate: () => gsap.utils.random(-12, 12),
    duration: 1.1,
    ease: 'bounce.out',
    stagger: 0.04,
    scrollTrigger: { trigger: wordmark, start: 'top 92%' },
  });
  return () => split.revert();
};
```

- [ ] **Step 2: Verify in the browser**

At 1440x900 and 390x844: the pink flood rises from the bottom edge with rounded top corners that flatten as it fills the screen; the title and three buttons rise in; the footer wordmark letters drop and bounce into place and never overflow the viewport width. Screenshot the half-risen flood at 1440.

- [ ] **Step 3: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/scripts/chapters/closing.ts
git commit -m "feat(motion): flood the closing chapter and drop in the wordmark

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Collision-free formation layouts

**Files:**
- Create: `src/scenes/formation-layout.ts`, `src/scenes/formations.ts`
- Create: `tests/unit/formation-layout.test.ts`

**Interfaces:**
- Consumes: `mulberry32(seed)` from `src/lib/random.ts`; `blocks`, `blockIds`, `BlockId`, `clusterBlocks`, `chromeSilver`, `chromeGold`, `paper`, `Material` (Task 1); `FormationId` (Task 6); `QualityTier` from `src/lib/canvas-island/capability.ts`.
- Produces:
  - `formation-layout.ts`: `type Vec3 = [number, number, number]`, `type Box = { min: Vec3; max: Vec3 }`, `type Placed = { x: number; y: number; z: number; radius: number }`, `BALLOON_STRETCH = 1.1`, `boundingRadius(radius: number): number`, `separated(a: Placed, b: Placed, gap?: number): boolean`, `layoutFormation(options: LayoutOptions): Placed[]`.
  - `formations.ts`: `CAMERA_Z = 18`, `CAMERA_FOV = 30`, `visibleHalfHeight(z: number): number`, `familyOf(index: number): Material`, `type FormationSlot = Placed & { hex: string; family: Material }`, `type BuildOptions = { count: number; aspect: number; tier: QualityTier; serviceBlocks: readonly BlockId[] }`, `buildFormation(id: FormationId, options: BuildOptions): FormationSlot[]`.

- [ ] **Step 1: Write the failing test**

`tests/unit/formation-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { blockIds } from '../../src/lib/landing/blocks.ts';
import type { FormationId } from '../../src/lib/landing/formations.ts';
import {
  boundingRadius,
  layoutFormation,
  separated,
  type Placed,
} from '../../src/scenes/formation-layout.ts';
import {
  buildFormation,
  familyOf,
  visibleHalfHeight,
} from '../../src/scenes/formations.ts';

const ids: FormationId[] = [
  'hero',
  'drift',
  'hidden',
  'release',
  ...blockIds.map((_, index) => `service-${index}` as FormationId),
];
const counts = [30, 14];
const aspects = [0.46, 1, 1.78];

function overlapping(slots: Placed[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++)
      if (!separated(slots[i]!, slots[j]!, 0)) pairs.push([i, j]);
  return pairs;
}

describe('layoutFormation', () => {
  const options = {
    count: 20,
    volume: { min: [-4, -3, -4], max: [4, 3, 4] } as const,
    radius: [0.4, 0.8] as [number, number],
    seed: 11,
  };

  it('places every balloon without any overlap', () => {
    const slots = layoutFormation({
      ...options,
      volume: { min: [-4, -3, -4], max: [4, 3, 4] },
    });
    expect(slots).toHaveLength(20);
    expect(overlapping(slots)).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    const volume = { min: [-4, -3, -4], max: [4, 3, 4] } as {
      min: [number, number, number];
      max: [number, number, number];
    };
    expect(layoutFormation({ ...options, volume })).toEqual(
      layoutFormation({ ...options, volume }),
    );
  });

  it('keeps balloons out of keep-out boxes', () => {
    const keepOut = { min: [-4, -1, -4], max: [4, 1, 4] } as {
      min: [number, number, number];
      max: [number, number, number];
    };
    const slots = layoutFormation({
      ...options,
      volume: { min: [-4, -3, -4], max: [4, 3, 4] },
      keepOut: [keepOut],
    });
    for (const slot of slots)
      expect(Math.abs(slot.y)).toBeGreaterThanOrEqual(
        1 + boundingRadius(slot.radius) - 1e-9,
      );
  });

  it('shrinks radii instead of failing when space is tight', () => {
    const slots = layoutFormation({
      count: 40,
      volume: { min: [-1.5, -1.5, -1.5], max: [1.5, 1.5, 1.5] },
      radius: [0.6, 0.9],
      seed: 3,
    });
    expect(slots).toHaveLength(40);
    expect(overlapping(slots)).toEqual([]);
  });
});

describe('buildFormation', () => {
  const serviceBlocks = blockIds;

  it.each(ids.flatMap((id) => counts.flatMap((count) => aspects.map((aspect) => [id, count, aspect] as const))))(
    '%s with %i balloons at aspect %f never overlaps',
    (id, count, aspect) => {
      const tier = count === 30 ? 'high' : 'low';
      const slots = buildFormation(id, { count, aspect, tier, serviceBlocks });
      expect(slots).toHaveLength(count);
      expect(overlapping(slots)).toEqual([]);
    },
  );

  it('spreads the hero at least 12 units deep', () => {
    const slots = buildFormation('hero', {
      count: 30,
      aspect: 1.78,
      tier: 'high',
      serviceBlocks,
    });
    const z = slots.map((slot) => slot.z);
    expect(Math.max(...z) - Math.min(...z)).toBeGreaterThanOrEqual(12);
  });

  it('keeps the drift behind the headline plane and services in front of it', () => {
    const base = { count: 30, aspect: 1.78, tier: 'high' as const, serviceBlocks };
    for (const slot of buildFormation('drift', base))
      expect(slot.z + boundingRadius(slot.radius)).toBeLessThan(0);
    for (const slot of buildFormation('service-2', base))
      expect(slot.z - boundingRadius(slot.radius)).toBeGreaterThan(0);
  });

  it('parks hidden balloons below the frame and releases them above it', () => {
    const base = { count: 30, aspect: 1, tier: 'high' as const, serviceBlocks };
    for (const slot of buildFormation('hidden', base))
      expect(slot.y + boundingRadius(slot.radius)).toBeLessThan(
        -visibleHalfHeight(slot.z),
      );
    for (const slot of buildFormation('release', base))
      expect(slot.y - boundingRadius(slot.radius)).toBeGreaterThan(
        visibleHalfHeight(slot.z),
      );
  });

  it('colours service clusters with the card pair, never the card colour', () => {
    const slots = buildFormation('service-0', {
      count: 30,
      aspect: 1.78,
      tier: 'high',
      serviceBlocks: ['pink', 'cobalt', 'sunflower', 'emerald', 'tangerine', 'lilac'],
    });
    const latex = new Set(
      slots.filter((slot) => slot.family === 'latex').map((slot) => slot.hex),
    );
    expect(latex).toEqual(new Set(['#FFC21A', '#2340FF']));
  });

  it('assigns stable material families by index', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(familyOf)).toEqual([
      'chrome',
      'latex',
      'latex',
      'pearl',
      'latex',
      'latex',
      'chrome',
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/formation-layout.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/scenes/formation-layout.ts`**

```ts
import { mulberry32 } from '../lib/random.ts';

export type Vec3 = [number, number, number];
export type Box = { min: Vec3; max: Vec3 };
export type Placed = { x: number; y: number; z: number; radius: number };
export type LayoutOptions = {
  count: number;
  /** Balloons sit wholly inside this box. */
  volume: Box;
  radius: [number, number];
  /** Extra clearance as a fraction of the two bounding radii. */
  gap?: number;
  /** No balloon may touch these boxes. */
  keepOut?: Box[];
  seed: number;
  /** Candidates tried per balloon before the radii shrink. */
  attempts?: number;
};

// createBalloonGeometry stretches the sphere 1.1x vertically.
export const BALLOON_STRETCH = 1.1;

export function boundingRadius(radius: number): number {
  return radius * BALLOON_STRETCH;
}

export function separated(a: Placed, b: Placed, gap = 0.04): boolean {
  const min = (boundingRadius(a.radius) + boundingRadius(b.radius)) * (1 + gap);
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 >= min * min;
}

function touches(slot: Placed, box: Box): boolean {
  const r = boundingRadius(slot.radius);
  const dx = Math.max(box.min[0] - slot.x, 0, slot.x - box.max[0]);
  const dy = Math.max(box.min[1] - slot.y, 0, slot.y - box.max[1]);
  const dz = Math.max(box.min[2] - slot.z, 0, slot.z - box.max[2]);
  return dx * dx + dy * dy + dz * dz < r * r;
}

// Dart throwing with a fixed seed: the same formation every visit. If a
// balloon cannot be placed, every radius shrinks by 10% and the layout restarts.
export function layoutFormation(options: LayoutOptions): Placed[] {
  const { count, volume, keepOut = [], seed, gap = 0.04, attempts = 400 } =
    options;
  let [minRadius, maxRadius] = options.radius;
  for (let round = 0; round < 24; round++) {
    const random = mulberry32(seed + round * 7919);
    const placed: Placed[] = [];
    for (let index = 0; index < count; index++) {
      let found: Placed | undefined;
      for (let attempt = 0; attempt < attempts && !found; attempt++) {
        const radius = minRadius + random() * (maxRadius - minRadius);
        const r = boundingRadius(radius);
        const axis = (k: 0 | 1 | 2) =>
          volume.min[k] +
          r +
          random() * Math.max(0, volume.max[k] - volume.min[k] - 2 * r);
        const candidate = { x: axis(0), y: axis(1), z: axis(2), radius };
        if (keepOut.some((box) => touches(candidate, box))) continue;
        if (placed.every((other) => separated(other, candidate, gap)))
          found = candidate;
      }
      if (!found) break;
      placed.push(found);
    }
    if (placed.length === count) return placed;
    minRadius *= 0.9;
    maxRadius *= 0.9;
  }
  throw new Error(`Could not place ${count} balloons without overlap.`);
}
```

- [ ] **Step 4: Create `src/scenes/formations.ts`**

```ts
import type { QualityTier } from '../lib/canvas-island/capability.ts';
import {
  blocks,
  blockIds,
  chromeGold,
  chromeSilver,
  clusterBlocks,
  paper,
  type BlockId,
  type Material,
} from '../lib/landing/blocks.ts';
import type { FormationId } from '../lib/landing/formations.ts';
import { layoutFormation, type Box, type Placed } from './formation-layout.ts';

export const CAMERA_Z = 18;
export const CAMERA_FOV = 30;

export type FormationSlot = Placed & { hex: string; family: Material };
export type BuildOptions = {
  count: number;
  aspect: number;
  tier: QualityTier;
  /** Block colour of each service card, in page order. */
  serviceBlocks: readonly BlockId[];
};

// Half the visible height at depth z, for the stage camera.
export function visibleHalfHeight(z: number): number {
  return Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * (CAMERA_Z - z);
}

export function familyOf(index: number): Material {
  if (index % 6 === 0) return 'chrome';
  if (index % 6 === 3) return 'pearl';
  return 'latex';
}

const seeds: Record<string, number> = {
  hero: 101,
  drift: 202,
  hidden: 101,
  release: 404,
};

function box(min: Box['min'], max: Box['max']): Box {
  return { min, max };
}

function shape(
  id: FormationId,
  { aspect, tier }: BuildOptions,
): { volume: Box; radius: [number, number]; keepOut: Box[] } {
  const halfHeight = visibleHalfHeight(0);
  const halfWidth = halfHeight * aspect;
  const portrait = aspect < 1;
  if (id === 'hero' || id === 'hidden') {
    // The headline sits in the lower part of the hero; front balloons stay
    // off its centre so the words stay readable.
    const headline = box(
      [-halfWidth * 0.55, -halfHeight, 0],
      [halfWidth * 0.55, -halfHeight * 0.15, 7],
    );
    const keepOut = [headline];
    if (tier === 'low')
      keepOut.push(
        box([-halfWidth, -halfHeight, -11], [halfWidth, -halfHeight * 0.15, 7]),
      );
    // 16 units deep, so 30 balloons reliably span at least 12 of them.
    return {
      volume: box(
        [-halfWidth * 1.05, -halfHeight * 0.95, -10],
        [halfWidth * 1.05, halfHeight * 0.95, 6],
      ),
      radius: portrait ? [0.35, 0.7] : [0.45, 0.95],
      keepOut,
    };
  }
  if (id === 'drift')
    return {
      volume: box(
        [-halfWidth * 1.2, -halfHeight, -16],
        [halfWidth * 1.2, halfHeight, -2],
      ),
      radius: [0.4, 0.8],
      keepOut: [],
    };
  if (id === 'release')
    return {
      volume: box([-halfWidth, halfHeight * 1.6, -6], [halfWidth, halfHeight * 3, 4]),
      radius: [0.4, 0.85],
      keepOut: [],
    };
  // Service clusters: between the copy and the photo, in front of the plane.
  const centreX = portrait ? halfWidth * 0.45 : 0;
  const centreY = portrait ? halfHeight * 0.6 : halfHeight * 0.25;
  const spread = portrait ? 1.6 : 2.4;
  return {
    volume: box(
      [centreX - spread, centreY - spread, 0.5],
      [centreX + spread, centreY + spread, 5.5],
    ),
    radius: portrait ? [0.25, 0.45] : [0.3, 0.55],
    keepOut: [],
  };
}

function latexColours(id: FormationId, serviceBlocks: readonly BlockId[]): string[] {
  if (id.startsWith('service-')) {
    const index = Number(id.slice('service-'.length));
    const card = serviceBlocks[index] ?? blockIds[index % blockIds.length]!;
    return clusterBlocks[card].map((block) => blocks[block].hex);
  }
  if (id === 'release')
    return (['sunflower', 'cobalt', 'lilac'] as const).map(
      (block) => blocks[block].hex,
    );
  return blockIds.map((block) => blocks[block].hex);
}

export function buildFormation(
  id: FormationId,
  options: BuildOptions,
): FormationSlot[] {
  const { volume, radius, keepOut } = shape(id, options);
  const seed = seeds[id] ?? 300 + Number(id.slice('service-'.length));
  const placed = layoutFormation({
    count: options.count,
    volume,
    radius,
    keepOut,
    seed,
  });
  // Hidden reuses the hero layout, moved below the frame.
  const offsetY = id === 'hidden' ? -visibleHalfHeight(-10) * 2.2 : 0;
  const latex = latexColours(id, options.serviceBlocks);
  return placed.map((slot, index) => {
    const family = familyOf(index);
    const hex =
      family === 'chrome'
        ? index % 12 === 0
          ? chromeGold
          : chromeSilver
        : family === 'pearl'
          ? paper
          : latex[index % latex.length]!;
    return { ...slot, y: slot.y + offsetY, hex, family };
  });
}
```

- [ ] **Step 5: Run the test**

Run: `pnpm vitest run tests/unit/formation-layout.test.ts`
Expected: PASS. If a `hidden` or `release` case fails the frame check, increase `offsetY` (hidden) or the release volume's minimum y until it passes; keep the assertion as written.

- [ ] **Step 6: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/scenes/formation-layout.ts src/scenes/formations.ts tests/unit/formation-layout.test.ts
git commit -m "feat(scenes): generate collision-free balloon formations with real depth

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: The balloon stage and removal of the old scenes

**Files:**
- Create: `src/scenes/stage.ts`, `src/components/landing/LandingStage.astro`
- Rewrite: `src/scripts/landing.ts`, `tests/unit/landing.test.ts`
- Modify: `src/scenes/material-params.ts:1` (import `Material` from `blocks.ts`), `src/scenes/balloon.ts` (keep only `createBalloonGeometry`), `src/components/PageView.astro` (render `LandingStage` in the `stage` slot), `src/styles/landing.css` (poster fade hook), `tests/unit/scene-foundation.test.ts`
- Delete: `src/scripts/intro.ts`, `src/scripts/palette-picker.ts`, `src/lib/landing/palettes.ts`, `src/lib/landing/events.ts`, `src/lib/landing/intro-plan.ts`, `src/scenes/hero.ts`, `src/scenes/intro.ts`, `src/scenes/confetti.ts`, `src/scenes/release.ts`, `src/scenes/sculptures.ts`, `src/scenes/sculpture-mesh.ts`, `src/scenes/sculpture-parts.ts`, `src/scenes/garland-layout.ts`, `src/scenes/picking.ts`, `src/scenes/palette-source.ts`, `src/scenes/materials.ts`, `src/scenes/balloon-motion.ts`, `tests/unit/intro.test.ts`, `tests/unit/palette-picker.test.ts`, `tests/unit/palettes.test.ts`, `tests/unit/scene-layouts.test.ts`

**Interfaces:**
- Consumes: `buildFormation`, `CAMERA_Z`, `CAMERA_FOV`, `FormationSlot` (Task 11); `formationEvent`, `isFormationId`, `resolveFormation`, `FormationId` (Task 6); `isBlockId`, `paper` (Task 1); `createRenderer`, `fitCamera`, `compileScene` (`src/scenes/renderer.ts`); `FrameLoop` (`src/scenes/loop.ts`); `studioEnvironment` (`src/scenes/environment.ts`); `surface` (`src/scenes/material-params.ts`); `createBalloonGeometry` (`src/scenes/balloon.ts`); `mountIsland`, `afterLoad`, `afterInteraction` (`src/lib/canvas-island/lifecycle.ts`).
- Produces: `createStageScene(canvas: HTMLCanvasElement, capability: Capability): Promise<IslandScene>`; `sceneLoaders = { stage }`; the landing root gets `data-stage="live"` once the stage renders. In dev builds only, `globalThis.__one23Poster(): string` returns a WebP data URL of the hero formation in one pass (used by Task 13).

- [ ] **Step 1: Write the failing landing lifecycle test**

Replace `tests/unit/landing.test.ts` with a suite over the new `initLanding`. It mocks `mountIsland`'s collaborators through `options.loaders`, `options.capability`, `options.start`, `options.engage` and `options.motion`:

```ts
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import type { IslandScene } from '../../src/lib/canvas-island/lifecycle.ts';

let dom: JSDOM;
const now = (run: () => void) => {
  run();
  return () => undefined;
};
const capability = (overrides: Partial<Capability> = {}): Capability => ({
  webgl: true,
  reducedMotion: false,
  tier: 'high',
  pixelRatio: 1,
  ...overrides,
});
const scene = (): IslandScene => ({
  start: vi.fn(),
  stop: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
});

beforeEach(() => {
  dom = new JSDOM(`<body>
    <div class="stage" data-island="stage"><canvas></canvas></div>
    <div data-landing data-formation="hero"></div></body>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('IntersectionObserver', undefined);
  vi.stubGlobal('ResizeObserver', undefined);
});
afterEach(() => vi.unstubAllGlobals());

async function load() {
  return import('../../src/scripts/landing.ts');
}
const root = () => dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLanding', () => {
  it('mounts the stage outside the landing root, marks it live, then disposes', async () => {
    const { initLanding } = await load();
    const created = scene();
    const motionDispose = vi.fn();
    const dispose = initLanding(root(), {
      capability: capability(),
      start: now,
      loaders: { stage: async () => async () => created },
      motion: () => motionDispose,
    });
    await vi.waitFor(() => expect(created.start).toHaveBeenCalled());
    expect(root().dataset.stage).toBe('live');
    dispose();
    expect(created.dispose).toHaveBeenCalled();
    expect(motionDispose).toHaveBeenCalled();
  });

  it('does nothing before the start schedule fires', async () => {
    const { initLanding } = await load();
    const probe = vi.fn(() => capability());
    const motion = vi.fn(() => () => undefined);
    initLanding(root(), {
      capability: probe,
      start: () => () => undefined,
      motion,
    });
    expect(probe).not.toHaveBeenCalled();
    expect(motion).not.toHaveBeenCalled();
  });

  it('on the low tier waits for engagement before loading the stage', async () => {
    const { initLanding } = await load();
    let engage: () => void = () => undefined;
    const load3d = vi.fn(async () => async () => scene());
    initLanding(root(), {
      capability: capability({ tier: 'low' }),
      start: now,
      engage: (run) => {
        engage = run;
        return () => undefined;
      },
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    engage();
    await vi.waitFor(() => expect(load3d).toHaveBeenCalled());
  });

  it('keeps the poster when WebGL or motion is unavailable', async () => {
    const { initLanding } = await load();
    const load3d = vi.fn();
    initLanding(root(), {
      capability: capability({ webgl: false }),
      start: now,
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });
});
```

These four tests replace the old eight, which covered the intro and palette picker.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/landing.test.ts`
Expected: FAIL, the stage element is outside the root and `data-stage` is never set.

- [ ] **Step 3: Rewrite `src/scripts/landing.ts`**

```ts
import {
  browserProbe,
  detectCapability,
  type Capability,
} from '../lib/canvas-island/capability.ts';
import {
  afterInteraction,
  afterLoad,
  mountIsland,
  type Schedule,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  /** A value, or a probe that runs only once the page may start 3D work. */
  capability?: Capability | (() => Capability);
  loaders?: SceneLoaders;
  motion?: (root: HTMLElement) => () => void;
  /** When 3D and motion work may begin; defaults to after load and idle. */
  start?: Schedule;
  /** When low-tier islands may start; defaults to the first interaction. */
  engage?: Schedule;
};

// Dynamic imports keep Three.js out of the initial page script.
export const sceneLoaders: SceneLoaders = {
  stage: async () => (await import('../scenes/stage.ts')).createStageScene,
};

// Chapter motion reads layout, so its module loads after first paint.
export function loadLandingMotion(root: HTMLElement): () => void {
  let dispose: (() => void) | undefined;
  let cancelled = false;
  import('./landing-motion.ts').then(
    ({ initLandingMotion }) => {
      if (!cancelled) dispose = initLandingMotion(root);
    },
    (error: unknown) => console.warn('Landing motion unavailable.', error),
  );
  return () => {
    cancelled = true;
    dispose?.();
  };
}

export function initLanding(
  root: HTMLElement,
  options: LandingOptions = {},
): () => void {
  const doc = root.ownerDocument;
  const loaders = options.loaders ?? sceneLoaders;
  const start = options.start ?? afterLoad(doc);
  const engage =
    options.engage ?? afterInteraction(doc.defaultView ?? globalThis);
  const cleanups: Array<() => void> = [];
  let disposed = false;

  const begin = () => {
    if (disposed) return;
    const capability =
      typeof options.capability === 'function'
        ? options.capability()
        : (options.capability ?? detectCapability(browserProbe()));
    cleanups.push((options.motion ?? loadLandingMotion)(root));
    // Phones keep the poster still until the visitor engages, so the stage
    // build never blocks the page while it is being read.
    if (capability.tier === 'low')
      cleanups.push(engage(() => islands(capability)));
    else islands(capability);
  };
  // The stage lives outside the landing root (beside the smooth-scroll
  // wrapper), so islands are looked up in the whole document.
  const islands = (capability: Capability) => {
    if (disposed) return;
    for (const element of doc.querySelectorAll<HTMLElement>('[data-island]')) {
      const load = loaders[element.dataset.island ?? ''];
      if (!load) continue;
      const island = mountIsland({
        element,
        load,
        capability,
        onState: (state) => {
          if (state === 'live') root.dataset.stage = 'live';
          else delete root.dataset.stage;
        },
      });
      cleanups.push(() => island.dispose());
    }
  };
  cleanups.push(start(begin));
  return () => {
    disposed = true;
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

`mountIsland` sets state `fallback` synchronously when WebGL is missing or reduced motion is on, which deletes `data-stage`, so the poster stays.

- [ ] **Step 4: Run the lifecycle test**

Run: `pnpm vitest run tests/unit/landing.test.ts`
Expected: PASS.

- [ ] **Step 5: Slim the reused scene modules**

In `src/scenes/material-params.ts`, change the first line to `import type { Material } from '../lib/landing/blocks.ts';`.

In `src/scenes/balloon.ts`, keep only `createBalloonGeometry` and its `SphereGeometry` import; delete the `Balloon` class, `BalloonState` and the `balloon-motion.ts` import.

In `tests/unit/scene-foundation.test.ts`, delete the `describe` blocks "balloon motion", "Balloon", "firstPoppable", "Confetti", "PaletteMaterials" and "palette source" and their now-unused imports; keep "mulberry32", "material parameters" and "compileScene".

- [ ] **Step 6: Create `src/scenes/stage.ts`**

```ts
import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  InstancedMesh,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { isBlockId, paper, type Material } from '../lib/landing/blocks.ts';
import {
  formationEvent,
  isFormationId,
  resolveFormation,
  type FormationId,
} from '../lib/landing/formations.ts';
import { mulberry32 } from '../lib/random.ts';
import { createBalloonGeometry } from './balloon.ts';
import { studioEnvironment } from './environment.ts';
import { buildFormation, CAMERA_FOV, CAMERA_Z, familyOf } from './formations.ts';
import { FrameLoop } from './loop.ts';
import { surface } from './material-params.ts';
import { compileScene, createRenderer, fitCamera } from './renderer.ts';

type Body = {
  position: Vector3;
  velocity: Vector3;
  target: Vector3;
  radius: number;
  colour: Color;
  from: Color;
  to: Color;
  colourStart: number;
  phase: number;
  family: Material;
  slot: number;
};

const COLOUR_TIME = 0.8;
const families: Material[] = ['latex', 'pearl', 'chrome'];

export async function createStageScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const count = high ? 30 : 14;
  const root = doc.querySelector<HTMLElement>('[data-landing]');
  // Only the high tier draws a back pass, onto a 2D canvas behind the content.
  const back = high
    ? doc.querySelector<HTMLCanvasElement>('[data-stage-back]')
    : null;
  const backContext = back?.getContext('2d') ?? null;
  const serviceBlocks = [
    ...doc.querySelectorAll<HTMLElement>('[data-service-card]'),
  ]
    .map((card) => card.dataset.block ?? '')
    .filter(isBlockId);

  const renderer = createRenderer(canvas, capability);
  renderer.localClippingEnabled = true;
  renderer.autoClear = false;
  const scene = new Scene();
  scene.fog = new FogExp2(new Color(paper), 0.028);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xdadad4, 0.6));
  const key = new DirectionalLight(0xffffff, 1.35);
  key.position.set(4, 6, 10);
  scene.add(key);
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 120);
  camera.position.set(0, 0, CAMERA_Z);

  // One clipping plane always, so switching passes never changes the shader.
  const clip = new Plane(new Vector3(0, 0, 1), 1000);
  const geometry = createBalloonGeometry(high ? 40 : 24);
  const random = mulberry32(17);
  const bodies: Body[] = Array.from({ length: count }, (_, index) => ({
    position: new Vector3(0, -30, 0),
    velocity: new Vector3(),
    target: new Vector3(0, -30, 0),
    radius: 0.6,
    colour: new Color(paper),
    from: new Color(paper),
    to: new Color(paper),
    colourStart: -1,
    phase: random() * Math.PI * 2,
    family: familyOf(index),
    slot: 0,
  }));
  const meshes = families.map((family) => {
    const members = bodies.filter((body) => body.family === family);
    members.forEach((body, slot) => (body.slot = slot));
    const material = new MeshPhysicalMaterial({
      ...surface[family],
      envMap: environment.texture,
      clippingPlanes: [clip],
    });
    const mesh = new InstancedMesh(geometry, material, Math.max(1, members.length));
    mesh.count = members.length;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { family, material, mesh };
  });
  const meshOf = (family: Material) =>
    meshes.find((entry) => entry.family === family)!.mesh;

  let aspect = 1;
  let now = 0;
  let stiffness = 14;
  let formation: FormationId = 'hero';
  let parked = false;
  const pointer = { x: 0, y: 0 };

  const apply = (id: FormationId) => {
    formation = resolveFormation(id, capability.tier);
    const slots = buildFormation(formation, {
      count,
      aspect,
      tier: capability.tier,
      serviceBlocks,
    });
    slots.forEach((slot, index) => {
      const body = bodies[index]!;
      body.target.set(slot.x, slot.y, slot.z);
      body.radius = slot.radius;
      body.from.copy(body.colour);
      body.to.set(slot.hex);
      body.colourStart = now + random() * 0.3;
    });
    // Released balloons float up slowly; everything else regroups briskly.
    stiffness = formation === 'release' ? 3 : 14;
    parked = false;
    setVisible(true);
  };
  const setVisible = (visible: boolean) => {
    canvas.style.visibility = visible ? '' : 'hidden';
    if (back) back.style.visibility = visible ? '' : 'hidden';
  };

  const initial = root?.dataset.formation ?? 'hero';
  const onFormation = (event: Event) => {
    const id = (event as CustomEvent<{ id: string }>).detail?.id;
    if (id && isFormationId(id)) apply(id);
  };
  doc.addEventListener(formationEvent, onFormation);
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = (event.clientY / innerHeight) * 2 - 1;
  };
  if (high) doc.addEventListener('pointermove', onPointer, { passive: true });

  const dummy = new Object3D();
  const step = (time: number, delta: number) => {
    now = time;
    const damping = 2 * Math.sqrt(stiffness);
    let moving = false;
    for (const body of bodies) {
      const ax = (body.target.x - body.position.x) * stiffness - body.velocity.x * damping;
      const ay = (body.target.y - body.position.y) * stiffness - body.velocity.y * damping;
      const az = (body.target.z - body.position.z) * stiffness - body.velocity.z * damping;
      body.velocity.x += ax * delta;
      body.velocity.y += ay * delta;
      body.velocity.z += az * delta;
      body.position.addScaledVector(body.velocity, delta);
      if (body.position.distanceToSquared(body.target) > 0.0025) moving = true;
      if (body.colourStart >= 0 && time >= body.colourStart) {
        const k = Math.min(1, (time - body.colourStart) / COLOUR_TIME);
        body.colour.copy(body.from).lerp(body.to, k * k * (3 - 2 * k));
        if (k >= 1) body.colourStart = -1;
      }
      const mesh = meshOf(body.family);
      dummy.position.set(
        body.position.x,
        body.position.y + Math.sin(time * 0.6 + body.phase) * 0.08,
        body.position.z,
      );
      dummy.rotation.set(0, 0, Math.sin(time * 0.4 + body.phase) * 0.08);
      dummy.scale.setScalar(body.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(body.slot, dummy.matrix);
      mesh.setColorAt(body.slot, body.colour);
    }
    for (const { mesh } of meshes) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    if (formation === 'hidden' && !moving) {
      parked = true;
      setVisible(false);
    }
  };
  const draw = () => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.clear();
    if (back && backContext) {
      // Behind the content: everything at or behind the headline plane.
      clip.normal.set(0, 0, -1);
      clip.constant = 0;
      renderer.render(scene, camera);
      backContext.clearRect(0, 0, back.width, back.height);
      backContext.drawImage(canvas, 0, 0, back.width, back.height);
      renderer.clear();
      clip.normal.set(0, 0, 1);
      clip.constant = 0;
    } else {
      clip.normal.set(0, 0, 1);
      clip.constant = 1000;
    }
    renderer.render(scene, camera);
  };
  const loop = new FrameLoop(renderer, (time, delta) => {
    if (parked) return;
    step(time, delta);
    if (!parked) draw();
  });

  if (import.meta.env.DEV)
    (globalThis as { __one23Poster?: () => string }).__one23Poster = () => {
      apply('hero');
      for (const body of bodies) {
        body.position.copy(body.target);
        body.velocity.set(0, 0, 0);
        body.colour.copy(body.to);
        body.colourStart = -1;
      }
      pointer.x = 0;
      pointer.y = 0;
      camera.position.set(0, 0, CAMERA_Z);
      step(now, 0);
      clip.normal.set(0, 0, 1);
      clip.constant = 1000;
      renderer.clear();
      renderer.render(scene, camera);
      return canvas.toDataURL('image/webp', 0.9);
    };

  apply(isFormationId(initial) ? initial : 'hero');
  for (const body of bodies) body.position.copy(body.target).add(new Vector3(0, -12, 0));
  await compileScene(renderer, scene, camera);
  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      if (back) {
        back.width = canvas.width;
        back.height = canvas.height;
      }
      aspect = width / Math.max(1, height);
      apply(formation);
      step(now, 0);
      draw();
    },
    dispose: () => {
      loop.stop();
      doc.removeEventListener(formationEvent, onFormation);
      doc.removeEventListener('pointermove', onPointer);
      setVisible(true);
      for (const { mesh, material } of meshes) {
        mesh.dispose();
        material.dispose();
      }
      geometry.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
```

Notes for the implementer: the balloons start 12 units below their hero targets, so the first frames show them rising into place. `resize` re-applies the current formation because volumes depend on the aspect ratio. `fitCamera` sets the drawing buffer size; the back canvas copies that exact size and CSS stretches both canvases to the viewport.

- [ ] **Step 7: Create `LandingStage.astro` and render it**

`src/components/landing/LandingStage.astro`:

```astro
---
// Fixed, decorative canvases. They sit outside the smooth-scroll wrapper so
// fixed positioning is not broken by its transform.
---

<canvas class="stage-canvas stage-back" data-stage-back aria-hidden="true"
></canvas>
<div class="stage" data-island="stage">
  <canvas class="stage-canvas stage-front" aria-hidden="true"></canvas>
</div>
```

In `PageView.astro`, import it and add `{landing && <LandingStage slot="stage" />}` inside `BaseLayout`.

- [ ] **Step 8: Delete the old scenes, scripts and tests**

```bash
git rm src/scripts/intro.ts src/scripts/palette-picker.ts src/lib/landing/palettes.ts src/lib/landing/events.ts src/lib/landing/intro-plan.ts src/scenes/hero.ts src/scenes/intro.ts src/scenes/confetti.ts src/scenes/release.ts src/scenes/sculptures.ts src/scenes/sculpture-mesh.ts src/scenes/sculpture-parts.ts src/scenes/garland-layout.ts src/scenes/picking.ts src/scenes/palette-source.ts src/scenes/materials.ts src/scenes/balloon-motion.ts tests/unit/intro.test.ts tests/unit/palette-picker.test.ts tests/unit/palettes.test.ts tests/unit/scene-layouts.test.ts
grep -rn "palettes\|intro-plan\|palette-picker\|landing/events\|garland\|sculpture\|confetti\|data-palette" src tests
```

Expected: the grep prints nothing. Fix any remaining reference (for example a leftover CSS selector).

- [ ] **Step 9: Run the gates**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`
Expected: all pass, including the integration test that keeps Three.js out of the initial page script and finds a lazy chunk with `WebGLRenderer`.

- [ ] **Step 10: Verify in the browser**

At 1440x900 (high tier): balloons rise into the hero; some are behind the headline letters and some in front, and none intersect; moving the mouse shifts the view slightly. Scroll: they drift far back behind the statement text; regroup beside each service card in the two contrasting colours, recolouring per card; drift behind the marquee; fall away below the frame and disappear for the celebrations wall (check with `javascript_tool` that the front canvas has `style.visibility === 'hidden'` there); and float up and out across the pink closing screen. Check frame time with:

```js
await new Promise((resolve) => { const t = []; let last = performance.now(); const tick = (now) => { t.push(now - last); last = now; t.length < 120 ? requestAnimationFrame(tick) : resolve(t.sort((a, b) => a - b)[108]); }; requestAnimationFrame(tick); })
```

Expected: the 90th-percentile frame is under 20ms in the hero and in a service card. If the hero is slower on this machine, report the number; Task 15 decides whether to turn off the back pass.

At 390x844 with the `mobile` preset (low tier): no back canvas content, the stage loads only after the first scroll or tap, the hero balloons stay out of the headline band, and the statement shows no balloons.

- [ ] **Step 11: Commit**

```bash
git add -A src tests
git commit -m "feat(scenes): replace the old scenes with one travelling balloon stage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Hero poster still

**Files:**
- Create: `src/assets/stage/hero-poster.webp`
- Modify: `src/components/landing/HeroChapter.astro`, `src/styles/landing.css`, `docs/photo-sources.md`

**Interfaces:**
- Consumes: `globalThis.__one23Poster()` (Task 12, dev only); `data-stage="live"` on the landing root (Task 12).
- Produces: `.hero-poster` image shown until the stage is live, and permanently without WebGL or with reduced motion.

- [ ] **Step 1: Capture the poster**

Run the dev server, open `http://localhost:4321/one23balloon/` in the built-in browser and resize to 1600x1000. Wait until the stage is live (`document.querySelector('[data-landing]').dataset.stage === 'live'`). Then run with `javascript_tool`:

```js
const url = globalThis.__one23Poster(); const link = Object.assign(document.createElement('a'), { href: url, download: 'hero-poster.webp' }); document.body.append(link); link.click(); link.remove(); url.length
```

This triggers a browser download, which needs the user's approval: ask the controller to get it, naming the file (`hero-poster.webp`), the source (the local dev page) and the size (the returned length times 0.75 bytes). After approval, move the file from the user's Downloads folder to `src/assets/stage/hero-poster.webp`. Open it with the Read tool and confirm a transparent background with the full hero cluster and no clipping at the edges.

- [ ] **Step 2: Render the poster in the hero**

In `HeroChapter.astro` add `import { Image } from 'astro:assets'; import poster from '../../assets/stage/hero-poster.webp';` and, as the first child of the section:

```astro
  <Image
    class="hero-poster"
    src={poster}
    alt=""
    aria-hidden="true"
    widths={[800, 1200, 1600]}
    sizes="100vw"
    loading="eager"
    decoding="async"
  />
```

Add to `src/styles/landing.css`, under the hero rules:

```css
.hero-poster {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: contain;
  z-index: -1;
  pointer-events: none;
  transition: opacity 0.4s var(--ease-out);
}
.landing[data-stage='live'] .hero-poster {
  opacity: 0;
}
```

- [ ] **Step 3: Record the generated image**

Add a section to `docs/photo-sources.md`:

```markdown
## Generated images

| File | How it was made |
| --- | --- |
| src/assets/stage/hero-poster.webp | Captured on 2026-10-30 from the live stage's hero formation (30 balloons, one pass, transparent background) at 1600x1000 in the dev build through `globalThis.__one23Poster()`. Recapture after any change to formations, colours or materials. |
```

- [ ] **Step 4: Verify**

With the stage live the poster fades out and the live cluster sits where the poster was. To see the fallback, set `document.querySelector('[data-landing]').removeAttribute('data-stage')` in the console: the poster returns at full opacity. The unit test "keeps the poster when WebGL or motion is unavailable" (Task 12) covers the real fallback path. Confirm the built HTML for `/` contains one `.hero-poster` with `alt=""`.

- [ ] **Step 5: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add src/assets/stage/hero-poster.webp src/components/landing/HeroChapter.astro src/styles/landing.css docs/photo-sources.md
git commit -m "feat(hero): show a captured poster still until the stage is live

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Share image and SEO copy

**Files:**
- Modify: `public/og-one23balloon.jpg`
- Modify: `src/content/pages/en/home.md`, `src/content/pages/zh/home.md` (description only, if needed)
- Modify: `docs/photo-sources.md` (the OG paragraph)

**Interfaces:**
- Consumes: celebration photos (Task 3).

- [ ] **Step 1: Pick and crop a colourful share image**

Choose the most colourful celebration photo whose 1200x630 crop shows no printed names, faces or text. Generate the share image (adjust `left` and `top` to the chosen region):

```bash
node --input-type=module -e "import sharp from 'sharp'; await sharp('src/assets/work/gallery-<nn>.jpg').extract({ left: <x>, top: <y>, width: <w>, height: Math.round(<w> * 630 / 1200) }).resize(1200, 630).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og-one23balloon.jpg');"
```

Open the result with the Read tool and confirm no names, faces or text.

- [ ] **Step 2: Update the record**

Rewrite the `public/og-one23balloon.jpg` paragraph in `docs/photo-sources.md` with the new source file, crop region and the same "no printed names" rule.

- [ ] **Step 3: Check the page descriptions**

Read `src/content/pages/en/home.md` and `zh/home.md`. The en description already describes the services; keep it unless it mentions removed content (palettes, steps, FAQ). If the zh description mentions removed content, rewrite it as 为婚礼、开业典礼、生日与宝宝庆典打造的气球布置，服务吉隆坡与雪兰莪。 and rerun `pnpm fonts:subset`.

- [ ] **Step 4: Run the gates and commit**

Run: `pnpm lint && pnpm check && pnpm test && pnpm build`

```bash
git add public/og-one23balloon.jpg docs/photo-sources.md src/content/pages public/fonts src/lib/fonts/zh-charset.txt
git commit -m "feat(seo): use a colourful celebration photo for the share image

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Accessibility, performance and evidence

**Files:**
- Modify: `docs/quality-report.md`, `brief.md`, `CHANGELOG.md`, `README.md` (dependency notes only if anything changed)

**Interfaces:**
- Consumes: the finished page.

- [ ] **Step 1: Run the gates from clean**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test
pnpm build
```

Expected: install clean, lint passes, check reports 0 errors, warnings and hints, tests all pass (record the count), build writes `/`, `/zh/` and 404. Record each result.

- [ ] **Step 2: Reduced motion and no-JavaScript check**

The built-in browser can emulate colour scheme but not `prefers-reduced-motion`. Verify reduced motion by the code paths and their tests: every chapter and the smoother run inside `motionQueries` media queries (Task 6 test), and `mountIsland` refuses the stage when `capability.reducedMotion` (Task 12 test "keeps the poster when WebGL or motion is unavailable"). No chapter content depends on JavaScript; the integration test "renders every chapter and photo in static HTML" covers it. Use `pnpm preview` (port 4322; check whether PID 37836 from the earlier session still holds it) for Steps 3 and 4. Record in the report that reduced motion was verified by tests and code reading, not by emulation.

- [ ] **Step 3: Visual evidence**

For en and zh at 360x780, 768x1024, 1280x800 and 1440x900, screenshot each chapter at rest and the hero mid-split, a service card transition, the tilted celebrations entry and the closing flood. Confirm at every size: the header is on one line and at most 64px tall; no horizontal overflow (`document.documentElement.scrollWidth === innerWidth`); balloons never intersect each other in the hero and a service card; every CTA is on one line. Save screenshots under `docs/evidence/2026-10-30-redesign/` only if earlier evidence in the repository was committed the same way (check `docs/quality-report.md`); otherwise keep them in the scratchpad and list them in the report.

- [ ] **Step 4: Lighthouse**

Run Lighthouse mobile and desktop for `/` and `/zh/` against `pnpm preview`, the same way as the earlier performance follow-up (see `docs/quality-report.md` for the exact command it recorded). Targets: performance 90 or higher on mobile for both locales, accessibility, best practices and SEO 100, CLS below 0.1. If mobile performance is below 90, profile, fix (for example smaller poster widths, lazier celebration images, fewer balloons on low tier) and rerun; if the high-tier hero frame time from Task 12 was above 20ms, turn off the back pass for that case and record the decision.

- [ ] **Step 5: Update the documents**

- `docs/quality-report.md`: a new dated section for the redesign with the gate results, test count, Lighthouse scores per locale and form factor, the evidence list, and limitations (for example reduced motion verified by code reading, actionlint and Docker still not run).
- `brief.md`: in "Pending client confirmation", remove the FAQ answers and booking steps items; add approval of the new photos (list the files with faces or printed names from `docs/photo-sources.md`), the new en and zh copy, and the poster still.
- `CHANGELOG.md`: an entry for the showcase redesign under the unreleased heading, listing what changed and what was removed.
- `README.md`: only if dependency notes mention Fraunces or the palette picker; otherwise leave it.

- [ ] **Step 6: Commit**

```bash
git add docs/quality-report.md brief.md CHANGELOG.md README.md
git commit -m "docs: record the showcase redesign evidence and client sign-off items

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Hand back for publishing**

Do not push. Report to the user the branch, the commit list, the gate and Lighthouse results, the evidence and limitations, and ask whether to push `redesign-showcase` and open a pull request.
