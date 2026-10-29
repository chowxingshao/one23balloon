import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectCapability,
  type Capability,
} from '../../src/lib/canvas-island/capability.ts';
import {
  mountIsland,
  type IslandScene,
  type Observe,
} from '../../src/lib/canvas-island/lifecycle.ts';

const media = (matches: Record<string, boolean>) => (query: string) => ({
  matches: Boolean(matches[query]),
});
const canvasWith = (context: unknown) => () => ({ getContext: () => context });

describe('detectCapability', () => {
  it('reports WebGL, the high tier and a pixel ratio capped at 2', () => {
    const loseContext = vi.fn();
    expect(
      detectCapability({
        matchMedia: media({}),
        devicePixelRatio: 3,
        hardwareConcurrency: 8,
        deviceMemory: 8,
        createCanvas: canvasWith({ getExtension: () => ({ loseContext }) }),
      }),
    ).toEqual({
      webgl: true,
      reducedMotion: false,
      tier: 'high',
      pixelRatio: 2,
    });
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it.each([
    { matchMedia: media({ '(pointer: coarse)': true }) },
    { hardwareConcurrency: 4 },
    { deviceMemory: 2 },
  ])('uses the low tier for %o', (probe) => {
    expect(
      detectCapability({
        devicePixelRatio: 3,
        createCanvas: canvasWith({}),
        ...probe,
      }),
    ).toMatchObject({ tier: 'low', pixelRatio: 1.5 });
  });

  it('reports reduced motion', () => {
    expect(
      detectCapability({
        matchMedia: media({ '(prefers-reduced-motion: reduce)': true }),
      }).reducedMotion,
    ).toBe(true);
  });

  it('treats missing or failing WebGL as unavailable', () => {
    expect(detectCapability({ createCanvas: canvasWith(null) }).webgl).toBe(
      false,
    );
    expect(
      detectCapability({
        createCanvas: () => {
          throw new Error('blocked');
        },
      }).webgl,
    ).toBe(false);
    expect(detectCapability({}).webgl).toBe(false);
  });
});

describe('mountIsland', () => {
  let dom: JSDOM;
  beforeEach(() => {
    dom = new JSDOM('<div data-island="demo"><canvas></canvas></div>');
  });
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });

  const capable: Capability = {
    webgl: true,
    reducedMotion: false,
    tier: 'high',
    pixelRatio: 1,
  };
  const element = () =>
    dom.window.document.querySelector<HTMLElement>('[data-island]')!;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const fakeScene = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  });
  function manualVisibility() {
    let notify: (visible: boolean) => void = () => undefined;
    const stop = vi.fn();
    const observe: Observe = (_element, onChange) => {
      notify = onChange;
      return stop;
    };
    return { observe, stop, show: (visible: boolean) => notify(visible) };
  }

  it('falls back without WebGL and never loads', () => {
    const load = vi.fn();
    const island = mountIsland({
      element: element(),
      load,
      capability: { ...capable, webgl: false },
    });
    expect(island.state).toBe('fallback');
    expect(element().dataset.islandState).toBe('fallback');
    expect(load).not.toHaveBeenCalled();
  });

  it('falls back under reduced motion unless explicitly allowed', () => {
    const reduced = { ...capable, reducedMotion: true };
    expect(
      mountIsland({ element: element(), load: vi.fn(), capability: reduced })
        .state,
    ).toBe('fallback');
    expect(
      mountIsland({
        element: element(),
        load: vi.fn(),
        capability: reduced,
        allowReducedMotion: true,
        observe: () => () => undefined,
      }).state,
    ).toBe('idle');
  });

  it('loads when visible, starts, and stops when scrolled away', async () => {
    const scene = fakeScene();
    const factory = vi.fn(async () => scene);
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => factory,
      capability: capable,
      observe: visibility.observe,
    });
    expect(island.state).toBe('idle');
    visibility.show(true);
    await flush();
    expect(island.state).toBe('live');
    expect(factory).toHaveBeenCalledWith(
      element().querySelector('canvas'),
      capable,
    );
    expect(scene.resize).toHaveBeenCalledOnce();
    expect(scene.start).toHaveBeenCalledOnce();
    visibility.show(false);
    expect(scene.stop).toHaveBeenCalledOnce();
  });

  it('pauses while the document is hidden', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    mountIsland({
      element: element(),
      load: async () => async () => scene,
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    Object.defineProperty(dom.window.document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    expect(scene.stop).toHaveBeenCalledOnce();
  });

  it('falls back when loading fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => {
        throw new Error('chunk failed');
      },
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    expect(island.state).toBe('fallback');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('disposes the scene and stops observing', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => async () => scene,
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    island.dispose();
    expect(scene.stop).toHaveBeenCalled();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(visibility.stop).toHaveBeenCalledOnce();
    expect(island.state).toBe('disposed');
  });

  it('disposes a scene that finishes loading after the island was disposed', async () => {
    let resolve: (scene: IslandScene) => void = () => undefined;
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => () =>
        new Promise<IslandScene>((done) => (resolve = done)),
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    island.dispose();
    const scene = fakeScene();
    resolve(scene);
    await flush();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(scene.start).not.toHaveBeenCalled();
  });

  it('falls back and releases the scene when the WebGL context is lost', async () => {
    const scene = fakeScene();
    const visibility = manualVisibility();
    const island = mountIsland({
      element: element(),
      load: async () => async () => scene,
      capability: capable,
      observe: visibility.observe,
    });
    visibility.show(true);
    await flush();
    element()
      .querySelector('canvas')!
      .dispatchEvent(
        new dom.window.Event('webglcontextlost', { cancelable: true }),
      );
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(island.state).toBe('fallback');
  });
});
