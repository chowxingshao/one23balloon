import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// Words fill in reading order; each photo pill pops in with its word. The
// unread words start at half strength, which keeps large text above 3:1.
export const statement: ChapterSetup = (section) => {
  const text = section.querySelector<HTMLElement>('[data-statement]');
  if (!text) return;
  // The default adds aria-label to the paragraph, which ARIA does not allow
  // there; the words stay in reading order, so nothing needs hiding.
  const split = SplitText.create(text, {
    type: 'words',
    wordsClass: 'statement-split',
    aria: 'none',
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
      { opacity: 0.5 },
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
