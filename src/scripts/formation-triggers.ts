import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  announceFormation,
  chapterIds,
  formationFor,
  type FormationId,
} from '../lib/landing/formations.ts';

// Whichever chapter (or service card) crosses the middle of the screen owns
// the balloons. Services announce per card so the cluster recolours per card.
export function initFormationTriggers(root: HTMLElement): () => void {
  const triggers: ScrollTrigger[] = [];
  const watch = (trigger: Element, id: FormationId) =>
    triggers.push(
      ScrollTrigger.create({
        trigger,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) announceFormation(root, id);
        },
      }),
    );
  for (const chapter of chapterIds) {
    const section = root.querySelector(`[data-chapter="${chapter}"]`);
    if (!section) continue;
    if (chapter === 'services') {
      section
        .querySelectorAll('[data-service-card]')
        .forEach((card, index) => watch(card, formationFor(chapter, index)));
      continue;
    }
    watch(section, formationFor(chapter));
  }
  return () => {
    for (const trigger of triggers.splice(0)) trigger.kill();
  };
}
