import { PerspectiveCamera, Scene, type WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../src/lib/random.ts';
import { compileScene } from '../../src/scenes/renderer.ts';

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
