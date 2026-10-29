import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Run = () => (() => void) | void;
let dom: JSDOM;

function setup({ motion = true } = {}) {
  const added: Array<{ query: string; run: Run }> = [];
  const revert = vi.fn();
  const to = vi.fn();
  vi.resetModules();
  vi.doMock('../../src/lib/config/site.ts', () => ({
    getSiteConfig: () => ({ features: { motion } }),
  }));
  vi.doMock('gsap', () => ({
    gsap: {
      to,
      registerPlugin: vi.fn(),
      context: vi.fn(() => ({ add: vi.fn(), revert: vi.fn() })),
      matchMedia: () => ({
        add: (query: string, run: Run) => added.push({ query, run }),
        revert,
      }),
    },
  }));
  vi.doMock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: { refresh: vi.fn() },
  }));
  return {
    added,
    revert,
    to,
    load: () => import('../../src/scripts/landing-motion.ts'),
  };
}

beforeEach(() => {
  dom = new JSDOM(`<div data-landing>
    <div data-gallery><ol data-gallery-track></ol></div>
    <div data-marquee><ul class="marquee-list"></ul><ul class="marquee-list marquee-copy"></ul></div>
  </div>`);
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('../../src/lib/config/site.ts');
  vi.doUnmock('gsap');
  vi.doUnmock('gsap/ScrollTrigger');
  dom.window.close();
});
const root = () =>
  dom.window.document.querySelector<HTMLElement>('[data-landing]')!;

describe('initLandingMotion', () => {
  it('does nothing when motion is disabled', async () => {
    const motion = setup({ motion: false });
    const { initLandingMotion } = await motion.load();
    initLandingMotion(root())();
    expect(motion.added).toHaveLength(0);
    expect(motion.to).not.toHaveBeenCalled();
  });

  it('runs the marquee, pins the gallery on wide screens, and cleans up', async () => {
    const motion = setup();
    const { initLandingMotion } = await motion.load();
    const dispose = initLandingMotion(root());
    expect(motion.added.map((entry) => entry.query)).toEqual([
      '(prefers-reduced-motion: no-preference)',
      '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
    ]);
    const cleanups = motion.added.map((entry) => entry.run());
    const marquee = root().querySelector('[data-marquee]')!;
    const gallery = root().querySelector('[data-gallery]')!;
    expect(marquee.classList.contains('is-running')).toBe(true);
    expect(gallery.classList.contains('is-pinned')).toBe(true);
    expect(motion.to.mock.calls[0][0]).toHaveLength(2);
    expect(motion.to.mock.calls[1][0]).toBe(
      root().querySelector('[data-gallery-track]'),
    );
    expect(motion.to.mock.calls[1][1].scrollTrigger).toMatchObject({
      trigger: gallery,
      pin: true,
      scrub: 1,
    });
    for (const cleanup of cleanups) cleanup?.();
    expect(marquee.classList.contains('is-running')).toBe(false);
    expect(gallery.classList.contains('is-pinned')).toBe(false);
    dispose();
    expect(motion.revert).toHaveBeenCalledOnce();
  });

  it('travels the gallery past the viewport padding so the last card shows', async () => {
    const motion = setup();
    const { initLandingMotion } = await motion.load();
    initLandingMotion(root());
    const gallery = root().querySelector<HTMLElement>('[data-gallery]')!;
    const track = root().querySelector<HTMLElement>('[data-gallery-track]')!;
    Object.defineProperty(track, 'scrollWidth', {
      value: 4872,
      configurable: true,
    });
    Object.defineProperty(gallery, 'clientWidth', { value: 1265 });
    vi.stubGlobal('getComputedStyle', () => ({
      paddingInlineStart: '48px',
      paddingInlineEnd: '48px',
    }));
    for (const entry of motion.added) entry.run();
    const vars = motion.to.mock.calls[1][1];
    expect(vars.x()).toBe(-(4872 + 96 - 1265));
    expect(vars.scrollTrigger.end()).toBe(`+=${4872 + 96 - 1265}`);
    Object.defineProperty(track, 'scrollWidth', { value: 600 });
    expect(vars.x()).toBe(-0);
  });
});
