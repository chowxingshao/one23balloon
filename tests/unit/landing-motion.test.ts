import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Run = (context: {
  conditions?: Record<string, boolean>;
}) => (() => void) | void;
let dom: JSDOM;

function setup({ motion = true } = {}) {
  const added: Array<{ query: unknown; run: Run }> = [];
  const revert = vi.fn();
  const registerPlugin = vi.fn();
  const smootherKill = vi.fn();
  const create = vi.fn(() => ({ kill: smootherKill }));
  const chapterCalls: string[] = [];
  vi.resetModules();
  vi.doMock('../../src/lib/config/site.ts', () => ({
    getSiteConfig: () => ({ features: { motion } }),
  }));
  vi.doMock('gsap', () => ({
    gsap: {
      registerPlugin,
      matchMedia: () => ({
        add: (query: unknown, run: Run) => added.push({ query, run }),
        revert,
      }),
    },
  }));
  vi.doMock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: {
      refresh: vi.fn(),
      create: vi.fn(() => ({ kill: vi.fn() })),
    },
  }));
  vi.doMock('gsap/ScrollSmoother', () => ({ ScrollSmoother: { create } }));
  vi.doMock('gsap/SplitText', () => ({ SplitText: {} }));
  vi.doMock('../../src/scripts/chapters/index.ts', () => ({
    chapters: Object.fromEntries(
      [
        'hero',
        'statement',
        'services',
        'signature',
        'celebrations',
        'closing',
      ].map((id) => [
        id,
        (section: HTMLElement, context: { desktop: boolean }) => {
          chapterCalls.push(`${section.dataset.chapter}:${context.desktop}`);
        },
      ]),
    ),
  }));
  return {
    added,
    revert,
    registerPlugin,
    create,
    smootherKill,
    chapterCalls,
    load: () => import('../../src/scripts/landing-motion.ts'),
  };
}

beforeEach(() => {
  dom = new JSDOM(`<div id="smooth-wrapper"><div id="smooth-content">
    <div data-landing>
      <section data-chapter="hero"></section>
      <section data-chapter="closing"></section>
    </div></div></div>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const path of [
    '../../src/lib/config/site.ts',
    'gsap',
    'gsap/ScrollTrigger',
    'gsap/ScrollSmoother',
    'gsap/SplitText',
    '../../src/scripts/chapters/index.ts',
  ])
    vi.doUnmock(path);
});

const root = () =>
  dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLandingMotion', () => {
  it('does nothing when motion is off', async () => {
    const harness = setup({ motion: false });
    const { initLandingMotion } = await harness.load();
    initLandingMotion(root())();
    expect(harness.added).toHaveLength(0);
  });

  it('creates the smoother first, only on its own media query', async () => {
    const harness = setup();
    const { initLandingMotion, motionQueries } = await harness.load();
    initLandingMotion(root());
    expect(harness.registerPlugin).toHaveBeenCalled();
    expect(harness.added[0]!.query).toBe(motionQueries.smooth);
    const cleanup = harness.added[0]!.run({});
    expect(harness.create).toHaveBeenCalledTimes(1);
    (cleanup as () => void)();
    expect(harness.smootherKill).toHaveBeenCalled();
  });

  it('runs every present chapter with the desktop flag, then reverts on dispose', async () => {
    const harness = setup();
    const { initLandingMotion } = await harness.load();
    const dispose = initLandingMotion(root());
    harness.added[1]!.run({ conditions: { motion: true, desktop: true } });
    expect(harness.chapterCalls).toEqual(['hero:true', 'closing:true']);
    dispose();
    expect(harness.revert).toHaveBeenCalled();
  });
});
