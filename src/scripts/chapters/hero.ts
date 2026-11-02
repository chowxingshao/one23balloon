import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { ChapterSetup } from './types.ts';

// The headline splits apart from its middle as the balloons push forward.
export const hero: ChapterSetup = (section, { root, desktop }) => {
  const header = root.ownerDocument.querySelector<HTMLElement>('.site-header');
  // Created after the pin trigger, so its end is measured with the pin spacer
  // in place. toggleClass would leave the header opaque at scroll 0 (progress 0
  // is not active), so the class follows progress directly.
  const trackHeader = () => {
    if (!header) return;
    const sync = (self: ScrollTrigger) =>
      header.classList.toggle('is-over-hero', self.progress < 1);
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top+=64',
      onRefresh: sync,
      onUpdate: sync,
    });
  };
  const lines = [...section.querySelectorAll<HTMLElement>('[data-hero-line]')];
  if (!lines.length) {
    trackHeader();
    return () => header?.classList.remove('is-over-hero');
  }
  // aria-label is not allowed on the line spans, so the heading carries the
  // name and the split characters stay hidden from assistive technology.
  const title = section.querySelector<HTMLElement>('h1');
  const titleText = title?.textContent?.replace(/\s+/g, ' ').trim();
  if (title && titleText) title.setAttribute('aria-label', titleText);
  const splits = lines.map((line) =>
    SplitText.create(line, {
      type: 'chars',
      charsClass: 'hero-char',
      aria: 'hidden',
    }),
  );
  // No entrance tween: the headline is already painted in the static HTML, and
  // hiding it once motion starts would make it blink out and back in.
  const travel = () => innerWidth * (desktop ? 0.55 : 0.3);
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: desktop ? '+=100%' : 'bottom top',
      pin: desktop,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  for (const split of splits) {
    const half = Math.ceil(split.chars.length / 2);
    timeline
      .to(
        split.chars.slice(0, half),
        { x: () => -travel(), stagger: { each: 0.02, from: 'end' } },
        0,
      )
      .to(
        split.chars.slice(half),
        { x: () => travel(), stagger: { each: 0.02, from: 'start' } },
        0,
      );
  }
  timeline.to(section.querySelector('.hero-lede'), { autoAlpha: 0, y: -40 }, 0);
  trackHeader();
  return () => {
    header?.classList.remove('is-over-hero');
    for (const split of splits) split.revert();
    title?.removeAttribute('aria-label');
  };
};
