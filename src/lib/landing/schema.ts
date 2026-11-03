import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { blockIds } from './blocks.ts';

export const serviceIds = [
  'weddings',
  'openings',
  'birthdays',
  'baby',
  'cars',
  'bouquets',
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const pieceIds = ['lion-dance', 'rose'] as const;

// Visible copy never uses em or en dashes (see design-direction.md).
const text = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/[–—]/.test(value), 'Use a hyphen, not a dash.');
// A feed post, a reel, or a single story permalink. A highlight album URL
// (stories/highlights/<id>/) is not accepted: it names no one photo.
const instagramPost = z
  .string()
  .regex(
    /^https:\/\/www\.instagram\.com\/(?:(?:[\w.]+\/)?(?:p|reel)\/[\w-]+|stories\/(?!highlights\/)[\w.]+\/\d+)\/$/,
    'Use the Instagram post URL the photo came from.',
  );
const unique =
  <T>(key: (item: T) => string, label: string) =>
  (items: T[], context: z.RefinementCtx) => {
    const seen = new Set(items.map(key));
    if (seen.size !== items.length)
      context.addIssue({ code: 'custom', message: `${label} must be unique.` });
  };

export function createLandingSchema(image: SchemaContext['image']) {
  const photo = z.strictObject({
    image: image(),
    alt: text,
    source: instagramPost,
  });
  const part = z.union([
    z.strictObject({ text }),
    z.strictObject({ word: text, photo }),
  ]);
  return z.strictObject({
    whatsapp: z
      .string()
      .regex(/^\d{10,15}$/, 'Digits only, country code first.'),
    meta: z.strictObject({
      instagramLabel: text,
      xiaohongshuLabel: text,
      registration: text,
      rights: text,
    }),
    header: z.strictObject({ whatsapp: text.pipe(z.string().max(12)) }),
    hero: z.strictObject({
      title: z.tuple([text, text]),
      lede: text.refine(
        (value) => value.split(/\s+/).length <= 20,
        'Keep the hero lede to 20 words.',
      ),
    }),
    statement: z.strictObject({
      parts: z
        .array(part)
        .min(5)
        .superRefine((parts, context) => {
          if (parts.filter((item) => 'photo' in item).length !== 4)
            context.addIssue({
              code: 'custom',
              message: 'The statement needs exactly four photo pills.',
            });
        }),
    }),
    services: z.strictObject({
      title: text,
      items: z
        .array(
          z.strictObject({
            id: z.enum(serviceIds),
            colour: z.enum(blockIds),
            title: text,
            body: text,
            linkLabel: text,
            message: text,
            photo,
          }),
        )
        .length(serviceIds.length)
        .superRefine(unique((item) => item.id, 'Service ids'))
        .superRefine(unique((item) => item.colour, 'Service colours')),
    }),
    signature: z.strictObject({
      marquee: z.array(text).length(5),
      pieces: z
        .array(z.strictObject({ id: z.enum(pieceIds), caption: text, photo }))
        .length(pieceIds.length)
        .superRefine(unique((item) => item.id, 'Piece ids')),
    }),
    celebrations: z.strictObject({
      title: text,
      items: z
        .array(
          z.strictObject({
            id: z.string().regex(/^c\d{2}$/),
            occasion: text,
            photo,
          }),
        )
        .min(30)
        .max(50)
        .superRefine(unique((item) => item.id, 'Celebration ids'))
        .superRefine(
          unique((item) => item.photo.source, 'Celebration sources'),
        ),
    }),
    closing: z.strictObject({
      title: text,
      whatsapp: text,
      message: text,
    }),
  });
}
