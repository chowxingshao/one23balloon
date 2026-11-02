# Changelog

All notable template changes are documented here using Keep a Changelog conventions.

## [Unreleased]

### Added

- one23balloon showcase redesign of the landing page, replacing the Gala atelier look. Six chapters (hero, statement, what we do, signature pieces, recent celebrations, closing) in a colour-block palette (paper, ink, pink, cobalt, sunflower, emerald, tangerine, lilac) with one light theme. A single Three.js balloon stage travels through the chapters in collision-free formations, drawn in two passes so balloons sit in front of and behind the headline; the low tier uses 14 balloons and the high tier 30. GSAP chapter motion: smooth scrolling (wide screens with a fine pointer), a split hero headline, a statement that fills word by word, a pinned stack of service cards, a signature marquee that reverses with scroll direction, a celebrations wall that enters tilted from 64rem, and a closing flood with a dropping wordmark. Self-hosted Unbounded 900 and Noto Sans SC Black. Twenty-six new celebration photos (40 in the wall, each with an occasion label), a captured landscape and portrait poster still shown until the stage is live and kept as the no-WebGL and reduced-motion fallback, and a new share image. Chinese copy parity is still enforced at build time. See the quality report for the gate results, Lighthouse scores and limitations.

### Removed

- The previous landing sections and features: the intro, palette picker, FAQ, venues marquee, how-it-works steps, contact section, balloon sculptures scene and the three separate 3D islands. Fraunces and the Noto Serif faces are gone; no serif remains.

### Changed

- Consolidated agent guidance into a single `CLAUDE.md` and removed `AGENTS.md`; README and architecture references now point only to `CLAUDE.md`.

### Fixed

- one23balloon accessibility and mobile performance on the redesigned landing page: Lighthouse mobile 99/94/99 (en) and 96 (zh), accessibility, best practices and SEO 100, CLS 0; desktop 71-72. The celebrations wall tilts only from 64rem and its perspective grows with the wall, because the fixed perspective projected the lower rows to boxes millions of pixels wide and stalled axe-core's contrast check on mobile. The split hero heading and the statement no longer put `aria-label` on elements that forbid it, the service cards are `article`s so ScrollTrigger's pin spacers no longer break a list, unread statement words start at 50% opacity (3.4:1) instead of 16%, and the hero poster is fetched at high priority.
- one23balloon landing performance (previous landing page): Lighthouse mobile performance 40-41 to 92 (en) and 90 (zh), desktop 72-74 to 91 and 90. The intro, WebGL probe, 3D islands and landing motion wait for the load event and an idle period; the low tier skips the intro and mounts islands on the first interaction; the hero copy is no longer faded in; the palette picker reserves its space; scenes compile their shaders asynchronously; Source Sans 3 is subset to Latin (170 KB to 44 KB). New `afterLoad` and `afterInteraction` schedules in `canvas-island`. The mobile score reflects the low tier loading no 3D until the first interaction, which Lighthouse never performs; on phones the hero scene's build cost moves to the first scroll or tap. See the quality report and decision 0007.
- one23balloon landing review fixes: section bands keep their own palettes while only the hero and closing follow the picker; the hero headline no longer breaks mid-word in English or splits 时刻 in Chinese; islands wait for idle time and the hero scene waits for the intro; the intro stays invisible until live, gives up after 1.2 s and ends within 3.5 s; islands follow the latest intersection entry; the share image no longer shows a customer name; the gallery heading aligns to the page grid; the sticky header background spans the viewport; gallery captions pause between location and theme for screen readers; stage photos gain a 1440px source; `pnpm fonts:subset` records the charset only after every font is written. The client checklist in `brief.md` now lists printed customer names, the two published FAQ answers and unstated gallery details.

- Added `.gitattributes` to normalize line endings to LF, so Windows checkouts (`core.autocrlf=true`) no longer produce CRLF files that fail `pnpm lint` and `pnpm verify:fresh`.
- Vercel previews require an API-verified successful production push bootstrap, preventing a PR from becoming a new project's first production deployment.

- Project setup preserves unowned workflows and completes containment, ownership, directory-collision, and symbolic-link preflight before writes or removals, including dangling manifest links and Windows cross-drive paths.
- Netlify, Vercel, and Cloudflare templates implement opt-in same-repository PR previews from verified CI artifacts and update preview URL comments while skipping fork credentials and preserving production deployment gates.

### Added

- one23balloon client styling and motion for the landing page: Gala atelier look, real client photos, a GSAP pinned gallery and venue marquee, a once-per-session intro, and lazy Three.js balloon scenes (hero garland, sculptures, closing release) behind the engine-agnostic `canvas-island` lifecycle with photo fallbacks, recorded in [decision 0007](docs/decisions/0007-three-for-3d-balloons.md) (`three@0.186.1`, `@types/three@0.186.0`).
- Fixed-layer tests now build against a `demo` fixture preset (`tests/helpers/build.ts`) that uses the demonstration config and content in `tests/helpers/demo.ts` and `tests/fixtures/demo/`, so client configuration and content no longer affect template coverage.
- Static landing sections for the home page (hero, services, gallery, sculptures, venues, optional steps, FAQ, closing), rendered from the landing content collection with WhatsApp calls to action, hidden-until-scripted palette pickers and island placeholders; the build fails when the Chinese landing content drifts from English.
- Self-hosted Fraunces (Latin) and Noto Serif SC and Noto Sans SC subsets generated by `pnpm fonts:subset` from a pinned google/fonts commit; Chinese faces use `unicode-range`, are preloaded only on Chinese pages, and the new `subset-font@2.9.0` devDependency is recorded in decision 0006.
- `UPDATING.md` documenting how a copy started from this template pulls later upstream changes via an `upstream` remote, with layer-aware conflict guidance; linked from README and getting-started.
- Fresh release-source acceptance with credential/cache exclusions, owned temporary copies, source checksum preservation, complete gate execution, and final quality/handoff documentation.

- Reusable CI with verified static artifact gating, repository issue/PR templates, maintainer ownership, dependency update groups, MIT licensing, and contribution/security/agent guidance.

- Runnable static Astro starter with exact dependencies, strict TypeScript, linting, formatting, and Vitest.
- Validated public site configuration, safe origins and base paths, optional locale settings, and a build-only Markdown brief reader.
- Minimal demo page and setup, architecture, and dependency decision documentation.
- Typed pages, posts, and projects with ISO-date and image validation, deterministic draft filtering, isolated content-build tests, and clearly marked demonstration content.
- Centralized published content routes, base-aware locale URLs, optional translation fallback, validated UI dictionaries, and script-aware text direction.
- Replaceable editorial demonstration pages, manifest-driven navigation and language switching, accessible static layouts, self-hosted licensed Source Sans 3, system light/dark tokens, and real HTML route-output tests.

- Safe config-derived metadata and JSON-LD, canonical translation discovery, base-aware sitemap and robots, gated plain-text RSS, and ordered cleanup of private build artifacts with real HTML/XML fixtures.
- Accessible contact form with public endpoint configuration, native POST and no-JavaScript validation, local error feedback, a hidden honeypot, and Astro navigation cleanup.
