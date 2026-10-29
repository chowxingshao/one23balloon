import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import { initLanding } from '../../src/scripts/landing.ts';

const capable: Capability = {
  webgl: true,
  reducedMotion: false,
  tier: 'high',
  pixelRatio: 1,
};
let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM(`<div data-landing data-intro data-intro-skip="Skip">
    <div data-palette-picker hidden></div>
    <div data-island="hero"><canvas></canvas></div>
    <div data-island="unknown"><canvas></canvas></div>
  </div>`);
  vi.stubGlobal('CustomEvent', dom.window.CustomEvent);
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});
const doc = () => dom.window.document;
const root = () => doc().querySelector<HTMLElement>('[data-landing]')!;
const hero = () => doc().querySelector<HTMLElement>('[data-island="hero"]')!;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  } as unknown as Storage;
}

describe('initLanding', () => {
  it('mounts known islands, enhances pickers, starts motion and the intro, then disposes everything', async () => {
    const scene = {
      start: vi.fn(),
      stop: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
    };
    const motionDispose = vi.fn();
    const motion = vi.fn(() => motionDispose);
    const intro = vi.fn(() => new Promise<never>(() => undefined));
    const dispose = initLanding(root(), {
      capability: capable,
      storage: memoryStorage(),
      loaders: { hero: async () => async () => scene },
      intro,
      motion,
    });
    await flush();
    expect(hero().dataset.islandState).toBe('live');
    expect(
      doc()
        .querySelector('[data-island="unknown"]')!
        .hasAttribute('data-island-state'),
    ).toBe(false);
    expect(
      doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden,
    ).toBe(false);
    expect(motion).toHaveBeenCalledWith(root());
    expect(intro).toHaveBeenCalledOnce();
    expect(doc().querySelector('.intro')).not.toBeNull();

    dispose();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(motionDispose).toHaveBeenCalledOnce();
    expect(hero().dataset.islandState).toBe('disposed');
    expect(
      doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden,
    ).toBe(true);
    expect(doc().querySelector('.intro')).toBeNull();
  });

  it('keeps photo fallbacks and skips the intro without WebGL', () => {
    const load = vi.fn();
    const intro = vi.fn();
    initLanding(root(), {
      capability: { ...capable, webgl: false },
      storage: memoryStorage(),
      loaders: { hero: load },
      intro,
      motion: () => () => undefined,
    });
    expect(hero().dataset.islandState).toBe('fallback');
    expect(load).not.toHaveBeenCalled();
    expect(intro).not.toHaveBeenCalled();
  });
});
