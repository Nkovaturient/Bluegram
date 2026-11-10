/**
 * High-contrast diverging color scale for Sen slope vs peer span.
 * Uses a non-linear saturation curve and avoids washed-out white so markers
 * remain legible over bright MODIS clouds, polar ice sheets, and dark oceans.
 */
export function slopeColorHex(slope: number, span: number): number {
  if (Math.abs(slope) < 1e-9) {
    return 0xfbbf24; // Amber-gold for exact zero trend
  }
  const rawT = Math.max(-1, Math.min(1, slope / span));
  // Boost mid-range saturation so small slopes don't wash out into white cloud cover
  const strength = Math.max(0.38, Math.pow(Math.abs(rawT), 0.55));

  if (rawT < 0) {
    // Declining: bright cyan-sky [56, 189, 248] -> deep electric blue [37, 99, 235]
    const from = [56, 189, 248];
    const to = [37, 99, 235];
    const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * strength);
    return (channel(0) << 16) | (channel(1) << 8) | channel(2);
  }

  // Rising: warm coral-amber [251, 146, 60] -> vibrant crimson-orange [255, 77, 46]
  const from = [251, 146, 60];
  const to = [255, 77, 46];
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * strength);
  return (channel(0) << 16) | (channel(1) << 8) | channel(2);
}

export function slopeSpan(slopes: Record<string, number>): number {
  let span = 0;
  for (const value of Object.values(slopes)) {
    span = Math.max(span, Math.abs(value));
  }
  return span === 0 ? 1 : span;
}
