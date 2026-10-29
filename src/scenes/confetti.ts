import {
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type Color,
  type Object3D,
} from 'three';

type Particle = { mesh: Mesh; velocity: Vector3; spin: Vector3; born: number };
const LIFETIME = 1.6;
const GRAVITY = 2.2;

export class Confetti {
  private readonly geometry = new PlaneGeometry(1, 0.55);
  private readonly materials = new Map<string, MeshStandardMaterial>();
  private particles: Particle[] = [];

  constructor(
    private readonly parent: Object3D,
    private readonly random: () => number,
  ) {}

  get active(): number {
    return this.particles.length;
  }

  burst(
    origin: Vector3,
    colour: Color,
    options: { count: number; size: number; speed: number; now: number },
  ): void {
    const key = colour.getHexString();
    let material = this.materials.get(key);
    if (!material) {
      material = new MeshStandardMaterial({
        color: colour.clone(),
        metalness: 0.8,
        roughness: 0.3,
        side: DoubleSide,
      });
      this.materials.set(key, material);
    }
    for (let index = 0; index < options.count; index++) {
      const mesh = new Mesh(this.geometry, material);
      mesh.scale.setScalar(options.size);
      mesh.position.copy(origin);
      this.parent.add(mesh);
      const angle = this.random() * Math.PI * 2;
      const lift = this.random() * 1.4 - 0.4;
      const speed = options.speed * (0.6 + this.random());
      this.particles.push({
        mesh,
        born: options.now,
        velocity: new Vector3(
          Math.cos(angle) * Math.cos(lift) * speed,
          Math.sin(lift) * speed + 0.6,
          Math.sin(angle) * Math.cos(lift) * speed * 0.5,
        ),
        spin: new Vector3(this.random() * 9, this.random() * 9, 0),
      });
    }
  }

  update(now: number, delta: number): void {
    for (let index = this.particles.length - 1; index >= 0; index--) {
      const particle = this.particles[index];
      particle.velocity.y -= GRAVITY * delta;
      particle.velocity.multiplyScalar(Math.pow(0.4, delta));
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.mesh.rotation.x += particle.spin.x * delta;
      particle.mesh.rotation.y += particle.spin.y * delta;
      if (now - particle.born > LIFETIME) {
        this.parent.remove(particle.mesh);
        this.particles.splice(index, 1);
      }
    }
  }

  dispose(): void {
    for (const particle of this.particles) this.parent.remove(particle.mesh);
    this.particles = [];
    this.geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }
}
