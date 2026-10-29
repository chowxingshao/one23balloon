import type { SiteConfig } from './src/lib/config/schema.ts';

export const siteConfig = {
  name: 'one23balloon',
  shortName: 'one23balloon',
  description:
    'Balloon installations for weddings, launches, openings and milestone celebrations across Kuala Lumpur and Selangor.',
  url: 'https://chowxingshao.github.io',
  base: '/one23balloon/',
  language: 'en',
  author: 'one23balloon',
  email: '',
  formEndpoint: '',
  social: {
    instagram: 'https://www.instagram.com/one23balloon/',
    xiaohongshu: 'https://xhslink.com/m/625h2gZKgy6',
  },
  analyticsId: '',
  defaultOgImage: '/og-default.png',
  i18n: { defaultLocale: 'en', locales: ['en', 'zh'] },
  features: {
    blog: false,
    projects: false,
    rss: false,
    motion: true,
    i18n: true,
    deploy: 'github-pages',
  },
} satisfies SiteConfig;
