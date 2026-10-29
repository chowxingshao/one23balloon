import type { WebGLRenderer } from 'three';

// Scene time only advances while running, so paused scenes resume where they left off.
export class FrameLoop {
  private running = false;
  private last = 0;
  private time = 0;

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly tick: (time: number, delta: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop((timestamp: number) => {
      const delta = Math.min(0.05, (timestamp - this.last) / 1000);
      this.last = timestamp;
      this.time += Math.max(0, delta);
      this.tick(this.time, Math.max(0, delta));
    });
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }
}
