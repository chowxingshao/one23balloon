import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import { markIntroPlayed } from '../../src/lib/landing/intro-plan.ts';
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
  // Islands wait for idle time; run that step at once so tests only await promises.
  vi.stubGlobal('requestIdleCallback', (run: () => void) => {
    run();
    return 0;
  });
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});
const doc = () => dom.window.document;
const root = () => doc().querySelector<HTMLElement>('[data-landing]')!;
const hero = () => doc().querySelector<HTMLElement>('[data-island="hero"]')!;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
// Runs a scheduled step straight away, standing in for "after load and idle".
const now = (run: () => void) => {
  run();
  return () => undefined;
};
function manualSchedule() {
  let pending: (() => void) | undefined;
  const cancel = vi.fn();
  const schedule = vi.fn((run: () => void) => {
    pending = run;
    return cancel;
  });
  return { schedule, cancel, run: () => pending?.() };
}
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  } as unknown as Storage;
}

describe('initLanding', () => {
  const fakeScene = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  });
  const played = () => {
    const storage = memoryStorage();
    markIntroPlayed(storage);
    return storage;
  };

  it('mounts known islands, enhances pickers, starts motion, then disposes everything', async () => {
    const scene = fakeScene();
    const motionDispose = vi.fn();
    const motion = vi.fn(() => motionDispose);
    const intro = vi.fn();
    const dispose = initLanding(root(), {
      capability: capable,
      start: now,
      storage: played(),
      loaders: { hero: async () => async () => scene },
      intro,
      motion,
    });
    await flush();
    expect(hero().dataset.islandState).toBe('live');
    expect(intro).not.toHaveBeenCalled();
    expect(
      doc()
        .querySelector('[data-island="unknown"]')!
        .hasAttribute('data-island-state'),
    ).toBe(false);
    expect(
      doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden,
    ).toBe(false);
    expect(motion).toHaveBeenCalledWith(root());

    dispose();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(motionDispose).toHaveBeenCalledOnce();
    expect(hero().dataset.islandState).toBe('disposed');
    expect(
      doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden,
    ).toBe(true);
  });

  it('builds the hero scene only after the intro finishes', async () => {
    const scene = fakeScene();
    const heroLoad = vi.fn(async () => async () => scene);
    const intro = vi.fn(() => new Promise<never>(() => undefined));
    initLanding(root(), {
      capability: capable,
      start: now,
      storage: memoryStorage(),
      loaders: { hero: heroLoad },
      intro,
      motion: () => () => undefined,
    });
    await flush();
    expect(intro).toHaveBeenCalledOnce();
    expect(doc().querySelector('.intro')).not.toBeNull();
    expect(heroLoad).not.toHaveBeenCalled();
    expect(hero().hasAttribute('data-island-state')).toBe(false);

    doc().querySelector<HTMLButtonElement>('.intro-skip')!.click();
    await flush();
    expect(hero().dataset.islandState).toBe('live');
  });

  it('does not mount the hero when disposed while the intro plays', async () => {
    const heroLoad = vi.fn(async () => async () => fakeScene());
    const dispose = initLanding(root(), {
      capability: capable,
      start: now,
      storage: memoryStorage(),
      loaders: { hero: heroLoad },
      intro: () => new Promise<never>(() => undefined),
      motion: () => () => undefined,
    });
    dispose();
    await flush();
    expect(doc().querySelector('.intro')).toBeNull();
    expect(heroLoad).not.toHaveBeenCalled();
    expect(hero().hasAttribute('data-island-state')).toBe(false);
  });

  it('does no 3D, motion or WebGL probing until the page has loaded and gone idle', async () => {
    const start = manualSchedule();
    const detect = vi.fn(() => capable);
    const motion = vi.fn(() => () => undefined);
    const intro = vi.fn(() => new Promise<never>(() => undefined));
    initLanding(root(), {
      capability: detect,
      start: start.schedule,
      storage: memoryStorage(),
      loaders: { hero: async () => async () => fakeScene() },
      intro,
      motion,
    });
    await flush();
    expect(
      doc().querySelector<HTMLElement>('[data-palette-picker]')!.hidden,
    ).toBe(false);
    expect(detect).not.toHaveBeenCalled();
    expect(motion).not.toHaveBeenCalled();
    expect(intro).not.toHaveBeenCalled();
    expect(hero().hasAttribute('data-island-state')).toBe(false);

    start.run();
    await flush();
    expect(detect).toHaveBeenCalledOnce();
    expect(motion).toHaveBeenCalledWith(root());
    expect(intro).toHaveBeenCalledOnce();
  });

  it('waits for the window load event by default', async () => {
    Object.defineProperty(doc(), 'readyState', {
      configurable: true,
      value: 'loading',
    });
    const motion = vi.fn(() => () => undefined);
    initLanding(root(), {
      capability: capable,
      storage: played(),
      loaders: { hero: async () => async () => fakeScene() },
      motion,
    });
    await flush();
    expect(motion).not.toHaveBeenCalled();
    dom.window.dispatchEvent(new dom.window.Event('load'));
    await flush();
    expect(motion).toHaveBeenCalledOnce();
    expect(hero().dataset.islandState).toBe('live');
  });

  it('cancels the pending start when disposed first', () => {
    const start = manualSchedule();
    const motion = vi.fn(() => () => undefined);
    const dispose = initLanding(root(), {
      capability: capable,
      start: start.schedule,
      storage: played(),
      motion,
    });
    dispose();
    expect(start.cancel).toHaveBeenCalledOnce();
    start.run();
    expect(motion).not.toHaveBeenCalled();
  });

  it('on the low tier, skips the intro and leaves WebGL alone until the visitor engages', async () => {
    const engage = manualSchedule();
    const probe = vi.fn(() => true);
    const heroLoad = vi.fn(async () => async () => fakeScene());
    const motion = vi.fn(() => () => undefined);
    const intro = vi.fn();
    initLanding(root(), {
      capability: () => ({
        ...capable,
        tier: 'low',
        get webgl() {
          return probe();
        },
      }),
      start: now,
      engage: engage.schedule,
      storage: memoryStorage(),
      loaders: { hero: heroLoad },
      intro,
      motion,
    });
    await flush();
    expect(motion).toHaveBeenCalledOnce();
    expect(probe).not.toHaveBeenCalled();
    expect(hero().hasAttribute('data-island-state')).toBe(false);

    engage.run();
    await flush();
    expect(probe).toHaveBeenCalled();
    expect(intro).not.toHaveBeenCalled();
    expect(doc().querySelector('.intro')).toBeNull();
    expect(heroLoad).toHaveBeenCalledOnce();
    expect(hero().dataset.islandState).toBe('live');
  });

  it('keeps photo fallbacks and skips the intro without WebGL', () => {
    const load = vi.fn();
    const intro = vi.fn();
    initLanding(root(), {
      capability: { ...capable, webgl: false },
      start: now,
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
