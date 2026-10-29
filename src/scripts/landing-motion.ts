import { gsap } from 'gsap';
import { motionEnabled, registerMotion } from '../lib/motion/index.ts';

const motionQuery = '(prefers-reduced-motion: no-preference)';

export function initLandingMotion(root: HTMLElement): () => void {
  if (!motionEnabled()) return () => undefined;
  registerMotion();
  const media = gsap.matchMedia();

  media.add(
    motionQuery,
    () => {
      const marquee = root.querySelector<HTMLElement>('[data-marquee]');
      if (!marquee) return;
      // Two identical lists side by side loop seamlessly at -100%.
      marquee.classList.add('is-running');
      gsap.to(marquee.querySelectorAll('.marquee-list'), {
        xPercent: -100,
        duration: 40,
        ease: 'none',
        repeat: -1,
      });
      return () => marquee.classList.remove('is-running');
    },
    root,
  );

  media.add(
    `(min-width: 64rem) and ${motionQuery}`,
    () => {
      const viewport = root.querySelector<HTMLElement>('[data-gallery]');
      const track = viewport?.querySelector<HTMLElement>(
        '[data-gallery-track]',
      );
      if (!viewport || !track) return;
      viewport.classList.add('is-pinned');
      const distance = () =>
        Math.max(0, track.scrollWidth - viewport.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => viewport.classList.remove('is-pinned');
    },
    root,
  );

  return () => media.revert();
}
