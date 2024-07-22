import { Vec3 } from '../engine.js';

export function hilbert3D(
  center: Vec3 = new Vec3(0, 0, 0),
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
): Vec3[] {
  const half = size / 2;

  const vec_s = [
    new Vec3(center.x - half, center.y + half, center.z - half),
    new Vec3(center.x - half, center.y + half, center.z + half),
    new Vec3(center.x - half, center.y - half, center.z + half),
    new Vec3(center.x - half, center.y - half, center.z - half),
    new Vec3(center.x + half, center.y - half, center.z - half),
    new Vec3(center.x + half, center.y - half, center.z + half),
    new Vec3(center.x + half, center.y + half, center.z + half),
    new Vec3(center.x + half, center.y + half, center.z - half),
  ];

  const vec = [vec_s[v0], vec_s[v1], vec_s[v2], vec_s[v3], vec_s[v4], vec_s[v5], vec_s[v6], vec_s[v7]];

  if (--iterations >= 0) {
    return [
      ...hilbert3D(vec[0], half, iterations, v0, v3, v4, v7, v6, v5, v2, v1),
      ...hilbert3D(vec[1], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
      ...hilbert3D(vec[2], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
      ...hilbert3D(vec[3], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
      ...hilbert3D(vec[4], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
      ...hilbert3D(vec[5], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
      ...hilbert3D(vec[6], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
      ...hilbert3D(vec[7], half, iterations, v6, v5, v2, v1, v0, v3, v4, v7),
    ];
  }

  return vec;
}
