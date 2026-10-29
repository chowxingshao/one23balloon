import type { Capability } from './capability.ts';

export type IslandScene = {
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  dispose(): void;
};
export type SceneFactory = (
  canvas: HTMLCanvasElement,
  capability: Capability,
) => Promise<IslandScene>;
export type IslandState = 'idle' | 'loading' | 'live' | 'fallback' | 'disposed';
export type Observe = (
  element: Element,
  onChange: (visible: boolean) => void,
) => () => void;
export type IslandOptions = {
  element: HTMLElement;
  load: () => Promise<SceneFactory>;
  capability: Capability;
  allowReducedMotion?: boolean;
  observe?: Observe;
  onState?: (state: IslandState) => void;
};
export type Island = { readonly state: IslandState; dispose(): void };

export const observeIntersection: Observe = (element, onChange) => {
  if (typeof IntersectionObserver === 'undefined') {
    onChange(true);
    return () => undefined;
  }
  // Start loading a little before the island scrolls into view.
  const observer = new IntersectionObserver(
    (entries) => onChange(entries.some((entry) => entry.isIntersecting)),
    { rootMargin: '200px 0px' },
  );
  observer.observe(element);
  return () => observer.disconnect();
};

export function mountIsland(options: IslandOptions): Island {
  const {
    element,
    load,
    capability,
    allowReducedMotion = false,
    observe = observeIntersection,
    onState,
  } = options;
  const doc = element.ownerDocument;
  const canvas = element.querySelector('canvas');
  const cleanups: Array<() => void> = [];
  let state: IslandState = 'idle';
  let scene: IslandScene | undefined;
  let visible = false;
  // Read through a function: async steps change state behind TypeScript's back.
  const current = () => state;
  const setState = (next: IslandState) => {
    state = next;
    element.dataset.islandState = next;
    onState?.(next);
  };
  const release = () => {
    const active = scene;
    scene = undefined;
    active?.stop();
    active?.dispose();
  };
  const dispose = () => {
    if (current() === 'disposed') return;
    for (const cleanup of cleanups.splice(0)) cleanup();
    release();
    setState('disposed');
  };
  const island: Island = {
    get state() {
      return current();
    },
    dispose,
  };

  if (
    !canvas ||
    !capability.webgl ||
    (capability.reducedMotion && !allowReducedMotion)
  ) {
    setState('fallback');
    return island;
  }
  setState('idle');

  const sync = () => {
    if (!scene) return;
    if (visible && doc.visibilityState !== 'hidden') scene.start();
    else scene.stop();
  };
  const resize = () => scene?.resize(canvas.clientWidth, canvas.clientHeight);
  const ensureLoaded = async () => {
    if (current() !== 'idle') return;
    setState('loading');
    try {
      const factory = await load();
      if (current() !== 'loading') return;
      const created = await factory(canvas, capability);
      if (current() !== 'loading') {
        created.dispose();
        return;
      }
      scene = created;
      resize();
      setState('live');
      sync();
    } catch (error) {
      if (current() === 'disposed') return;
      console.warn('3D scene unavailable; showing the photo instead.', error);
      release();
      setState('fallback');
    }
  };

  cleanups.push(
    observe(element, (isVisible) => {
      visible = isVisible;
      if (isVisible) void ensureLoaded();
      sync();
    }),
  );
  const onVisibility = () => sync();
  doc.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() =>
    doc.removeEventListener('visibilitychange', onVisibility),
  );
  const onContextLost = (event: Event) => {
    event.preventDefault();
    release();
    if (current() !== 'disposed') setState('fallback');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  cleanups.push(() =>
    canvas.removeEventListener('webglcontextlost', onContextLost),
  );
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    cleanups.push(() => observer.disconnect());
  }
  return island;
}
