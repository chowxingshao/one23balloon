import {
  browserProbe,
  detectCapability,
  type Capability,
} from '../lib/canvas-island/capability.ts';
import {
  afterInteraction,
  afterLoad,
  mountIsland,
  type Island,
  type Schedule,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';
// Straight from the module, not the barrel, so GSAP stays out of this script.
import { motionEnabled } from '../lib/motion/environment.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  /** A value, or a probe that runs only once the page may start 3D work. */
  capability?: Capability | (() => Capability);
  loaders?: SceneLoaders;
  /**
   * Starts the chapter motion. `onUnavailable` reports a load failure, so the
   * stage is dropped instead of covering content that no scroll will drive.
   */
  motion?: (root: HTMLElement, onUnavailable: () => void) => () => void;
  /** Whether the public config and the visitor allow motion. */
  motionEnabled?: () => boolean;
  /** When 3D and motion work may begin; defaults to after load and idle. */
  start?: Schedule;
  /** When low-tier islands may start; defaults to the first interaction. */
  engage?: Schedule;
};

// Dynamic imports keep Three.js out of the initial page script.
export const sceneLoaders: SceneLoaders = {
  stage: async () => (await import('../scenes/stage.ts')).createStageScene,
};

// Chapter motion reads layout, so its module loads after first paint.
export function loadLandingMotion(
  root: HTMLElement,
  onUnavailable: () => void = () => undefined,
): () => void {
  let dispose: (() => void) | undefined;
  let cancelled = false;
  const fail = (error: unknown) => {
    console.warn('Landing motion unavailable.', error);
    if (!cancelled) onUnavailable();
  };
  import('./landing-motion.ts').then(({ initLandingMotion }) => {
    if (cancelled) return;
    try {
      dispose = initLandingMotion(root);
    } catch (error) {
      fail(error);
    }
  }, fail);
  return () => {
    cancelled = true;
    dispose?.();
  };
}

export function initLanding(
  root: HTMLElement,
  options: LandingOptions = {},
): () => void {
  const doc = root.ownerDocument;
  const loaders = options.loaders ?? sceneLoaders;
  const start = options.start ?? afterLoad(doc);
  const engage =
    options.engage ?? afterInteraction(doc.defaultView ?? globalThis);
  const cleanups: Array<() => void> = [];
  const mounted: Island[] = [];
  const motionAllowed = options.motionEnabled ?? motionEnabled;
  const reduce = doc.defaultView?.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  );
  let disposed = false;
  // Set once the stage must not run: the visitor asked for reduced motion
  // after load, or the chapter motion that drives it never started.
  let stageOff = false;

  // Back to the poster: the islands go, which hides the canvases.
  const dropStage = () => {
    stageOff = true;
    for (const island of mounted.splice(0)) island.dispose();
  };
  const onReduceChange = () => {
    if (reduce?.matches) dropStage();
  };
  reduce?.addEventListener?.('change', onReduceChange);
  cleanups.push(() => reduce?.removeEventListener?.('change', onReduceChange));

  const begin = () => {
    if (disposed) return;
    const detected =
      typeof options.capability === 'function'
        ? options.capability()
        : (options.capability ?? detectCapability(browserProbe()));
    // Without motion nothing triggers a formation, so the stage would stay
    // frozen in the hero formation over every chapter. Treat it as reduced.
    const capability: Capability = motionAllowed()
      ? detected
      : {
          get webgl() {
            return detected.webgl;
          },
          reducedMotion: true,
          tier: detected.tier,
          pixelRatio: detected.pixelRatio,
        };
    cleanups.push((options.motion ?? loadLandingMotion)(root, dropStage));
    // Phones keep the poster still until the visitor engages, so the stage
    // build never blocks the page while it is being read.
    if (capability.tier === 'low')
      cleanups.push(engage(() => islands(capability)));
    else islands(capability);
  };
  // The stage lives outside the landing root (beside the smooth-scroll
  // wrapper), so islands are looked up in the whole document.
  const islands = (capability: Capability) => {
    if (disposed || stageOff || reduce?.matches) return;
    for (const element of doc.querySelectorAll<HTMLElement>('[data-island]')) {
      const load = loaders[element.dataset.island ?? ''];
      if (!load) continue;
      const island = mountIsland({
        element,
        load,
        capability,
        onState: (state) => {
          if (state === 'live') root.dataset.stage = 'live';
          else delete root.dataset.stage;
        },
      });
      mounted.push(island);
      cleanups.push(() => island.dispose());
    }
  };
  cleanups.push(start(begin));
  return () => {
    disposed = true;
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  };
}

export function installLandingLifecycle(doc: Document): () => void {
  let disposePage: () => void = () => undefined;
  let disposed = false;
  const initialize = () => {
    disposePage();
    const root = doc.querySelector<HTMLElement>('[data-landing]');
    disposePage = root ? initLanding(root) : () => undefined;
  };
  const dispose = () => {
    disposePage();
    disposePage = () => undefined;
  };
  doc.addEventListener('astro:page-load', initialize);
  doc.addEventListener('astro:before-swap', dispose);
  initialize();
  return () => {
    if (disposed) return;
    disposed = true;
    dispose();
    doc.removeEventListener('astro:page-load', initialize);
    doc.removeEventListener('astro:before-swap', dispose);
  };
}
