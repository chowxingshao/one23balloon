import { PMREMGenerator, type Texture, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A soft studio room gives latex its sheen and chrome its reflections.
export function studioEnvironment(renderer: WebGLRenderer): {
  texture: Texture;
  dispose(): void;
} {
  const generator = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const target = generator.fromScene(room, 0.04);
  room.dispose();
  generator.dispose();
  return { texture: target.texture, dispose: () => target.dispose() };
}
