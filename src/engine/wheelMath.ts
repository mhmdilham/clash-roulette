export function pickRandomIndex(length: number, rng?: () => number): number {
  if (length <= 1) return 0;
  if (rng) {
    return Math.min(length - 1, Math.max(0, Math.floor(rng() * length)));
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % length;
  }
  return Math.floor(Math.random() * length);
}

export function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

/**
 * Local wheel coordinates: 0deg is at 3 o'clock (pointer position), increasing clockwise.
 * Slice `i` spans `[i * step, (i + 1) * step)`.
 * Rotating the wheel clockwise by `rotationDeg` brings local angle `(360 - norm(rotationDeg)) % 360`
 * under the fixed 3 o'clock pointer.
 */
export function getSliceIndexAtPointer(rotationDeg: number, sliceCount: number): number {
  if (sliceCount <= 1) return 0;
  const step = 360 / sliceCount;
  const localAtPointer = normalizeDeg(360 - normalizeDeg(rotationDeg));
  return Math.min(sliceCount - 1, Math.floor(localAtPointer / step));
}

export function getSliceMidAngle(index: number, sliceCount: number): number {
  if (sliceCount <= 1) return 0;
  const step = 360 / sliceCount;
  return (index + 0.5) * step;
}

export function computeTargetRotation(
  currentDeg: number,
  targetIndex: number,
  sliceCount: number,
  options?: { minSpins?: number; jitterRatio?: number; rng?: () => number },
): number {
  const minSpins = options?.minSpins ?? 5;
  const jitterRatio = options?.jitterRatio ?? 0.32;
  const rng = options?.rng ?? Math.random;

  if (sliceCount <= 1) {
    return currentDeg + minSpins * 360;
  }

  const step = 360 / sliceCount;
  const jitter = (rng() - 0.5) * 2 * jitterRatio * step;
  const desiredLocal = (targetIndex + 0.5) * step + jitter;
  const desiredMod = normalizeDeg(360 - desiredLocal);
  const currentMod = normalizeDeg(currentDeg);
  const delta = normalizeDeg(desiredMod - currentMod);

  return currentDeg + minSpins * 360 + delta;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/**
 * Produces a valid SVG path for a pie slice from `startDeg` to `endDeg` (0deg = 3 o'clock, clockwise).
 * For a single full-circle slice (sweep >= 360), draws two 180deg arcs so the circle never collapses.
 */
export function describeSlicePath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = endDeg - startDeg;
  if (sweep >= 359.99) {
    return [
      `M ${cx + radius} ${cy}`,
      `A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`,
      `A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`,
      'Z',
    ].join(' ');
  }

  const start = polarToCartesian(cx, cy, radius, startDeg);
  const end = polarToCartesian(cx, cy, radius, endDeg);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}
