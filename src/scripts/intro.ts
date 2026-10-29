import type { Capability } from '../lib/canvas-island/capability.ts';
import {
  mountIsland,
  type Island,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';
import { markIntroPlayed, shouldPlayIntro } from '../lib/landing/intro-plan.ts';

export type IntroLoader = (onDone: () => void) => Promise<SceneFactory>;

// The scene must be live within this long, and the whole intro is capped.
export const introLiveTimeout = 1200;
export const introMaxDuration = 3500;

// The page is already rendered and interactive underneath; the overlay only
// decorates. It stays transparent and click-through until its scene is live
// (see landing.css), so a slow chunk never blanks the page.
// onFinish runs once: when the intro ends, or straight away if it does not play.
export function playIntro(options: {
  root: HTMLElement;
  capability: Capability;
  storage: Storage | undefined;
  load: IntroLoader;
  onFinish?: () => void;
}): () => void {
  const { root, capability, storage, load, onFinish } = options;
  if (!shouldPlayIntro(storage, capability)) {
    onFinish?.();
    return () => undefined;
  }
  markIntroPlayed(storage);

  const doc = root.ownerDocument;
  const overlay = doc.createElement('div');
  overlay.className = 'intro';
  const canvas = doc.createElement('canvas');
  canvas.className = 'island-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const skip = doc.createElement('button');
  skip.type = 'button';
  skip.className = 'intro-skip';
  skip.textContent = root.dataset.introSkip ?? 'Skip';
  overlay.append(canvas, skip);
  doc.body.append(overlay);

  // Held in an object: finish can run during mountIsland, before the island is returned.
  const mounted: { island?: Island } = {};
  let finished = false;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') finish();
  };
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  function finish() {
    if (finished) return;
    finished = true;
    for (const timer of timers) clearTimeout(timer);
    doc.removeEventListener('keydown', onKeyDown);
    mounted.island?.dispose();
    overlay.style.pointerEvents = 'none';
    const fade = overlay.animate?.(
      [{ opacity: getComputedOpacity(overlay) }, { opacity: 0 }],
      { duration: 400, easing: 'ease-out', fill: 'forwards' },
    );
    onFinish?.();
    if (fade)
      fade.finished.then(
        () => overlay.remove(),
        () => overlay.remove(),
      );
    else overlay.remove();
  }

  // A click anywhere, including the skip button, ends the intro.
  overlay.addEventListener('click', finish);
  doc.addEventListener('keydown', onKeyDown);
  timers.push(
    setTimeout(() => {
      if (mounted.island?.state !== 'live') finish();
    }, introLiveTimeout),
    setTimeout(finish, introMaxDuration),
  );
  mounted.island = mountIsland({
    element: overlay,
    capability,
    observe: (_element, onChange) => {
      onChange(true);
      return () => undefined;
    },
    // The intro covers first paint, so it loads at once instead of waiting for idle.
    idle: (run) => {
      run();
      return () => undefined;
    },
    load: () => load(finish),
    onState: (state) => {
      if (state === 'fallback') finish();
    },
  });
  return finish;
}

// Fade from wherever the overlay is, so an intro that never went live does not flash.
function getComputedOpacity(element: HTMLElement): number {
  const value = Number.parseFloat(
    element.ownerDocument.defaultView?.getComputedStyle(element).opacity ?? '',
  );
  return Number.isFinite(value) ? value : 1;
}
