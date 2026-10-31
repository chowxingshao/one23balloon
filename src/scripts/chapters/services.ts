import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ChapterSetup } from './types.ts';

// Each card pins at the top; the next one slides over it while it shrinks,
// tilts back and dims.
export const services: ChapterSetup = (section, { desktop }) => {
  const cards = gsap.utils.toArray<HTMLElement>(
    section.querySelectorAll('[data-service-card]'),
  );
  const last = cards.at(-1);
  cards.forEach((card, index) => {
    gsap.from(card.querySelectorAll('.service-copy > *'), {
      y: 60,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 60%' },
    });
    const next = cards[index + 1];
    if (!next || !last) return;
    ScrollTrigger.create({
      trigger: card,
      start: 'top top',
      endTrigger: last,
      end: 'top top',
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
    });
    const scroll = {
      trigger: next,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    };
    gsap.to(card, {
      scale: 0.9,
      rotateX: desktop ? 8 : 0,
      transformPerspective: 1600,
      transformOrigin: '50% 0%',
      ease: 'none',
      scrollTrigger: scroll,
    });
    gsap.to(card.querySelector('.service-dim'), {
      opacity: 0.35,
      ease: 'none',
      scrollTrigger: scroll,
    });
  });
  if (!last || cards.length < 2) return;
  // Under ScrollSmoother a pin is a transform, so the tilted cards' perspective
  // flares their lower edges. Once the last card has covered the stack, make the
  // cards under it transparent so those edges never show below it as it scrolls away.
  const covered = cards.slice(0, -1);
  const reset = () => {
    for (const card of covered) card.style.opacity = '';
  };
  ScrollTrigger.create({
    trigger: last,
    start: 'top top',
    end: 'max',
    onToggle: (self) => {
      for (const card of covered) card.style.opacity = self.isActive ? '0' : '';
    },
  });
  return reset;
};
