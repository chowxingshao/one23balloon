import { gsap } from 'gsap';
import type { ChapterSetup } from './types.ts';

// The whole wall arrives tilted back in perspective and flattens as it
// reaches the top; on wide screens alternate columns drift at other speeds.
export const celebrations: ChapterSetup = (section, { desktop }) => {
  const plane = section.querySelector<HTMLElement>('[data-celebrations-plane]');
  if (plane)
    gsap.fromTo(
      plane,
      {
        rotateX: desktop ? 18 : 8,
        skewY: desktop ? 3 : 0,
        yPercent: 4,
        transformPerspective: 1400,
        transformOrigin: '50% 0%',
      },
      {
        rotateX: 0,
        skewY: 0,
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      },
    );
  if (!desktop) return;
  section
    .querySelectorAll<HTMLElement>('[data-celebrations-column]')
    .forEach((column, index) => {
      // Slow columns start at rest: a negative start lifts them over the title.
      const fast = index % 2 === 1;
      gsap.fromTo(
        column,
        { yPercent: fast ? 6 : 0 },
        {
          yPercent: fast ? -10 : 2,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    });
};
