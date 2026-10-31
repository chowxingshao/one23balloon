import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// Words fill in reading order; each photo pill pops in with its word.
export const statement: ChapterSetup = (section) => {
  const text = section.querySelector<HTMLElement>('[data-statement]');
  if (!text) return;
  const split = SplitText.create(text, {
    type: 'words',
    wordsClass: 'statement-split',
  });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        end: 'bottom 65%',
        scrub: 0.5,
      },
    })
    .fromTo(
      split.words,
      { opacity: 0.16 },
      { opacity: 1, stagger: 0.1, ease: 'none' },
      0,
    )
    .fromTo(
      text.querySelectorAll('.statement-pill'),
      { scale: 0, rotate: -12 },
      { scale: 1, rotate: 0, stagger: 0.35, ease: 'back.out(2)' },
      0,
    );
  return () => split.revert();
};
