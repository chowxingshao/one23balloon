import { Group, Mesh, SphereGeometry, type Material } from 'three';
import type { Part } from './sculpture-parts.ts';

export type SculptureMaterials = {
  body: (slot: number) => Material;
  stem: Material;
  accent: Material;
};
export type BuiltSculpture = {
  group: Group;
  meshes: Mesh[];
  geometry: SphereGeometry;
};

export function buildSculpture(
  parts: readonly Part[],
  materials: SculptureMaterials,
  segments: number,
): BuiltSculpture {
  const geometry = new SphereGeometry(
    1,
    segments,
    Math.max(8, Math.round(segments * 0.6)),
  );
  const group = new Group();
  const meshes = parts.map((part) => {
    const material =
      part.role === 'body'
        ? materials.body(part.slot)
        : part.role === 'stem'
          ? materials.stem
          : materials.accent;
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...part.position);
    mesh.scale.set(...part.scale);
    mesh.rotation.z = part.rotationZ;
    group.add(mesh);
    return mesh;
  });
  return { group, meshes, geometry };
}
