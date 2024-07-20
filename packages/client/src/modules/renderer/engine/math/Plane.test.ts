import { Plane } from './Plane.js';
import { describe, it, expect } from 'vitest';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Line3 } from '@modules/renderer/engine/math/Line3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
const expectCloseTo = (a: Plane, b: Plane, epsilon: number = Number.EPSILON) => {
  expect(a.normal.x).toBeCloseTo(b.normal.x, epsilon);
  expect(a.normal.y).toBeCloseTo(b.normal.y, epsilon);
  expect(a.normal.z).toBeCloseTo(b.normal.z, epsilon);
  expect(a.constant).toBeCloseTo(b.constant, epsilon);
};

describe('Math - Plane', () => {
  it('Instancing', () => {
    let plane = Plane.new();
    expect(plane).toEqual(Plane.fromParams(1, 0, 0, 0));

    plane = Plane.fromParams(1, 2, 3, 4);
    expect(plane).toEqual(Plane.fromParams(1, 2, 3, 4));

    const clone = Plane.clone(plane);
    expect(clone).not.toBe(plane);
    expect(clone).toEqual(Plane.fromParams(1, 2, 3, 4));

    plane.setParams(5, 6, 7, 8);
    expect(plane).toEqual(Plane.fromParams(5, 6, 7, 8));

    expect(plane.equals(clone)).toBe(false);
    expect(Plane.is(plane)).toBe(true);
    expect(Plane.is({})).toBe(false);
  });

  it('fromNormalAndCoplanar', () => {
    const plane = Plane.fromNormalAndCoplanar(Vec3.new(1, 0, 0), Vec3.new(0, 0, 0));
    expectCloseTo(plane, Plane.fromParams(1, 0, 0, 0));

    const plane2 = Plane.fromNormalAndCoplanar(Vec3.new(0, 1, 0), Vec3.new(0, 0, 0));
    expectCloseTo(plane2, Plane.fromParams(0, 1, 0, 0));

    const plane3 = Plane.fromNormalAndCoplanar(Vec3.new(0, 0, 1), Vec3.new(0, 0, 0));
    expectCloseTo(plane3, Plane.fromParams(0, 0, 1, 0));

    const plane4 = Plane.fromNormalAndCoplanar(Vec3.new(1, 1, 1), Vec3.new(0, 0, 0));
    expectCloseTo(plane4, Plane.fromParams(1, 1, 1, 0));

    const plane5 = Plane.fromNormalAndCoplanar(Vec3.new(1, 1, 1), Vec3.new(1, 1, 1));
    expectCloseTo(plane5, Plane.fromParams(1, 1, 1, -3));
  });

  it('fromCoplanar', () => {
    const v1 = Vec3.new(2.0, 0.5, 0.25);
    const v2 = Vec3.new(2.0, -0.5, 1.25);
    const v3 = Vec3.new(2.0, -3.5, 2.2);

    const plane = Plane.fromCoplanar(v1, v2, v3);
    expectCloseTo(plane, Plane.fromParams(1, 0, 0, -2));
  });

  it('normalize', () => {
    const plane = Plane.fromParams(1, 1, 1, 1);
    plane.normalize();
    expectCloseTo(plane, Plane.fromParams(0.57735, 0.57735, 0.57735, 0.57735));
  });

  it('distanceTo', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const point = Vec3.new(1, 1, 1);
    expect(plane.distanceTo(point)).toBe(1);

    const plane2 = Plane.fromParams(1, 0, 0, 1);
    expect(plane2.distanceTo(point)).toBe(2);
  });

  it('distanceToSphere', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const sphere = Sphere.fromParams(2, 0, 0, 0);

    expect(plane.distanceToSphere(sphere)).toBe(2);
    sphere.radius = 2;

    expect(plane.distanceToSphere(sphere)).toBe(0);
  });

  it('negate', () => {
    const plane = Plane.fromParams(1, 2, 3, 4);
    plane.negate();
    expectCloseTo(plane, Plane.fromParams(-1, -2, -3, -4));
  });

  it('intersectLine', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const line = Line3.fromParams(0, 0, 0, 1, 1, 1);

    const result = Vec3.new();
    plane.intersectLine(line, result);

    expect(result).toEqual(Vec3.new(0, 0, 0));

    const plane2 = Plane.fromParams(1, 0, 0, 1);

    expect(plane2.intersectLine(line)).toBe(null);
  });

  it('intersectsLine', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const line = Line3.fromParams(0, 0, 0, 1, 1, 1);

    expect(plane.intersectsLine(line)).toBe(true);

    const plane2 = Plane.fromParams(1, 0, 0, 1);

    expect(plane2.intersectsLine(line)).toBe(false);
  });

  it('project', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const point = Vec3.new(1, 1, 1);

    const result = Vec3.new();
    plane.project(point, result);

    expect(result).toEqual(Vec3.new(0, 1, 1));
  });

  it('intersectsBox', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const box = Box3.fromParams(0, 0, 0, 2, 2, 2);

    expect(plane.intersectsBox(box)).toBe(true);

    const plane2 = Plane.fromParams(1, 0, 0, 2);

    expect(plane2.intersectsBox(box)).toBe(false);
  });

  it('intersectsSphere', () => {
    const a = Sphere.fromParams(0, 0, 0, 1);
    const b = Plane.fromParams(0, 1, 0, 1);
    const c = Plane.fromParams(0, 1, 0, 1.25);

    expect(b.intersectsSphere(a)).toBe(true);
    expect(c.intersectsSphere(a)).toBe(false);
    expect(c.intersectsSphere(a)).toBe(false);
  });

  it('coplanar', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const point = Vec3.new();
    plane.coplanar(point);

    expect(plane.distanceTo(point)).toBe(0);

    const plane2 = Plane.fromParams(0, 1, 0, -1);
    plane2.coplanar(point);
    expect(plane2.distanceTo(point)).toBe(0);
  });

  it('equals', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const plane2 = Plane.fromParams(1, 0, 0, 0);

    expect(plane.equals(plane2)).toBe(true);

    const plane3 = Plane.fromParams(0, 1, 0, 0);
    expect(plane.equals(plane3)).toBe(false);
  });

  it('applyMat4', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);

    const mat4 = Mat4.rotationY(Math.PI / 2);

    plane.applyMat4(mat4);

    expectCloseTo(plane, Plane.fromParams(0, 0, -1, 0));
  });

  it('translate', () => {
    const plane = Plane.fromParams(1, 0, 0, 0);
    const offset = Vec3.new(1, 0, 0);

    plane.translate(offset);

    expectCloseTo(plane, Plane.fromParams(1, 0, 0, -1));
  });
});
