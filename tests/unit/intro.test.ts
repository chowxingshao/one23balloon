import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import {
  introGrid,
  introLayout,
  introStorageKey,
  markIntroPlayed,
  shouldPlayIntro,
} from '../../src/lib/landing/intro-plan.ts';
import type {
  IslandScene,
  SceneFactory,
} from '../../src/lib/canvas-island/lifecycle.ts';
import { playIntro } from '../../src/scripts/intro.ts';

const capable: Capability = {
  webgl: true,
  reducedMotion: false,
  tier: 'high',
  pixelRatio: 1,
};
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  } as unknown as Storage;
}
const throwing = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('shouldPlayIntro', () => {
  it('plays once per session with WebGL and motion allowed', () => {
    const storage = memoryStorage();
    expect(shouldPlayIntro(storage, capable)).toBe(true);
    markIntroPlayed(storage);
    expect(storage.getItem(introStorageKey)).toBe('1');
    expect(shouldPlayIntro(storage, capable)).toBe(false);
  });

  it('never plays without WebGL, with reduced motion, or without storage', () => {
    expect(shouldPlayIntro(memoryStorage(), { ...capable, webgl: false })).toBe(
      false,
    );
    expect(
      shouldPlayIntro(memoryStorage(), { ...capable, reducedMotion: true }),
    ).toBe(false);
    expect(shouldPlayIntro(undefined, capable)).toBe(false);
    expect(shouldPlayIntro(throwing, capable)).toBe(false);
    expect(() => markIntroPlayed(throwing)).not.toThrow();
  });
});

describe('introGrid', () => {
  it('keeps the balloon count near the target and follows the aspect ratio', () => {
    for (const target of [60, 30])
      for (const aspect of [16 / 9, 1, 0.46]) {
        const { cols, rows } = introGrid(target, aspect);
        expect(cols * rows).toBeGreaterThanOrEqual(target * 0.75);
        expect(cols * rows).toBeLessThanOrEqual(target * 1.25);
        expect(cols).toBeGreaterThanOrEqual(3);
        expect(rows).toBeGreaterThanOrEqual(3);
        if (aspect >= 1) expect(cols).toBeGreaterThanOrEqual(rows);
        else expect(rows).toBeGreaterThanOrEqual(cols);
      }
  });

  it('treats a non-finite aspect as square', () => {
    for (const aspect of [Number.NaN, Infinity, -Infinity])
      expect(introGrid(60, aspect)).toEqual(introGrid(60, 1));
  });
});

describe('introLayout', () => {
  const options = {
    cols: 13,
    rows: 8,
    halfWidth: 1.47,
    halfHeight: 0.95,
    seed: 5,
    slots: 5,
  };

  it('fills the grid deterministically and finishes within about two seconds', () => {
    const layout = introLayout(options);
    expect(layout).toEqual(introLayout(options));
    expect(layout.cells).toHaveLength(104);
    expect(layout.duration).toBeGreaterThan(1.5);
    expect(layout.duration).toBeLessThanOrEqual(2.3);
    for (const cell of layout.cells) {
      expect(cell.inflateAt).toBeLessThan(0.35);
      expect(cell.popAt).toBeGreaterThan(1.1);
    }
  });

  it('pops from the centre outwards', () => {
    const { cells } = introLayout(options);
    const distance = (cell: { x: number; y: number }) =>
      Math.hypot(cell.x, cell.y);
    const max = Math.hypot(options.halfWidth, options.halfHeight);
    for (const a of cells)
      for (const b of cells)
        if (distance(a) - distance(b) > 0.15 * max)
          expect(a.popAt).toBeGreaterThan(b.popAt);
  });
});

describe('playIntro', () => {
  let dom: JSDOM;
  beforeEach(() => {
    dom = new JSDOM(
      '<div data-landing data-intro data-intro-skip="Skip intro"></div>',
    );
  });
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });
  const root = () =>
    dom.window.document.querySelector<HTMLElement>('[data-landing]')!;
  const overlay = () => dom.window.document.querySelector('.intro');
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const pending = () => new Promise<never>(() => undefined);

  it('does nothing when the intro already played this session', () => {
    const storage = memoryStorage();
    markIntroPlayed(storage);
    const load = vi.fn();
    playIntro({ root: root(), capability: capable, storage, load });
    expect(overlay()).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('adds a decorative canvas and a labelled skip button, and marks the session', () => {
    const storage = memoryStorage();
    playIntro({ root: root(), capability: capable, storage, load: pending });
    expect(
      overlay()?.querySelector('canvas')?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(overlay()?.querySelector('button')?.textContent).toBe('Skip intro');
    expect(storage.getItem(introStorageKey)).toBe('1');
  });

  it('ends on skip', () => {
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: pending,
    });
    overlay()!.querySelector('button')!.click();
    expect(overlay()).toBeNull();
  });

  it('ends on Escape', () => {
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: pending,
    });
    dom.window.document.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
    );
    expect(overlay()).toBeNull();
  });

  it('ends when the scene reports it is done', async () => {
    const scene = {
      start: vi.fn(),
      stop: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
    };
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: async (onDone) => async () => {
        setTimeout(onDone, 0);
        return scene;
      },
    });
    await flush();
    await flush();
    expect(overlay()).toBeNull();
    expect(scene.dispose).toHaveBeenCalledOnce();
  });

  it('ends if the scene cannot load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: async () => {
        throw new Error('chunk failed');
      },
    });
    await flush();
    expect(overlay()).toBeNull();
  });

  const fakeScene = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  });

  it('stays hidden until the scene is live', async () => {
    let resolve: (factory: SceneFactory) => void = () => undefined;
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: () => new Promise<SceneFactory>((done) => (resolve = done)),
    });
    expect(overlay()?.getAttribute('data-island-state')).toBe('loading');
    resolve(async () => fakeScene());
    await flush();
    expect(overlay()?.getAttribute('data-island-state')).toBe('live');
  });

  it('disposes a scene that finishes building after the intro was skipped', async () => {
    let resolve: (scene: IslandScene) => void = () => undefined;
    const factory = vi.fn(
      () => new Promise<IslandScene>((done) => (resolve = done)),
    );
    const scene = fakeScene();
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: async () => factory,
    });
    await flush();
    expect(factory).toHaveBeenCalledOnce();
    overlay()!.querySelector('button')!.click();
    resolve(scene);
    await flush();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(scene.start).not.toHaveBeenCalled();
  });

  it('never builds the scene when skipped before the chunk loads', async () => {
    let resolve: (factory: SceneFactory) => void = () => undefined;
    const factory = vi.fn(async () => fakeScene());
    playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: () => new Promise<SceneFactory>((done) => (resolve = done)),
    });
    overlay()!.querySelector('button')!.click();
    resolve(factory);
    await flush();
    expect(factory).not.toHaveBeenCalled();
  });

  describe('time limits', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('gives up if the scene is not live within 1.2 s', async () => {
      const onFinish = vi.fn();
      playIntro({
        root: root(),
        capability: capable,
        storage: memoryStorage(),
        load: pending,
        onFinish,
      });
      await vi.advanceTimersByTimeAsync(1199);
      expect(overlay()).not.toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      expect(overlay()).toBeNull();
      expect(onFinish).toHaveBeenCalledOnce();
    });

    it('ends after 3.5 s even if the scene never reports it is done', async () => {
      playIntro({
        root: root(),
        capability: capable,
        storage: memoryStorage(),
        load: async () => async () => fakeScene(),
      });
      await vi.advanceTimersByTimeAsync(3499);
      expect(overlay()?.getAttribute('data-island-state')).toBe('live');
      await vi.advanceTimersByTimeAsync(1);
      expect(overlay()).toBeNull();
    });
  });

  it('runs finish once, fading out without blocking input', () => {
    const fade = { finished: new Promise<void>(() => undefined) };
    const animate = vi.fn(() => fade);
    (dom.window.HTMLElement.prototype as { animate?: unknown }).animate =
      animate;
    const onFinish = vi.fn();
    const finish = playIntro({
      root: root(),
      capability: capable,
      storage: memoryStorage(),
      load: pending,
      onFinish,
    });
    finish();
    finish();
    expect(onFinish).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fill: 'forwards' }),
    );
    expect(overlay()?.style.pointerEvents).toBe('none');
  });

  it('reports finish straight away when the intro does not play', () => {
    const onFinish = vi.fn();
    playIntro({
      root: root(),
      capability: { ...capable, webgl: false },
      storage: memoryStorage(),
      load: pending,
      onFinish,
    });
    expect(onFinish).toHaveBeenCalledOnce();
  });
});
