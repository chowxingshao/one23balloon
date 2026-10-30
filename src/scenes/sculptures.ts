import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { compileScene, createRenderer, fitCamera } from './renderer.ts';
import { buildSculpture } from './sculpture-mesh.ts';
import { cakeParts, dogParts, tulipParts } from './sculpture-parts.ts';

export async function createSculptureScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const segments = capability.tier === 'high' ? 40 : 20;
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.55));
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 6, 7);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);

  const random = mulberry32(31);
  const materials = new PaletteMaterials(currentPalette(doc));
  // Per-material envMapIntensity (latex/pearl/chrome) needs the texture before any material exists.
  materials.setEnvironment(environment.texture);
  const stem = new MeshPhysicalMaterial({
    color: new Color('#6F8466'),
    roughness: 0.4,
    clearcoat: 0.6,
    envMap: environment.texture,
  });
  const accent = materials.create('chrome');
  const pedestalGeometry = new CylinderGeometry(0.95, 1.05, 0.3, segments);
  const pedestalMaterial = new MeshPhysicalMaterial({
    color: new Color('#FBF7F1'),
    roughness: 0.6,
    clearcoat: 0.3,
    envMap: environment.texture,
  });

  const pieces = [
    { parts: dogParts, scale: 0.85, lift: 0.95 },
    { parts: tulipParts(5), scale: 0.8, lift: 1.25 },
    { parts: cakeParts(), scale: 0.85, lift: 1.1 },
  ].map(({ parts, scale, lift }, index) => {
    const built = buildSculpture(
      parts,
      { body: (slot) => materials.shared(slot), stem, accent },
      segments,
    );
    built.group.scale.setScalar(scale);
    built.group.position.y = lift;
    const holder = new Group();
    holder.add(built.group, new Mesh(pedestalGeometry, pedestalMaterial));
    scene.add(holder);
    return {
      holder,
      built,
      phase: index * 2.1,
      balloons: built.meshes.map((mesh) => new Balloon(mesh, true)),
    };
  });
  const balloons = pieces.flatMap((piece) => piece.balloons);

  const layout = (portrait: boolean) => {
    pieces.forEach((piece, index) =>
      piece.holder.position.set(
        portrait ? 0 : (index - 1) * 3.4,
        // Centre the stack (dog ears to cake pedestal) in the space above the names.
        portrait ? (1 - index) * 3.1 - 1 : -0.9,
        0,
      ),
    );
    camera.position.set(0, portrait ? 0 : 0.6, portrait ? 18.5 : 11);
    camera.lookAt(0, portrait ? -0.3 : 0.1, 0);
  };
  layout(false);

  const confetti = new Confetti(scene, random);
  let now = 0;
  const stopPicking = createPicker(
    canvas,
    camera,
    () =>
      balloons
        .filter((balloon) => balloon.poppable)
        .map((balloon) => balloon.mesh),
    (balloon) => {
      if (!balloon.pop(now)) return;
      confetti.burst(
        balloon.mesh.getWorldPosition(new Vector3()),
        (balloon.mesh.material as MeshPhysicalMaterial).color,
        { count: 10, size: 0.07, speed: 1.2, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) =>
    materials.transitionTo(id, now),
  );

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    for (const piece of pieces)
      piece.built.group.rotation.y = time * 0.35 + piece.phase;
    for (const balloon of balloons) balloon.update(time);
    materials.update(time);
    confetti.update(time, delta);
    renderer.render(scene, camera);
  });

  await compileScene(renderer, scene, camera);
  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      layout(camera.aspect < 1);
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      confetti.dispose();
      materials.dispose();
      for (const piece of pieces) piece.built.geometry.dispose();
      for (const item of [pedestalGeometry, pedestalMaterial, stem])
        item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
