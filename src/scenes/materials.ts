import { Color, MeshPhysicalMaterial } from 'three';
import {
  palettes,
  type PaletteColour,
  type PaletteId,
} from '../lib/landing/palettes.ts';
import {
  easeInOut,
  mixSurface,
  surface,
  type SurfaceParams,
} from './material-params.ts';

export type Slot = number | 'chrome';
type Look = SurfaceParams & { color: Color };
type Tracked = {
  material: MeshPhysicalMaterial;
  slot: Slot;
  from?: Look;
  to?: Look;
  start: number;
};

const TRANSITION = 0.9;
const fallbackChrome: PaletteColour = { hex: '#C7CCD4', material: 'chrome' };

export function paletteColour(id: PaletteId, slot: Slot): PaletteColour {
  const { colours } = palettes[id];
  if (slot === 'chrome')
    return (
      colours.find((colour) => colour.material === 'chrome') ?? fallbackChrome
    );
  return colours[((slot % colours.length) + colours.length) % colours.length];
}

function look(colour: PaletteColour): Look {
  return { ...surface[colour.material], color: new Color(colour.hex) };
}

function snapshot(material: MeshPhysicalMaterial): Look {
  return {
    color: material.color.clone(),
    metalness: material.metalness,
    roughness: material.roughness,
    clearcoat: material.clearcoat,
    clearcoatRoughness: material.clearcoatRoughness,
    iridescence: material.iridescence,
    envMapIntensity: material.envMapIntensity,
  };
}

function apply(material: MeshPhysicalMaterial, value: Look): void {
  material.color.copy(value.color);
  material.metalness = value.metalness;
  material.roughness = value.roughness;
  material.clearcoat = value.clearcoat;
  material.clearcoatRoughness = value.clearcoatRoughness;
  material.iridescence = value.iridescence;
  material.envMapIntensity = value.envMapIntensity;
}

export class PaletteMaterials {
  private readonly tracked: Tracked[] = [];
  private readonly sharedBySlot = new Map<Slot, MeshPhysicalMaterial>();

  constructor(
    private paletteId: PaletteId,
    private readonly random: () => number = Math.random,
  ) {}

  get palette(): PaletteId {
    return this.paletteId;
  }

  create(slot: Slot): MeshPhysicalMaterial {
    const material = new MeshPhysicalMaterial();
    apply(material, look(paletteColour(this.paletteId, slot)));
    this.tracked.push({ material, slot, start: -1 });
    return material;
  }

  shared(slot: Slot): MeshPhysicalMaterial {
    let material = this.sharedBySlot.get(slot);
    if (!material) {
      material = this.create(slot);
      this.sharedBySlot.set(slot, material);
    }
    return material;
  }

  // Each material starts at a random offset so the change sweeps through the scene.
  transitionTo(id: PaletteId, now: number): void {
    this.paletteId = id;
    for (const entry of this.tracked) {
      entry.from = snapshot(entry.material);
      entry.to = look(paletteColour(id, entry.slot));
      entry.start = now + this.random() * 0.5;
    }
  }

  update(now: number): void {
    for (const entry of this.tracked) {
      if (entry.start < 0 || now < entry.start || !entry.from || !entry.to)
        continue;
      const k = easeInOut((now - entry.start) / TRANSITION);
      apply(entry.material, {
        ...mixSurface(entry.from, entry.to, k),
        color: entry.from.color.clone().lerp(entry.to.color, k),
      });
      if (k >= 1) entry.start = -1;
    }
  }

  dispose(): void {
    for (const entry of this.tracked) entry.material.dispose();
    this.tracked.length = 0;
    this.sharedBySlot.clear();
  }
}
