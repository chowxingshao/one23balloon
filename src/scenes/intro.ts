import {
  DirectionalLight,
  HemisphereLight,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { introLayout, type IntroCell } from '../lib/landing/intro-plan.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette } from './palette-source.ts';
import { createRenderer, fitCamera } from './renderer.ts';

type Cell = { balloon: Balloon; cell: IntroCell; inflated: boolean };
const DEPTH = 3;

export async function createIntroScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
  options: { onDone: () => void },
): Promise<IslandScene> {
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.6));
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 4, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 9);
  const materials = new PaletteMaterials(currentPalette(canvas.ownerDocument));
  materials.setEnvironment(environment.texture);
  const geometry = createBalloonGeometry(high ? 32 : 18);
  const confetti = new Confetti(scene, mulberry32(99));
  let cells: Cell[] = [];
  let duration = 0;
  let done = false;

  // The wall is laid out once, on the first resize, when the aspect ratio is known.
  const build = () => {
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * DEPTH;
    const halfWidth = halfHeight * camera.aspect;
    const cols = high ? 13 : 8;
    const rows = Math.max(5, Math.round(cols * (halfHeight / halfWidth)));
    const layout = introLayout({
      cols,
      rows,
      halfWidth,
      halfHeight,
      seed: 5,
      slots: 5,
    });
    duration = layout.duration;
    cells = layout.cells.map((cell) => {
      const balloon = Balloon.create(
        geometry,
        materials.shared(cell.slot),
        cell.radius,
        false,
      );
      balloon.mesh.position.set(cell.x, cell.y, camera.position.z - DEPTH);
      balloon.mesh.visible = false;
      scene.add(balloon.mesh);
      return { balloon, cell, inflated: false };
    });
  };

  const loop = new FrameLoop(renderer, (time, delta) => {
    for (const entry of cells) {
      if (!entry.inflated && time >= entry.cell.inflateAt) {
        entry.inflated = true;
        entry.balloon.inflate(time);
      }
      if (time >= entry.cell.popAt && entry.balloon.pop(time))
        confetti.burst(
          entry.balloon.mesh.position,
          (entry.balloon.mesh.material as MeshPhysicalMaterial).color,
          { count: 8, size: 0.035, speed: 0.9, now: time },
        );
      entry.balloon.update(time);
    }
    confetti.update(time, delta);
    renderer.render(scene, camera);
    if (!done && duration && time >= duration + 0.4) {
      done = true;
      // Finish outside the animation callback, which disposes this renderer.
      setTimeout(options.onDone, 0);
    }
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      if (!cells.length) build();
    },
    dispose: () => {
      loop.stop();
      confetti.dispose();
      materials.dispose();
      geometry.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
