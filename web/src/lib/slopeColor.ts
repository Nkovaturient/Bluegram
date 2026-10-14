/** Diverging blue → white → red for Sen slope vs peer span (matches globe + feed). */
export function slopeColorHex(slope: number, span: number): number {
  const t = Math.max(-1, Math.min(1, slope / span));
  const blue = [59, 130, 246];
  const white = [244, 247, 251];
  const red = [239, 68, 68];
  const from = t < 0 ? blue : white;
  const to = t < 0 ? white : red;
  const mix = t < 0 ? t + 1 : t;
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * mix);
  return (channel(0) << 16) | (channel(1) << 8) | channel(2);
}

export function slopeSpan(slopes: Record<string, number>): number {
  let span = 0;
  for (const value of Object.values(slopes)) {
    span = Math.max(span, Math.abs(value));
  }
  return span === 0 ? 1 : span;
}
