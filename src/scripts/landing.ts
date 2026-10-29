import {
  browserProbe,
  detectCapability,
  type Capability,
} from '../lib/canvas-island/capability.ts';
import {
  mountIsland,
  type SceneFactory,
} from '../lib/canvas-island/lifecycle.ts';
import { playIntro, type IntroLoader } from './intro.ts';
import { initLandingMotion } from './landing-motion.ts';
import { initPalettePicker } from './palette-picker.ts';

export type SceneLoaders = Record<string, () => Promise<SceneFactory>>;
export type LandingOptions = {
  capability?: Capability;
  storage?: Storage;
  loaders?: SceneLoaders;
  intro?: IntroLoader;
  motion?: (root: HTMLElement) => () => void;
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
  const capability = options.capability ?? detectCapability(browserProbe());
  const loaders = options.loaders ?? sceneLoaders;
  const cleanups: Array<() => void> = [
    initPalettePicker(root),
    (options.motion ?? initLandingMotion)(root),
  ];
  for (const element of root.querySelectorAll<HTMLElement>('[data-island]')) {
    const load = loaders[element.dataset.island ?? ''];
    if (!load) continue;
    const island = mountIsland({ element, load, capability });
    cleanups.push(() => island.dispose());
  }
  if (root.hasAttribute('data-intro'))
    cleanups.push(
      playIntro({
        root,
        capability,
        storage: options.storage ?? sessionStore(),
        load: options.intro ?? introLoader,
      }),
    );
  return () => {
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
