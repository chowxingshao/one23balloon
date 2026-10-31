import {
  browserProbe,
  detectCapability,
  type Capability,
} from '../lib/canvas-island/capability.ts';
import {
  afterInteraction,
  afterLoad,
  mountIsland,
  type Schedule,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  /** A value, or a probe that runs only once the page may start 3D work. */
  capability?: Capability | (() => Capability);
  loaders?: SceneLoaders;
  motion?: (root: HTMLElement) => () => void;
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
export function loadLandingMotion(root: HTMLElement): () => void {
  let dispose: (() => void) | undefined;
  let cancelled = false;
  import('./landing-motion.ts').then(
    ({ initLandingMotion }) => {
      if (!cancelled) dispose = initLandingMotion(root);
    },
    (error: unknown) => console.warn('Landing motion unavailable.', error),
  );
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
  let disposed = false;

  const begin = () => {
    if (disposed) return;
    const capability =
      typeof options.capability === 'function'
        ? options.capability()
        : (options.capability ?? detectCapability(browserProbe()));
    cleanups.push((options.motion ?? loadLandingMotion)(root));
    // Phones keep the poster still until the visitor engages, so the stage
    // build never blocks the page while it is being read.
    if (capability.tier === 'low')
      cleanups.push(engage(() => islands(capability)));
    else islands(capability);
  };
  // The stage lives outside the landing root (beside the smooth-scroll
  // wrapper), so islands are looked up in the whole document.
  const islands = (capability: Capability) => {
    if (disposed) return;
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
