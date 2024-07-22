import { Vec3 } from '../engine.js';

export function generateHilbert(
  { x, y, z }: Vec3 = Vec3.new(0, 0, 0),
  size: number = 10,
  iterations: number = 1,
  v0: number = 0,
  v1: number = 1,
  v2: number = 2,
  v3: number = 3,
  v4: number = 4,
  v5: number = 5,
  v6: number = 6,
  v7: number = 7,
  into: Vec3[] = [],
): Vec3[] {
  const half = size / 2;

  const coords = [
    Vec3.new(x - half, y + half, z - half),
    Vec3.new(x - half, y + half, z + half),
    Vec3.new(x - half, y - half, z + half),
    Vec3.new(x - half, y - half, z - half),
    Vec3.new(x + half, y - half, z - half),
    Vec3.new(x + half, y - half, z + half),
    Vec3.new(x + half, y + half, z + half),
    Vec3.new(x + half, y + half, z - half),
  ];

  if (--iterations >= 0) {
    generateHilbert(coords[0], half, iterations, v0, v3, v4, v7, v6, v5, v2, v1, into);
    generateHilbert(coords[1], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3, into);
    generateHilbert(coords[2], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3, into);
    generateHilbert(coords[3], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5, into);
    generateHilbert(coords[4], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5, into);
    generateHilbert(coords[5], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7, into);
    generateHilbert(coords[6], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7, into);
    generateHilbert(coords[7], half, iterations, v6, v5, v2, v1, v0, v3, v4, v7, into);
  } else {
    into.push(coords[v0], coords[v1], coords[v2], coords[v3], coords[v4], coords[v5], coords[v6], coords[v7]);
  }

  return into;
}
