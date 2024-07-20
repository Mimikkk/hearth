import { describe, expect, it } from 'vitest';
import { Triangle_ } from './Triangle.js';
import { Vec3 } from './Vector3.ts';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Plane_ } from './Plane.ts';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';

describe('Maths', () => {
  it.only('Instancing', () => {
    const triangle = Triangle_.empty();
    expect(triangle).toEqual({
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 0 },
      c: { x: 0, y: 0, z: 0 },
    });

    Triangle_.set(triangle, Vec3.negate(Vec3.create(1, 1, 1)), Vec3.create(1, 1, 1), Vec3.create(2, 2, 2));
    expect(triangle).toEqual({
      a: { x: -1, y: -1, z: -1 },
      b: { x: 1, y: 1, z: 1 },
      c: { x: 2, y: 2, z: 2 },
    });

    const clone = Triangle_.clone(triangle);
    expect(clone).not.toBe(triangle);
    expect(clone).toEqual(triangle);
    expect(clone.a).not.toBe(triangle.a);
    expect(clone.b).not.toBe(triangle.b);
    expect(clone.c).not.toBe(triangle.c);

    const copy = Triangle_.copy(triangle);
    expect(copy).toEqual(triangle);
    expect(copy).not.toBe(triangle);
    expect(copy.a).toBe(triangle.a);
    expect(copy.b).toBe(triangle.b);
    expect(copy.c).toBe(triangle.c);
  });

  it.only('fromPointsAndIndices', () => {
    const points = [Vec3.negate(Vec3.create(1, 1, 1)), Vec3.create(1, 1, 1), Vec3.create(2, 2, 2)];
    const triangle = Triangle_.fromPointsAndIndices(points, 1, 0, 2);

    expect(triangle).toEqual({
      a: { x: 1, y: 1, z: 1 },
      b: { x: -1, y: -1, z: -1 },
      c: { x: 2, y: 2, z: 2 },
    });
    expect(triangle.a).not.toBe(points[1]);
    expect(triangle.b).not.toBe(points[0]);
    expect(triangle.c).not.toBe(points[2]);
  });

  it.only('fromAttributeAndIndices', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 1, 1, -1, -1, -1, 2, 2, 2]), 3);

    const triangle = Triangle_.fromAttributeAndIndices(attribute, 1, 0, 2);

    expect(triangle).toEqual({
      a: { x: -1, y: -1, z: -1 },
      b: { x: 1, y: 1, z: 1 },
      c: { x: 2, y: 2, z: 2 },
    });
  });

  it('interpolate', () => {});

  it.only('area', () => {
    let triangle = Triangle_.empty();

    expect(Triangle_.area(triangle)).toBe(0);

    Triangle_.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle_.area(triangle)).toBe(0.5);

    Triangle_.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle_.area(triangle)).toBe(2);

    Triangle_.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(3, 0, 0));
    expect(Triangle_.area(triangle)).toBe(0);
  });

  it.only('midpoint', () => {
    let triangle = Triangle_.empty();
    const midpoint = Vec3.empty();

    expect(Triangle_.midpoint_(triangle, midpoint)).toEqual(Vec3.create(0, 0, 0));

    Triangle_.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle_.midpoint_(triangle, midpoint)).toEqual(Vec3.create(1 / 3, 1 / 3, 0));

    Triangle_.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle_.midpoint_(triangle, midpoint)).toEqual(Vec3.create(2 / 3, 0, 2 / 3));
  });

  it.only('normal', () => {
    let triangle = Triangle_.empty();
    const normal = Vec3.empty();

    expect(Triangle_.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 0));

    triangle = Triangle_.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expect(Triangle_.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 1));

    triangle = Triangle_.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    expect(Triangle_.normal_(triangle, normal)).toEqual(Vec3.create(0, 1, 0));
  });

  it.only('plane', () => {
    let triangle = Triangle_.empty();
    const plane = Plane_.empty();
    const normal = Vec3.empty();

    Triangle_.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);

    Triangle_.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle_.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);
    expect(Triangle_.normal_(triangle, normal)).toEqual(Vec3.create(0, 0, 1));

    Triangle_.set(triangle, Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));

    Triangle_.plane_(triangle, plane);
    expect(Plane_.distanceToVec(plane, triangle.a)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.b)).toBe(0);
    expect(Plane_.distanceToVec(plane, triangle.c)).toBe(0);
    expect(Triangle_.normal_(triangle, normal)).toEqual(Vec3.create(0, 1, 0));
  });

  it.only('barycoord', () => {
    let a = Triangle_.empty();

    const barycoord = Vec3.empty();
    const midpoint = Vec3.empty();

    expect(Triangle_.barycoord_(a, a.a, barycoord) === null).toBe(true);
    expect(Triangle_.barycoord_(a, a.b, barycoord) === null).toBe(true);
    expect(Triangle_.barycoord_(a, a.c, barycoord) === null).toBe(true);

    a = Triangle_.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle_.midpoint_(a, midpoint);

    Triangle_.barycoord_(a, a.a, barycoord);
    expect(barycoord).toEqual(Vec3.create(1, 0, 0));
    Triangle_.barycoord_(a, a.b, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 1, 0));
    Triangle_.barycoord_(a, a.c, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 0, 1));
    Triangle_.barycoord_(a, midpoint, barycoord);
    expect(Vec3.distanceTo(barycoord, Vec3.create(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);

    a = Triangle_.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    Triangle_.midpoint_(a, midpoint);

    Triangle_.barycoord_(a, a.a, barycoord);
    expect(barycoord).toEqual(Vec3.create(1, 0, 0));
    Triangle_.barycoord_(a, a.b, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 1, 0));
    Triangle_.barycoord_(a, a.c, barycoord);
    expect(barycoord).toEqual(Vec3.create(0, 0, 1));
    Triangle_.barycoord_(a, midpoint, barycoord);
    expect(Vec3.distanceTo(barycoord, Vec3.create(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);
  });

  it.only('containsVec', () => {
    let a = Triangle_.empty();
    const midpoint = Vec3.empty();

    expect(Triangle_.containsVec(a, a.a)).toBe(false);
    expect(Triangle_.containsVec(a, a.b)).toBe(false);
    expect(Triangle_.containsVec(a, a.c)).toBe(false);

    a = Triangle_.create(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Triangle_.midpoint_(a, midpoint);
    expect(Triangle_.containsVec(a, a.a)).toBe(true);
    expect(Triangle_.containsVec(a, a.b)).toBe(true);
    expect(Triangle_.containsVec(a, a.c)).toBe(true);
    expect(Triangle_.containsVec(a, midpoint)).toBe(true);
    expect(Triangle_.containsVec(a, Vec3.create(-1, -1, -1))).toBe(false);

    a = Triangle_.create(Vec3.create(2, 0, 0), Vec3.create(0, 0, 0), Vec3.create(0, 0, 2));
    Triangle_.midpoint_(a, midpoint);
    expect(Triangle_.containsVec(a, a.a)).toBe(true);
    expect(Triangle_.containsVec(a, a.b)).toBe(true);
    expect(Triangle_.containsVec(a, a.c)).toBe(true);
    expect(Triangle_.containsVec(a, midpoint)).toBe(true);
    expect(Triangle_.containsVec(a, Vec3.create(-1, -1, -1))).toBe(false);
  });

  it.only('intersectsBox', () => {
    const a = Box3_.create(1, 1, 1, 2, 2, 2);
    const b = Triangle_.create(Vec3.create(1.5, 1.5, 2.5), Vec3.create(2.5, 1.5, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const c = Triangle_.create(Vec3.create(1.5, 1.5, 3.5), Vec3.create(3.5, 1.5, 1.5), Vec3.create(1.5, 1.5, 1.5));
    const d = Triangle_.create(Vec3.create(1.5, 1.75, 3), Vec3.create(3, 1.75, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const e = Triangle_.create(Vec3.create(1.5, 1.8, 3), Vec3.create(3, 1.8, 1.5), Vec3.create(1.5, 2.5, 1.5));
    const f = Triangle_.create(Vec3.create(1.5, 2.5, 3), Vec3.create(3, 2.5, 1.5), Vec3.create(1.5, 2.5, 1.5));

    expect(Triangle_.intersectsBox(b, a)).toBe(true);
    expect(Triangle_.intersectsBox(c, a)).toBe(true);
    expect(Triangle_.intersectsBox(d, a)).toBe(true);
    expect(Triangle_.intersectsBox(e, a)).toBe(false);
    expect(Triangle_.intersectsBox(f, a)).toBe(false);
  });

  it('closestTo', () => {
    const a = Triangle_.create(Vec3.create(-1, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    const point = Vec3.create();

    // point lies inside the triangle
    a.closestPointToPoint(Vec3.create(0, 0.5, 0), point);
    expect(point.equals(Vec3.create(0, 0.5, 0))).toBe(true);

    // point lies on a vertex
    a.closestPointToPoint(a.a, point);
    expect(point.equals(a.a)).toBe(true);

    a.closestPointToPoint(a.b, point);
    expect(point.equals(a.b)).toBe(true);

    a.closestPointToPoint(a.c, point);
    expect(point.equals(a.c)).toBe(true);

    // point lies on an edge
    a.closestPointToPoint(zero3.clone(), point);
    expect(point.equals(zero3.clone())).toBe(true);

    // point lies outside the triangle
    a.closestPointToPoint(Vec3.create(-2, 0, 0), point);
    expect(point.equals(Vec3.create(-1, 0, 0))).toBe(true);

    a.closestPointToPoint(Vec3.create(2, 0, 0), point);
    expect(point.equals(Vec3.create(1, 0, 0))).toBe(true);

    a.closestPointToPoint(Vec3.create(0, 2, 0), point);
    expect(point.equals(Vec3.create(0, 1, 0))).toBe(true);

    a.closestPointToPoint(Vec3.create(0, -2, 0), point);
    expect(point.equals(Vec3.create(0, 0, 0))).toBe(true);
  });

  it.only('isFrontFacing', () => {
    const triangle = Triangle_.empty();
    const direction = Vec3.empty();
    expect(Triangle_.isFrontFacing(triangle, direction)).toBe(false);

    Triangle_.set(triangle, Vec3.create(0, 0, 0), Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    Vec3.set(direction, 0, 0, -1);
    expect(Triangle_.isFrontFacing(triangle, direction)).toBe(true);

    Triangle_.set(triangle, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0), Vec3.create(1, 0, 0));
    expect(Triangle_.isFrontFacing(triangle, direction)).toBe(false);
  });
});
