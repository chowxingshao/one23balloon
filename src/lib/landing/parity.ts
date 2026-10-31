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
  statement: {
    parts: Array<{ text: string } | { word: string; photo: Photo }>;
  };
  services: { items: Array<{ id: string; colour: string; photo: Photo }> };
  signature: {
    marquee: string[];
    pieces: Array<{ id: string; photo: Photo }>;
  };
  celebrations: { items: Array<{ id: string; photo: Photo }> };
};

// Translations may change words, never structure, photos or the contact number.
function fingerprint(data: ParityInput): Record<string, string> {
  return {
    whatsapp: data.whatsapp,
    statement: JSON.stringify(
      data.statement.parts.flatMap((part) =>
        'photo' in part ? [photoKey(part.photo)] : [],
      ),
    ),
    services: JSON.stringify(
      data.services.items.map((item) => [
        item.id,
        item.colour,
        ...photoKey(item.photo),
      ]),
    ),
    signature: JSON.stringify([
      data.signature.marquee.length,
      data.signature.pieces.map((piece) => [
        piece.id,
        ...photoKey(piece.photo),
      ]),
    ]),
    celebrations: JSON.stringify(
      data.celebrations.items.map((item) => [item.id, ...photoKey(item.photo)]),
    ),
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
