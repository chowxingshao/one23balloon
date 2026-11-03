import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// A pink curtain rises over the page, then the wordmark drops in letter by letter.
export const closing: ChapterSetup = (section, { root }) => {
  const flood = section.querySelector<HTMLElement>('[data-closing-flood]');
  if (flood)
    gsap.fromTo(
      flood,
      { clipPath: 'inset(100% 0% 0% 0% round 3rem 3rem 0rem 0rem)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0rem 0rem 0rem 0rem)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      },
    );
  const reveal = gsap.from(
    section.querySelectorAll('.chapter-title, .closing-actions > *'),
    {
      y: 80,
      // Opacity, not autoAlpha: the actions must stay reachable by Tab before
      // the trigger fires.
      opacity: 0,
      stagger: 0.08,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: section, start: 'top 40%' },
    },
  );
  // A focused action must be visible: Tab can arrive before the trigger fires.
  const actions = section.querySelector<HTMLElement>('.closing-actions');
  const showFocused = () => reveal.progress(1);
  actions?.addEventListener('focusin', showFocused);
  const stopFocus = () => actions?.removeEventListener('focusin', showFocused);
  const wordmark =
    root.ownerDocument.querySelector<HTMLElement>('[data-wordmark]');
  if (!wordmark) return stopFocus;
  const split = SplitText.create(wordmark, { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: -130,
    rotate: () => gsap.utils.random(-12, 12),
    duration: 1.1,
    ease: 'bounce.out',
    stagger: 0.04,
    scrollTrigger: { trigger: wordmark, start: 'top 92%' },
  });
  return () => {
    stopFocus();
    split.revert();
  };
};
