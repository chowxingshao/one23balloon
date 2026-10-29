import {
  BufferGeometry,
  ConeGeometry,
  DirectionalLight,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { createRenderer, fitCamera } from './renderer.ts';

type Rising = {
  balloon: Balloon;
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
};

// Balloons drift up through the closing section and are released again from below.
export async function createReleaseScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.6));
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 5, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const random = mulberry32(57);
  const materials = new PaletteMaterials(currentPalette(doc));
  // Per-material envMapIntensity (latex/pearl/chrome) needs the texture before any material exists.
  materials.setEnvironment(environment.texture);
  const geometry = createBalloonGeometry(high ? 32 : 18);
  const knot = new ConeGeometry(0.09, 0.14, 12);
  const stringMaterial = new LineBasicMaterial({ color: 0xb8ada4 });
  const string = new BufferGeometry().setFromPoints([
    new Vector3(0, -1.2, 0),
    new Vector3(0.12, -2.6, 0),
    new Vector3(-0.08, -4.2, 0),
  ]);
  let halfWidth = 2.5;
  // Released just below the frame and retired once the string clears the top.
  let floor = -3.4;
  let ceiling = 4.6;
  const spread = () => (random() * 2 - 1) * halfWidth;

  const rising: Rising[] = Array.from(
    { length: high ? 18 : 10 },
    (_, index) => {
      const material = materials.create(index % 5);
      const balloon = Balloon.create(
        geometry,
        material,
        0.22 + random() * 0.18,
        false,
      );
      const tie = new Mesh(knot, material);
      tie.position.y = -1.14;
      balloon.mesh.add(tie, new Line(string, stringMaterial));
      scene.add(balloon.mesh);
      return {
        balloon,
        x: 0,
        y: 0,
        z: -1 + random() * 2,
        speed: 0.35 + random() * 0.3,
        phase: random() * Math.PI * 2,
      };
    },
  );
  const confetti = new Confetti(scene, random);
  let now = 0;
  let placed = false;

  const stopPicking = createPicker(
    canvas,
    camera,
    () =>
      rising
        .map((entry) => entry.balloon)
        .filter((balloon) => balloon.poppable)
        .map((balloon) => balloon.mesh),
    (balloon) => {
      if (!balloon.pop(now)) return;
      confetti.burst(
        balloon.mesh.getWorldPosition(new Vector3()),
        (balloon.mesh.material as MeshPhysicalMaterial).color,
        { count: 12, size: 0.08, speed: 1.4, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) =>
    materials.transitionTo(id, now),
  );

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    for (const entry of rising) {
      entry.y += entry.speed * delta;
      if (entry.y > ceiling || entry.balloon.state === 'hidden') {
        entry.x = spread();
        entry.y = floor;
        entry.balloon.inflate(time);
      }
      entry.balloon.mesh.position.set(
        entry.x + Math.sin(time * 0.6 + entry.phase) * 0.25,
        entry.y,
        entry.z,
      );
      entry.balloon.mesh.rotation.z = Math.sin(time * 0.5 + entry.phase) * 0.1;
      entry.balloon.update(time);
    }
    materials.update(time);
    confetti.update(time, delta);
    renderer.render(scene, camera);
  });

  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      const halfHeight =
        Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const previous = halfWidth;
      halfWidth = halfHeight * camera.aspect * 0.85;
      floor = -halfHeight - 0.6;
      ceiling = halfHeight + 1.8;
      if (!placed) {
        // Most balloons start mid-flight so the section is never empty on arrival.
        for (const entry of rising) {
          entry.x = spread();
          entry.y = floor - 1 + random() * (ceiling - floor) * 0.75;
        }
        placed = true;
      } else if (previous !== halfWidth) {
        // Keep the spread matched to the frame when the aspect changes.
        for (const entry of rising) entry.x *= halfWidth / previous;
      }
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      confetti.dispose();
      materials.dispose();
      for (const item of [geometry, knot, string, stringMaterial])
        item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
