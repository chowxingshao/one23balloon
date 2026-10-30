import type { ChapterId } from '../../lib/landing/formations.ts';
import { celebrations } from './celebrations.ts';
import { closing } from './closing.ts';
import { hero } from './hero.ts';
import { services } from './services.ts';
import { signature } from './signature.ts';
import { statement } from './statement.ts';
import type { ChapterSetup } from './types.ts';

export const chapters: Record<ChapterId, ChapterSetup> = {
  hero,
  statement,
  services,
  signature,
  celebrations,
  closing,
};
