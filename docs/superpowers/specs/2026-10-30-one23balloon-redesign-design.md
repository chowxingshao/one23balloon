# one23balloon showcase redesign: design

Date: 2026-10-30. Status: approved in brainstorming, pending implementation plan.

Supersedes the visual direction, page structure, 3D scenes and content model of [the 2026-10-29 landing design](2026-10-29-one23balloon-landing-design.md). Configuration, routing, hosting, SEO, the WhatsApp number and the governance rules in that spec still apply unless this document changes them.

Related: [brief](../../../brief.md), [architecture](../../architecture.md), [photo sources](../../photo-sources.md).

## Goal

Rebuild the one23balloon page as a pure showcase of what the studio does and the events it has styled. It must feel premium and grand (宏大、高级), be as colourful as the studio's Instagram, put the brand front and centre with very large type, and move at the level of whole sections rather than single elements fading in.

## Why the first version is being replaced

The user rejected the Gala atelier build for these reasons, and every one is a hard requirement of this redesign:

1. Text is too small, does not feel premium or grand, and does not carry the brand.
2. The 3D balloons overlap each other and sit on one depth plane.
3. A light and a dark scheme. Only one theme is wanted.
4. Photos in arched and oval frames.
5. Fonts with no character.
6. The "Where we set up" venue marquee and carousel.
7. A two-question FAQ.
8. Sections that are not showcase: FAQ, venues, contact steps, palette picker.
9. Not colourful enough.
10. GSAP motion that is too subtle and tied to individual elements.

## References

Studied on 2026-10-30. They set the motion and composition vocabulary; nothing is copied from them.

| Reference | Taken from it |
| --- | --- |
| Credo (video 1) | One 3D object travels through the page; the hero headline splits apart around it; list rows react as it passes. |
| "Stories in Motion" (video 2) | Photos and icons inline inside a headline sentence; cards fanning and flying; whole-section background changes. |
| Strawberry juice (video 3) | One giant word with the subject in the middle and objects floating in front and behind. |
| C8VN (video 4) | 3D spheres at real depth; whole-section curtain wipes; huge condensed headlines. |
| Qwero (video 5) | Whole sections tilt and skew in perspective on scroll; bold pink, blue and black blocks; giant wordmark footer. |
| Adobe MAX | Very heavy, very large sans headlines; colourful photo grids; full-bleed imagery. |
| Stretch, Knm, Blitz (Dribbble stills) | Big-type heroes with one strong visual; rounded photo panels; bold colour against a quiet canvas. |

## Decisions

| Topic | Decision |
| --- | --- |
| Direction | "Colour block": off-white canvas with full-bleed saturated colour blocks. |
| Theme | One theme. No `prefers-color-scheme` variant, no dark tokens, no palette picker. |
| Display type | Unbounded Black (900). Chinese display: Noto Sans SC Black (900). |
| Body type | Source Sans 3 (already self-hosted) for English, Noto Sans SC 400 for Chinese. |
| Photo shape | Plain rectangles with one radius (`--radius-photo: 1.25rem`) or full bleed. No arches, no ovals, nothing overlaid on a photo. |
| Sections | Hero, statement, services, signature pieces, recent celebrations, closing with wordmark footer. Removed: intro, palette picker, sculptures as its own section, venues, steps, FAQ. |
| Contact | WhatsApp pill in the header, plus one closing call to action with WhatsApp, Instagram and Xiaohongshu. No form. |
| 3D | One travelling balloon cluster on a single stage, with real depth and a guaranteed no-overlap layout. |
| Motion | GSAP 3.15 with ScrollTrigger, SplitText and ScrollSmoother (all in the existing `gsap` package). |
| Photos | Existing 22 kept where they fit; 25 to 35 more collected from the client's Instagram. |
| Languages | Unchanged: `en` at `/one23balloon/`, `zh` at `/one23balloon/zh/`. |
| Branch | `redesign-showcase`, delivered by pull request. Deploy happens only when the user merges. |

## Refinements from planning (2026-10-30)

The implementation plan settles details this spec left open. Where a sentence elsewhere in this document disagreed, it has been edited to match.

1. The hero display size is `clamp(2.75rem, 10vw, 12rem)`, not 12vw. Unbounded is very wide, so "Every party," at 12vw overflows a 1440px viewport. The exact coefficient is confirmed in the Task 5 browser check.
2. The footer wordmark is about 8.5vw, not 18vw, for the same reason, and is confirmed in Task 5.
3. The celebrations grid has four column lists at 64rem and wider, two multi-columns from 40rem, and one below. The 1024px three-column step is dropped because per-column parallax needs real column elements.
4. The depth-of-field (bokeh) pass is dropped. It needs `EffectComposer`, which conflicts with the two-pass front/back rendering. Depth reads through the narrow field of view, fog and scale.
5. The back pass runs whenever the formation has balloons behind the headline plane (hero, drift), not only in the hero. That is what lets the drift formation sit behind the statement text.
6. On the low tier, `drift` resolves to `hidden`, because without a back canvas the drifting balloons would cover the statement text.
7. Service clusters use the two contrasting block colours from `clusterBlocks` plus chrome and pearl, not the card's own colour, which would vanish against the card. The release formation uses sunflower, cobalt and lilac against the pink flood.
8. The header's one-line fit at 360px is checked in the browser (Task 5 and Task 15), because jsdom cannot measure layout. The schema caps the header pill label at 12 characters.

## Visual system

### Colour

One theme. The canvas and ink are fixed; colour enters as full-bleed blocks and through photos and 3D materials.

| Token | Value | Use | Text on it |
| --- | --- | --- | --- |
| `--paper` | `#F4F4F1` | Page canvas | ink 17.0:1 |
| `--ink` | `#121212` | Text, header pill, buttons on paper | - |
| `--muted` | `#55554F` | Supporting text on paper | 6.8:1 on paper |
| `--pink` | `#FF3E8A` | Block colour, closing flood | ink 5.6:1 |
| `--cobalt` | `#2340FF` | Block colour | white 6.5:1 |
| `--sunflower` | `#FFC21A` | Block colour | ink 11.6:1 |
| `--emerald` | `#14B37D` | Block colour | ink 6.9:1 |
| `--tangerine` | `#FF6A2B` | Block colour | ink 6.6:1 |
| `--lilac` | `#B69CFF` | Block colour | ink 8.2:1 |

Rules:

- Text on cobalt is white; text on every other block is ink. These pairings are the only allowed ones and are checked by a unit test that computes WCAG contrast from the token values (4.5:1 minimum).
- Pure `#000` and `#fff` are not used as surfaces. White is used only as text on cobalt.
- Shadows, where used, are tinted with the block or ink colour, never pure black.

### Typography

- Display: Unbounded 900, self-hosted, subset to Latin. Scale: hero `clamp(2.75rem, 10vw, 12rem)`, chapter titles `clamp(2.75rem, 7vw, 7.5rem)`, card titles `clamp(2rem, 4.5vw, 4.5rem)`. Line height 0.92 to 0.98, tracking -0.02em.
- Chinese display: Noto Sans SC 900, subset by `pnpm fonts:subset` from the `zh` content, line height 1.1.
- Body: Source Sans 3 at `clamp(1.125rem, 1.4vw, 1.375rem)`, line height 1.55, measure 40rem. Chinese body: Noto Sans SC 400.
- Removed: Fraunces and Noto Serif SC, with their licence files.
- Emphasis inside a headline uses the same family; no mixed families.

### Shape and layout

- One radius scale: `--radius-photo: 1.25rem` for photos and cards, full pill for buttons and the header pill.
- Shell up to 90rem with a 4vw gutter (16px minimum). Chapters run 100dvh or taller; nothing uses `100vh`.
- Every multi-column layout states its collapse below 768px: one column, full-width photos, no tilt. The one exception is the celebrations grid, which keeps two multi-columns from 40rem (640px) and becomes one column below that.

## Page structure

Six chapters. No two share a layout family. At most two small labels above headlines on the whole page.

### Header

Wordmark `one23balloon` at the left in Unbounded, `EN / 中文` switcher and a WhatsApp pill at the right, on one line at every width from 360px. Header height 4rem desktop and mobile; the WhatsApp pill shortens to an icon plus "WhatsApp" below 480px so nothing wraps. Sticky, with a paper background that appears after the hero.

### 1. Hero

- Headline over two lines, about 10vw: en "Every party, bigger." / zh "每一场派对，更盛大。". One short lede line (20 words maximum) and no other text. The header pill is the call to action.
- The 3D cluster surrounds the headline: some balloons render behind the letters and some in front (see "Front and back layers").
- Before the 3D starts, the committed poster still occupies the same place, so the first paint already shows balloons.
- Scroll (scrubbed, pinned for about one viewport on desktop): SplitText splits the headline into its two halves per line; left halves move left and right halves move right while the cluster pushes toward the camera, then the chapter releases.

### 2. Statement

- One large sentence, set at chapter-title size, with four small rounded photo pills placed inline between words: en "We style [photo] weddings, [photo] grand openings, [photo] birthdays and [photo] 100-day parties across KL and Selangor." The zh sentence carries the same four pills.
- Scroll (scrubbed): words fill from `--muted` at 25% opacity to `--ink` in reading order; each photo pill scales from 0 to 1 as its word fills.
- No 3D here; the stage is in its "drift" formation and moves behind the text. On the low tier there is no back canvas, so the balloons are hidden here.

### 3. What we do

- Six services as full-screen colour cards in a pinned stack: weddings and proposals (pink), grand openings and corporate (cobalt), milestone birthdays (sunflower), baby celebrations (emerald), car handovers (tangerine), balloon bouquets (lilac).
- Each card: service name at card-title size, one sentence, one large photo in a rounded rectangle on the opposite side, and a small WhatsApp text link with that service's pre-filled message.
- Scroll: each card pins at the top; the next card slides up over it while the previous one scales to 0.9, tilts back (`rotateX` about 8deg) and dims. Mobile: no tilt, cards stack with a simple slide.
- The 3D cluster re-forms beside the card's text in that card's colours (see "Formations").

### 4. Signature pieces

- One giant marquee line in Unbounded at about 14vw: en "Arches · Garlands · Columns · Sculptures · Bouquets", zh equivalent. This is the only marquee on the page.
- The marquee scrolls on its own and reverses direction with scroll direction. Two sculpture photos (the lion-dance head and the red rose) cross it at different parallax speeds, each with a one-line caption below.

### 5. Recent celebrations

- Chapter title at chapter-title size, then a masonry grid of 40 to 50 photos in four column lists at 64rem and wider, two multi-columns from 40rem, one below.
- The section enters tilted: it starts at `rotateX` about 18deg and a slight `skewY`, and flattens to 0 as its top reaches the top of the viewport (scrubbed).
- Inside, columns translate at different speeds (alternate columns faster and slower) while the section is in view.
- Each photo has a short caption below it with the occasion only, for example "21st birthday" or "百日宴". No venues or locations.
- The 3D stage is hidden here and rendering is paused.

### 6. Closing and footer

- A curtain wipe floods the viewport in `--pink` from bottom to top (scrubbed clip-path).
- The cluster's "release" formation: balloons rise and leave the top of the frame.
- Headline "Let's make yours." / "让我们为你布置。" at chapter-title size, with three buttons: WhatsApp (primary, ink), Instagram and Xiaohongshu (outlined ink).
- Footer: the word `ONE23BALLOON` set edge to edge at about 8.5vw, confirmed in the browser; letters drop in with a stagger as the footer enters. Below it, the SSM registration and rights line.

## Content model

### `landing` collection

The schema in `src/content.config.ts` is replaced. Both `en.yaml` and `zh.yaml` must satisfy it, and the build-time parity check stays: same service ids, same celebration ids in the same order, same photo files.

```yaml
whatsapp: '60109017633'
meta: { instagramLabel, xiaohongshuLabel, registration, rights }
header: { whatsapp } # pill label
hero: { title: [line1, line2], lede }
statement:
  parts: # text runs and inline photo pills, in order
    - { text: 'We style' }
    - { word: 'weddings,', photo: { image, alt, source } }
services:
  title
  items: [{ id, colour, title, body, linkLabel, message, photo: { image, alt, source } }]
signature:
  marquee: [Arches, Garlands, Columns, Sculptures, Bouquets]
  pieces: [{ id, caption, photo: { image, alt, source } }]
celebrations:
  title
  items: [{ id, occasion, photo: { image, alt, source } }]
closing: { title, whatsapp, message, instagram, xiaohongshu }
```

- `colour` is one of `pink | cobalt | sunflower | emerald | tangerine | lilac`, validated by the schema, and each service uses a different one.
- Removed keys: `intro`, `palettes`, `sculptures`, `venues`, `steps`, `faq`, and the old `gallery` (its photos move into `celebrations`).
- UI strings that are not content (skip link, language names, aria labels) stay in the i18n dictionaries.

### Photos

- Keep the 22 existing files; most move into `celebrations`. `hero-arch.jpg` is no longer used in the hero.
- Collect 25 to 35 more from https://www.instagram.com/one23balloon/ in the built-in browser, favouring strong colour, and including square and landscape frames where they exist.
- Selection rules are unchanged from `docs/photo-sources.md`: no recognisable customer face as the main subject, no customer brands or logos, no licensed characters, no editing text overlays, sharp, at least 1000px wide. Every file gets a row in `photo-sources.md`, including face and printed-name notes for client sign-off.
- Files wider than 1440px are downscaled to 1440px (JPEG, mozjpeg, quality 86). Astro's image pipeline produces responsive AVIF and WebP with explicit dimensions.
- Masonry needs each photo's aspect ratio at build time; it comes from Astro's image metadata, so no layout shift.

## 3D architecture

### Stage

- One `BalloonStage` replaces the hero, sculptures, release and intro scenes. It owns one `THREE.WebGLRenderer` on a fixed, full-viewport, `aria-hidden`, `pointer-events: none` canvas.
- Balloons are instanced: one instanced mesh per material family (latex, chrome), 30 balloons at the high tier and 14 at the low tier.
- Kept and reused: `src/lib/canvas-island/` (lifecycle, capability tiering), `src/scenes/renderer.ts`, `materials.ts`, `material-params.ts`, `balloon.ts`, `environment.ts`, `loop.ts`. Removed: `garland-layout.ts`, `hero.ts`, `intro.ts`, `confetti.ts`, `release.ts`, `sculpture-*.ts`, `sculptures.ts`, `picking.ts`, `palette-source.ts` and the balloon dog.

### Depth

- Perspective camera with a narrow field of view (about 30 degrees) so depth reads as scale change.
- Balloons spread over at least 12 world units on the z axis.
- Exponential fog towards `--paper` so far balloons lower in contrast.

### No-overlap layout

- `src/scenes/formation-layout.ts` generates each formation's positions with 3D Poisson-disk sampling inside a formation-specific volume. Every pair of balloons keeps a centre distance of at least the sum of their radii plus a 4% gap.
- The generator is deterministic for a given seed, so formations are stable between visits and testable.
- Unit tests: no pair intersects in any formation at any tier count; the z spread of the hero formation is at least 12 units; the generator terminates for every formation at every tier count.

### Formations

| Formation | Chapter | Shape | Colours |
| --- | --- | --- | --- |
| `hero` | Hero | Wide ring around the headline, deep front to back | Mixed: all six block colours plus chrome |
| `drift` (low tier: resolves to `hidden`) | Statement, signature | Small, far back, slow drift | Mixed, low contrast |
| `service-n` | Each service card | Tight cluster beside the card text | Two contrasting block colours (`clusterBlocks`) plus chrome and pearl |
| `hidden` | Celebrations | Off screen, rendering paused | - |
| `release` | Closing | Balloons rise out of the frame | Sunflower, cobalt, lilac and chrome |

- ScrollTrigger maps each chapter to a target formation. Balloons move between formations with a critically damped spring per balloon. The no-overlap guarantee applies to resting formations; during a transition, paths may briefly cross.
- Colour changes tween material colours in about 0.8s.

### Front and back layers

At the high tier:

- Each balloon is in layer `back` or `front` by its z position relative to the headline plane.
- Each frame, the renderer draws the `back` layer, copies the result with `drawImage` to a 2D canvas positioned behind the headline, then clears and draws the `front` layer to the WebGL canvas above the headline. One WebGL context in total.
- Low tier: the back canvas is not created, and the hero formation keeps balloons clear of the headline's bounding box.
- The back pass runs whenever the formation has balloons behind the headline plane (hero and drift).

### Poster still

- `src/assets/stage/hero-poster.png` is a transparent capture of the hero formation, taken from the real scene in the browser and committed. Its capture steps are documented in `docs/photo-sources.md` (a new "Generated images" section).
- It renders in the static HTML, sized and positioned like the live cluster, and is the hero's largest contentful paint candidate.
- When the stage's first frame is ready, the poster cross-fades out over 0.4s.
- It is the hero's only visual when WebGL is unavailable, when the GPU context is lost, or when reduced motion is on.

### Lifecycle and performance

- Tiering stays as implemented in the performance follow-up: on the low tier, the stage loads on the first scroll or tap; on the high tier it loads when the page is idle.
- Three.js is still reached only by dynamic import.
- Rendering pauses when the tab is hidden, while the `hidden` formation is active, and when the stage is off screen at the end of the release.
- Targets: mobile Lighthouse performance 90 or higher for both locales; accessibility, best practices and SEO 100. CLS below 0.1.

## Motion engine

- GSAP 3.15: `ScrollTrigger`, `SplitText`, `ScrollSmoother`. All three are part of the existing `gsap` dependency (free since 3.13), so no package is added.
- ScrollSmoother runs only on `(pointer: fine) and (prefers-reduced-motion: no-preference)` with `min-width: 1024px`. Touch devices keep native scrolling.
- Each chapter has one module in `src/scripts/chapters/` that exports `setup(root): cleanup`. `src/scripts/landing.ts` registers them through one `gsap.matchMedia()` so that a change in motion preference reverts everything.
- Pins use `start: 'top top'`. Every chapter refreshes ScrollTrigger after fonts and images load.
- No `scroll` event listeners; scroll is read only through ScrollTrigger.

### Reduced motion and no JavaScript

- `prefers-reduced-motion: reduce`: no smoother, no pins, no SplitText, no tilt, no marquee movement, no 3D. The poster still is shown, every word is fully visible, the celebrations grid is flat.
- Without JavaScript the page is the same static layout: all text visible, all photos visible, poster still in the hero, marquee shown as a static line.

## Fonts

- Add Unbounded (OFL) as `public/fonts/unbounded-latin.woff2` with `OFL-Unbounded.txt`. It is subset to Latin with `subset-font`, like Source Sans 3.
- Add Noto Sans SC 900 to the `pnpm fonts:subset` pipeline next to the existing 400 subset. The fonts test fails if any `zh` character is missing from either subset.
- Remove Fraunces and Noto Serif SC and their licence files.
- The font decision record (`docs/decisions/0006-font-subsetting.md`) gets an amendment, or a new 0008 record if the pipeline changes shape.

## SEO

Unchanged contracts: titles, descriptions, canonical and hreflang from the manifest, sitemap, Open Graph image. The en and zh titles and descriptions are rewritten for the showcase. `public/og-one23balloon.jpg` is regenerated from a colourful celebration photo, with the same rule that it carries no printed names.

## Testing and validation

- Unit:
  - Landing schema and en/zh parity under the new schema.
  - Block colour contrast pairs.
  - Formation layout: no overlap, depth spread, determinism and termination.
  - Formation scheduling (chapter to formation mapping).
  - Chapter modules return cleanups that revert their tweens and triggers.
  - Reduced-motion path sets no pins and creates no stage.
  - Fonts subset coverage.
- Integration: built HTML for `/` and `/zh/` contains every chapter's text and every photo without JavaScript; no removed section remains; header fits on one line at 360px.
- Gates: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`.
- Browser evidence for both locales at 360, 768, 1280 and 1440px: screenshots of each chapter, with reduced motion on and off. The no-overlap rule is also checked visually in the hero and a service card.
- Lighthouse mobile and desktop for both locales, recorded in `docs/quality-report.md` with limitations.

## Documentation

- `design-direction.md` rewritten as "Colour block".
- `brief.md`: remove the FAQ answers and booking steps from "Pending client confirmation"; add the new photos and the new copy to it.
- `docs/photo-sources.md`: new rows, and the poster capture.
- `CHANGELOG.md`, `docs/quality-report.md`, font decision record, and README dependency notes if anything changes.
- The 2026-10-29 spec is left as is, with a line at its top pointing to this document.

## Out of scope

- New dependencies (none are needed).
- Lightbox or detail pages for celebration photos.
- Prices, testimonials, client brand names.
- Custom domain, analytics.
- Moving `canvas-island` into canvas-base.

## Risks

| Risk | Mitigation |
| --- | --- |
| Enough colourful, rule-compliant photos may not exist on Instagram | Stop at what qualifies; the grid works from 30 photos. Report the count. |
| Two-layer hero rendering costs frame time | High tier only; measured in the performance pass; fall back to front-only if a high-tier hero frame exceeds 16ms. |
| ScrollSmoother conflicts with pinned stacks or the 3D stage | Smoother runs desktop only; pins are created after the smoother; verified in browser evidence. |
| Very large type breaks layouts in Chinese or at 360px | Separate zh line lengths in content; integration test for header fit; screenshots at 360px. |
| Mobile Lighthouse regresses below 90 | Poster still as LCP, stage deferred on low tier, fonts subset, photos lazy below the fold. |
| Client sign-off on new photos and copy | Logged in `brief.md` before launch, like the first build. |
