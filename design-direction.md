# Colour block

Selected 2026-10-30 for one23balloon. It replaces Gala atelier (2026-10-29) at the client's request, after the client rejected small type, overlapping balloons, two colour schemes, arched photo frames, characterless fonts and sections that were not showcase. The client direction stays: 宏大、高级、不低俗、不幼稚、colourful.

## Concept

Balloons and events are the colour. The canvas is a quiet off-white, so every saturated block, photo and balloon reads at full strength. Type is very large and inflated: Unbounded Black set as big as the viewport allows, so the brand is the first thing seen. The page is a showcase of the studio's work, not a brochure.

## Palette

One theme. Block values live in `src/lib/landing/blocks.ts` and are mirrored in `src/styles/tokens.css`; `tests/unit/blocks.test.ts` keeps the two in sync and checks every pairing for WCAG AA (4.5:1).

| Token     | Value   | Use                               | Text on it | Contrast |
| --------- | ------- | --------------------------------- | ---------- | -------- |
| paper     | #F4F4F1 | Page canvas                       | ink        | 17.0     |
| ink       | #121212 | Text, header pill, primary button | n/a        | n/a      |
| muted     | #55554F | Supporting text on paper          | n/a        | 6.8      |
| pink      | #FF3E8A | Block colour, closing flood       | ink        | 5.6      |
| cobalt    | #2340FF | Block colour                      | white      | 6.5      |
| sunflower | #FFC21A | Block colour                      | ink        | 11.6     |
| emerald   | #14B37D | Block colour                      | ink        | 6.9      |
| tangerine | #FF6A2B | Block colour                      | ink        | 6.6      |
| lilac     | #B69CFF | Block colour                      | ink        | 8.2      |

Rules:

- Text on cobalt is white. Text on every other block is ink. No other pairing is allowed.
- Pure black and pure white are not used as surfaces. White appears only as text on cobalt.
- Shadows, where used, are tinted with the block or ink colour.
- Chrome silver (#C7CCD4) and chrome gold (#D9B47A) are 3D material colours only, never text or surfaces.
- Recheck every value after any change.

## Typography

- English display: Unbounded 900, tracking -0.02em, line height 0.92 to 0.98.
- Chinese display: Noto Sans SC 900, line height 1.1.
- Body: Source Sans 3 (English) and Noto Sans SC 400 (Chinese), line height 1.55, measure 40rem.
- No serif anywhere. Emphasis inside a headline uses the same family.

Scale (from `src/styles/tokens.css`):

| Token                 | Value                              | Use            |
| --------------------- | ---------------------------------- | -------------- |
| `--font-size-hero`    | `clamp(2.75rem, 10vw, 12rem)`      | Hero headline  |
| `--font-size-display` | `clamp(2.75rem, 7vw, 7.5rem)`      | Chapter titles |
| `--font-size-title`   | `clamp(2rem, 4.5vw, 4.5rem)`       | Card titles    |
| `--font-size-heading` | `clamp(1.5rem, 2.6vw, 2.25rem)`    | Small headings |
| `--font-size-lead`    | `clamp(1.2rem, 1.6vw, 1.5rem)`     | Lede lines     |
| `--font-size-body`    | `clamp(1.125rem, 1.4vw, 1.375rem)` | Body text      |

## Shape and layout

- One photo radius, `--radius-photo: 1.25rem`, or full bleed. No arches and no ovals.
- Buttons, the header pill and the statement photo pills are full pills.
- Nothing is overlaid on a photo. Captions sit below it.
- Shell up to 90rem with a `--gutter` of `max(1rem, 4vw)`. Chapters run 100dvh or taller.
- Every multi-column layout collapses to one column below 768px, with full-width photos and no tilt. The one exception is the celebrations grid, which keeps two multi-columns from 40rem (640px) and becomes one column below that.

Fit values confirmed in the browser (Task 5), at 360, 390, 768, 1280, 1440 and 1920px in English and Chinese:

- Hero headline stays at `clamp(2.75rem, 10vw, 12rem)`. "Every party," measures 1084px of 1325px available at 1440px, so 12vw would also fit but leaves under 2% spare. At 360px the 2.75rem floor applies and the line ends about 3px past the gutter, still inside the viewport.
- Footer wordmark is `8.5vw`, about 0.89 of the viewport width, against 0.92 available. The landing footer drops the 90rem shell cap so the wordmark keeps that ratio above 1440px.
- Below 48rem, chapter titles and the statement use `clamp(1.75rem, 9vw, 2.75rem)` so "celebrations" and "weddings," never split or clip at 360px, and each statement pill stays on the line of its first word.
- The header is one 60px row at every width. Below 30rem the name, switcher and pill tighten their gaps and sizes to fit 360px.

## Chapters and motion

1. Hero: two-line headline at hero size with balloons in front of and behind the letters. On scroll the headline splits left and right while the cluster pushes toward the camera.
2. Statement: one large sentence with four inline photo pills. Words fill from half strength to ink in reading order as each pill scales in; the starting strength keeps the large text above 3:1 contrast.
3. What we do: six full-screen colour cards in a pinned stack. Each next card slides over the previous one, which scales back, tilts and dims.
4. Signature pieces: one giant marquee line that reverses with scroll direction, crossed by two sculpture photos at different parallax speeds.
5. Recent celebrations: a masonry grid that, from 64rem, enters tilted and flattens on scroll, with columns moving at different speeds. Narrower screens keep it flat. The tilt's perspective grows with the height of the wall so no row passes behind the camera.
6. Closing: a pink curtain wipe floods the viewport, balloons rise out of frame, and a giant footer wordmark drops in letter by letter.

## 3D rules

- One stage and one renderer. A single travelling balloon cluster changes formation per chapter.
- Real depth: a narrow field of view, a wide z spread and fog towards paper.
- No overlaps: every resting formation keeps balloon centres apart by their radii plus a 4% gap, checked by unit tests.
- A committed poster still shows the hero formation on first paint, and stays as the only visual when WebGL is unavailable or motion is reduced.

## Accessibility

- One theme with `color-scheme: light`. No dark tokens and no palette picker.
- `prefers-reduced-motion: reduce` gives a static page: no smoother, pins, tilt, marquee movement or 3D, with the poster still shown.
- All content is in the static HTML and visible without JavaScript.
- 3D canvases and decorative balloons are `aria-hidden`. Every control is a real button or link.
- Keyboard focus uses a 3px outline with a 4px offset in cobalt, and the skip link appears on focus.
