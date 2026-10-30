export const POP_DURATION = 0.07;
export const INFLATE_DURATION = 0.7;
export const REINFLATE_DELAY = 2.4;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// A popping balloon swells 28% before vanishing; null means hidden.
export function popScale(elapsed: number): number | null {
  if (elapsed >= POP_DURATION) return null;
  return 1 + (0.28 * Math.max(0, elapsed)) / POP_DURATION;
}

// Damped overshoot, like latex settling after inflation.
export function inflateScale(elapsed: number): number {
  const t = clamp(elapsed / INFLATE_DURATION);
  if (t >= 1) return 1;
  return 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.2);
}
