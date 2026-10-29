# Release quality evidence

## one23balloon client acceptance (2026-10-29)

Environment: Windows 11 Pro 10.0.26200, Node 24.19.0, pnpm 12.8.1, Astro 7.3.7. Browser checks used the in-app browser (Chromium 152.0.7977.167) against `astro preview` at `http://localhost:4322/one23balloon/`; Lighthouse 13.5.0 (`pnpm dlx`) drove headless Google Chrome 155. The preview server was one already running from this repository, serving the `dist/` built for this run (Astro allows only one preview per project).

| Check                                                                            | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lint / check / test / build                                                      | All four pass after `pnpm install --frozen-lockfile`. `astro check`: 140 files, 0 errors, 0 warnings, 0 hints, and `tsc --noEmit` clean. Tests: **360 passed in 29 files**. Build: **3 pages** (`/`, `/zh/`, `404`) plus sitemap.                                                                                                                                                                                                                                         |
| Initial script size / Three.js chunk (gzip)                                      | **75,142 B** gzip (215,051 B raw) / **144,432 B** gzip (579,481 B raw, `renderer.*.js`). Initial scripts are the landing script (11,435 B raw, 4,994 B gzip), the shared GSAP chunk `motion.*.js` (202,242 B raw, 69,445 B gzip) and the page script (1,374 B raw, 703 B gzip). Three.js loads by dynamic `import()` after first paint; the hero scene pulls it in immediately, so it still downloads during initial load. The other lazy chunks total about 11.8 KB raw. |
| actionlint                                                                       | Not installed; `deploy.yml` and `ci.yml` were not linted. Limitation, not a pass.                                                                                                                                                                                                                                                                                                                                                                                         |
| Docker verify                                                                    | Not run. The Docker CLI is installed but the engine is not running (`failed to connect to the docker API`). `docker compose up` and `pnpm verify:container one23balloon` were not exercised. Limitation, not a pass.                                                                                                                                                                                                                                                      |
| Browser matrix (360/768/1280, light/dark, motion/reduced/no-JS, keyboard)        | See "one23balloon browser findings" below. Normal motion, light and dark at 360, 768 and 1280 for both languages: one h1, no horizontal overflow, no broken images, no console errors, 3D islands render. Keyboard and palette checks pass. Reduced motion and true JavaScript-off could not be driven (details below).                                                                                                                                                   |
| Lighthouse mobile / desktop (performance / accessibility / best-practices / SEO) | `/one23balloon/` mobile **40**/100/100/100 and **41**/100/100/100 (two runs); desktop **72**/100/100/100. `/one23balloon/zh/` mobile **41**/100/100/100; desktop **74**/100/100/100. **Mobile performance misses the 80 target on both pages.** Accessibility, best practices and SEO meet their 95 targets.                                                                                                                                                              |

Limitations: emulated widths and colour schemes, not physical devices; the Lighthouse runs used simulated throttling on a developer machine with other servers running; WebGL-off, reduced-motion and JavaScript-off behaviour is covered by unit tests only (the browser tool cannot emulate them); Docker and actionlint were unavailable; the 360px header is taller than its token (below); pending client confirmations remain listed in `brief.md` (WhatsApp number, Xiaohongshu URL, booking steps, FAQ and gallery facts, English and Chinese copy approval, customer faces and printed names).

Governance review for this client copy (CONTRIBUTING checklist) is still open: CODEOWNERS, CONTRIBUTING, CODE_OF_CONDUCT and SECURITY describe the upstream template and need a client decision; the MIT notice and font licences (`public/fonts/OFL*.txt`) are retained.

### one23balloon Lighthouse detail

Lighthouse 13.5.0, default simulated throttling (mobile: 412x823, 150 ms RTT, 1,638 Kbps, 4x CPU; desktop preset: 1350x940, 40 ms RTT), run with `pnpm dlx lighthouse@13.5.0 <url> [--preset=desktop] --only-categories=performance,accessibility,best-practices,seo` against the preview. Lighthouse always loads a fresh page, so the intro plays in every run. A "played session" run (intro skipped through `sessionStorage`) cannot be produced from the CLI, so the second English mobile run is a repeat, not that variant.

| Run               | Perf | A11y | Best practices | SEO | FCP   | LCP   | TBT      | CLS   |
| ----------------- | ---- | ---- | -------------- | --- | ----- | ----- | -------- | ----- |
| en mobile (run 1) | 40   | 100  | 100            | 100 | 2.4 s | 6.2 s | 1,990 ms | 0     |
| en mobile (run 2) | 41   | 100  | 100            | 100 | 2.4 s | 6.1 s | 1,660 ms | 0     |
| en desktop        | 72   | 100  | 100            | 100 | 0.6 s | 1.3 s | 470 ms   | 0     |
| zh mobile         | 41   | 100  | 100            | 100 | 2.2 s | 6.7 s | 1,580 ms | 0     |
| zh desktop        | 74   | 100  | 100            | 100 | 0.3 s | 1.0 s | 490 ms   | 0.021 |

Where the time goes (English mobile): script evaluation is 6.3 s of 7.5 s main-thread work, split between the landing script (3.5 s), the Three.js renderer chunk (2.5 s) and GSAP (1.2 s), with five long tasks, the largest 1.5 s. The LCP element is the hero lede paragraph (`p.lede[data-reveal]`), 2.2 s of whose 6.2 s is element render delay, so its paint waits on the script-driven reveal. Total transfer is 838 KiB. The performance score is dominated by script cost under 4x CPU throttling; the score has not been improved in this task and needs a follow-up decision (for example deferring the hero scene until after the first reveal, or splitting the landing script).

### one23balloon browser findings

Normal motion, in-app browser, light and dark at 360, 768 and 1280 px for `/one23balloon/` and `/one23balloon/zh/` (12 combinations):

- One h1 per page, `scrollWidth` equals `clientWidth` (no horizontal overflow), zero broken images, three canvases mounted, no console errors or page exceptions. The only console error recorded was the deliberate 404 for a nonexistent URL used to measure baseline frame rate.
- Intro plays on a fresh session with a "Skip intro" button and sets `sessionStorage` `one23balloon:intro-played`; hero, sculpture and closing 3D scenes render (the closing balloons rise with strings); the marquee moves; the gallery is pinned at 1280 and not pinned at 768 and 360.
- Headline wrapping: English wraps as "Celebrations," / "composed in colour" and Chinese as "为每一场盛大时刻，" / "精心布置" at 1024, 1280, 1440 and 1920 px, measured per character. No mid-word breaks and no 时刻 split. The h1 has no overflow at any of those widths.
- Pinned gallery after resizing a loaded page (1280, 1920, 1024, 360, back to 1280, using the browser tool's viewport emulation, not a physical window drag): the pin re-measured each time, with no horizontal overflow (`docOv` 0), the pin dropped at 360 and restored at 1280. A physical drag-resize was not possible.
- Header height: 77 px at 768 and 1280, but **135 px at 360** because the WhatsApp button wraps to a second row, against the `--header-height` token of 4.5rem (72 px). After the skip link, `main` starts at 72 px, so its first 63 px sit under the sticky header; the first visible content (eyebrow) starts at 152 px, 17 px clear of the header, only because the hero has top padding. Nothing is hidden today, but the token and the real height disagree at 360.
- Chinese weights: Noto Sans SC is pinned at 400, so weight-600 Chinese text (header CTA "WhatsApp 联系我们", current language "中文") is synthesized bold. It looked clean and acceptable in a 360 px dark screenshot; this is a subjective judgement from one viewport.
- Palette: arrow keys move between options (Right, Down, Left, End checked), selection follows focus, only one option per picker is a tab stop, and the scene recolours (Jewel tones, Chrome blue verified). No long task over 50 ms occurred on the first or later palette picks (PerformanceObserver). Visible smoothness could not be judged: the browser pane ran at about 4 fps even on a static page, so screenshots after a click showed mid-transition frames.
- Keyboard: the first Tab reaches the skip link, Enter moves focus to `main#main-content`, and every subsequent stop (header links, WhatsApp links, palette options, gallery region, FAQ summaries, footer links) showed a 3 px `:focus-visible` outline.
- JavaScript disabled: the tool cannot disable JavaScript, so this was simulated by fetching the built HTML, stripping every `<script>` and rendering it at 360 px. Result: no scripts, one h1, no overflow, nine WhatsApp links, two FAQ items, venue list text, all text present, hero photo shown and palette pickers `display: none` (they carry `hidden`). Lazy images below the fold were not scrolled into view in that simulation. A real JavaScript-off run was not performed.
- Reduced motion: the tool cannot emulate `prefers-reduced-motion`, so no browser evidence exists. Intro skip, photo fallback, no pinning and no marquee are covered by unit tests only.
- WebGL unavailable: not exercised in a real browser; covered by `tests/unit/canvas-island.test.ts` and `tests/unit/landing.test.ts`.

Acceptance measured on **2026-10-12**, Asia/Kuala_Lumpur, on Windows with Node **24.19.0**, pnpm **12.8.1**, Astro **7.3.7**, Playwright **1.62.1**, and headless Microsoft Edge **155.0.4283.45**. The recommended pinned Node is 24.21.0; local Node 24.19.0 satisfies the declared engine range. These are emulated browser checks, not physical-device, screen-reader, or hosted-provider certification.

## Application and copy acceptance

`pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` passed: zero Astro/TypeScript diagnostics, **212 tests in 16 files**, and eight static demo pages. `pnpm verify:fresh` also passed frozen installation, check, lint, all tests, and build in a new `Client Sites/Test One` temporary directory. SHA-256 snapshots confirmed copied and original release source needed no edits; successful owned temporary copies were removed. Its four small boundary tests cover exclusions, source preservation, paths with spaces, unsafe destinations, symlinks, and cleanup ownership. The normal suite never recursively launches acceptance.

Seven separate fixture builds passed artifact inspection:

| Fixture                   | Inspected result                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Defaults                  | Eight demo pages and public discovery files; no private build route.                                                |
| Blog/projects/RSS off     | No disabled routes, navigation links, or feed.                                                                      |
| RSS alone off             | No feed file or head discovery link; content remains.                                                               |
| Motion off                | Static headings remain visible; browser content stays visible with no-preference motion.                            |
| en/ms missing translation | Requested document language, English source article, source canonical, warning, and fallback omitted from sitemap.  |
| Arabic RTL                | Arabic document language/direction and English fallback article language; logical layout and long Arabic UI stress. |
| `/demo/` hosting          | Mounted links and sitemap URLs; generated document tree serves the mount.                                           |

## Browser coverage

The default production build was served by `astro preview` at `http://127.0.0.1:4387`. Home, about, contact, blog index, post, projects index, project detail, and 404 were checked at **360, 768, and 1280 pixels**, each in light/dark and normal/reduced/no-JavaScript modes. The **162 checks** include long heading/navigation stress. Each page retained one visible h1, a loaded local font, no horizontal overflow, a keyboard skip link targeting main, and visible subsequent keyboard focus. No page exceptions or console errors were recorded. Representative 360px contact, 768px project detail, 1280px home, and 360px Arabic dark screenshots were visually inspected; every page/width received automated DOM inspection and a captured reduced-motion light screenshot.

A separate **72-check** browser run covered normal-motion home/contact, Malay fallback, Arabic RTL, motion off, and mounted fixtures in both colors at all three widths, with long UI strings. A local Node static fixture server applied the exact generated CSP response headers; it recorded no CSP console errors, page exceptions, hidden headings, or horizontal overflow. This verifies browser compatibility with the policy; it does not verify nginx response behavior. Arabic glyphs use system fallback in this fixture: a client must select and self-host a script-covering font and approve actual translations.

## Lighthouse measurements

Lighthouse **13.5.0** audited every default page against the static production preview on 2026-10-12. Desktop used the desktop preset: 1350x940, DPR 1, simulated 40 ms RTT/10,240 Kbps, CPU multiplier 1. Mobile used the Moto G Power user-agent preset: 412x823, DPR 1.75, simulated 150 ms RTT/1,638.4 Kbps, CPU multiplier 4. These URLs use local HTTP; no deployed host or nginx Lighthouse run is claimed.

Scores below are performance/accessibility/best-practices/SEO:

| Route                        | Desktop            | Mobile initial     |
| ---------------------------- | ------------------ | ------------------ |
| `/`                          | 100/100/100/100    | 98/100/100/100     |
| `/about/`                    | 100/100/100/100    | 98/100/100/100     |
| `/contact/`                  | 100/100/100/100    | 98/100/100/100     |
| `/blog/`                     | 100/100/100/100    | **87**/100/100/100 |
| `/blog/welcome/`             | 100/100/100/100    | 98/100/100/100     |
| `/projects/`                 | 100/100/100/100    | 98/100/100/100     |
| `/projects/example-project/` | 100/100/100/100    | 98/100/100/100     |
| `/404.html`                  | 100/100/100/**66** | 100/100/100/**66** |

The mobile blog index initially missed performance >=95: 475 ms total blocking time while another browser fixture audit ran concurrently. Three subsequent isolated runs scored **98/100/100/100**, with 46, 38, and 49 ms blocking time. The initial outlier is retained; concurrent CPU load is a likely contributor, not a proven sole cause. Follow-up is to repeat isolated measurements on the actual production host and a representative device, investigating startup JavaScript if blocking time persists. No source change was made to conceal that measurement. All indexable pages reached the target in the isolated recorded measurements; this is not a guarantee for future runs or client content.

The 404's only failed SEO audit is indexing eligibility, caused by intentional `noindex, follow`. Keep that policy and exclude error pages from an indexable-page SEO target; do not make a 404 crawlable to improve its score.

## Docker and publication limits

Final Docker acceptance could **not** run: Docker CLI 29.7.2 was present, but the Linux daemon pipe `dockerDesktopLinuxEngine` was unavailable, including after starting Docker Desktop. `docker compose -p canvas-task-11 up --build -d` failed before creating resources, and `pnpm verify:container` returned `fetch failed`; cleanup of only that named project was attempted and also could not connect. Root and `/demo/` HTTP/cache/gzip/status checks therefore remain unverified in this final environment. Task 8 recorded earlier successful local root/mount checks; those are historical evidence, not a final rerun. Generated-header unit tests and the browser CSP fixture passed.

Raw Lighthouse reports, browser JSON/screenshots, fixture results, command logs, and the detailed task report are retained under ignored `.superpowers/sdd/2026-10-08-canvas-base/task-11-*` in the maintenance workspace. They are excluded from released starter copies; this summary is included.

MIT and copyright 2026 chowxingshao are owner-confirmed, and required font/third-party notices remain. **Publication readiness remains open:** the private security channel/response expectations and conduct contact are unconfirmed; remote protections and environment controls are not configured or verified. Hosted CI runs, Netlify/Vercel/Cloudflare/Pages/GHCR deployments, preview posting, physical devices, screen readers, and real provider form delivery remain untested. No remote settings, push, release tag, publication, or deployment occurred.
