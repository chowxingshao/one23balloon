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

// A controllable (prefers-reduced-motion: reduce) query on the test window.
function reduceQuery() {
  const handlers = new Set<(event: { matches: boolean }) => void>();
  const query = {
    matches: false,
    addEventListener: (_type: string, handler: never) => handlers.add(handler),
    removeEventListener: (_type: string, handler: never) =>
      handlers.delete(handler),
  };
  vi.stubGlobal('matchMedia', undefined);
  (dom.window as unknown as { matchMedia: () => unknown }).matchMedia = () =>
    query;
  return {
    listeners: () => handlers.size,
    change(matches: boolean) {
      query.matches = matches;
      for (const handler of [...handlers]) handler({ matches });
    },
  };
}

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

  it.each([
    ['WebGL is unavailable', { webgl: false }],
    ['the visitor prefers reduced motion', { reducedMotion: true }],
  ])('keeps the poster when %s', async (_name, overrides) => {
    const { initLanding } = await load();
    const load3d = vi.fn();
    initLanding(root(), {
      capability: capability(overrides),
      start: now,
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });

  it('keeps the poster when the motion config is off', async () => {
    const { initLanding } = await load();
    const load3d = vi.fn();
    initLanding(root(), {
      capability: capability(),
      start: now,
      motionEnabled: () => false,
      loaders: { stage: load3d },
      motion: () => () => undefined,
    });
    expect(load3d).not.toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });

  it('returns to the poster when reduced motion is switched on mid-visit', async () => {
    const { initLanding } = await load();
    const media = reduceQuery();
    const created = scene();
    initLanding(root(), {
      capability: capability(),
      start: now,
      loaders: { stage: async () => async () => created },
      motion: () => () => undefined,
    });
    await vi.waitFor(() => expect(root().dataset.stage).toBe('live'));
    media.change(true);
    expect(created.dispose).toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });

  it('does not start a low-tier stage after reduced motion was switched on', async () => {
    const { initLanding } = await load();
    const media = reduceQuery();
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
    media.change(true);
    engage();
    await Promise.resolve();
    expect(load3d).not.toHaveBeenCalled();
  });

  it('stops listening for reduced motion once disposed', async () => {
    const { initLanding } = await load();
    const media = reduceQuery();
    const dispose = initLanding(root(), {
      capability: capability(),
      start: now,
      loaders: { stage: async () => async () => scene() },
      motion: () => () => undefined,
    });
    expect(media.listeners()).toBe(1);
    dispose();
    expect(media.listeners()).toBe(0);
  });

  it('drops the stage when the chapter motion is unavailable', async () => {
    const { initLanding } = await load();
    const created = scene();
    let unavailable: () => void = () => undefined;
    initLanding(root(), {
      capability: capability(),
      start: now,
      loaders: { stage: async () => async () => created },
      motion: (_root, onUnavailable) => {
        unavailable = onUnavailable;
        return () => undefined;
      },
    });
    await vi.waitFor(() => expect(root().dataset.stage).toBe('live'));
    unavailable();
    expect(created.dispose).toHaveBeenCalled();
    expect(root().dataset.stage).toBeUndefined();
  });
});

describe('loadLandingMotion', () => {
  afterEach(() => vi.doUnmock('../../src/scripts/landing-motion.ts'));

  it('reports a chunk that fails to load', async () => {
    vi.doMock('../../src/scripts/landing-motion.ts', () => {
      throw new Error('chunk failed');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { loadLandingMotion } = await import('../../src/scripts/landing.ts');
    const onUnavailable = vi.fn();
    loadLandingMotion(root(), onUnavailable);
    await vi.waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
  });
});
