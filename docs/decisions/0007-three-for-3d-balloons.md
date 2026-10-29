# 0007: Three.js for real-time 3D balloons

Status: Accepted (one23balloon client project)

The one23balloon direction calls for glossy latex, pearl and mirror-chrome balloons that recolour live when a visitor picks a palette, pop on click, and rotate as sculptures. SVG and CSS cannot render physically based reflections. Pre-rendered images cannot recolour or rotate. Lottie adds a similar weight without 3D lighting.

Use exact `three@0.186.1` (runtime) and `@types/three@0.186.0` (types). Three.js is imported only by `src/scenes/` and loaded with dynamic `import()` from `src/scripts/landing.ts`, so it never blocks first paint. `src/lib/canvas-island/` owns the engine-agnostic lifecycle (lazy mount, off-screen pause, quality tiers, context loss, photo fallback) and is the candidate to extract into canvas-base once a second project needs 3D. Three.js itself stays out of the template.

Consequences: a lazy chunk of 144,432 bytes gzipped (579,481 bytes raw), measured on 2026-10-29 and recorded in the quality report; scenes must be disposed on navigation; Three.js releases often, so review its changelog before upgrading.

Measured cost: the chunk is lazy but the hero scene requests it immediately, so it still downloads during initial load. Lighthouse 13.5.0 (simulated throttling, 2026-10-29) scored mobile performance 40-41 on both pages against the 80 target, with 3.5 s of landing-script and 2.5 s of renderer evaluation under 4x CPU slowdown; desktop scored 72-74. Accessibility, best practices and SEO scored 100. Revisit deferring the hero scene until after the first reveal; see the quality report.
