type Photo = { source: string; image: unknown };

// Strings in unit tests; Astro's processed ImageMetadata (with src) at runtime.
function imageKey(image: unknown): string {
  if (typeof image === 'string') return image;
  const src = (image as { src?: unknown } | null | undefined)?.src;
  return typeof src === 'string' ? src : String(image);
}

const photoKey = (photo: Photo) => [photo.source, imageKey(photo.image)];

export type ParityInput = {
  whatsapp: string;
  hero: { photo: Photo };
  palettes: { items: Array<{ id: string }> };
  services: { items: Array<{ id: string; palette: string; photo: Photo }> };
  gallery: { items: Photo[] };
  sculptures: { pieces: Array<{ id: string }>; photos: Photo[] };
  venues: { items: string[] };
  steps: { draft: boolean; items: unknown[] };
  faq: { items: Array<{ draft: boolean }> };
  closing: { photo: Photo };
};

// Translations may change words, never structure, photos or the contact number.
function fingerprint(data: ParityInput): Record<string, string> {
  return {
    whatsapp: data.whatsapp,
    hero: JSON.stringify(photoKey(data.hero.photo)),
    palettes: JSON.stringify(data.palettes.items.map((item) => item.id)),
    services: JSON.stringify(
      data.services.items.map((item) => [
        item.id,
        item.palette,
        ...photoKey(item.photo),
      ]),
    ),
    gallery: JSON.stringify(data.gallery.items.map(photoKey)),
    sculptures: JSON.stringify([
      data.sculptures.pieces.map((piece) => piece.id),
      data.sculptures.photos.map(photoKey),
    ]),
    venues: String(data.venues.items.length),
    steps: JSON.stringify([data.steps.draft, data.steps.items.length]),
    faq: JSON.stringify(data.faq.items.map((item) => item.draft)),
    closing: JSON.stringify(photoKey(data.closing.photo)),
  };
}

export function parityProblems(
  reference: ParityInput,
  other: ParityInput,
): string[] {
  const expected = fingerprint(reference);
  const actual = fingerprint(other);
  return Object.keys(expected).filter((key) => expected[key] !== actual[key]);
}
