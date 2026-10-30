import { JSDOM } from 'jsdom';
import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  Vector3,
  type WebGLRenderer,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { paletteChangeEvent } from '../../src/lib/landing/events.ts';
import { palettes } from '../../src/lib/landing/palettes.ts';
import { mulberry32 } from '../../src/lib/random.ts';
import { Balloon } from '../../src/scenes/balloon.ts';
import {
  INFLATE_DURATION,
  REINFLATE_DELAY,
  inflateScale,
  popScale,
} from '../../src/scenes/balloon-motion.ts';
import { Confetti } from '../../src/scenes/confetti.ts';
import { firstPoppable } from '../../src/scenes/picking.ts';
import { compileScene } from '../../src/scenes/renderer.ts';
import {
  easeInOut,
  mixSurface,
  surface,
} from '../../src/scenes/material-params.ts';
import { PaletteMaterials, paletteColour } from '../../src/scenes/materials.ts';
import {
  currentPalette,
  onPaletteChange,
} from '../../src/scenes/palette-source.ts';

const hex = (color: Color) => `#${color.getHexString()}`;

describe('mulberry32', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('material parameters', () => {
  it('eases and mixes surfaces', () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(2)).toBe(1);
    expect(mixSurface(surface.latex, surface.chrome, 0.5).metalness).toBe(0.5);
  });
});

describe('balloon motion', () => {
  it('swells briefly, then disappears when popped', () => {
    expect(popScale(0)).toBe(1);
    expect(popScale(0.035)).toBeCloseTo(1.14, 5);
    expect(popScale(0.07)).toBeNull();
  });

  it('inflates from zero to one with a small overshoot and never goes negative', () => {
    const samples = Array.from({ length: 71 }, (_, i) => inflateScale(i / 100));
    expect(samples[0]).toBe(0);
    expect(inflateScale(INFLATE_DURATION)).toBe(1);
    expect(Math.max(...samples)).toBeGreaterThan(1);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
  });
});

describe('Balloon', () => {
  it('pops, hides, re-inflates and settles at its radius', () => {
    const balloon = Balloon.create(
      new BoxGeometry(),
      new MeshBasicMaterial(),
      0.5,
      true,
    );
    expect(balloon.mesh.userData.balloon).toBe(balloon);
    expect(balloon.pop(1)).toBe(true);
    expect(balloon.pop(1)).toBe(false);
    balloon.update(1.035);
    expect(balloon.mesh.scale.x).toBeGreaterThan(0.5);
    balloon.update(1.08);
    expect(balloon.state).toBe('hidden');
    expect(balloon.mesh.visible).toBe(false);
    expect(balloon.poppable).toBe(false);
    // Small margins keep floating-point subtraction on the right side of each threshold.
    const inflatedAt = 1.08 + REINFLATE_DELAY + 0.01;
    balloon.update(inflatedAt);
    expect(balloon.state).toBe('inflating');
    expect(balloon.mesh.visible).toBe(true);
    balloon.update(inflatedAt + INFLATE_DURATION + 0.01);
    expect(balloon.state).toBe('idle');
    expect(balloon.mesh.scale.x).toBeCloseTo(0.5);
  });

  it('keeps a non-uniform base scale and can stay popped', () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    mesh.scale.set(1, 2, 1);
    const balloon = new Balloon(mesh, false);
    balloon.pop(0);
    balloon.update(0.1);
    balloon.update(10);
    expect(balloon.state).toBe('hidden');
    balloon.inflate(10);
    balloon.update(10 + INFLATE_DURATION + 0.01);
    expect(mesh.scale.toArray()).toEqual([1, 2, 1]);
  });
});

describe('firstPoppable', () => {
  it('skips popped balloons and unrelated objects to find a poppable one', () => {
    const make = () =>
      Balloon.create(new BoxGeometry(), new MeshBasicMaterial(), 1, false);
    const popped = make();
    popped.pop(0);
    popped.update(1);
    const visible = make();
    const other = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    expect(popped.poppable).toBe(false);
    expect(
      firstPoppable([
        { object: other },
        { object: popped.mesh },
        { object: visible.mesh },
      ]),
    ).toBe(visible);
    expect(firstPoppable([{ object: popped.mesh }])).toBeUndefined();
    expect(firstPoppable([])).toBeUndefined();
  });
});

describe('Confetti', () => {
  it('adds particles, removes them after their lifetime, and disposes', () => {
    const parent = new Group();
    const confetti = new Confetti(parent, mulberry32(1));
    confetti.burst(new Vector3(), new Color('#ff0000'), {
      count: 5,
      size: 0.1,
      speed: 1,
      now: 0,
    });
    expect(parent.children).toHaveLength(5);
    confetti.update(1, 0.016);
    expect(confetti.active).toBe(5);
    confetti.update(2, 0.016);
    expect(parent.children).toHaveLength(0);
    confetti.burst(new Vector3(), new Color('#00ff00'), {
      count: 3,
      size: 0.1,
      speed: 1,
      now: 2,
    });
    confetti.dispose();
    expect(parent.children).toHaveLength(0);
  });
});

describe('PaletteMaterials', () => {
  it('creates palette materials and transitions them to another palette', () => {
    const materials = new PaletteMaterials('blush-champagne', () => 0);
    const latex = materials.create(0);
    const chrome = materials.create('chrome');
    expect(hex(latex.color)).toBe('#e8b4b2');
    expect(latex.metalness).toBe(0);
    expect(chrome.metalness).toBe(1);
    expect(hex(chrome.color)).toBe('#d9b47a');
    materials.transitionTo('rose-gold', 10);
    expect(materials.palette).toBe('rose-gold');
    materials.update(10.45);
    expect(hex(latex.color)).not.toBe('#e8b4b2');
    materials.update(11);
    expect(hex(latex.color)).toBe('#b5475b');
    expect(hex(chrome.color)).toBe('#d4af6a');
    expect(materials.shared(1)).toBe(materials.shared(1));
  });

  it('applies the environment map to existing and new materials', () => {
    const materials = new PaletteMaterials('jewel', () => 0);
    const before = materials.create(0);
    const texture = new Texture();
    materials.setEnvironment(texture);
    const after = materials.create('chrome');
    expect(before.envMap).toBe(texture);
    expect(after.envMap).toBe(texture);
  });

  it('wraps slot numbers onto the palette', () => {
    expect(paletteColour('jewel', 7)).toEqual(palettes.jewel.colours[2]);
    expect(paletteColour('jewel', -1)).toEqual(palettes.jewel.colours[4]);
    expect(paletteColour('jewel', 'chrome').material).toBe('chrome');
  });
});

describe('palette source', () => {
  let dom: JSDOM;
  afterEach(() => dom?.window.close());

  it('reads the current palette and forwards valid changes only', () => {
    dom = new JSDOM('<div data-landing data-palette="sage-cream"></div>');
    const doc = dom.window.document;
    expect(currentPalette(doc)).toBe('sage-cream');
    const listener = vi.fn();
    const stop = onPaletteChange(doc, listener);
    const send = (id: string) =>
      doc.querySelector('[data-landing]')!.dispatchEvent(
        new dom.window.CustomEvent(paletteChangeEvent, {
          bubbles: true,
          detail: { id },
        }),
      );
    send('jewel');
    send('neon');
    stop();
    send('rose-gold');
    expect(listener.mock.calls).toEqual([['jewel']]);
  });

  it('falls back to the default palette', () => {
    dom = new JSDOM('<div></div>');
    expect(currentPalette(dom.window.document)).toBe('blush-champagne');
  });
});

describe('compileScene', () => {
  afterEach(() => vi.useRealTimers());
  const scene = new Scene();
  const camera = new PerspectiveCamera();

  it('waits for the parallel compile to finish', async () => {
    let finish: () => void = () => undefined;
    const compileAsync = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const renderer = { compileAsync } as unknown as WebGLRenderer;
    let done = false;
    void compileScene(renderer, scene, camera).then(() => (done = true));
    await Promise.resolve();
    expect(compileAsync).toHaveBeenCalledWith(scene, camera);
    expect(done).toBe(false);
    finish();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(done).toBe(true);
  });

  it('stops waiting after the limit, leaving the rest to the first render', async () => {
    vi.useFakeTimers();
    const renderer = {
      compileAsync: () => new Promise<void>(() => undefined),
    } as unknown as WebGLRenderer;
    let done = false;
    void compileScene(renderer, scene, camera, 500).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });
});
