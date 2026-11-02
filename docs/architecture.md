# Architecture

Astro builds static HTML with `output: 'static'`. MDX and ordered discovery integrations are active. There is no backend adapter, database, authentication, or server API. Strict TypeScript applies through Astro's strict preset; `pnpm check` also runs `tsc --noEmit` across TypeScript files, including config, scripts, and tests.

## Public configuration

The root `site.config.ts` exports public identity and feature values. `src/lib/config/schema.ts` validates every field and exports `SiteConfig`, `DeployTarget`, and `parseSiteConfig(value)`. It normalizes the optional mount path and rejects unsafe origins, endpoints, locale lists, and inconsistent language settings. Unknown properties are rejected to catch configuration mistakes.

`src/lib/config/site.ts` validates the root export once and exposes it through `getSiteConfig(): Readonly<SiteConfig>`. Both `astro.config.mjs` and the static page consume this reader, so build settings and rendered identity share the same values. The returned root object is frozen; nested objects remain typed configuration values. Consumers should treat the whole object as read-only.

`src/lib/config/brief.ts` is a separate Node-only boundary. It reads Markdown from a repository-root directory URL and never enters a browser bundle. Pass a directory URL with a trailing slash. It returns `null` for ENOENT and propagates every other filesystem error. It neither parses a brief into configuration nor embeds private brief data into a page.

## Layer boundary

The fixed layer owns the toolchain, config validation, routing/content/SEO/motion helpers, build tooling, and template documentation. Changes here should solve infrastructure problems or upgrade supported dependencies.

The variable layer owns pages, layouts, components, styles, imagery, typography, and animation choreography. Replace it for each project. Keep UI copy in content files; the minimal page reads identity through the public config reader and instructional text from `src/content/ui.json`.

Vitest uses Astro's documented `getViteConfig()` helper so supported exports such as `astro/zod` resolve in the test environment. Configuration fixtures clone the root values before merging feature overrides, preventing accidental state sharing.

Sitemap and RSS generate static discovery artifacts; jsdom parses real built HTML/XML in typed integration tests. GSAP supplies scoped optional motion. No deployment workflows are generated while the deploy target is `none`.

## Metadata and discovery boundary

`src/lib/seo/metadata.ts` exports `SeoInput`, `SeoMetadata`, `buildMetadata`, and `absoluteRouteUrl`. Route paths, canonical paths, and alternate paths are already mounted. The helper validates public config, rejects unsafe image/route URLs, and revalidates explicit page identity schemas. `serializeJsonLd` produces valid JSON with `<`, U+2028, and U+2029 escaped. `SeoHead.astro` processes content cover images through `astro:assets`, emits the complete static head, and adds feed discovery only when the feed exists. BaseLayout forwards metadata inputs; PageView forwards the optional validated page identity. The 404 wrapper explicitly requests noindex.

`src/lib/seo/feed.ts` exports `feedEnabled`, `FeedItem`, and `buildFeedItems`. The prerendered RSS endpoint passes plain-text titles/descriptions and real Dates to the supported RSS generator; it never renders content bodies. Feed eligibility requires blog and RSS, and projects remain independently gated.

`createDiscoveryIntegrations(config)` returns preparation, [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/), and finalization in that order. Astro ignores underscore-prefixed directories in filesystem routing, so preparation injects `/__build/routes.json` from `src/pages/__build/routes.json.ts` only for the build command, explicitly prerendered. That endpoint queries `getRouteManifest()` in Astro's render context and serializes only `{ path, canonicalPath, fallback, alternates }`. It never emits content bodies or config. Node-only config modules must not import `astro:content` or the runtime manifest helper.

After pages render, preparation reads that private artifact into an integration-local canonical map. The sitemap filter accepts only actual non-fallback canonical manifest records; serialization supplies only actual canonical translation links. No automatic locale cross-product is configured. Drafts, disabled sections, 404, endpoints, and private paths therefore stay outside the sitemap.

`finalizeArtifacts(outputDir, config)` runs after sitemap generation, copies `sitemap-index.xml` to the advertised `sitemap.xml`, removes a disabled RSS placeholder, then deletes the exact private JSON file and its empty directory. Cleanup uses nonrecursive directory removal so unexpected data cannot be silently erased. Final static output has no `__build` artifact. Finalization also emits security-header/location includes and a base-mounted static tree under `.generated/nginx/`, consumed by the production Docker image.

## Repository workflow and artifact boundary

[CONTRIBUTING.md](../CONTRIBUTING.md) defines the shared human/agent maintenance workflow; [CLAUDE.md](../CLAUDE.md) references it and this architecture. Fixed-layer maintenance and variable-layer client authoring have different purposes but share static output, accessibility, public config, dependency, and validation requirements.

`.github/workflows/ci.yml` exposes `workflow_call` alongside PR and main-push triggers. Its single validation job uses the pinned Node/pnpm versions and an OS/Node/lockfile-keyed pnpm store cache. Frozen installation, lint, check, test, build, and Docker build run in order. No step ignores failure. Only then does the default-success upload step publish `site-dist`; a missing output fails upload. CI also exports the built Docker image as `site-image` and prepares the static Vercel output from verified `dist/` as `site-vercel`. Optional deploy workflows depend on that reusable job and consume the matching artifact, including the exact Docker image for registry publication. No deployment job builds unchecked source. CI has `contents: read`, retains no checkout credentials, and never publishes an image or deploys a site.

MIT licensing covers the template's code; third-party assets retain their own notices. Governance describes the upstream community and needs explicit review for client copies. Remote protection and private reporting are administrator settings, not effects of committing YAML or Markdown.

## Release source boundary

`scripts/verify-fresh.ts` copies authored release source into an owned temporary project, with no dependency junction. It excludes local state, credential directories, build/cache output, temporary evidence, and maintenance-only `docs/superpowers/`; the source guidance and plan remain unchanged in the maintenance repository. Fresh template copies keep governance and legal notices. Hash snapshots prove original and copied source remain unchanged through frozen install, check, lint, test, and build. This acceptance command is separate from the small copy-boundary integration tests to prevent recursion. Symlink sources and destination ancestors are rejected; cleanup validates the temporary parent, prefix, ownership marker, and real path.

## one23balloon landing (client layer)

The home route renders `src/components/landing/LandingView.astro` from the typed `landing` data collection (`src/content/landing/<locale>.yaml`, schema in `src/lib/landing/schema.ts`). `getLanding()` checks that every locale matches the default locale's structure, photos and contact number, and fails the build otherwise. All copy, photos and WhatsApp links are static HTML.

The page is six chapters, in order: hero, statement, what we do (services), signature pieces, recent celebrations and closing. `chapterIds` in `src/lib/landing/formations.ts` names them, and each chapter's markup carries `data-chapter`. All content is in the static HTML and readable without JavaScript.

Client scripts progressively enhance from `src/scripts/landing.ts`, which starts nothing before the load event and an idle period (`afterLoad`). It starts two things: the chapter motion and the stage.

**Chapter registry and landing-motion.** `src/scripts/chapters/index.ts` is the chapter registry: one `ChapterSetup` module per chapter (`hero.ts`, `statement.ts`, `services.ts`, `signature.ts`, `celebrations.ts`, `closing.ts`). `src/scripts/landing-motion.ts` is loaded by dynamic import after first paint. It registers GSAP's ScrollTrigger, SplitText and ScrollSmoother, and runs every setup inside `gsap.matchMedia`: ScrollSmoother only under `(prefers-reduced-motion: no-preference) and (min-width: 64rem) and (pointer: fine)`, chapter motion under `(prefers-reduced-motion: no-preference)`, with `desktop` (64rem and wider) passed to each setup for pins, tilts and long travel. A setup may return a cleanup for anything GSAP does not revert itself. Scroll is read only through ScrollTrigger, never a `scroll` listener, and pins start at `top top`. `src/scripts/formation-triggers.ts` announces which formation owns the stage as chapters (and each service card) cross the middle of the screen.

**The travelling stage.** One Three.js scene (`src/scenes/stage.ts`, loaded by dynamic import, [decision 0007](decisions/0007-three-for-3d-balloons.md)) holds 30 balloons on the high tier and 14 on the low tier. The balloons never go away; they regroup into a named formation (`hero`, `drift`, `hidden`, `release`, and `service-N` clusters beside each service card) when `one23balloon:formation` is dispatched on the landing root. `src/scenes/formations.ts` and `formation-layout.ts` compute the resting positions, which never overlap, and `formation-anchor.ts` finds the free screen area beside a service card.

**Two-pass back canvas.** On the high tier each frame renders twice from the same scene with one clipping plane. The part at or behind the headline plane is drawn first and copied to a 2D canvas (`data-stage-back`) that sits behind the content; the part in front is drawn onto the fixed front canvas above it. That is how balloons pass behind the hero headline and the statement text and in front of everything else. Both canvases are decorative (`aria-hidden`), fixed and outside the smooth-scroll wrapper.

**Poster fallback.** The hero ships a captured still of the hero formation (two art-directed posters, `src/assets/stage/`), painted from the first byte. `data-stage="live"` on the landing root fades it out once the stage is rendering. It stays the only visual when WebGL is missing, reduced motion is set, the public config turns motion off, the scene fails to load or compile, the context is lost, or the chapter motion chunk fails to load, because without chapter motion no formation would ever change. If the visitor switches reduced motion on mid-visit, `landing.ts` disposes the stage, which clears and hides the canvases and removes `data-stage`, so the poster returns. `src/lib/canvas-island/` is engine-agnostic: it detects capability, mounts a scene once its island nears the viewport and the browser is idle, pauses it off-screen or in hidden tabs, and falls back to the photo. It is a candidate for extraction into canvas-base.

**Low tier.** Touch screens, four cores or fewer, and 4 GB or less count as `low`. There the stage mounts only after the visitor's first interaction (`afterInteraction`), builds 14 balloons at lower geometry detail, draws no back canvas, and resolves `drift` to `hidden`, because without a back canvas drifting balloons would cover the statement text. Scenes compile their shaders with `compileAsync` before the first frame.

Fixed-layer tests use the `demo` preset of `buildFixture`, which builds with the canvas-base demonstration config and content from `tests/fixtures/demo/`. Client tests use the `project` preset.
