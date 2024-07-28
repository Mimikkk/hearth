import { Ray } from './Ray.js';
import { describe, expect, it } from 'vitest';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Line3 } from '@modules/renderer/engine/math/Line3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Triangle } from '@modules/renderer/engine/math/Triangle.js';

const expectVecCloseTo = (a: Vec3, b: Vec3, epsilon: number = Number.EPSILON) => {
  expect(a.x).toBeCloseTo(b.x, epsilon);
  expect(a.y).toBeCloseTo(b.y, epsilon);
  expect(a.z).toBeCloseTo(b.z, epsilon);
};

const expectCloseTo = (a: Ray, b: Ray, epsilon: number = Number.EPSILON) => {
  expectVecCloseTo(a.origin, b.origin, epsilon);
  expectVecCloseTo(a.direction, b.direction, epsilon);
};

describe('Math - Ray', () => {
  it('Instancing', () => {
    let ray = Ray.new();
    expect(ray).toEqual(Ray.fromParams(0, 0, 0, 0, 0, -1));

    ray = Ray.fromParams(1, 2, 3, 4, 5, 6);
    expect(ray).toEqual(Ray.fromParams(1, 2, 3, 4, 5, 6));

    const clone = Ray.clone(ray);
    expect(clone).not.toBe(ray);
    expect(clone).toEqual(Ray.fromParams(1, 2, 3, 4, 5, 6));

    ray.setParams(5, 6, 7, 8, 9, 10);
    expect(ray).toEqual(Ray.fromParams(5, 6, 7, 8, 9, 10));

    expect(ray.equals(clone)).toBe(false);
    expect(Ray.is(ray)).toBe(true);
    expect(Ray.is({})).toBe(false);
  });

  it('at', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const point = ray.at(2);
    expect(point).toEqual(Vec3.new(2, 0, 0));
  });

  it('lookAt', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    ray.lookAt(Vec3.new(0, 1, 0));
    expectCloseTo(ray, Ray.fromParams(0, 0, 0, 0, 1, 0));
  });

  it('distanceTo', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const point = Vec3.new(0, 1, 0);
    expect(ray.distanceTo(point)).toBe(1);
  });

  it('distanceSqToLine', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const line = Line3.fromParams(0, 1, 0, 0, 1, 1);
    expect(ray.distanceSqToLine(line)).toBe(1);
  });

  it('intersectSphere', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const sphere = Sphere.fromParams(0, 0, 0, 1);
    const intersection = ray.intersectSphere(sphere);
    expectVecCloseTo(intersection!, Vec3.new(0, 0, -1));
  });

  it('intersectPlane', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const plane = Plane.fromParams(0, 0, 1, 0);
    const intersection = ray.intersectPlane(plane);
    expectVecCloseTo(intersection!, Vec3.new(0, 0, 0));
  });

  it('intersectBox', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const box = Box3.fromParams(-1, -1, -1, 1, 1, 1);
    const intersection = ray.intersectBox(box);
    expectVecCloseTo(intersection!, Vec3.new(0, 0, -1));
  });

  it('intersectTriangle', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const triangle = Triangle.new(Vec3.new(-1, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    const intersection = ray.intersectTriangle(triangle, false);
    expectVecCloseTo(intersection!, Vec3.new(0, 0, 0));
  });

  it('applyMat4', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const mat4 = new Mat4().asRotationY(Math.PI / 2);
    ray.applyMat4(mat4);
    expectCloseTo(ray, Ray.fromParams(0, 0, 0, 0, 0, -1));
  });

  it('equals', () => {
    const ray1 = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const ray2 = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const ray3 = Ray.fromParams(1, 0, 0, 1, 0, 0);

    expect(ray1.equals(ray2)).toBe(true);
    expect(ray1.equals(ray3)).toBe(false);
  });

  it('recast', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    ray.recast(2);
    expectCloseTo(ray, Ray.fromParams(2, 0, 0, 1, 0, 0));
  });

  it('closestTo', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const point = Vec3.new(1, 1, 0);
    const closest = ray.closestTo(point);
    expectVecCloseTo(closest, Vec3.new(1, 0, 0));
  });

  it('intersectsSphere', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const sphere = Sphere.fromParams(0, 0, 0, 1);
    expect(ray.intersectsSphere(sphere)).toBe(true);

    const farSphere = Sphere.fromParams(10, 10, 10, 1);
    expect(ray.intersectsSphere(farSphere)).toBe(false);
  });

  it('intersectsPlane', () => {
    const a = Ray.fromParams(1, 1, 1, 0, 0, 1);


    const b = Plane.fromNormalAndCoplanar(Vec3.new(0, 0, 1), Vec3.new(1, 1, 2));
    expect(a.intersectsPlane(b)).toBe(true);


    const c = Plane.fromNormalAndCoplanar(Vec3.new(0, 0, 1), Vec3.new(1, 1, 1));
    expect(a.intersectsPlane(c)).toBe(true);


    const d = Plane.fromNormalAndCoplanar(Vec3.new(0, 0, 1), Vec3.new(1, 1, 0));
    expect(a.intersectsPlane(d)).toBe(false);


    const e = Plane.fromNormalAndCoplanar(Vec3.new(1, 0, 0), Vec3.new(1, 1, 1));
    expect(a.intersectsPlane(e)).toBe(true);


    const f = Plane.fromNormalAndCoplanar(Vec3.new(1, 0, 0), Vec3.new(0, 0, 0));
    expect(a.intersectsPlane(f)).toBe(false);
  });

  it('intersectsBox', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const box = Box3.fromParams(-1, -1, -1, 1, 1, 1);
    expect(ray.intersectsBox(box)).toBe(true);

    const farBox = Box3.fromParams(10, 10, 10, 11, 11, 11);
    expect(ray.intersectsBox(farBox)).toBe(false);
  });

  it('distanceToPlane', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const plane = Plane.fromParams(0, 0, 1, 0);
    expect(ray.distanceToPlane(plane)).toBe(5);
    //
    const behindPlane = Plane.fromParams(0, 0, -1, 5);
    expect(ray.distanceToPlane(behindPlane)).toBe(10);

    const parallelPlane = Plane.fromParams(1, 0, 0, 0);
    expect(ray.distanceToPlane(parallelPlane)).toBe(0);

    const touchingPlane = Plane.fromParams(0, 0, 1, 5);
    expect(ray.distanceToPlane(touchingPlane)).toBe(-0);
  });

  it('distanceSqToLine/parallel lines', () => {
    const ray = Ray.fromParams(0, 0, 0, 1, 0, 0);
    const parallelLine = Line3.fromParams(0, 1, 0, 1, 1, 0);
    expect(ray.distanceSqToLine(parallelLine)).toBe(1);
  });

  it('intersectTriangle/backface culling', () => {
    const ray = Ray.fromParams(0, 0, -5, 0, 0, 1);
    const triangle = Triangle.new(Vec3.new(-1, 0, 0), Vec3.new(1, 0, 0), Vec3.new(0, 1, 0));
    const intersectionWithCulling = ray.intersectTriangle(triangle, true);
    expect(intersectionWithCulling).toBeNull();

    const backfaceRay = Ray.fromParams(0, 0, 5, 0, 0, -1);
    const intersectionCulled = backfaceRay.intersectTriangle(triangle, true);
    expect(intersectionCulled).not.toBeNull();
  });
});
