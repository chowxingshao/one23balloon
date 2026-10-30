export type ChapterContext = {
  /** The landing root ([data-landing]). */
  root: HTMLElement;
  /** True at 64rem and wider: pins, tilts and long travel are allowed. */
  desktop: boolean;
};

// Runs inside gsap.matchMedia, so tweens and ScrollTriggers it creates are
// reverted automatically. Return a cleanup only for anything else.
export type ChapterSetup = (
  section: HTMLElement,
  context: ChapterContext,
) => void | (() => void);
