import { readFileSync } from 'node:fs';
import type { SiteConfig } from '../../src/lib/config/schema.ts';

// The canvas-base demonstration identity. Fixed-layer tests build against it
// so they keep covering blog, projects, RSS and single-locale behaviour after
// the client configuration replaced those defaults.
export const demoSiteConfig = {
  name: 'Canvas Base',
  shortName: 'Canvas',
  description: 'A reusable static website starter.',
  url: 'https://example.com',
  base: '/',
  language: 'en',
  author: '',
  email: '',
  formEndpoint: '',
  social: {},
  analyticsId: '',
  defaultOgImage: '/og-default.png',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  features: {
    blog: true,
    projects: true,
    rss: true,
    motion: true,
    i18n: false,
    deploy: 'none',
  },
} satisfies SiteConfig;

const fixture = (name: string) =>
  readFileSync(new URL(`../fixtures/demo/${name}`, import.meta.url), 'utf8');

export const demoContent: Record<string, string> = {
  'src/content/pages/en/about.md': fixture('about.md'),
  'src/content/pages/en/contact.md': fixture('contact.md'),
  'src/content/posts/en/welcome.mdx': fixture('welcome.mdx'),
  'src/content/projects/en/example-project.md': fixture('example-project.md'),
  'src/assets/example-project.svg': fixture('example-project.svg'),
  'src/content/landing/en.yaml': fixture('landing.yaml'),
};

// Client-locale content that the single-locale demo config would reject.
export const projectOnlyPaths = [
  'src/content/pages/zh',
  'src/content/landing/zh.yaml',
  'src/i18n/zh.json',
];
