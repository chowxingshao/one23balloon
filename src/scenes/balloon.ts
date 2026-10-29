import {
  Mesh,
  SphereGeometry,
  type BufferGeometry,
  type Material,
  type Vector3,
} from 'three';
import {
  INFLATE_DURATION,
  REINFLATE_DELAY,
  inflateScale,
  popScale,
} from './balloon-motion.ts';

export type BalloonState = 'idle' | 'popping' | 'hidden' | 'inflating';

export function createBalloonGeometry(widthSegments: number): SphereGeometry {
  const geometry = new SphereGeometry(
    1,
    widthSegments,
    Math.max(8, Math.round(widthSegments * 0.66)),
  );
  geometry.scale(1, 1.1, 1);
  return geometry;
}

export class Balloon {
  state: BalloonState = 'idle';
  private changedAt = 0;
  private readonly base: Vector3;

  constructor(
    readonly mesh: Mesh,
    private readonly reinflate: boolean,
  ) {
    this.base = mesh.scale.clone();
    mesh.userData.balloon = this;
  }

  static create(
    geometry: BufferGeometry,
    material: Material,
    radius: number,
    reinflate: boolean,
  ): Balloon {
    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(radius);
    return new Balloon(mesh, reinflate);
  }

  get poppable(): boolean {
    return (
      this.mesh.visible && (this.state === 'idle' || this.state === 'inflating')
    );
  }

  pop(now: number): boolean {
    if (!this.poppable) return false;
    this.state = 'popping';
    this.changedAt = now;
    return true;
  }

  inflate(now: number): void {
    this.state = 'inflating';
    this.changedAt = now;
    this.mesh.visible = true;
    this.setScale(0.001);
  }

  update(now: number): void {
    const elapsed = now - this.changedAt;
    if (this.state === 'popping') {
      const scale = popScale(elapsed);
      if (scale === null) {
        this.state = 'hidden';
        this.changedAt = now;
        this.mesh.visible = false;
      } else this.setScale(scale);
    } else if (this.state === 'hidden') {
      if (this.reinflate && elapsed >= REINFLATE_DELAY) this.inflate(now);
    } else if (this.state === 'inflating') {
      this.setScale(Math.max(0.001, inflateScale(elapsed)));
      if (elapsed >= INFLATE_DURATION) {
        this.state = 'idle';
        this.setScale(1);
      }
    }
  }

  private setScale(factor: number): void {
    this.mesh.scale.copy(this.base).multiplyScalar(factor);
  }
}
