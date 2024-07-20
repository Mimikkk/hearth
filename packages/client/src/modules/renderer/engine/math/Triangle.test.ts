import { describe, expect, it } from 'vitest';
import { Triangle } from './Triangle.js';
import { Vec3 } from './Vec3.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Plane } from './Plane.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';

describe('Math - Triangle', () => {
  it('Instancing', () => {
    const triangle = Triangle.empty();
    expect(triangle).toEqual({
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 0 },
      c: { x: 0, y: 0, z: 0 },
    });

    triangle.set(Vec3.new(-1, -1, -1), Vec3.new(1, 1, 1), Vec3.new(2, 2, 2));
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
  });

  it('fromPointsAndIndices', () => {
    const points = [Vec3.new(-1, -1, -1), Vec3.new(1, 1, 1), Vec3.new(2, 2, 2)];
    const triangle = Triangle.fromCoords(points, 1, 0, 2);

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

    const triangle = Triangle.fromAttribute(attribute, 1, 0, 2);

    expect(triangle).toEqual({
      a: { x: -1, y: -1, z: -1 },
      b: { x: 1, y: 1, z: 1 },
      c: { x: 2, y: 2, z: 2 },
    });
  });

  it('interpolate', () => {
    const from = Triangle.new(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    const to = Triangle.new(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));

    const result = Vec3.new();
    from.interpolate(to, Vec3.new(0, 0, 0), result);
    expect(result).toEqual(Vec3.new(2, 0, 0));

    from.interpolate(to, Vec3.new(1, 0, 0), result);
    expect(result).toEqual(Vec3.new(0, 0, 0));

    from.interpolate(to, Vec3.new(0, 1, 0), result);
    expect(result).toEqual(Vec3.new(0, 0, 2));

    from.interpolate(to, Vec3.new(0.5, 0.5, 0), result);
    expect(result).toEqual(Vec3.new(0, 0, 1));

    from.interpolate(to, Vec3.new(1, 0, 0.5), result);
    expect(result).toEqual(Vec3.new(0, 0, 0));

    from.interpolate(to, Vec3.new(0, 1, 0.5), result);
    expect(result).toEqual(Vec3.new(0, 0, 2));
  });

  it('area', () => {
    let triangle = Triangle.empty();

    expect(triangle.area()).toBe(0);

    triangle.set(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    expect(triangle.area()).toBe(0.5);

    triangle.set(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));
    expect(triangle.area()).toBe(2);

    triangle.set(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(3, 0, 0));
    expect(triangle.area()).toBe(0);
  });

  it('midpoint', () => {
    let triangle = Triangle.empty();
    const midpoint = Vec3.empty();

    expect(triangle.midpoint(midpoint)).toEqual(Vec3.new(0, 0, 0));

    triangle.set(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    expect(triangle.midpoint(midpoint)).toEqual(Vec3.new(1 / 3, 1 / 3, 0));

    triangle.set(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));
    expect(triangle.midpoint(midpoint)).toEqual(Vec3.new(2 / 3, 0, 2 / 3));
  });

  it('normal', () => {
    let triangle = Triangle.empty();
    const normal = Vec3.empty();

    expect(triangle.normal(normal)).toEqual(Vec3.new(0, 0, 0));

    triangle = Triangle.new(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    expect(triangle.normal(normal)).toEqual(Vec3.new(0, 0, 1));

    triangle = Triangle.new(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));
    expect(triangle.normal(normal)).toEqual(Vec3.new(0, 1, 0));
  });

  it('plane', () => {
    let triangle = Triangle.new();
    const plane = Plane.new();
    const normal = Vec3.new();

    triangle.plane(plane);
    expect(plane.distanceTo(triangle.a)).toBe(0);
    expect(plane.distanceTo(triangle.b)).toBe(0);
    expect(plane.distanceTo(triangle.c)).toBe(0);

    triangle.set(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    triangle.plane(plane);
    expect(plane.distanceTo(triangle.a)).toBe(0);
    expect(plane.distanceTo(triangle.b)).toBe(0);
    expect(plane.distanceTo(triangle.c)).toBe(0);
    expect(triangle.normal(normal)).toEqual(Vec3.new(0, 0, 1));

    triangle.set(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));

    triangle.plane(plane);
    expect(plane.distanceTo(triangle.a)).toBe(0);
    expect(plane.distanceTo(triangle.b)).toBe(0);
    expect(plane.distanceTo(triangle.c)).toBe(0);
    expect(triangle.normal(normal)).toEqual(Vec3.new(0, 1, 0));
  });

  it('barycoord', () => {
    let a = Triangle.empty();

    const barycoord = Vec3.empty();
    const midpoint = Vec3.empty();

    expect(a.barycoord(a.a, barycoord) === null).toBe(true);
    expect(a.barycoord(a.b, barycoord) === null).toBe(true);
    expect(a.barycoord(a.c, barycoord) === null).toBe(true);

    a = Triangle.new(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    a.midpoint(midpoint);

    a.barycoord(a.a, barycoord);
    expect(barycoord).toEqual(Vec3.new(1, 0, 0));
    a.barycoord(a.b, barycoord);
    expect(barycoord).toEqual(Vec3.new(0, 1, 0));
    a.barycoord(a.c, barycoord);
    expect(barycoord).toEqual(Vec3.new(0, 0, 1));
    a.barycoord(midpoint, barycoord);
    expect(barycoord.distanceTo(Vec3.new(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);

    a = Triangle.new(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));
    a.midpoint(midpoint);

    a.barycoord(a.a, barycoord);
    expect(barycoord).toEqual(Vec3.new(1, 0, 0));
    a.barycoord(a.b, barycoord);
    expect(barycoord).toEqual(Vec3.new(0, 1, 0));
    a.barycoord(a.c, barycoord);
    expect(barycoord).toEqual(Vec3.new(0, 0, 1));
    a.barycoord(midpoint, barycoord);
    expect(barycoord.distanceTo(Vec3.new(1 / 3, 1 / 3, 1 / 3))).toBeCloseTo(0);
  });

  it('containsVec', () => {
    let a = Triangle.empty();
    const midpoint = Vec3.empty();

    expect(a.containsVec(a.a)).toBe(false);
    expect(a.containsVec(a.b)).toBe(false);
    expect(a.containsVec(a.c)).toBe(false);

    a = Triangle.new(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    a.midpoint(midpoint);
    expect(a.containsVec(a.a)).toBe(true);
    expect(a.containsVec(a.b)).toBe(true);
    expect(a.containsVec(a.c)).toBe(true);
    expect(a.containsVec(midpoint)).toBe(true);
    expect(a.containsVec(Vec3.new(-1, -1, -1))).toBe(false);

    a = Triangle.new(Vec3.new(2, 0, 0), Vec3.new(0, 0, 0), Vec3.new(0, 0, 2));
    a.midpoint(midpoint);
    expect(a.containsVec(a.a)).toBe(true);
    expect(a.containsVec(a.b)).toBe(true);
    expect(a.containsVec(a.c)).toBe(true);
    expect(a.containsVec(midpoint)).toBe(true);
    expect(a.containsVec(Vec3.new(-1, -1, -1))).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Box3.fromParams(1, 1, 1, 2, 2, 2);
    const b = Triangle.new(Vec3.new(1.5, 1.5, 2.5), Vec3.new(2.5, 1.5, 1.5), Vec3.new(1.5, 2.5, 1.5));
    const c = Triangle.new(Vec3.new(1.5, 1.5, 3.5), Vec3.new(3.5, 1.5, 1.5), Vec3.new(1.5, 1.5, 1.5));
    const d = Triangle.new(Vec3.new(1.5, 1.75, 3), Vec3.new(3, 1.75, 1.5), Vec3.new(1.5, 2.5, 1.5));
    const e = Triangle.new(Vec3.new(1.5, 1.8, 3), Vec3.new(3, 1.8, 1.5), Vec3.new(1.5, 2.5, 1.5));
    const f = Triangle.new(Vec3.new(1.5, 2.5, 3), Vec3.new(3, 2.5, 1.5), Vec3.new(1.5, 2.5, 1.5));

    expect(b.intersectsBox(a)).toBe(true);
    expect(c.intersectsBox(a)).toBe(true);
    expect(d.intersectsBox(a)).toBe(true);
    expect(e.intersectsBox(a)).toBe(false);
    expect(f.intersectsBox(a)).toBe(false);
  });

  it('closestTo', () => {
    const triangle = Triangle.new(Vec3.new(-1, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    const point = Vec3.empty();

    // point lies inside the triangle
    triangle.closestTo(Vec3.new(0, 0.5, 0), point);
    expect(point).toEqual(Vec3.new(0, 0.5, 0));

    // point lies on a vertex
    triangle.closestTo(triangle.a, point);
    expect(point).toEqual(triangle.a);

    triangle.closestTo(triangle.b, point);
    expect(point).toEqual(triangle.b);

    triangle.closestTo(triangle.c, point);
    expect(point).toEqual(triangle.c);

    // point lies on an edge
    triangle.closestTo(Vec3.new(0, 0, 0), point);
    expect(point).toEqual(Vec3.new(0, 0, 0));

    // point lies outside the triangle
    triangle.closestTo(Vec3.new(-2, 0, 0), point);
    expect(point).toEqual(Vec3.new(-1, 0, 0));

    triangle.closestTo(Vec3.new(2, 0, 0), point);
    expect(point).toEqual(Vec3.new(1, 0, 0));

    triangle.closestTo(Vec3.new(0, 2, 0), point);
    expect(point).toEqual(Vec3.new(0, 1, 0));

    triangle.closestTo(Vec3.new(0, -2, 0), point);
    expect(point).toEqual(Vec3.new(0, 0, 0));
  });

  it('isFrontFacing', () => {
    const triangle = Triangle.empty();
    const direction = Vec3.empty();
    expect(triangle.isFrontFacing(direction)).toBe(false);

    triangle.set(Vec3.new(0, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    direction.set(0, 0, -1);
    expect(triangle.isFrontFacing(direction)).toBe(true);

    triangle.set(Vec3.new(0, 0, 0), Vec3.new(0, 1, 0), Vec3.new(1, 0, 0));
    expect(triangle.isFrontFacing(direction)).toBe(false);
  });
});
