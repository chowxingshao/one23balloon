# 0006: Self-hosted fonts with Chinese subsetting

Status: Accepted

Fraunces (Latin) and Noto Serif SC and Noto Sans SC (Chinese) are self-hosted as WOFF2 files in `public/fonts/`, each with `font-display: swap` and its OFL license. Full CJK fonts are several megabytes, so `pnpm fonts:subset` keeps only the characters found in `zh-charset` sources (`zhCharsetSources` in `src/lib/fonts/charset.ts`) and writes `src/lib/fonts/zh-charset.txt`. The subset covers `src/content/landing/zh.yaml`, `src/content/pages/zh/home.md` and `src/i18n/zh.json`. `tests/unit/fonts.test.ts` compares the characters in `src/lib/fonts/zh-charset.txt` with the Chinese copy and fails when the copy uses a character the subset lacks, so rerun `pnpm fonts:subset` after editing Chinese text.

Upstream files come from a pinned google/fonts commit and are cached under the gitignored `.cache/fonts/`, so every run subsets identical sources. Chinese faces declare a `unicode-range`, so Latin pages never download them, and they are preloaded only on Chinese pages.

Source Sans 3, the body face inherited from the template, shipped as a 170 KB WOFF2 that held far more than its `-latin` name suggests. On 2026-10-30 it was subset once, from that committed file, to the same Latin set the script uses for Fraunces (U+0020–007E, U+00A0–00FF and common typographic punctuation), keeping the `wght` axis: 44 KB. Every built page was checked for characters outside that set first (none; Chinese text uses the Noto faces). `pnpm fonts:subset` does not manage this file; to add characters, subset the original from the initial commit again. It was the largest request ahead of the largest contentful paint on the one23balloon landing (see `docs/quality-report.md`).

Exact `subset-font@2.9.0` is a development dependency because it is the only tool the script needs (HarfBuzz subsetting with variable-axis pinning and WOFF2 output). It runs only on a maintainer machine, never in the build.
