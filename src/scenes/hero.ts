import {
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { mulberry32 } from '../lib/random.ts';
import { Balloon, createBalloonGeometry } from './balloon.ts';
import { Confetti } from './confetti.ts';
import { studioEnvironment } from './environment.ts';
import { garlandLayout, heroArch } from './garland-layout.ts';
import { FrameLoop } from './loop.ts';
import { PaletteMaterials } from './materials.ts';
import { currentPalette, onPaletteChange } from './palette-source.ts';
import { createPicker } from './picking.ts';
import { compileScene, createRenderer, fitCamera } from './renderer.ts';
import { buildSculpture } from './sculpture-mesh.ts';
import { dogParts } from './sculpture-parts.ts';

type Drifting = { balloon: Balloon; base: Vector3; phase: number };
// x, y, z, radius of single balloons floating around the arch.
const floaterSpots = [
  [-1.6, 2.1, -1.5, 0.36],
  [-3.6, -0.6, -2.4, 0.3],
  [4.3, 2.2, -2, 0.34],
  [-0.4, 2.5, -3, 0.28],
  [3.6, -1.2, 1.2, 0.26],
  [-2.8, 1.6, 0.3, 0.22],
] as const;

function archPanel(curveSegments: number): ExtrudeGeometry {
  const { halfWidth, height } = heroArch;
  const shape = new Shape();
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(-halfWidth, height - halfWidth);
  shape.absarc(0, height - halfWidth, halfWidth, Math.PI, 0, true);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(-halfWidth, 0);
  return new ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    curveSegments,
  });
}

export async function createHeroScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const renderer = createRenderer(canvas, capability);
  const scene = new Scene();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xd9c9ba, 0.55));
  const key = new DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9);

  const random = mulberry32(123);
  const materials = new PaletteMaterials(currentPalette(doc));
  // Per-material envMapIntensity (latex/pearl/chrome) needs the texture before any material exists.
  materials.setEnvironment(environment.texture);
  const geometry = createBalloonGeometry(high ? 48 : 24);
  const knot = new ConeGeometry(0.09, 0.14, 12);
  const panelGeometry = archPanel(high ? 48 : 24);
  const panelMaterial = new MeshPhysicalMaterial({
    color: new Color('#FBF7F1'),
    roughness: 0.75,
  });
  const stringMaterial = new LineBasicMaterial({ color: 0xb8ada4 });
  const strings: BufferGeometry[] = [];
  const stage = new Group();
  scene.add(stage);
  const panel = new Mesh(panelGeometry, panelMaterial);
  panel.position.set(heroArch.centerX, heroArch.baseY, -0.75);
  stage.add(panel);

  const garland: Drifting[] = garlandLayout({
    dims: heroArch,
    count: high ? 120 : 70,
    seed: 7,
    slots: 5,
  }).map((spot) => {
    const balloon = Balloon.create(
      geometry,
      materials.create(spot.slot),
      spot.radius,
      true,
    );
    balloon.mesh.position.set(spot.x, spot.y, spot.z);
    balloon.mesh.rotation.set(random(), random(), random());
    stage.add(balloon.mesh);
    return {
      balloon,
      base: new Vector3(spot.x, spot.y, spot.z),
      phase: spot.phase,
    };
  });

  const floaters: Drifting[] = floaterSpots.map(([x, y, z, radius]) => {
    const material = materials.create(Math.floor(random() * 5));
    const balloon = Balloon.create(geometry, material, radius, true);
    const tie = new Mesh(knot, material);
    tie.position.y = -1.14;
    balloon.mesh.add(tie);
    const string = new BufferGeometry().setFromPoints([
      new Vector3(0, -1.2, 0),
      new Vector3(0.15, -3.2, 0),
      new Vector3(-0.1, -5.5, 0),
    ]);
    strings.push(string);
    balloon.mesh.add(new Line(string, stringMaterial));
    balloon.mesh.position.set(x, y, z);
    stage.add(balloon.mesh);
    return {
      balloon,
      base: new Vector3(x, y, z),
      phase: random() * Math.PI * 2,
    };
  });

  const chrome = materials.create('chrome');
  const dog = buildSculpture(
    dogParts,
    { body: () => chrome, stem: chrome, accent: chrome },
    high ? 40 : 20,
  );
  dog.group.scale.setScalar(0.42);
  dog.group.position.set(-0.35, -2.05, 0.9);
  stage.add(dog.group);

  const confetti = new Confetti(scene, random);
  const pointer = { x: 0, y: 0 };
  let now = 0;
  let portrait = false;
  const balloons = [...garland, ...floaters].map((entry) => entry.balloon);
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
        { count: 16, size: 0.09, speed: 1.6, now },
      );
    },
  );
  const stopPalette = onPaletteChange(doc, (id) =>
    materials.transitionTo(id, now),
  );
  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };
  if (high) canvas.addEventListener('pointermove', onPointerMove);

  const loop = new FrameLoop(renderer, (time, delta) => {
    now = time;
    camera.position.x +=
      ((portrait ? 0 : pointer.x * 0.35) - camera.position.x) * 0.04;
    camera.position.y += (0.2 - pointer.y * 0.2 - camera.position.y) * 0.04;
    camera.lookAt(portrait ? 0 : 0.7, portrait ? -0.55 : -0.1, 0);
    for (const { balloon, base, phase } of garland) {
      balloon.mesh.position.set(
        base.x + Math.sin(time * 0.7 + phase) * 0.015,
        base.y + Math.cos(time * 0.6 + phase) * 0.02,
        base.z,
      );
      balloon.update(time);
    }
    for (const { balloon, base, phase } of floaters) {
      balloon.mesh.position.y = base.y + Math.sin(time * 0.55 + phase) * 0.14;
      balloon.mesh.rotation.z = Math.sin(time * 0.4 + phase) * 0.08;
      balloon.update(time);
    }
    dog.group.rotation.y = Math.sin(time * 0.35) * 0.6 + 0.4;
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
      // Portrait screens stack the copy above the stage, so centre the arch
      // and stand the dog inside its foot, where the narrow frame still shows it.
      portrait = camera.aspect < 1;
      stage.position.x = portrait ? -heroArch.centerX : 0;
      dog.group.position.x = portrait ? heroArch.centerX - 0.25 : -0.35;
      camera.position.z = portrait ? 12.5 : 9;
      renderer.render(scene, camera);
    },
    dispose: () => {
      loop.stop();
      stopPicking();
      stopPalette();
      canvas.removeEventListener('pointermove', onPointerMove);
      confetti.dispose();
      materials.dispose();
      for (const item of [
        geometry,
        knot,
        panelGeometry,
        panelMaterial,
        stringMaterial,
        dog.geometry,
        ...strings,
      ])
        item.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
