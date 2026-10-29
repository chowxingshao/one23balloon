import { Raycaster, Vector2, type Camera, type Object3D } from 'three';
import type { Balloon } from './balloon.ts';

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
    const hit = raycaster.intersectObjects(targets(), false)[0];
    const balloon = hit?.object.userData.balloon as Balloon | undefined;
    if (balloon?.poppable) onPick(balloon);
  };
  canvas.addEventListener('pointerdown', handle);
  return () => canvas.removeEventListener('pointerdown', handle);
}
