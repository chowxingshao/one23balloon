import { SphereGeometry } from 'three';

export function createBalloonGeometry(widthSegments: number): SphereGeometry {
  const geometry = new SphereGeometry(
    1,
    widthSegments,
    Math.max(8, Math.round(widthSegments * 0.66)),
  );
  geometry.scale(1, 1.1, 1);
  return geometry;
}
