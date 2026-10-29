import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { parityProblems } from '../../src/lib/landing/parity.ts';
import {
  createLandingSchema,
  sculptureIds,
  serviceIds,
} from '../../src/lib/landing/schema.ts';
import { paletteIds } from '../../src/lib/landing/palettes.ts';

const image = (() => z.string()) as unknown as SchemaContext['image'];
const schema = createLandingSchema(image);
const post = (n: number) => `https://www.instagram.com/p/POST${n}/`;
const photo = (n: number) => ({
  image: `photo-${n}.jpg`,
  alt: 'A balloon arch',
  source: post(n),
});

function valid() {
  return {
    whatsapp: '60109017633',
    meta: {
      instagramLabel: 'Instagram',
      xiaohongshuLabel: 'Xiaohongshu',
      registration: 'SSM CT0152510-K',
      rights: 'All rights reserved.',
    },
    intro: { skip: 'Skip intro' },
    hero: {
      eyebrow: 'KL',
      title: 'Title',
      lede: 'Lede',
      cta: 'WhatsApp us',
      message: 'Hi',
      photo: photo(0),
    },
    palettes: {
      label: 'Choose a palette',
      items: paletteIds.map((id) => ({ id, name: id, message: `Hi ${id}` })),
    },
    services: {
      title: 'Services',
      lede: 'Lede',
      cta: 'Ask',
      items: serviceIds.map((id, i) => ({
        id,
        title: id,
        body: 'Body',
        palette: paletteIds[i % 5],
        message: `Hi ${id}`,
        photo: photo(10 + i),
      })),
    },
    gallery: {
      title: 'Work',
      lede: 'Lede',
      more: 'More',
      items: Array.from({ length: 12 }, (_, i) => ({
        ...photo(20 + i),
        location: 'KL',
        theme: 'Birthday',
        colours: [{ hex: '#E8B4B2', name: 'Pink' }],
      })),
    },
    sculptures: {
      title: 'Sculptures',
      lede: 'Lede',
      pieces: sculptureIds.map((id) => ({ id, name: id })),
      photos: [
        { ...photo(40), caption: 'Lion dance' },
        { ...photo(41), caption: 'Roses' },
      ],
    },
    venues: {
      title: 'Venues',
      items: ['Hotels', 'Homes', 'KTV rooms', 'Restaurants'],
    },
    steps: {
      draft: true,
      title: 'How it works',
      items: [1, 2, 3].map((n) => ({ title: `Step ${n}`, body: 'Body' })),
    },
    faq: {
      title: 'FAQ',
      items: [{ question: 'Where?', answer: 'KL and Selangor.', draft: false }],
    },
    closing: {
      title: 'Compose',
      body: 'Body',
      cta: 'Start',
      message: 'Hi',
      photo: photo(50),
    },
  };
}

describe('landing schema', () => {
  it('accepts complete landing content', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });

  it.each([
    [
      'an empty alt',
      (d: ReturnType<typeof valid>) => {
        d.hero.photo.alt = ' ';
      },
    ],
    [
      'an unknown palette',
      (d: ReturnType<typeof valid>) => {
        d.services.items[0].palette = 'neon' as never;
      },
    ],
    [
      'a non-Instagram source',
      (d: ReturnType<typeof valid>) => {
        d.gallery.items[0].source = 'https://example.com/p/1/';
      },
    ],
    [
      'a formatted phone number',
      (d: ReturnType<typeof valid>) => {
        d.whatsapp = '010-9017633';
      },
    ],
    [
      'a missing gallery photo',
      (d: ReturnType<typeof valid>) => {
        d.gallery.items.pop();
      },
    ],
    [
      'a duplicated service',
      (d: ReturnType<typeof valid>) => {
        d.services.items[1].id = 'weddings';
      },
    ],
    [
      'a duplicated palette',
      (d: ReturnType<typeof valid>) => {
        d.palettes.items[1].id = 'blush-champagne';
      },
    ],
    [
      'too many colours',
      (d: ReturnType<typeof valid>) => {
        d.gallery.items[0].colours = Array(5).fill({
          hex: '#FFFFFF',
          name: 'White',
        });
      },
    ],
    [
      'an unknown field',
      (d: ReturnType<typeof valid>) => {
        (d.hero as Record<string, unknown>).price = 'RM299';
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const data = valid();
    mutate(data);
    expect(schema.safeParse(data).success).toBe(false);
  });
});

describe('landing parity', () => {
  it('accepts translations with the same structure', () => {
    const zh = valid();
    zh.hero.title = '标题';
    expect(parityProblems(valid(), zh)).toEqual([]);
  });

  it('reports structural differences by section', () => {
    const zh = valid();
    zh.gallery.items.reverse();
    zh.faq.items[0].draft = true;
    zh.whatsapp = '60123456789';
    expect(parityProblems(valid(), zh)).toEqual(['whatsapp', 'gallery', 'faq']);
  });
});
