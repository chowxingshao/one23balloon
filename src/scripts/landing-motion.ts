import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { motionEnabled, refreshOnLoad } from '../lib/motion/index.ts';
import { chapters } from './chapters/index.ts';
import { initFormationTriggers } from './formation-triggers.ts';

const motion = '(prefers-reduced-motion: no-preference)';
export const motionQueries = {
  motion,
  desktop: `${motion} and (min-width: 64rem)`,
  smooth: `${motion} and (min-width: 64rem) and (pointer: fine)`,
} as const;

export function initLandingMotion(root: HTMLElement): () => void {
  if (!motionEnabled()) return () => undefined;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  const doc = root.ownerDocument;
  const media = gsap.matchMedia();

  // Added first so pins created below measure against the smoothed scroller.
  media.add(motionQueries.smooth, () => {
    const wrapper = doc.querySelector<HTMLElement>('#smooth-wrapper');
    const content = doc.querySelector<HTMLElement>('#smooth-content');
    if (!wrapper || !content) return;
    const smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: 1.1,
      effects: false,
    });
    return () => smoother.kill();
  });

  media.add(
    { motion: motionQueries.motion, desktop: motionQueries.desktop },
    (context) => {
      const { motion: allowed, desktop } = context.conditions as {
        motion: boolean;
        desktop: boolean;
      };
      if (!allowed) return;
      const cleanups: Array<() => void> = [];
      for (const [id, setup] of Object.entries(chapters)) {
        const section = root.querySelector<HTMLElement>(
          `[data-chapter="${id}"]`,
        );
        if (!section) continue;
        const cleanup = setup(section, { root, desktop });
        if (cleanup) cleanups.push(cleanup);
      }
      cleanups.push(initFormationTriggers(root));
      return () => {
        for (const cleanup of cleanups.reverse()) cleanup();
      };
    },
  );

  const stopRefresh = refreshOnLoad(root);
  return () => {
    stopRefresh();
    media.revert();
  };
}
