export type QualityTier = 'high' | 'low';
export type Capability = {
  webgl: boolean;
  reducedMotion: boolean;
  tier: QualityTier;
  pixelRatio: number;
};
export type CapabilityProbe = {
  matchMedia?: (query: string) => { matches: boolean };
  devicePixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  createCanvas?: () => { getContext(type: string): unknown };
};
type ProbeContext = {
  getExtension?(name: string): { loseContext?(): void } | null;
} | null;

function webglAvailable(probe: CapabilityProbe): boolean {
  try {
    const canvas = probe.createCanvas?.();
    const context = (canvas?.getContext('webgl2') ??
      canvas?.getContext('webgl')) as ProbeContext | undefined;
    // Release the probe context immediately; browsers cap live contexts.
    context?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    return Boolean(context);
  } catch {
    return false;
  }
}

export function detectCapability(probe: CapabilityProbe): Capability {
  const matches = (query: string) => Boolean(probe.matchMedia?.(query).matches);
  const low =
    matches('(pointer: coarse)') ||
    (probe.hardwareConcurrency ?? 8) <= 4 ||
    (probe.deviceMemory ?? 8) <= 4;
  const tier: QualityTier = low ? 'low' : 'high';
  // Creating the probe context can stall the main thread (and, early on, first
  // paint), so it happens only when something first needs the answer.
  let webgl: boolean | undefined;
  return {
    get webgl() {
      webgl ??= webglAvailable(probe);
      return webgl;
    },
    reducedMotion: matches('(prefers-reduced-motion: reduce)'),
    tier,
    pixelRatio: Math.min(probe.devicePixelRatio ?? 1, low ? 1.5 : 2),
  };
}

export function browserProbe(): CapabilityProbe {
  return {
    matchMedia: globalThis.matchMedia
      ? (query) => globalThis.matchMedia(query)
      : undefined,
    devicePixelRatio: globalThis.devicePixelRatio,
    hardwareConcurrency: globalThis.navigator?.hardwareConcurrency,
    deviceMemory: (
      globalThis.navigator as Navigator & { deviceMemory?: number }
    )?.deviceMemory,
    createCanvas: () => document.createElement('canvas'),
  };
}
