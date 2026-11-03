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
    // Created paused and played only while the section is on screen. Every
    // tween below is made here, inside the matchMedia context, so a revert
    // takes all of them with it.
    const loop = gsap.to(runs, {
      xPercent: -100,
      duration: 26,
      ease: 'none',
      repeat: -1,
      paused: true,
    });
    // Start far from zero so reversing never runs into the beginning.
    loop.totalTime(loop.duration() * 100);
    const setSpeed = gsap.quickTo(loop, 'timeScale', {
      duration: 0.3,
      ease: 'power2.out',
    });
    // One persistent settle: a pause in scrolling eases back to cruising speed.
    let direction = 1;
    const settle = gsap.delayedCall(0.3, () => setSpeed(direction)).pause();
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        direction = self.direction;
        setSpeed(
          direction * (1 + Math.min(4, Math.abs(self.getVelocity()) / 800)),
        );
        settle.restart(true);
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
