import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capability } from '../../src/lib/canvas-island/capability.ts';
import type { IslandScene } from '../../src/lib/canvas-island/lifecycle.ts';

let dom: JSDOM;
const now = (run: () => void) => {
  run();
  return () => undefined;
};
const capability = (overrides: Partial<Capability> = {}): Capability => ({
  webgl: true,
  reducedMotion: false,
  tier: 'high',
  pixelRatio: 1,
  ...overrides,
});
const scene = (): IslandScene => ({
  start: vi.fn(),
  stop: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
});

beforeEach(() => {
  dom = new JSDOM(`<body>
    <div class="stage" data-island="stage"><canvas></canvas></div>
    <div data-landing data-formation="hero"></div></body>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('IntersectionObserver', undefined);
  vi.stubGlobal('ResizeObserver', undefined);
});
afterEach(() => vi.unstubAllGlobals());

async function load() {
  return import('../../src/scripts/landing.ts');
}
const root = () =>
  dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLanding', () => {
  it('mounts the stage outside the landing root, marks it live, then disposes', async () => {
    const { initLanding } = await load();
    const created = scene();
    const motionDispose = vi.fn();
    const dispose = initLanding(root(), {
      capability: capability(),
      start: now,
      loaders: { stage: async () => async () => created },
      motion: () => motionDispose,
    });
    await vi.waitFor(() => expect(created.start).toHaveBeenCalled());
    expect(root().dataset.stage).toBe('live');
    dispose();
    expect(created.dispose).toHaveBeenCalled();
    expect(motionDispose).toHaveBeenCalled();
  });

  it('does nothing before the start schedule fires', async () => {
    const { initLanding } = await load();
    const probe = vi.fn(() => capability());
    const motion = vi.fn(() => () => undefined);
    initLanding(root(), {
      capability: probe,
      start: () => () => undefined,
      motion,
    });
    expect(probe).not.toHaveBeenCalled();
    expect(motion).not.toHaveBeenCalled();
  });

  it('on the low tier waits for engagement before loading the stage', async () => {
    const { initLanding } = await load();
    let engage: () => void = () => undefined;
    const load3d = vi.fn(async () => async () => scene());
    initLanding(root(), {
      capability: capability({ tier: 'low' }),
      start: now,
      engage: (run) => {
        engage = run;
        return () => undefined;
      },
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    engage();
    await vi.waitFor(() => expect(load3d).toHaveBeenCalled());
  });

  it('keeps the poster when WebGL or motion is unavailable', async () => {
    const { initLanding } = await load();
    const load3d = vi.fn();
    initLanding(root(), {
      capability: capability({ webgl: false }),
      start: now,
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });
});
