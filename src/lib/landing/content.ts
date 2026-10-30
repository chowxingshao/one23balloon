import { getCollection, type CollectionEntry } from 'astro:content';
import { getSiteConfig } from '../config/site.ts';
import { enabledLocales } from '../routing/paths.ts';
import { parityProblems } from './parity.ts';

export type LandingData = CollectionEntry<'landing'>['data'];
export type LocalizedLanding = { data: LandingData; locale: string };

let cache: Promise<Map<string, LandingData>> | undefined;

async function loadLanding(): Promise<Map<string, LandingData>> {
  const config = getSiteConfig();
  const { defaultLocale } = config.i18n;
  const entries = new Map(
    (await getCollection('landing')).map((entry) => [entry.id, entry.data]),
  );
  const reference = entries.get(defaultLocale);
  if (!reference)
    throw new Error(`Missing landing content for ${defaultLocale}.`);
  for (const locale of enabledLocales(config)) {
    const data = entries.get(locale);
    if (!data || locale === defaultLocale) continue;
    const problems = parityProblems(reference, data);
    if (problems.length)
      throw new Error(
        `Landing content for ${locale} must match ${defaultLocale} in: ${problems.join(', ')}.`,
      );
  }
  return entries;
}

export async function getLanding(locale: string): Promise<LocalizedLanding> {
  cache ??= loadLanding();
  const entries = await cache;
  const data = entries.get(locale);
  if (data) return { data, locale };
  const { defaultLocale } = getSiteConfig().i18n;
  console.warn(
    `Missing landing translation (${locale}); using ${defaultLocale}.`,
  );
  return { data: entries.get(defaultLocale)!, locale: defaultLocale };
}
