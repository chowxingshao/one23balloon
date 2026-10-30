import {
  ACESFilmicToneMapping,
  WebGLRenderer,
  type Object3D,
  type PerspectiveCamera,
} from 'three';
import type { Capability } from '../lib/canvas-island/capability.ts';

export function createRenderer(
  canvas: HTMLCanvasElement,
  capability: Capability,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: capability.tier === 'high',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(capability.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function fitCamera(
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  width: number,
  height: number,
): void {
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// Compiles every material in the scene before the first frame. Where the
// browser offers KHR_parallel_shader_compile this happens off the main thread,
// so the first render no longer blocks it for hundreds of milliseconds. Never
// waits longer than the limit: the first render then finishes the job.
export async function compileScene(
  renderer: WebGLRenderer,
  scene: Object3D,
  camera: PerspectiveCamera,
  limit = 3000,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    renderer.compileAsync(scene, camera),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, limit);
    }),
  ]);
  clearTimeout(timer);
}
