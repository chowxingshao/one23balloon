# Gala atelier

Selected 2026-10-29 for one23balloon, replacing the template's editorial demonstration. It evolved from the "Soft atelier" option after the client direction 宏大、高级、不低俗、不幼稚、colourful: balloons are presented as art objects and event styling, never as cartoons.

## Concept

Balloons as sculpture, colour as curation. The page reads like a styling studio's lookbook: warm ivory space, very large light serif headlines, full-bleed photography of real setups, and real-time 3D balloon installations in latex, pearl and mirror chrome. It is colourful across the scroll because each section wears one of the client's real palettes, while every single view stays harmonious.

## Palette

Base (light scheme):

| Token   | Value   | Use                                  |
| ------- | ------- | ------------------------------------ |
| paper   | #F7F1EA | Page background                      |
| surface | #EFE6DC | Quiet panels, arch fills             |
| ink     | #221B17 | Headlines, body text, primary button |
| muted   | #5A4D45 | Supporting text                      |
| rose    | #9C4F5C | Links and accents                    |

Base (dark scheme, "evening gala"):

| Token   | Value   | Use               |
| ------- | ------- | ----------------- |
| paper   | #171311 | Page background   |
| surface | #241E1B | Quiet panels      |
| ink     | #F4EDE4 | Text              |
| muted   | #C9BCB1 | Supporting text   |
| rose    | #E9A8B4 | Links and accents |

Celebration palettes, used for section tints, 3D materials and palette picker. Material: L latex, P pearl, C chrome.

| Palette                | Section tint (light) | Section tint (dark) | Colours                                               |
| ---------------------- | -------------------- | ------------------- | ----------------------------------------------------- |
| Blush and champagne    | #F5ECE6              | #2A201F             | #E8B4B2 L, #F3DCCB L, #D9B47A C, #FBF4EC P, #C9898C L |
| Chrome blue and silver | #EDF0F4              | #1C222B             | #6F8FB8 C, #C7CCD4 C, #F4F6F8 P, #A9C3E0 L, #2E4A72 L |
| Sage and cream         | #EFF0E8              | #1F231D             | #A7B79A L, #E9E1CF L, #FAF6EE P, #CBB27C C, #6F8466 L |
| Rose and gold          | #F6ECEA              | #2B1D20             | #B5475B L, #D4AF6A C, #E8A0A8 L, #FFF5EE P, #7D2338 L |
| Jewel tones            | #F3EFE8              | #1E2026             | #2F5D8C L, #C94F6D L, #E8B04B L, #3E8E7E L, #C7CCD4 C |

Text always sits on paper, surface or a section tint, never on a saturated balloon colour. Ink and muted text meet WCAG AA on every tint in both schemes; rose links meet AA on paper and surface. Recheck every value after any change.

## Typography

- English display: Fraunces, light (300) at large sizes, 400 for smaller headings. Fluid display sizes span roughly 44–120px.
- English body: Source Sans 3 (already self-hosted), 18px, line height 1.65.
- Chinese display: Noto Serif SC 400.
- Chinese body: Noto Sans SC 400.
- All fonts are self-hosted with `font-display: swap` under the SIL Open Font License, with license files kept in `public/fonts/`. Chinese fonts are subset to the characters used in the `zh` content; a test fails if any character is missing from the subset.

## Layout

- 80rem shell, reading text within 44rem.
- Spacing scale 0.5, 1, 1.5, 2.5, 4rem; page sections 5–9rem, fluid.
- Arched frames (semicircle top) for photos and panels, echoing the client's arch backdrops.
- Full-bleed photography between 3D moments. Captions follow the client's format "Location｜Theme" with palette dots.
- Logical properties throughout; layout checked at 360, 768 and 1280px.

## Image treatment

Real photos of the client's setups, selected from their Instagram, processed by Astro's image pipeline to responsive AVIF/WebP with explicit dimensions. Prefer setup-only shots without text overlays. No filters or colour grading: photos stay true to the work.

## Motion character

Cinematic but composed:

- Easing `power3.out` / `expo.out` for reveals, 0.6–1.1s; elastic only for balloon inflation.
- Intro: balloon wall pops in a centre-out cascade with foil confetti, about 2s, once per session, skippable.
- Hero: 3D garland sways gently; palette changes sweep across the installation in about 0.9s.
- Sculptures rotate slowly on pedestals. Balloons pop on click or tap and re-inflate.
- Gallery pins and scrolls horizontally; venue names move in a slow marquee; balloons rise at the closing call to action.
- Nothing pulses, flashes or loops fast. No cursor-follow effects.

## Accessibility and fallbacks

- All content is in the static HTML and visible without JavaScript.
- 3D canvases and decorative balloons are `aria-hidden`; every control is a real button or link.
- `prefers-reduced-motion: reduce` disables the intro, 3D animation, pinning and marquee; static photos replace 3D spots.
- No WebGL or a lost GPU context falls back to the same static photos.
- Keyboard focus uses a 3px contrasting outline with 4px offset; the skip link appears on focus.
