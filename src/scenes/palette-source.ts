import { paletteChangeEvent } from '../lib/landing/events.ts';
import {
  defaultPaletteId,
  isPaletteId,
  type PaletteId,
} from '../lib/landing/palettes.ts';

export function currentPalette(doc: Document): PaletteId {
  const value =
    doc.querySelector<HTMLElement>('[data-landing]')?.dataset.palette;
  return value && isPaletteId(value) ? value : defaultPaletteId;
}

export function onPaletteChange(
  doc: Document,
  listener: (id: PaletteId) => void,
): () => void {
  const handle = (event: Event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id && isPaletteId(id)) listener(id);
  };
  doc.addEventListener(paletteChangeEvent, handle);
  return () => doc.removeEventListener(paletteChangeEvent, handle);
}
