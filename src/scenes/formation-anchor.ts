/** A rectangle in viewport pixels. */
export type Rect = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: Rect, b: Rect): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * The largest axis-aligned rectangle inside `bounds` that touches none of the
 * `obstacles` (each grown by `margin`). Every side of an optimal rectangle lies
 * on a bound or an obstacle edge, so only those edges are tried. Rectangles
 * thinner than `minSide` are ignored, and strips more elongated than
 * `maxElongation` lose score with the square of the excess. Returns undefined when nothing fits.
 */
export function largestFreeRect(
  bounds: Rect,
  obstacles: readonly Rect[],
  margin = 0,
  minSide = 24,
  maxElongation = 3,
): Rect | undefined {
  const grown = obstacles.map((o) => ({
    left: o.left - margin,
    top: o.top - margin,
    right: o.right + margin,
    bottom: o.bottom + margin,
  }));
  const within = (value: number, low: number, high: number) =>
    value >= low && value <= high;
  const xs = [
    bounds.left,
    bounds.right,
    ...grown.flatMap((o) => [o.left, o.right]),
  ]
    .filter((x) => within(x, bounds.left, bounds.right))
    .sort((a, b) => a - b);
  const ys = [
    bounds.top,
    bounds.bottom,
    ...grown.flatMap((o) => [o.top, o.bottom]),
  ]
    .filter((y) => within(y, bounds.top, bounds.bottom))
    .sort((a, b) => a - b);
  let best: Rect | undefined;
  let bestScore = 0;
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++)
      for (let k = 0; k < ys.length; k++)
        for (let l = k + 1; l < ys.length; l++) {
          const rect = {
            left: xs[i]!,
            right: xs[j]!,
            top: ys[k]!,
            bottom: ys[l]!,
          };
          const width = rect.right - rect.left;
          const height = rect.bottom - rect.top;
          const area = width * height;
          if (
            Math.min(width, height) < minSide ||
            grown.some((o) => overlaps(rect, o))
          )
            continue;
          // Long thin strips hold only tiny balloons, so they score less.
          const score =
            area *
            Math.min(
              1,
              maxElongation /
                (Math.max(width, height) / Math.min(width, height)),
            );
          if (score <= bestScore) continue;
          best = rect;
          bestScore = score;
        }
  return best;
}
