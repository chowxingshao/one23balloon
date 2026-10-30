import {
  parseSiteConfig,
  type SiteConfig,
} from '../../src/lib/config/schema.ts';
import { demoSiteConfig } from './demo.ts';

export function withFeatures(
  flags: Partial<SiteConfig['features']>,
): SiteConfig {
  const fixture = structuredClone(demoSiteConfig);
  return parseSiteConfig({
    ...fixture,
    features: { ...fixture.features, ...flags },
  });
}
