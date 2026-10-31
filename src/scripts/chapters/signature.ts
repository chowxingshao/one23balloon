import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ChapterSetup } from './types.ts';

// The page's only marquee. It follows scroll direction and speeds up with
// scroll velocity; the two sculptures cross it at different speeds.
export const signature: ChapterSetup = (section, { desktop }) => {
  const runs = section.querySelectorAll<HTMLElement>(
    '[data-marquee] .marquee-run',
  );
  if (runs.length) {
    const loop = gsap.to(runs, {
      xPercent: -100,
      duration: 26,
      ease: 'none',
      repeat: -1,
    });
    // Start far from zero so reversing never runs into the beginning.
    loop.totalTime(loop.duration() * 100);
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 800);
        gsap.to(loop, {
          timeScale: self.direction * boost,
          duration: 0.3,
          overwrite: true,
          onComplete: () => {
            gsap.to(loop, { timeScale: self.direction, duration: 0.8 });
          },
        });
      },
    });
  }
  section
    .querySelectorAll<HTMLElement>('[data-piece]')
    .forEach((piece, index) => {
      const reach = desktop ? 30 + index * 25 : 12;
      gsap.fromTo(
        piece,
        { yPercent: reach },
        {
          yPercent: -reach,
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
