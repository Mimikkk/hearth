export const CatmullRom = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
};

export const QuadraticBezier = (t: number, p0: number, p1: number, p2: number): number => {
  const k = 1 - t;
  const w0 = k * k * p0;
  const w1 = 2 * k * t * p1;
  const w2 = t * t * p2;

  return w0 + w1 + w2;
};

export const CubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
  const k = 1 - t;
  const w0 = k * k * k * p0;
  const w1 = 3 * k * k * t * p1;
  const w2 = 3 * k * t * t * p2;
  const w3 = t * t * t * p3;

  return w0 + w1 + w2 + w3;
};
