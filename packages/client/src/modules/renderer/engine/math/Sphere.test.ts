import { describe, expect, it } from 'vitest';
import { Sphere } from './Sphere.js';
import { Vec3 } from './Vec3.js';
import { Box3 } from './Box3.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

const vec3 = Vec3.new;

const expectWithin = (actual: Sphere, expected: Sphere, epsilon = Number.EPSILON) => {
  expect(Math.abs(actual.center.x - expected.center.x)).within(-epsilon, epsilon);
  expect(Math.abs(actual.center.y - expected.center.y)).within(-epsilon, epsilon);
  expect(Math.abs(actual.center.z - expected.center.z)).within(-epsilon, epsilon);
  expect(Math.abs(actual.radius - expected.radius)).within(-epsilon, epsilon);
};

describe('Math - Sphere', () => {
  it('Instancing', () => {
    const a = Sphere.empty();
    expect(a.center).toEqual(vec3(0, 0, 0));
    expect(a.radius).toBe(-1);

    const b = Sphere.fromParams(1, 2, 3, 4);
    expect(b.center).toEqual(vec3(1, 2, 3));
    expect(b.radius).toBe(4);

    const cloned = Sphere.clone(b);
    expect(cloned.center).not.toBe(b.center);
    expect(cloned.radius).toEqual(b.radius);
    expect(cloned.center).toEqual(b.center);
  });

  it('is/equals', () => {
    const a = Sphere.fromParams(1, 2, 3, 4);
    const b = Sphere.fromParams(1, 2, 3, 4);
    const c = Sphere.fromParams(1, 2, 3, 5);
    const vec = vec3(0, 0, 0);

    expect(Sphere.is(a)).toBe(true);
    expect(Sphere.is(vec)).toBe(false);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('fromVecs', () => {
    const points = [
      vec3(1, 1, 0),
      vec3(1, 1, 0),
      vec3(1, 1, 0),
      vec3(1, 1, 0),
      vec3(1, 1, 0),
      vec3(0.8660253882408142, 0.5, 0),
      vec3(-0, 0.5, 0.8660253882408142),
      vec3(1.8660253882408142, 0.5, 0),
      vec3(0, 0.5, -0.8660253882408142),
      vec3(0.8660253882408142, 0.5, -0),
      vec3(0.8660253882408142, -0.5, 0),
      vec3(-0, -0.5, 0.8660253882408142),
      vec3(1.8660253882408142, -0.5, 0),
      vec3(0, -0.5, -0.8660253882408142),
      vec3(0.8660253882408142, -0.5, -0),
      vec3(-0, -1, 0),
      vec3(-0, -1, 0),
      vec3(0, -1, 0),
      vec3(0, -1, -0),
      vec3(-0, -1, -0),
    ];

    const result = Sphere.fromCoords(points);
    const expected = Sphere.fromParams(0.9330126941204071, 0, 0, 1.3676668773461689);
    expectWithin(result, expected);
  });

  it('isEmpty', () => {
    const a = Sphere.new();
    expect(a.isEmpty()).toBe(true);

    const b = Sphere.fromParams(1, 1, 1, 1);
    expect(b.isEmpty()).toBe(false);

    const c = Sphere.fromParams(1, 1, 1, -1);
    expect(c.isEmpty()).toBe(true);

    const d = Sphere.fromParams(1, 1, 1, 0);
    expect(d.isEmpty()).toBe(false);
  });

  it('clear', () => {
    const a = Sphere.fromParams(1, 2, 3, 4);
    expect(a.isEmpty()).toBe(false);

    expect(a.clear()).toBe(a);
    expect(a.isEmpty()).toBe(true);
  });

  it('containsVec', () => {
    const sphere = Sphere.fromParams(1, 1, 1, 1);
    expect(!sphere.containsVec(vec3(0, 0, 0))).toBe(true);
    expect(sphere.containsVec(vec3(1, 1, 1))).toBe(true);

    expect(sphere.setParams(0, 0, 0, 0)).toBe(sphere);
    expect(sphere.containsVec(sphere.center)).toBe(true);
  });

  it('distanceToVec', () => {
    const sphere = Sphere.fromParams(1, 1, 1, 1);

    expect(sphere.distanceTo(vec3(0, 0, 0)) - 0.732).lessThan(0.001);
    expect(sphere.distanceTo(vec3(1, 1, 1))).toBe(-1);
  });

  it('intersects', () => {
    const a = Sphere.fromParams(1, 1, 1, 1);
    const b = Sphere.fromParams(0, 0, 0, 1);
    const c = Sphere.fromParams(0, 0, 0, 0.25);

    expect(a.intersects(b)).toBe(true);
    expect(a.intersects(c)).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Sphere.fromParams(0, 0, 0, 1);
    const b = Sphere.fromParams(-5, -5, -5, 1);
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);

    expect(a.intersectsBox(box)).toBe(true);
    expect(b.intersectsBox(box)).toBe(false);
  });

  it('intersectsPlane', () => {
    const sphere = Sphere.fromParams(0, 0, 0, 1);
    const b = new Plane(Vec3.new(0, 1, 0), 1);
    const c = new Plane(Vec3.new(0, 1, 0), 1.25);
    const d = new Plane(Vec3.new(0, -1, 0), 1.25);

    expect(sphere.intersectsPlane(b)).toBe(true);
    expect(sphere.intersectsPlane(c)).toBe(false);
    expect(sphere.intersectsPlane(d)).toBe(false);
  });

  it('clampVec', () => {
    const sphere = Sphere.fromParams(1, 1, 1, 1);

    expect(sphere.clamp(vec3(1, 1, 3))).toEqual(vec3(1, 1, 2));
    expect(sphere.clamp(vec3(1, 1, -3))).toEqual(vec3(1, 1, 0));
  });

  it('bbox', () => {
    const sphere = Sphere.new();
    const box = Box3.empty();

    expect(sphere.setParams(1, 1, 1, 1)).toBe(sphere);
    expect(sphere.bbox(box)).toBe(box);
    expect(box).toEqual(Box3.fromParams(0, 0, 0, 2, 2, 2));

    expect(sphere.setParams(0, 0, 0, 0)).toBe(sphere);
    expect(sphere.bbox(box)).toBe(box);
    expect(box).toEqual(Box3.fromParams(0, 0, 0, 0, 0, 0));

    expect(sphere.clear()).toBe(sphere);
    expect(sphere.bbox(box)).toBe(box);
    expect(box.isEmpty()).toBe(true);
  });

  it('applyMat4', () => {
    const sphere = Sphere.fromParams(1, 1, 1, 1);
    const mat = new Mat4().asTranslation(1, -2, 1);

    const box1 = sphere.bbox().applyMat4(mat);
    expect(sphere.applyMat4(mat)).toBe(sphere);
    const box2 = sphere.bbox();

    expect(box1).toEqual(box2);
  });

  it('translate', () => {
    const sphere = Sphere.fromParams(1, 1, 1, 1);

    expect(sphere.translate(vec3(1, 1, 1))).toBe(sphere);
    expect(sphere.center).toEqual(vec3(2, 2, 2));

    expect(sphere.translate(vec3(-1, -1, -1))).toBe(sphere);
    expect(sphere.center).toEqual(vec3(1, 1, 1));
  });

  it('expandByVec', () => {
    const sphere = Sphere.fromParams(0, 0, 0, 1);
    const vec = vec3(2, 0, 0);

    expect(sphere.containsVec(vec)).toBe(false);
    sphere.expandCoord(vec);

    expect(sphere.containsVec(vec)).toBe(true);
    expectWithin(sphere, Sphere.fromParams(0.5, 0, 0, 1.5));
  });

  it('union', () => {
    const a = Sphere.fromParams(0, 0, 0, 1);
    const b = Sphere.fromParams(2, 0, 0, 1);

    expect(a.union(b)).toBe(a);
    expect(a).toEqual(Sphere.fromParams(1, 0, 0, 2));

    const c = Sphere.fromParams(0, 0, 0, 1);
    const d = Sphere.fromParams(1, 0, 0, 4);

    expect(c.union(d)).toBe(c);
    expect(c).toEqual(Sphere.fromParams(1, 0, 0, 4));

    const e = Sphere.fromParams(0, 0, 0, 1);
    const f = Sphere.fromParams(0, 0, 0, 4);

    expect(e.union(f)).toBe(e);
    expect(e).toEqual(Sphere.fromParams(0, 0, 0, 4));
  });

  it('equals', () => {
    const a = Sphere.fromParams(0, 0, 0, 0);
    const b = Sphere.fromParams(1, 0, 0, 0);
    const c = Sphere.fromParams(1, 0, 0, 1);

    expect(a.equals(b)).toBe(false);
    expect(a.equals(c)).toBe(false);
    expect(b.equals(c)).toBe(false);

    b.from(a);
    expect(a.equals(b)).toBe(true);
  });
});
