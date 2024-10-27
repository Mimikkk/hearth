/**
 * Clamps a value between a minimum and maximum.
 *
 * @param value - The value to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 *
 * @example
 * clamp(10, 0, 100); // 10
 */
export const clamp = (value: number, min: number, max: number) =>
  Math.round(Math.min(max, Math.max(min, value)));
