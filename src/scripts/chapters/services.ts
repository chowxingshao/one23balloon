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
      // Opacity, not autoAlpha: the links must stay reachable by Tab before the
      // trigger fires.
      opacity: 0,
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
  // flares their lower edges. While the last card covers the stack, hide the
  // cards under it (visibility also takes their links out of the tab order, so
  // focus never lands on something the viewer cannot see).
  const covered = cards.slice(0, -1);
  const setCovered = (hidden: boolean) => {
    for (const card of covered) card.style.visibility = hidden ? 'hidden' : '';
  };
  ScrollTrigger.create({
    trigger: last,
    start: 'top top',
    end: 'max',
    onToggle: (self) => setCovered(self.isActive),
  });
  return () => setCovered(false);
};
