export type PartRole = 'body' | 'stem' | 'accent';
export type Part = {
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  rotationZ: number;
  role: PartRole;
  slot: number;
};

const part = (
  position: readonly [number, number, number],
  scale: readonly [number, number, number],
  rotationZ: number,
  role: PartRole,
  slot = 0,
): Part => ({ position, scale, rotationZ, role, slot });

// A classic twisted balloon dog: body, four legs, neck, head, snout, two ears, tail.
export const dogParts: readonly Part[] = [
  part([0, 0, 0], [1, 0.36, 0.36], 0, 'accent'),
  part([-0.72, -0.62, 0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([-0.72, -0.62, -0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([0.72, -0.62, 0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([0.72, -0.62, -0.22], [0.3, 0.68, 0.3], 0, 'accent'),
  part([-0.88, 0.45, 0], [0.28, 0.55, 0.28], -0.35, 'accent'),
  part([-1.08, 0.98, 0], [0.36, 0.33, 0.33], 0, 'accent'),
  part([-1.52, 0.88, 0], [0.48, 0.25, 0.25], 0, 'accent'),
  part([-0.92, 1.42, 0.18], [0.22, 0.52, 0.22], 0.3, 'accent'),
  part([-0.92, 1.42, -0.18], [0.22, 0.52, 0.22], 0.3, 'accent'),
  part([1.08, 0.42, 0], [0.24, 0.5, 0.24], -0.6, 'accent'),
];

// Stems fan out from a tied base; each bloom is three petals in one palette slot.
export function tulipParts(count: number): Part[] {
  const parts: Part[] = [];
  for (let index = 0; index < count; index++) {
    const angle = (index - (count - 1) / 2) * 0.22;
    const tipX = Math.sin(angle) * 2;
    const tipY = -1.2 + Math.cos(angle) * 2;
    parts.push(
      part(
        [Math.sin(angle), -1.2 + Math.cos(angle), 0],
        [0.06, 1, 0.06],
        -angle,
        'stem',
      ),
    );
    for (const [dx, dz, tilt] of [
      [-0.09, 0, 0.25],
      [0.09, 0, -0.25],
      [0, 0.06, 0],
    ] as const)
      parts.push(
        part(
          [tipX + dx, tipY, dz],
          [0.2, 0.3, 0.2],
          -angle + tilt,
          'body',
          index,
        ),
      );
  }
  parts.push(
    part([-0.35, -0.6, 0.1], [0.12, 0.55, 0.12], 0.6, 'stem'),
    part([0.35, -0.6, 0.1], [0.12, 0.55, 0.12], -0.6, 'stem'),
    part([-0.25, -1.15, 0.2], [0.22, 0.12, 0.12], 0.5, 'accent'),
    part([0.25, -1.15, 0.2], [0.22, 0.12, 0.12], -0.5, 'accent'),
  );
  return parts;
}

// Three tiers of balloon rings, each tier in its own palette slot, with a candle.
export function cakeParts(): Part[] {
  const tiers = [
    { radius: 1, y: -0.9 },
    { radius: 0.75, y: -0.3 },
    { radius: 0.5, y: 0.25 },
  ];
  const parts: Part[] = [];
  tiers.forEach((tier, slot) => {
    const count = Math.max(6, Math.round((2 * Math.PI * tier.radius) / 0.32));
    for (const lift of [0, 0.22])
      for (let index = 0; index < count; index++) {
        const angle = (index / count) * Math.PI * 2 + lift * 3;
        parts.push(
          part(
            [
              Math.cos(angle) * tier.radius,
              tier.y + lift,
              Math.sin(angle) * tier.radius,
            ],
            [0.2, 0.2, 0.2],
            0,
            'body',
            slot,
          ),
        );
      }
  });
  parts.push(
    part([0, 0.75, 0], [0.06, 0.35, 0.06], 0, 'accent'),
    part([0, 1.12, 0], [0.08, 0.12, 0.08], 0, 'accent'),
  );
  return parts;
}
