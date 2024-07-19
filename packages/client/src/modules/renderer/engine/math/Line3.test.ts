import { describe, expect, it } from 'vitest';
import { Line3 } from './Line3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { clamp } from './MathUtils.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

describe('Math - Line3', () => {
  it('Instancing', () => {
    let line = Line3.empty();
    expect(line).toEqual({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 0 } });

    line = Line3.fromParams(1, 2, 3, 4, 5, 6);
    expect(line).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    const clone = Line3.clone(line);
    expect(clone).not.toBe(line);
    expect(clone.start).not.toBe(line.start);
    expect(clone.end).not.toBe(line.end);
    expect(clone).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    line.setParams(7, 8, 9, 10, 11, 12);
    expect(line).toEqual({ start: { x: 7, y: 8, z: 9 }, end: { x: 10, y: 11, z: 12 } });
    expect(line.equals(clone)).toBe(false);
  });

  it('center', () => {
    const line = Line3.fromParams(0, 0, 0, 2, 2, 2);
    const center = line.center();

    expect(center).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('delta', () => {
    const line = Line3.fromParams(0, 0, 0, 2, 2, 2);
    const delta = line.delta();

    expect(delta).toEqual({ x: 2, y: 2, z: 2 });
  });

  it('distance/distanceSq', () => {
    const line = Line3.fromParams(0, 0, 0, 3, 3, 3);
    const distanceSq = line.distanceSq();
    const distance = line.distance();
    expect(distance).toBe(Math.sqrt(27));
    expect(distanceSq).toBe(27);
  });

  it('at', () => {
    const line = Line3.fromParams(0, 0, 1, 0, 0, 2);
    const vec = Vec3.new();

    line.at(-1, vec);
    expect(vec.distanceTo(Vec3.new(0, 0, 0))).toBe(0);

    line.at(0, vec);
    expect(vec.distanceTo(Vec3.new(0, 0, 1))).toBe(0);
    line.at(0.5, vec);
    expect(vec.distanceTo(Vec3.new(0, 0, 1.5))).toBe(0);
    line.at(1, vec);
    expect(vec.distanceTo(Vec3.new(0, 0, 2))).toBe(0);

    line.at(2, vec);
    expect(vec.distanceTo(Vec3.new(0, 0, 3))).toBe(0);
  });

  it('closestAt/closestTo/at', () => {
    const line = Line3.fromParams(0, 0, 0, 0, 0, 1);
    const point = Vec3.new();

    for (let i = -1; i <= 2; i += 0.05) {
      let step = clamp(i, 0, 1);

      line.at(i, point);

      expect(line.closestAt(point)).toBeCloseTo(step, 5);
      expect(line.closestTo(point)).toEqual(Vec3.new(0, 0, step));
    }
  });

  it('applyMat4', () => {
    const line = Line3.fromParams(0, 0, 0, 2, 2, 2);
    const vec4 = Vec4.new(2, 2, 2, 1);
    const mat4 = new Mat4().asTranslation(2, 3, 4);
    const vec3 = Vec3.new(2, 3, 4);
    const expected = Line3.new();

    line.applyMat4(mat4);
    expected.setParams(2, 3, 4, 4, 5, 6);
    expectCloseTo(line, expected);

    line.setParams(0, 0, 0, 2, 2, 2);
    mat4.asRotationX(Math.PI);

    line.applyMat4(mat4);
    vec4.applyMat4(mat4);

    expected.setParams(0, 0, 0, vec4.x / vec4.w, vec4.y / vec4.w, vec4.z / vec4.w);
    expectCloseTo(line, expected);

    line.setParams(0, 0, 0, 2, 2, 2);
    vec4.set(2, 2, 2, 1);
    mat4.setPosition(vec3);

    mat4.setPosition(vec3);
    line.applyMat4(mat4);
    vec4.applyMat4(mat4);

    expected.setParams(2, 3, 4, vec4.x / vec4.w, vec4.y / vec4.w, vec4.z / vec4.w);
    expectCloseTo(line, expected);
  });
});

const expectCloseTo = (line: Line3, to: Line3, epsilon: number = Number.EPSILON) => {
  expect(line.start.x).toBeCloseTo(to.start.x, epsilon);
  expect(line.start.y).toBeCloseTo(to.start.y, epsilon);
  expect(line.start.z).toBeCloseTo(to.start.z, epsilon);

  expect(line.end.x).toBeCloseTo(to.end.x, epsilon);
  expect(line.end.y).toBeCloseTo(to.end.y, epsilon);
  expect(line.end.z).toBeCloseTo(to.end.z, epsilon);
};
