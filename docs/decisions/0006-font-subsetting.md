# 0006: Self-hosted fonts with Chinese subsetting

Status: Accepted

Fraunces (Latin) and Noto Serif SC and Noto Sans SC (Chinese) are self-hosted as WOFF2 files in `public/fonts/`, each with `font-display: swap` and its OFL license. Full CJK fonts are several megabytes, so `pnpm fonts:subset` keeps only the characters found in `zh-charset` sources (`zhCharsetSources` in `src/lib/fonts/charset.ts`) and writes `src/lib/fonts/zh-charset.txt`. A unit test fails when Chinese copy uses a character the subset lacks; rerun the script after changing Chinese copy.

Upstream files come from a pinned google/fonts commit and are cached under the gitignored `.cache/fonts/`, so every run subsets identical sources. Chinese faces declare a `unicode-range`, so Latin pages never download them, and they are preloaded only on Chinese pages.

Exact `subset-font@2.9.0` is a development dependency because it is the only tool the script needs (HarfBuzz subsetting with variable-axis pinning and WOFF2 output). It runs only on a maintainer machine, never in the build.
