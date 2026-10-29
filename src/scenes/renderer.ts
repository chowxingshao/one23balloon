import {
  ACESFilmicToneMapping,
  WebGLRenderer,
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
