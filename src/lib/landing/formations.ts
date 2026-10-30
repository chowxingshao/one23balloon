import type { QualityTier } from '../canvas-island/capability.ts';

export const chapterIds = [
  'hero',
  'statement',
  'services',
  'signature',
  'celebrations',
  'closing',
] as const;
export type ChapterId = (typeof chapterIds)[number];
export type FormationId =
  'hero' | 'drift' | 'hidden' | 'release' | `service-${number}`;

// Dispatched (bubbling) from the landing root when the balloons should regroup.
export const formationEvent = 'one23balloon:formation';

export function formationFor(
  chapter: ChapterId,
  serviceIndex = 0,
): FormationId {
  switch (chapter) {
    case 'hero':
      return 'hero';
    case 'statement':
    case 'signature':
      return 'drift';
    case 'services':
      return `service-${serviceIndex}`;
    case 'celebrations':
      return 'hidden';
    case 'closing':
      return 'release';
  }
}

// Without a back canvas (low tier) drifting balloons would cover the text.
export function resolveFormation(
  id: FormationId,
  tier: QualityTier,
): FormationId {
  return tier === 'low' && id === 'drift' ? 'hidden' : id;
}

export function isFormationId(value: string): value is FormationId {
  return (
    ['hero', 'drift', 'hidden', 'release'].includes(value) ||
    /^service-\d+$/.test(value)
  );
}

export function announceFormation(root: HTMLElement, id: FormationId): void {
  if (root.dataset.formation === id) return;
  root.dataset.formation = id;
  root.dispatchEvent(
    new root.ownerDocument.defaultView!.CustomEvent(formationEvent, {
      bubbles: true,
      detail: { id },
    }),
  );
}
