# one23balloon landing page: design

Date: 2026-10-29. Status: approved in brainstorming, pending implementation plan.

Related: [brief](../../../brief.md), [design direction](../../../design-direction.md), [architecture](../../architecture.md), [i18n](../../i18n.md), [content](../../content.md).

## Goal

Replace the canvas-base demonstration with a bilingual, single-page landing site for one23balloon, a KL and Selangor balloon decoration studio. The page should feel grand and premium (宏大、高级、不幼稚), be motion-heavy with real-time 3D balloons, show real photos of their work, and convert visitors into WhatsApp enquiries.

## Decisions

| Topic | Decision |
| --- | --- |
| Site shape | One landing page. Blog, projects and RSS off. Demo `about` and `contact` pages, welcome post and example project removed. |
| Primary action | WhatsApp (`wa.me`) with pre-filled messages per service category and per palette. No contact form. |
| Languages | `en` default at `/`, `zh` (Simplified Chinese) at `/zh/`. |
| Pricing | Not shown. |
| Client brands | Not named or shown. Venue types only. |
| Hosting | GitHub Pages, `url: https://chowxingshao.github.io`, `base: /one23balloon/`, `deploy: 'github-pages'`. No custom domain yet. |
| Visual direction | Gala atelier (see `design-direction.md`). |
| 3D | Three.js in this project only, loaded lazily, behind an engine-agnostic canvas-island lifecycle module. Not added to canvas-base. |
| Photos | Selected and downloaded by the implementer from the client's Instagram. |
| Copy | Drafted by the implementer from the client's own posts; unapproved until client sign-off. |
| Intro frequency | Once per browser session (`sessionStorage`), skippable. |

## Page structure

Each section below exists in both locales with identical structure and images.

0. **Intro.** Script-injected overlay of glossy 3D balloons (about 60 on desktop, 30 on phones) that pop in a centre-out cascade with foil confetti, revealing the hero in about 2s. Skippable by click, tap, Esc or a visible "Skip" button. Not rendered without JavaScript, with reduced motion, without WebGL, or after the first play in a session. Never traps focus; the page underneath is already interactive.
1. **Header.** Wordmark, language switcher (template `LanguageSwitcher`), pinned WhatsApp link.
2. **Hero.** Headline, lede, WhatsApp button, palette picker (five buttons in a radio group). 3D organic garland around an arched panel, with a chrome balloon dog at its foot. Fallback: a real garland-arch photo.
3. **Celebrations we style.** Six categories, each with title, one-line description, real photo in an arched frame, section palette tint, and a WhatsApp link with a category message:
   - Weddings and proposals
   - Grand openings and corporate events
   - Milestone birthdays (hotel, Airbnb, KTV, restaurant surprises)
   - Baby celebrations and gender reveals (满月, 百日宴, 周岁宴)
   - Car handovers
   - Bouquets and balloon sculptures
4. **Recent work.** Twelve photos in a horizontal gallery pinned with ScrollTrigger on wide screens; a native horizontal scroll-snap list on small screens and without JavaScript. Captions use "Location｜Theme" plus palette dots with accessible colour names.
5. **Balloon sculptures.** Three rotating 3D pieces (chrome balloon dog, tulip bouquet, tiered balloon cake) on pedestals, plus two real photos of the client's sculptures (lion dance, rose bouquet). Click or tap pops a balloon segment, which re-inflates. Fallback: the real photos only.
6. **Where we set up.** Venue types (hotel rooms, Airbnbs, homes, KTV rooms, restaurants and private dining rooms, offices and showrooms, live-stream rooms) as a slow marquee; a static wrapped list without motion.
7. **How it works.** Three steps. Shipped as draft until the client confirms the process.
8. **FAQ.** Native `<details>` items. Entries without client-confirmed answers are `draft: true` and excluded from the build.
9. **Closing call to action.** "Compose your celebration": palette picker again (shares state with the hero picker) and WhatsApp button; balloons rise when the section enters view.
10. **Footer.** Business name, registration number, Instagram and Xiaohongshu links, copyright year.

## Content model

### Route identity

`src/content/pages/en/home.md` and `src/content/pages/zh/home.md` remain the route and SEO identity (title, description, `structuredData`). Routing, sitemap and hreflang stay on the existing manifest. The 404 page renders in the default locale only (template behaviour), so `not-found.md` stays English.

### `landing` data collection

New collection `landing`, one YAML file per locale: `src/content/landing/en.yaml`, `src/content/landing/zh.yaml`. Registered in `src/content.config.ts` with a Zod schema using `image()` for local images. It is a data collection consumed by the home view, not a routed collection, so it does not enter the manifest.

Shape (sketch; the schema is the source of truth):

```yaml
whatsapp: '60109017633' # digits only, country code first
hero:
  title: ...
  lede: ...
  cta: ...
  fallback: { image: ../../assets/work/hero-garland.jpg, alt: ... }
palettes: # ids must match the design palettes in code
  - { id: blush-champagne, name: ..., message: ... }
services:
  - { id: weddings, title: ..., body: ..., image: ..., alt: ..., palette: rose-gold, message: ... }
gallery:
  - { image: ..., alt: ..., location: ..., theme: ..., colours: [..], source: https://www.instagram.com/... }
sculptures: { title: ..., body: ..., photos: [ { image: ..., alt: ..., source: ... } ] }
venues: [ ... ]
steps: { draft: true, items: [ { title: ..., body: ... } ] }
faq: [ { question: ..., answer: ..., draft: true } ]
closing: { title: ..., body: ..., cta: ... }
footer: { registration: CT0152510-K, instagram: ..., xiaohongshu: ... }
intro: { skip: ... }
```

Validation rules:

- Every image has nonempty `alt`; every gallery and sculpture photo has an HTTPS `source` on instagram.com.
- `palette` and `palettes[].id` values are from the fixed palette id set.
- `whatsapp` is digits only, 10–15 characters.
- Section copy is nonempty plain text.

Cross-locale rule (tested): both locales have the same service ids, the same palette ids, the same gallery and sculpture image files in the same order, and the same number of steps and FAQ entries.

UI chrome strings (skip link, language names, "Skip intro", button labels shared across sections) stay in `src/content/ui.json` and `src/i18n/zh.json`.

## Configuration

`site.config.ts`:

- `name: 'one23balloon'`, `shortName: 'one23balloon'`, description from approved copy.
- `url: 'https://chowxingshao.github.io'`, `base: '/one23balloon/'`.
- `language: 'en'`, `i18n: { defaultLocale: 'en', locales: ['en', 'zh'] }`.
- `social: { instagram: 'https://www.instagram.com/one23balloon/', xiaohongshu: <confirmed URL or ''> }`.
- `features: { blog: false, projects: false, rss: false, motion: true, i18n: true, deploy: 'github-pages' }`.
- `formEndpoint: ''`, `analyticsId: ''`.

The WhatsApp number lives in landing content, so the config schema is unchanged. Run `pnpm configure:project` to generate the GitHub Pages workflow and the `zh` dictionary, then translate the dictionary.

## WhatsApp links

`src/lib/contact/whatsapp.ts` exports `whatsappUrl(number: string, message: string): string`, returning `https://wa.me/<digits>?text=<encodeURIComponent(message)>`. It rejects non-digit numbers and empty messages. Links are plain `<a>` elements rendered at build time, so they work without JavaScript.

The palette picker progressively enhances: without JavaScript the WhatsApp links carry the default message; with JavaScript, choosing a palette rewrites the hero and closing WhatsApp links to the palette's localized message, updates section accent tokens, and recolours the 3D scenes when present.

## 3D and motion architecture

### Module boundaries

```
src/lib/canvas-island/        engine-agnostic, no Three.js import
  capability.ts               WebGL detection, reduced motion, quality tier (DPR cap)
  lifecycle.ts                mount when visible, pause off-screen, resume, dispose,
                              fallback state via data-island-state
src/lib/landing/              pure landing logic (palettes, schema, parity, intro plan)
src/scenes/                   one23balloon-specific, imports three
  material-params.ts          pure latex, pearl, chrome surface values
  materials.ts                palette materials and transitions
  environment.ts, renderer.ts, loop.ts, picking.ts, palette-source.ts
  balloon-motion.ts           pure pop and inflate curves
  balloon.ts                  balloon mesh, pop and re-inflate state
  confetti.ts                 foil confetti particles
  garland-layout.ts           pure arched-panel garland layout
  sculpture-parts.ts          pure part data for dog, tulips, cake
  sculpture-mesh.ts           builds sculptures from part data
  hero.ts, sculptures.ts, release.ts, intro.ts   island scenes
src/scripts/
  palette-picker.ts           shared palette state, link rewriting, palette events
  landing-motion.ts           GSAP pinned gallery and marquee
  intro.ts                    intro overlay, skip and session rule
  landing.ts                  composes picker, motion, islands and intro
```

`canvas-island` is written to be extracted into canvas-base later. It must have no balloon-specific code and its own unit tests.

### Lifecycle and performance

- No 3D code on the critical path. Each canvas island dynamically imports its scene after the island is near the viewport and the browser is idle; the intro is the only island that starts immediately, and only when allowed.
- One WebGL renderer per visible island; islands pause their render loop when off-screen or when the tab is hidden.
- Quality tiers: device pixel ratio capped at 2 (desktop) and 1.5 (phones); balloon counts and geometry segments reduced on the low tier.
- WebGL context loss disposes the scene and shows the fallback.
- Islands integrate with the existing motion lifecycle in `src/lib/motion` so navigation cleanup disposes renderers, geometries, materials and listeners.

### Fallbacks

The static photo fallback for every 3D spot is in the HTML. It is replaced visually (not removed from the DOM) once the scene renders its first frame. Reduced motion, no WebGL, no JavaScript, and context loss all keep the photo.

### GSAP

Use the template's GSAP helpers and ScrollTrigger for reveals, the pinned gallery, the marquee and the closing balloon release. All triggers are scoped and cleaned up through the motion helpers. Reduced motion disables pinning and marquee movement.

## Fonts

- Add Fraunces (variable, Latin) and Noto Serif SC and Noto Sans SC subsets to `public/fonts/` with OFL license files; keep Source Sans 3.
- `scripts/subset-fonts.ts` (run with `pnpm fonts:subset`) collects every CJK character in `src/content/**/zh*` and `src/i18n/zh.json`, and writes WOFF2 subsets with `subset-font` (dev dependency).
- A unit test reads the subset fonts and fails if any CJK character in `zh` content is missing.
- The `zh` document uses the SC families first; `en` uses Fraunces and Source Sans 3.

## Images

- Source: the client's own Instagram posts, downloaded by the implementer at the highest resolution served (normally 1080px wide), saved as JPEG under `src/assets/work/` with descriptive kebab-case names.
- About 22 images: 1 hero fallback, 6 services, 12 gallery, 2 sculptures, 1 social sharing image (`og`).
- Selection criteria: setup-only shots where possible, no text overlays, sharp, variety of occasions and palettes, recent work preferred. Reel posts use the cover frame only when it is clean.
- Each image's source post URL is recorded in the landing content.
- Photos with recognisable customer faces are listed in the brief's pending-confirmation checklist.

## SEO

- Home pages declare `structuredData` with `type: LocalBusiness`, `name`, `url`, `telephone` (+60 10-901 7633 once confirmed), `address: Kuala Lumpur and Selangor, Malaysia`, and `sameAs` Instagram and Xiaohongshu.
- Titles and descriptions per locale from approved copy. Reciprocal hreflang between `/one23balloon/` and `/one23balloon/zh/` comes from the manifest.
- `defaultOgImage` replaced with a 1200×630 crop of a real setup.

## Dependencies

| Package | Kind | Reason |
| --- | --- | --- |
| `three` | runtime | Real-time 3D balloons; no lighter option gives physically based chrome and pearl materials with live recolouring. Lazy-loaded. |
| `subset-font` | dev | Build-time CJK font subsetting so Chinese pages ship about 100–300 KB of fonts instead of about 10 MB. |

Each gets a README justification and a decision record (`docs/decisions/0006-three-for-3d-balloons.md`, `docs/decisions/0007-cjk-font-subsetting.md`). Versions pinned exactly, matching the repository convention.

## Testing and validation

Template coverage: the existing fixed-layer tests (routing, discovery, content, SEO, setup) depend on the demonstration config and content. The demo files move to `tests/fixtures/demo/`, and `buildFixture` gains a default `demo` preset that builds with the canvas-base demo config, demo content and a lightweight landing fixture. New client tests use the `project` preset.

Unit tests:

- `whatsappUrl` encoding, number validation, empty message rejection.
- Landing schema: valid fixtures pass; missing alt, bad palette id, bad source URL, bad WhatsApp number fail.
- Cross-locale parity of ids, images and counts.
- CJK font subset coverage.
- `canvas-island` capability and lifecycle (visibility, pause, dispose, fallback) with mocked observers and WebGL.

Integration (`buildFixture` builds):

- `/` and `/zh/` render with correct `lang`, titles, canonical and reciprocal hreflang.
- Every WhatsApp link is a valid `wa.me` URL with the expected encoded text.
- Fallback images and all section content exist in the static HTML.
- No blog, projects or RSS routes; sitemap contains exactly the two home pages.
- Draft FAQ entries and draft steps are absent.

Gates: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`. Docker verification if Docker is available; record a limitation if not. Validate the generated GitHub Pages workflow.

Browser evidence (contribution checklist): 360, 768 and 1280px; light and dark; keyboard navigation; JavaScript disabled; reduced motion; WebGL unavailable; long Chinese and English strings. Record Lighthouse mobile scores; targets performance ≥ 80, accessibility ≥ 95, best practices ≥ 95, SEO ≥ 95. Record actual results and limitations in `docs/quality-report.md`.

## Documentation

Update README (project identity, dependencies), CHANGELOG, `docs/quality-report.md`, the two decision records, and record that `src/lib/canvas-island/` is a candidate for extraction into canvas-base once a second project needs 3D.

## Out of scope

- Prices, testimonials, client brand names or logos.
- Contact form, analytics, cookie banner.
- Custom domain, deployment execution and repository settings (deployment stays opt-in; publishing requires the user).
- Adding Three.js or canvas-island to canvas-base.
- Separate service or project pages, blog.

## Risks

- **Performance on low-end phones.** Mitigated by lazy loading, quality tiers, off-screen pausing and photo fallbacks; measured with Lighthouse.
- **Instagram image quality.** Max 1080px and recompressed; acceptable for gallery sizes, hero fallback chosen for sharpness.
- **Unapproved copy and photo permissions.** Tracked in the brief checklist; the site is not published until cleared.
- **Three.js API churn.** Version pinned; scenes isolated in `src/scenes/`.
