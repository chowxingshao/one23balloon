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
import { playIntro, type IntroLoader } from './intro.ts';
import { initPalettePicker } from './palette-picker.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  /** A value, or a probe that runs only once the page may start 3D work. */
  capability?: Capability | (() => Capability);
  storage?: Storage;
  loaders?: SceneLoaders;
  intro?: IntroLoader;
  motion?: (root: HTMLElement) => () => void;
  /** When 3D and motion work may begin; defaults to after load and idle. */
  start?: Schedule;
  /** When low-tier islands may start; defaults to the first interaction. */
  engage?: Schedule;
};

// Dynamic imports keep Three.js out of the initial page script.
export const sceneLoaders: SceneLoaders = {
  hero: async () => (await import('../scenes/hero.ts')).createHeroScene,
  sculptures: async () =>
    (await import('../scenes/sculptures.ts')).createSculptureScene,
  release: async () =>
    (await import('../scenes/release.ts')).createReleaseScene,
};

export const introLoader: IntroLoader = async (onDone) => {
  const { createIntroScene } = await import('../scenes/intro.ts');
  return (canvas, capability) =>
    createIntroScene(canvas, capability, { onDone });
};

// The gallery pin and marquee are below the fold, so their module (and its
// layout reads) loads after first paint instead of with the page script.
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

function sessionStore(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
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
  const cleanups: Array<() => void> = [initPalettePicker(root)];
  let disposed = false;

  // Nothing below runs before the load event and an idle period, so the
  // WebGL probe (whose context creation can stall the page) and scene chunks
  // never compete with first paint.
  const begin = () => {
    if (disposed) return;
    const capability =
      typeof options.capability === 'function'
        ? options.capability()
        : (options.capability ?? detectCapability(browserProbe()));
    cleanups.push((options.motion ?? loadLandingMotion)(root));
    // On the low tier the in-view hero would build at once, blocking the phone
    // while the page is being read, so no island (and no WebGL probe) starts
    // until the visitor engages. The photos show until then, as without WebGL.
    if (capability.tier === 'low')
      cleanups.push(engage(() => islands(capability)));
    else islands(capability);
  };
  const islands = (capability: Capability) => {
    if (disposed) return;
    const mount = (element: HTMLElement) => {
      const load = loaders[element.dataset.island ?? ''];
      if (!load || disposed) return;
      const island = mountIsland({ element, load, capability });
      cleanups.push(() => island.dispose());
    };
    // The hero scene sits under the intro overlay, so it is built only once the
    // intro is over (playIntro reports that at once when the intro does not play).
    const deferred: HTMLElement[] = [];
    for (const element of root.querySelectorAll<HTMLElement>('[data-island]')) {
      if (element.dataset.island === 'hero' && root.hasAttribute('data-intro'))
        deferred.push(element);
      else mount(element);
    }
    if (root.hasAttribute('data-intro'))
      cleanups.push(
        playIntro({
          root,
          capability,
          storage: options.storage ?? sessionStore(),
          load: options.intro ?? introLoader,
          onFinish: () => deferred.forEach(mount),
        }),
      );
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
