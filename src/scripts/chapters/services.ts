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
  const stops: Array<() => void> = [];
  cards.forEach((card, index) => {
    const reveal = gsap.from(card.querySelectorAll('.service-copy > *'), {
      y: 60,
      // Opacity, not autoAlpha: the links must stay reachable by Tab before the
      // trigger fires.
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 60%' },
    });
    // A focused link must be visible: Tab can arrive before the trigger fires.
    const showFocused = () => reveal.progress(1);
    card.addEventListener('focusin', showFocused);
    stops.push(() => card.removeEventListener('focusin', showFocused));
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
  const stopAll = () => {
    for (const stop of stops.splice(0)) stop();
  };
  if (!last || cards.length < 2) return stopAll;
  // Under ScrollSmoother a pin is a transform, so the tilted cards' perspective
  // flares their lower edges. While the last card covers the stack, clip the
  // cards under it away. The clip is visual only: headings and links stay in
  // the accessibility tree, so the covered cards' links leave the tab order
  // while they are clipped, and focus never lands on an invisible element.
  const covered = cards.slice(0, -1);
  const savedTabIndex = new Map<HTMLElement, string | null>();
  const takeOutOfTabOrder = (element: HTMLElement) => {
    if (savedTabIndex.has(element)) return;
    savedTabIndex.set(element, element.getAttribute('tabindex'));
    element.setAttribute('tabindex', '-1');
  };
  const restoreTabOrder = () => {
    for (const [element, value] of savedTabIndex) {
      if (value === null) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', value);
    }
    savedTabIndex.clear();
  };
  const setCovered = (clipped: boolean) => {
    for (const card of covered) {
      card.style.clipPath = clipped ? 'inset(0 0 100% 0)' : '';
      if (clipped)
        for (const element of card.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])',
        ))
          takeOutOfTabOrder(element);
    }
    if (!clipped) restoreTabOrder();
  };
  ScrollTrigger.create({
    trigger: last,
    start: 'top top',
    end: 'max',
    onToggle: (self) => setCovered(self.isActive),
  });
  return () => {
    setCovered(false);
    stopAll();
  };
};
