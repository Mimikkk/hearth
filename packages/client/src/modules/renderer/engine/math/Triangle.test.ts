import { describe, expect, it } from 'vitest';
import { Triangle } from './Triangle.js';
import { Vec3 } from './Vector3.ts';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Plane_ } from './Plane.ts';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';

describe('Maths', () => {
  it('Instancing', () => {
    const triangle = Triangle.empty();
    expect(triangle).toEqual({
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 0 },
      c: { x: 0, y: 0, z: 0 },
    });

    Triangle.set(triangle, Vec3.negate(Vec3.create(1, 1, 1)), Vec3.create(1, 1, 1), Vec3.create(2, 2, 2));
    expect(triangle).toEqual({
      a: { x: -1, y: -1, z: -1 },
      b: { x: 1, y: 1, z: 1 },
      c: { x: 2, y: 2, z: 2 },
    });

    const clone = Triangle.clone(triangle);
    expect(clone).not.toBe(triangle);
    expect(clone).toEqual(triangle);
    expect(clone.a).not.toBe(triangle.a);
    expect(clone.b).not.toBe(triangle.b);
    expect(clone.c).not.toBe(triangle.c);

    const copy = Triangle.copy(triangle);
    expect(copy).toEqual(triangle);
    expect(copy).not.toBe(triangle);
    expect(copy.a).toBe(triangle.a);
    expect(copy.b).toBe(triangle.b);
    expect(copy.c).toBe(triangle.c);
  });

  it('fromPointsAndIndices', () => {
    const points = [Vec3.negate(Vec3.create(1, 1, 1)), Vec3.create(1, 1, 1), Vec3.create(2, 2, 2)];
    const triangle = Triangle.fromPointsAndIndices(points, 1, 0, 2);

    expect(triangle).toEqual({
      a: { x: 1, y: 1, z: 1 },
      b: { x: -1, y: -1, z: -1 },
      c: { x: 2, y: 2, z: 2 },
    });
    expect(triangle.a).not.toBe(points[1]);
    expect(triangle.b).not.toBe(points[0]);
    expect(triangle.c).not.toBe(points[2]);
  });

  it('fromAttributeAndIndices', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 1, 1, -1, -1, -1, 2, 2, 2]), 3);

    const triangle = Triangle.fromAttributeAndIndices(attribute, 1, 0, 2);

    expect(triangle).toEqual({
      a: { x: -1, y: -1, z: -1 },
      b: { x: 1, y: 1, z: 1 },
      c: { x: 2, y: 2, z: 2 },
    });
  });

  it('interpolate', () => {
    const from = Triangle.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    const to = Triangle.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));

    const result = Vec3.empty();
    Triangle.interpolate_(from, to, Vec3.create(0, 0, 0), result);
    expect(result).toEqual(Vec3.create(2, 0, 0));

    Triangle.interpolate_(from, to, Vec3.create(1, 0, 0), result);
    expect(result).toEqual(Vec3.create(0, 0, 0));

    Triangle.interpolate_(from, to, Vec3.create(0, 1, 0), result);
    expect(result).toEqual(Vec3.create(0, 0, 2));

    Triangle.interpolate_(from, to, Vec3.create(0.5, 0.5, 0), result);
    expect(result).toEqual(Vec3.create(0, 0, 1));

    Triangle.interpolate_(from, to, Vec3.create(1, 0, 0.5), result);
    expect(result).toEqual(Vec3.create(0, 0, 0));

    Triangle.interpolate_(from, to, Vec3.create(0, 1, 0.5), result);
    expect(result).toEqual(Vec3.create(0, 0, 2));
  });

  it('area', () => {
    let triangle = Triangle.empty();

    expect(Triangle.area(triangle)).toBe(0);

    Triangle.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle.area(triangle)).toBe(0.5);

    Triangle.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle.area(triangle)).toBe(2);

    Triangle.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(3, 0, 0));
    expect(Triangle.area(triangle)).toBe(0);
  });

  it('midpoint', () => {
    let triangle = Triangle.empty();
    const midpoint = Vec3.empty();

    expect(Triangle.midpoint_(triangle, midpoint)).toEqual(Vec3.create(0, 0, 0));

    Triangle.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle.midpoint_(triangle, midpoint)).toEqual(Vec3.create(1 / 3, 1 / 3, 0));

    Triangle.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle.midpoint_(triangle, midpoint)).toEqual(Vec3.create(2 / 3, 0, 2 / 3));
  });

  it('normal', () => {
    let triangle = Triangle.empty();
    const normal = Vec3.empty();

    expect(Triangle.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 0));

    triangle = Triangle.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 1));

    triangle = Triangle.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle.normal_(triangle, normal)).toEqual(Vec3.create(0, 1, 0));
  });

  it('plane', () => {
    let triangle = Triangle.empty();
    const plane = Plane_.empty();
    const normal = Vec3.empty();

    Triangle.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);

    Triangle.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);
    expect(Triangle.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 1));

    Triangle.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));

    Triangle.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);
    expect(Triangle.normal_(triangle, normal)).toEqual(Vec3.create(0, 1, 0));
  });

  it('barycoord', () => {
    let a = Triangle.empty();

    const barycoord = Vec3.empty();
    const midpoint = Vec3.empty();

    expect(Triangle.barycoord_(a, a.a, barycoord) === null).toBe(true);
    expect(Triangle.barycoord_(a, a.b, barycoord) === null).toBe(true);
    expect(Triangle.barycoord_(a, a.c, barycoord) === null).toBe(true);

    a = Triangle.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle.midpoint_(a, midpoint);

    Triangle.barycoord_(a, a.a, barycoord);
    expect(barycoord).toEqual(Vec3.create(1, 0, 0));
    Triangle.barycoord_(a, a.b, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 1, 0));
    Triangle.barycoord_(a, a.c, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 0, 1));
    Triangle.barycoord_(a, midpoint, barycoord);
    expect(Vec3.distanceTo(barycoord, Vec3.create(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);

    a = Triangle.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    Triangle.midpoint_(a, midpoint);

    Triangle.barycoord_(a, a.a, barycoord);
    expect(barycoord).toEqual(Vec3.create(1, 0, 0));
    Triangle.barycoord_(a, a.b, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 1, 0));
    Triangle.barycoord_(a, a.c, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 0, 1));
    Triangle.barycoord_(a, midpoint, barycoord);
    expect(Vec3.distanceTo(barycoord, Vec3.create(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);
  });

  it('containsVec', () => {
    let a = Triangle.empty();
    const midpoint = Vec3.empty();

    expect(Triangle.containsVec(a, a.a)).toBe(false);
    expect(Triangle.containsVec(a, a.b)).toBe(false);
    expect(Triangle.containsVec(a, a.c)).toBe(false);

    a = Triangle.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle.midpoint_(a, midpoint);
    expect(Triangle.containsVec(a, a.a)).toBe(true);
    expect(Triangle.containsVec(a, a.b)).toBe(true);
    expect(Triangle.containsVec(a, a.c)).toBe(true);
    expect(Triangle.containsVec(a, midpoint)).toBe(true);
    expect(Triangle.containsVec(a, Vec3.create(-1, -1, -1))).toBe(false);

    a = Triangle.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    Triangle.midpoint_(a, midpoint);
    expect(Triangle.containsVec(a, a.a)).toBe(true);
    expect(Triangle.containsVec(a, a.b)).toBe(true);
    expect(Triangle.containsVec(a, a.c)).toBe(true);
    expect(Triangle.containsVec(a, midpoint)).toBe(true);
    expect(Triangle.containsVec(a, Vec3.create(-1, -1, -1))).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Box3_.create(1, 1, 1, 2, 2, 2);
    const b = Triangle.create(Vec3.create(1.5, 1.5, 2.5), Vec3.create(2.5, 1.5, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const c = Triangle.create(Vec3.create(1.5, 1.5, 3.5), Vec3.create(3.5, 1.5, 1.5), Vec3.create(1.5, 1.5, 1.5));
    const d = Triangle.create(Vec3.create(1.5, 1.75, 3), Vec3.create(3, 1.75, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const e = Triangle.create(Vec3.create(1.5, 1.8, 3), Vec3.create(3, 1.8, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const f = Triangle.create(Vec3.create(1.5, 2.5, 3), Vec3.create(3, 2.5, 1.5), Vec3.create(1.5, 2.5, 1.5));

    expect(Triangle.intersectsBox(b, a)).toBe(true);
    expect(Triangle.intersectsBox(c, a)).toBe(true);
    expect(Triangle.intersectsBox(d, a)).toBe(true);
    expect(Triangle.intersectsBox(e, a)).toBe(false);
    expect(Triangle.intersectsBox(f, a)).toBe(false);
  });

  it('closestTo', () => {
    const triangle = Triangle.create(Vec3.create(-1, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    const point = Vec3.empty();

    // point lies inside the triangle
    Triangle.closestTo_(triangle, Vec3.create(0, 0.5, 0), point);
    expect(point).toEqual(Vec3.create(0, 0.5, 0));

    // point lies on a vertex
    Triangle.closestTo_(triangle, triangle.a, point);
    expect(point).toEqual(triangle.a);

    Triangle.closestTo_(triangle, triangle.b, point);
    expect(point).toEqual(triangle.b);

    Triangle.closestTo_(triangle, triangle.c, point);
    expect(point).toEqual(triangle.c);

    // point lies on an edge
    Triangle.closestTo_(triangle, Vec3.create(0, 0, 0), point);
    expect(point).toEqual(Vec3.create(0, 0, 0));

    // point lies outside the triangle
    Triangle.closestTo_(triangle, Vec3.create(-2, 0, 0), point);
    expect(point).toEqual(Vec3.create(-1, 0, 0));

    Triangle.closestTo_(triangle, Vec3.create(2, 0, 0), point);
    expect(point).toEqual(Vec3.create(1, 0, 0));

    Triangle.closestTo_(triangle, Vec3.create(0, 2, 0), point);
    expect(point).toEqual(Vec3.create(0, 1, 0));

    Triangle.closestTo_(triangle, Vec3.create(0, -2, 0), point);
    expect(point).toEqual(Vec3.create(0, 0, 0));
  });

  it('isFrontFacing', () => {
    const triangle = Triangle.empty();
    const direction = Vec3.empty();
    expect(Triangle.isFrontFacing(triangle, direction)).toBe(false);

    Triangle.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Vec3.set(direction, 0, 0, -1);
    expect(Triangle.isFrontFacing(triangle, direction)).toBe(true);

    Triangle.set(triangle, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0), Vec3.create(1, 0, 0));
    expect(Triangle.isFrontFacing(triangle, direction)).toBe(false);
  });
});
