import { gsap } from 'gsap';
import type { ChapterSetup } from './types.ts';

// On wide screens the whole wall arrives tilted back in perspective and
// flattens as it reaches the top, and alternate columns drift at other speeds.
// Narrower screens keep the wall flat.
const TILT = 18;

export const celebrations: ChapterSetup = (section, { desktop }) => {
  if (!desktop) return;
  const plane = section.querySelector<HTMLElement>('[data-celebrations-plane]');
  if (plane)
    gsap.fromTo(
      plane,
      {
        rotateX: TILT,
        skewY: 3,
        yPercent: 4,
        // The wall is taller than a fixed camera distance, which would send
        // its lower rows behind the camera and project their boxes to millions
        // of pixels. Keep the camera further back than the tilted wall is deep.
        transformPerspective: () =>
          Math.max(
            1400,
            plane.offsetHeight * Math.sin((TILT * Math.PI) / 180) * 1.5,
          ),
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
          invalidateOnRefresh: true,
        },
      },
    );
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
