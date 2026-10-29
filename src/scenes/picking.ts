import { Raycaster, Vector2, type Camera, type Object3D } from 'three';
import type { Balloon } from './balloon.ts';

// Raycaster ignores `visible`, so skip hits on popped balloons and anything else.
export function firstPoppable(
  hits: Array<{ object: Object3D }>,
): Balloon | undefined {
  for (const hit of hits) {
    const balloon = hit.object.userData.balloon as Balloon | undefined;
    if (balloon?.poppable) return balloon;
  }
  return undefined;
}

export function createPicker(
  canvas: HTMLCanvasElement,
  camera: Camera,
  targets: () => Object3D[],
  onPick: (balloon: Balloon) => void,
): () => void {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const handle = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    raycaster.setFromCamera(pointer, camera);
    const balloon = firstPoppable(raycaster.intersectObjects(targets(), false));
    if (balloon) onPick(balloon);
  };
  canvas.addEventListener('pointerdown', handle);
  return () => canvas.removeEventListener('pointerdown', handle);
}
