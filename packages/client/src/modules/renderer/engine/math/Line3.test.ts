/* global QUnit */

import { describe, expect, it } from 'vitest';
import { Line3_ } from './Line3.ts';
import { Vec3, Vector3 } from '@modules/renderer/engine/math/Vector3.js';
import { clamp } from './MathUtils.ts';
import { Vec4, Vector4 } from '@modules/renderer/engine/math/Vector4.js';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';

describe('Math - Line3', () => {
  it('Instancing', () => {
    let line = Line3_.empty();
    expect(line).toEqual({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 0 } });

    line = Line3_.create(1, 2, 3, 4, 5, 6);
    expect(line).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    const clone = Line3_.clone(line);
    expect(clone).not.toBe(line);
    expect(clone.start).not.toBe(line.start);
    expect(clone.end).not.toBe(line.end);
    expect(clone).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    const copy = Line3_.copy(line);
    expect(copy).not.toBe(line);
    expect(copy.start).toBe(line.start);
    expect(copy.end).toBe(line.end);

    Line3_.set(line, 7, 8, 9, 10, 11, 12);
    expect(line).toEqual({ start: { x: 7, y: 8, z: 9 }, end: { x: 10, y: 11, z: 12 } });
    expect(copy).toEqual(line);

    expect(Line3_.equals(line, copy)).toBe(true);
    expect(Line3_.equals(line, clone)).toBe(false);
  });

  it('center', () => {
    const line = Line3_.create(0, 0, 0, 2, 2, 2);
    const center = Line3_.center(line);

    expect(center).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('delta', () => {
    const line = Line3_.create(0, 0, 0, 2, 2, 2);
    const delta = Line3_.delta(line);

    expect(delta).toEqual({ x: 2, y: 2, z: 2 });
  });

  it('distance/distanceSq', () => {
    const line = Line3_.create(0, 0, 0, 3, 3, 3);
    const distanceSq = Line3_.distanceSq(line);
    const distance = Line3_.distance(line);
    expect(distance).toBe(Math.sqrt(27));
    expect(distanceSq).toBe(27);
  });

  it('at', () => {
    const line = Line3_.create(0, 0, 1, 0, 0, 2);
    const point = Vec3.empty();

    Line3_.at_(line, -1, point);
    expect(Vec3.distanceTo(point, Vec3.create(0, 0, 1))).toBe(0);

    Line3_.at_(line, 0, point);
    expect(Vec3.distanceTo(point, Vec3.create(0, 0, 1))).toBe(0);
    Line3_.at_(line, 0.5, point);
    expect(Vec3.distanceTo(point, Vec3.create(0, 0, 1.5))).toBe(0);
    Line3_.at_(line, 1, point);
    expect(Vec3.distanceTo(point, Vec3.create(0, 0, 2))).toBe(0);

    Line3_.at_(line, 2, point);
    expect(Vec3.distanceTo(point, Vec3.create(0, 0, 2))).toBe(0);
  });

  it('closestAt/closestTo/at', () => {
    const line = Line3_.create(0, 0, 0, 0, 0, 1);
    const point = Vec3.empty();

    for (let i = -1; i <= 2; i += 0.05) {
      let step = clamp(i, 0, 1);

      Line3_.at_(line, i, point);

      expect(Line3_.closestAt(line, point)).toBeCloseTo(step, 5);
      expect(Line3_.closestTo(line, point)).toEqual(Vec3.create(0, 0, step));
    }
  });

  it('applyMat4', () => {
    const line = Line3_.create(0, 0, 0, 2, 2, 2);
    const vec4 = new Vector4(2, 2, 2, 1);
    const mat4 = new Matrix4().makeTranslation(2, 3, 4);
    const vec3 = new Vector3(2, 3, 4);

    Line3_.applyMat4(line, mat4);
    expect(line).toEqual({ start: { x: 2, y: 3, z: 4 }, end: { x: 4, y: 5, z: 6 } });

    Line3_.set(line, 0, 0, 0, 2, 2, 2);
    mat4.makeRotationX(Math.PI);

    Line3_.applyMat4(line, mat4);
    Vec4.applyMat4(vec4, mat4);

    expect(line).toEqual({
      start: { x: 0, y: 0, z: 0 },
      end: { x: vec4.x / vec4.w, y: vec4.y / vec4.w, z: vec4.z / vec4.w },
    });

    Line3_.set(line, 0, 0, 0, 2, 2, 2);
    vec4.set(2, 2, 2, 1);
    mat4.setPosition(vec3);

    Line3_.applyMat4(line, mat4);
    Vec3.applyMat4(vec4, mat4);

    expect(line).toEqual({
      start: { x: 2, y: 3, z: 4 },
      end: { x: vec4.x / vec4.w, y: vec4.y / vec4.w, z: vec4.z / vec4.w },
    });
  });

  it('fromEnds', () => {
    const start = Vec3.create(1, 2, 3);
    const end = Vec3.create(4, 5, 6);
    const line = Line3_.fromEnds(start, end);

    expect(line).toEqual({ start, end });
  });
});
