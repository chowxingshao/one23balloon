import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { paletteIds } from './palettes.ts';

export const serviceIds = [
  'weddings',
  'openings',
  'birthdays',
  'baby',
  'cars',
  'bouquets',
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const sculptureIds = ['dog', 'tulips', 'cake'] as const;

const text = z.string().trim().min(1);
const instagramPost = z
  .string()
  .regex(
    /^https:\/\/www\.instagram\.com\/(?:[\w.]+\/)?(?:p|reel)\/[\w-]+\/$/,
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
  const palette = z.enum(paletteIds);
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
    intro: z.strictObject({ skip: text }),
    hero: z.strictObject({
      eyebrow: text,
      title: text,
      lede: text,
      cta: text,
      message: text,
      photo,
    }),
    palettes: z.strictObject({
      label: text,
      items: z
        .array(z.strictObject({ id: palette, name: text, message: text }))
        .length(paletteIds.length)
        .superRefine(unique((item) => item.id, 'Palette ids')),
    }),
    services: z.strictObject({
      title: text,
      lede: text,
      cta: text,
      items: z
        .array(
          z.strictObject({
            id: z.enum(serviceIds),
            title: text,
            body: text,
            palette,
            message: text,
            photo,
          }),
        )
        .length(serviceIds.length)
        .superRefine(unique((item) => item.id, 'Service ids')),
    }),
    gallery: z.strictObject({
      title: text,
      lede: text,
      more: text,
      items: z
        .array(
          photo.extend({
            location: text,
            theme: text,
            colours: z
              .array(
                z.strictObject({
                  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
                  name: text,
                }),
              )
              .min(1)
              .max(4),
          }),
        )
        .length(12),
    }),
    sculptures: z.strictObject({
      title: text,
      lede: text,
      pieces: z
        .array(z.strictObject({ id: z.enum(sculptureIds), name: text }))
        .length(sculptureIds.length)
        .superRefine(unique((item) => item.id, 'Sculpture ids')),
      photos: z.array(photo.extend({ caption: text })).length(2),
    }),
    venues: z.strictObject({ title: text, items: z.array(text).min(4) }),
    steps: z.strictObject({
      draft: z.boolean(),
      title: text,
      items: z.array(z.strictObject({ title: text, body: text })).length(3),
    }),
    faq: z.strictObject({
      title: text,
      items: z.array(
        z.strictObject({ question: text, answer: text, draft: z.boolean() }),
      ),
    }),
    closing: z.strictObject({
      title: text,
      body: text,
      cta: text,
      message: text,
      photo,
    }),
  });
}
