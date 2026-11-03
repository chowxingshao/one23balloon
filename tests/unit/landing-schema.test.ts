import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { parityProblems } from '../../src/lib/landing/parity.ts';
import {
  createLandingSchema,
  pieceIds,
  serviceIds,
} from '../../src/lib/landing/schema.ts';
import { blockIds } from '../../src/lib/landing/blocks.ts';

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
    header: { whatsapp: 'WhatsApp' },
    hero: { title: ['Every party,', 'bigger.'], lede: 'Balloon setups.' },
    statement: {
      parts: [
        { text: 'We style' },
        { word: 'weddings,', photo: photo(1) },
        { word: 'openings,', photo: photo(2) },
        { word: 'birthdays', photo: photo(3) },
        { text: 'and' },
        { word: '100-day parties', photo: photo(4) },
        { text: 'across KL.' },
      ],
    },
    services: {
      title: 'What we do',
      items: serviceIds.map((id, index) => ({
        id,
        colour: blockIds[index],
        title: `Service ${id}`,
        body: 'Body',
        linkLabel: 'Ask on WhatsApp',
        message: 'Hi',
        photo: photo(10 + index),
      })),
    },
    signature: {
      marquee: ['Arches', 'Garlands', 'Columns', 'Sculptures', 'Bouquets'],
      pieces: pieceIds.map((id, index) => ({
        id,
        caption: 'Caption',
        photo: photo(20 + index),
      })),
    },
    celebrations: {
      title: 'Recent celebrations',
      items: Array.from({ length: 30 }, (_, index) => ({
        id: `c${String(index + 1).padStart(2, '0')}`,
        occasion: 'Birthday',
        photo: photo(100 + index),
      })),
    },
    closing: {
      title: "Let's make yours.",
      whatsapp: 'WhatsApp us',
      message: 'Hi',
    },
  };
}

describe('landing schema', () => {
  it('accepts complete showcase content', () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });

  it.each(['intro', 'palettes', 'venues', 'steps', 'faq', 'gallery'])(
    'rejects the removed %s section',
    (key) => {
      expect(schema.safeParse({ ...valid(), [key]: {} }).success).toBe(false);
    },
  );

  it('requires a two-line hero title', () => {
    const data = valid();
    data.hero.title = ['Only one line'] as unknown as [string, string];
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('caps the header pill label at 12 characters', () => {
    const data = valid();
    data.header.whatsapp = 'Message us on WhatsApp';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('requires exactly four photo pills in the statement', () => {
    const data = valid();
    data.statement.parts.splice(1, 1);
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('gives every service a different block colour', () => {
    const data = valid();
    data.services.items[1]!.colour = data.services.items[0]!.colour;
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('rejects unknown block colours', () => {
    const data = valid() as unknown as {
      services: { items: Array<{ colour: string }> };
    };
    data.services.items[0]!.colour = 'neon';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('keeps between 30 and 50 celebrations with unique ids', () => {
    const short = valid();
    short.celebrations.items.pop();
    expect(schema.safeParse(short).success).toBe(false);
    const duplicate = valid();
    duplicate.celebrations.items[1]!.id = 'c01';
    expect(schema.safeParse(duplicate).success).toBe(false);
  });

  it.each(['+60 10-901 7633', '010-9017633', '60109017633 '])(
    'rejects the formatted whatsapp number %j',
    (number) => {
      const data = valid();
      data.whatsapp = number;
      expect(schema.safeParse(data).success).toBe(false);
    },
  );

  it('rejects a duplicate service id', () => {
    const data = valid();
    data.services.items[1]!.id = data.services.items[0]!.id;
    expect(schema.safeParse(data).success).toBe(false);
  });

  it.each([
    [
      'at the top level',
      (data: ReturnType<typeof valid>) => ({ ...data, extra: 1 }),
    ],
    [
      'in a photo',
      (data: ReturnType<typeof valid>) => {
        Object.assign(data.statement.parts[1]!.photo!, { credit: 'x' });
        return data;
      },
    ],
    [
      'in a service',
      (data: ReturnType<typeof valid>) => {
        Object.assign(data.services.items[0]!, { price: 'RM1' });
        return data;
      },
    ],
  ])('rejects an unknown field %s', (_place, mutate) => {
    expect(schema.safeParse(mutate(valid())).success).toBe(false);
  });

  it.each(['', '   '])('rejects an empty photo alt %j', (alt) => {
    const data = valid();
    data.celebrations.items[0]!.photo.alt = alt;
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('rejects a celebration source used twice', () => {
    const data = valid();
    data.celebrations.items[1]!.photo.source =
      data.celebrations.items[0]!.photo.source;
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('rejects em and en dashes in visible text', () => {
    const data = valid();
    data.hero.lede = 'Balloons — for you';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('only accepts Instagram post URLs as photo sources', () => {
    const data = valid();
    data.celebrations.items[0]!.photo.source = 'https://example.com/a.jpg';
    expect(schema.safeParse(data).success).toBe(false);
  });

  it('accepts a story permalink as a celebration source but not a highlight album', () => {
    const story = valid();
    story.celebrations.items[0]!.photo.source =
      'https://www.instagram.com/stories/one23balloon/3899572834921993285/';
    expect(schema.safeParse(story).success).toBe(true);
    const album = valid();
    album.celebrations.items[0]!.photo.source =
      'https://www.instagram.com/stories/highlights/18463288678070950/';
    expect(schema.safeParse(album).success).toBe(false);
  });
});

describe('landing parity', () => {
  it('accepts translated words with the same structure', () => {
    const zh = valid();
    zh.hero.title = ['每一场派对，', '更盛大。'];
    zh.statement.parts[0] = { text: '我们为' };
    zh.celebrations.items[0]!.occasion = '生日派对';
    expect(parityProblems(valid(), zh)).toEqual([]);
  });

  it.each([
    [
      'celebrations',
      (data: ReturnType<typeof valid>) =>
        (data.celebrations.items[3]!.photo = photo(999)),
    ],
    [
      'services',
      (data: ReturnType<typeof valid>) =>
        (data.services.items[0]!.colour = 'lilac'),
    ],
    [
      'statement',
      (data: ReturnType<typeof valid>) =>
        (data.statement.parts[1] = { word: 'x', photo: photo(77) }),
    ],
    [
      'signature',
      (data: ReturnType<typeof valid>) => data.signature.marquee.pop(),
    ],
    [
      'whatsapp',
      (data: ReturnType<typeof valid>) => (data.whatsapp = '60123456789'),
    ],
  ])('reports drift in %s', (key, mutate) => {
    const other = valid();
    mutate(other);
    expect(parityProblems(valid(), other)).toContain(key);
  });
});
