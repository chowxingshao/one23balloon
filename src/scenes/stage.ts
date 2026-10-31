import {
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  InstancedMesh,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  Scene,
  Vector3,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';
import type { IslandScene } from '../lib/canvas-island/lifecycle.ts';
import { isBlockId, paper, type Material } from '../lib/landing/blocks.ts';
import {
  formationEvent,
  isFormationId,
  resolveFormation,
  type FormationId,
} from '../lib/landing/formations.ts';
import { mulberry32 } from '../lib/random.ts';
import { createBalloonGeometry } from './balloon.ts';
import { studioEnvironment } from './environment.ts';
import {
  buildFormation,
  CAMERA_FOV,
  CAMERA_Z,
  familyOf,
} from './formations.ts';
import { largestFreeRect, type Rect } from './formation-anchor.ts';
import { FrameLoop } from './loop.ts';
import { surface } from './material-params.ts';
import { compileScene, createRenderer, fitCamera } from './renderer.ts';

type Body = {
  position: Vector3;
  velocity: Vector3;
  target: Vector3;
  radius: number;
  colour: Color;
  from: Color;
  to: Color;
  colourStart: number;
  phase: number;
  family: Material;
  slot: number;
};

const COLOUR_TIME = 0.8;
const families: Material[] = ['latex', 'pearl', 'chrome'];

export async function createStageScene(
  canvas: HTMLCanvasElement,
  capability: Capability,
): Promise<IslandScene> {
  const doc = canvas.ownerDocument;
  const high = capability.tier === 'high';
  const count = high ? 30 : 14;
  const root = doc.querySelector<HTMLElement>('[data-landing]');
  // Only the high tier draws a back pass, onto a 2D canvas behind the content.
  const back = high
    ? doc.querySelector<HTMLCanvasElement>('[data-stage-back]')
    : null;
  const backContext = back?.getContext('2d') ?? null;
  const serviceBlocks = [
    ...doc.querySelectorAll<HTMLElement>('[data-service-card]'),
  ]
    .map((card) => card.dataset.block ?? '')
    .filter(isBlockId);

  const renderer = createRenderer(canvas, capability);
  renderer.localClippingEnabled = true;
  renderer.autoClear = false;
  const scene = new Scene();
  scene.fog = new FogExp2(new Color(paper), 0.028);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.add(new HemisphereLight(0xffffff, 0xdadad4, 0.6));
  const key = new DirectionalLight(0xffffff, 1.35);
  key.position.set(4, 6, 10);
  scene.add(key);
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 120);
  camera.position.set(0, 0, CAMERA_Z);

  // One clipping plane always, so switching passes never changes the shader.
  const clip = new Plane(new Vector3(0, 0, 1), 1000);
  const geometry = createBalloonGeometry(high ? 40 : 24);
  const random = mulberry32(17);
  const bodies: Body[] = Array.from({ length: count }, (_, index) => ({
    position: new Vector3(0, -30, 0),
    velocity: new Vector3(),
    target: new Vector3(0, -30, 0),
    radius: 0.6,
    colour: new Color(paper),
    from: new Color(paper),
    to: new Color(paper),
    colourStart: -1,
    phase: random() * Math.PI * 2,
    family: familyOf(index),
    slot: 0,
  }));
  const meshes = families.map((family) => {
    const members = bodies.filter((body) => body.family === family);
    members.forEach((body, slot) => (body.slot = slot));
    const material = new MeshPhysicalMaterial({
      ...surface[family],
      envMap: environment.texture,
      clippingPlanes: [clip],
    });
    const mesh = new InstancedMesh(
      geometry,
      material,
      Math.max(1, members.length),
    );
    mesh.count = members.length;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { family, material, mesh };
  });
  const meshOf = (family: Material) =>
    meshes.find((entry) => entry.family === family)!.mesh;

  let aspect = 1;
  let now = 0;
  let stiffness = 14;
  let formation: FormationId = 'hero';
  let parked = false;
  const pointer = { x: 0, y: 0 };

  // The free screen area beside the active card's text and photo, as fractions
  // of the viewport. Layout offsets are used, so the card's scale and tilt
  // animations do not disturb the measurement.
  const serviceAnchor = (id: FormationId) => {
    const card = doc.querySelectorAll<HTMLElement>('[data-service-card]')[
      Number(id.slice('service-'.length))
    ];
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!card || !width || !height) return undefined;
    const offsetIn = (element: HTMLElement): Rect => {
      let left = 0;
      let top = 0;
      for (
        let node: HTMLElement | null = element;
        node && node !== card;
        node = node.offsetParent as HTMLElement | null
      ) {
        left += node.offsetLeft;
        top += node.offsetTop;
      }
      return {
        left,
        top,
        right: left + element.offsetWidth,
        bottom: top + element.offsetHeight,
      };
    };
    const obstacles = ['h3', 'p', 'a', '.service-photo']
      .map((selector) => card.querySelector<HTMLElement>(selector))
      .filter((element): element is HTMLElement => element !== null)
      .map(offsetIn);
    // Layout height, not the rect: the header may be translated away mid-scroll.
    const header =
      doc.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    const edge = 14;
    const free = largestFreeRect(
      {
        left: edge,
        top: header + edge,
        right: Math.min(width, card.offsetWidth) - edge,
        bottom: height - edge,
      },
      obstacles,
      edge,
    );
    if (!free) return undefined;
    return {
      left: free.left / width,
      right: free.right / width,
      top: free.top / height,
      bottom: free.bottom / height,
    };
  };
  const apply = (id: FormationId) => {
    formation = resolveFormation(id, capability.tier);
    const slots = buildFormation(formation, {
      count,
      aspect,
      tier: capability.tier,
      serviceBlocks,
      anchor: formation.startsWith('service-')
        ? serviceAnchor(formation)
        : undefined,
    });
    slots.forEach((slot, index) => {
      const body = bodies[index]!;
      body.target.set(slot.x, slot.y, slot.z);
      body.radius = slot.radius;
      body.from.copy(body.colour);
      body.to.set(slot.hex);
      body.colourStart = now + random() * 0.3;
    });
    // Released balloons float up slowly; everything else regroups briskly.
    stiffness = formation === 'release' ? 3 : 14;
    parked = false;
    setVisible(true);
  };
  const setVisible = (visible: boolean) => {
    canvas.style.visibility = visible ? '' : 'hidden';
    if (back) back.style.visibility = visible ? '' : 'hidden';
  };

  const initial = root?.dataset.formation ?? 'hero';
  const onFormation = (event: Event) => {
    const id = (event as CustomEvent<{ id: string }>).detail?.id;
    if (id && isFormationId(id)) apply(id);
  };
  doc.addEventListener(formationEvent, onFormation);
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = (event.clientY / innerHeight) * 2 - 1;
  };
  if (high) doc.addEventListener('pointermove', onPointer, { passive: true });

  const dummy = new Object3D();
  const step = (time: number, delta: number) => {
    now = time;
    const damping = 2 * Math.sqrt(stiffness);
    let moving = false;
    for (const body of bodies) {
      const ax =
        (body.target.x - body.position.x) * stiffness -
        body.velocity.x * damping;
      const ay =
        (body.target.y - body.position.y) * stiffness -
        body.velocity.y * damping;
      const az =
        (body.target.z - body.position.z) * stiffness -
        body.velocity.z * damping;
      body.velocity.x += ax * delta;
      body.velocity.y += ay * delta;
      body.velocity.z += az * delta;
      body.position.addScaledVector(body.velocity, delta);
      if (body.position.distanceToSquared(body.target) > 0.0025) moving = true;
      if (body.colourStart >= 0 && time >= body.colourStart) {
        const k = Math.min(1, (time - body.colourStart) / COLOUR_TIME);
        body.colour.copy(body.from).lerp(body.to, k * k * (3 - 2 * k));
        if (k >= 1) body.colourStart = -1;
      }
      const mesh = meshOf(body.family);
      dummy.position.set(
        body.position.x,
        body.position.y + Math.sin(time * 0.6 + body.phase) * 0.08,
        body.position.z,
      );
      dummy.rotation.set(0, 0, Math.sin(time * 0.4 + body.phase) * 0.08);
      dummy.scale.setScalar(body.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(body.slot, dummy.matrix);
      mesh.setColorAt(body.slot, body.colour);
    }
    for (const { mesh } of meshes) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    // Hidden and released balloons end off screen: stop drawing until they move.
    if ((formation === 'hidden' || formation === 'release') && !moving) {
      parked = true;
      setVisible(false);
    }
  };
  const draw = () => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.clear();
    if (back && backContext) {
      // Behind the content: everything at or behind the headline plane.
      clip.normal.set(0, 0, -1);
      clip.constant = 0;
      renderer.render(scene, camera);
      backContext.clearRect(0, 0, back.width, back.height);
      backContext.drawImage(canvas, 0, 0, back.width, back.height);
      renderer.clear();
      clip.normal.set(0, 0, 1);
      clip.constant = 0;
    } else {
      clip.normal.set(0, 0, 1);
      clip.constant = 1000;
    }
    renderer.render(scene, camera);
  };
  const loop = new FrameLoop(renderer, (time, delta) => {
    if (parked) return;
    step(time, delta);
    if (!parked) draw();
  });

  if (import.meta.env.DEV)
    (globalThis as { __one23Poster?: () => string }).__one23Poster = () => {
      apply('hero');
      for (const body of bodies) {
        body.position.copy(body.target);
        body.velocity.set(0, 0, 0);
        body.colour.copy(body.to);
        body.colourStart = -1;
      }
      pointer.x = 0;
      pointer.y = 0;
      camera.position.set(0, 0, CAMERA_Z);
      step(now, 0);
      clip.normal.set(0, 0, 1);
      clip.constant = 1000;
      renderer.clear();
      renderer.render(scene, camera);
      return canvas.toDataURL('image/webp', 0.9);
    };

  apply(isFormationId(initial) ? initial : 'hero');
  for (const body of bodies)
    body.position.copy(body.target).add(new Vector3(0, -12, 0));
  await compileScene(renderer, scene, camera);
  return {
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      fitCamera(camera, renderer, width, height);
      if (back) {
        back.width = canvas.width;
        back.height = canvas.height;
      }
      aspect = width / Math.max(1, height);
      apply(formation);
      step(now, 0);
      draw();
    },
    dispose: () => {
      loop.stop();
      doc.removeEventListener(formationEvent, onFormation);
      doc.removeEventListener('pointermove', onPointer);
      setVisible(true);
      for (const { mesh, material } of meshes) {
        mesh.dispose();
        material.dispose();
      }
      geometry.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
