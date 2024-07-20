import { describe, expect, it } from 'vitest';
import { Sphere, Sphere_ } from './Sphere.js';
import { IVec3, Vector3 } from './Vector3.js';
import { Box3, Box3_ } from './Box3.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';

const { vec3 } = IVec3;

const expectWithin = (actual: Sphere_, expected: Sphere_, epsilon = Number.EPSILON) => {
  expect(Math.abs(actual.center.x - expected.center.x)).within(-epsilon, epsilon);
  expect(Math.abs(actual.center.y - expected.center.y)).within(-epsilon, epsilon);
  expect(Math.abs(actual.center.z - expected.center.z)).within(-epsilon, epsilon);
  expect(Math.abs(actual.radius - expected.radius)).within(-epsilon, epsilon);
};

describe('Math - Sphere', () => {
  it('Instancing', () => {
    const a = Sphere_.empty();
    expect(a.center).toEqual(vec3(0, 0, 0));
    expect(a.radius).toBe(-1);

    const b = Sphere_.create(1, 2, 3, 4);
    expect(b.center).toEqual(vec3(1, 2, 3));
    expect(b.radius).toBe(4);

    const cloned = Sphere_.copy(b);
    expect(cloned).not.toBe(b);
    expect(cloned.center).toBe(b.center);
    expect(cloned.radius).toBe(b.radius);

    const copied = Sphere_.clone(b);
    expect(copied.center).not.toBe(b.center);
    expect(copied.radius).toEqual(b.radius);
    expect(copied.center).toEqual(b.center);
  });

  it('is/equals', () => {
    const a = Sphere_.create(1, 2, 3, 4);
    const b = Sphere_.create(1, 2, 3, 4);
    const c = Sphere_.create(1, 2, 3, 5);
    const vec = vec3(0, 0, 0);

    expect(Sphere_.is(a)).toBe(true);
    expect(Sphere_.is(vec)).toBe(false);
    expect(Sphere_.equals(a, b)).toBe(true);
    expect(Sphere_.equals(a, c)).toBe(false);
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

    const result = Sphere_.fromVecs(points);
    const expected = Sphere_.create(0.9330126941204071, 0, 0, 1.3676668773461689);
    expectWithin(result, expected);
  });

  it('isEmpty', () => {
    const a = Sphere_.empty();
    expect(Sphere_.isEmpty(a)).toBe(true);

    const b = Sphere_.create(1, 1, 1, 1);
    expect(Sphere_.isEmpty(b)).toBe(false);

    const c = Sphere_.create(1, 1, 1, -1);
    expect(Sphere_.isEmpty(c)).toBe(true);

    const d = Sphere_.create(1, 1, 1, 0);
    expect(Sphere_.isEmpty(d)).toBe(false);
  });

  it('clear', () => {
    const a = Sphere_.create(1, 2, 3, 4);
    expect(Sphere_.isEmpty(a)).toBe(false);

    expect(Sphere_.clear(a)).toBe(a);
    expect(Sphere_.isEmpty(a)).toBe(true);
  });

  it('containsVec', () => {
    const sphere = Sphere_.create(1, 1, 1, 1);
    expect(!Sphere_.containsVec(sphere, vec3(0, 0, 0))).toBe(true);
    expect(Sphere_.containsVec(sphere, vec3(1, 1, 1))).toBe(true);

    expect(Sphere_.set(sphere, 0, 0, 0, 0)).toBe(sphere);
    expect(Sphere_.containsVec(sphere, sphere.center)).toBe(true);
  });

  it('distanceToVec', () => {
    const sphere = Sphere_.create(1, 1, 1, 1);

    expect(Sphere_.distanceToVec(sphere, vec3(0, 0, 0)) - 0.732).lessThan(0.001);
    expect(Sphere_.distanceToVec(sphere, vec3(1, 1, 1))).toBe(-1);
  });

  it('intersects', () => {
    const a = Sphere_.create(1, 1, 1, 1);
    const b = Sphere_.create(0, 0, 0, 1);
    const c = Sphere_.create(0, 0, 0, 0.25);

    expect(Sphere_.intersects(a, b)).toBe(true);
    expect(Sphere_.intersects(a, c)).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Sphere_.create(0, 0, 0, 1);
    const b = Sphere_.create(-5, -5, -5, 1);
    const box = Box3_.create(0, 0, 0, 1, 1, 1);

    expect(Sphere_.intersectsBox(a, box)).toBe(true);
    expect(Sphere_.intersectsBox(b, box)).toBe(false);
  });

  it('intersectsPlane', () => {
    const sphere = Sphere_.create(0, 0, 0, 1);
    const b = new Plane(new Vector3(0, 1, 0), 1);
    const c = new Plane(new Vector3(0, 1, 0), 1.25);
    const d = new Plane(new Vector3(0, -1, 0), 1.25);

    expect(Sphere_.intersectsPlane(sphere, b)).toBe(true);
    expect(Sphere_.intersectsPlane(sphere, c)).toBe(false);
    expect(Sphere_.intersectsPlane(sphere, d)).toBe(false);
  });

  it('clampVec', () => {
    const sphere = Sphere_.create(1, 1, 1, 1);

    expect(Sphere_.clampVec(sphere, vec3(1, 1, 3))).toEqual(vec3(1, 1, 2));
    expect(Sphere_.clampVec(sphere, vec3(1, 1, -3))).toEqual(vec3(1, 1, 0));
  });

  it('bbox', () => {
    const sphere = Sphere_.empty();
    const box = Box3_.empty();

    expect(Sphere_.set(sphere, 1, 1, 1, 1)).toBe(sphere);
    expect(Sphere_.bbox_(sphere, box)).toBe(box);
    expect(box).toEqual(Box3_.create(0, 0, 0, 2, 2, 2));

    expect(Sphere_.set(sphere, 0, 0, 0, 0)).toBe(sphere);
    expect(Sphere_.bbox_(sphere, box)).toBe(box);
    expect(box).toEqual(Box3_.create(0, 0, 0, 0, 0, 0));

    expect(Sphere_.clear(sphere)).toBe(sphere);
    expect(Sphere_.bbox_(sphere, box)).toBe(box);
    expect(Box3_.isEmpty(box)).toBe(true);
  });

  it('applyMat4', () => {
    const sphere = Sphere_.create(1, 1, 1, 1);
    const mat = new Matrix4().makeTranslation(1, -2, 1);

    const box1 = Box3_.applyMat4(Sphere_.bbox(sphere), mat);
    expect(Sphere_.applyMat4(sphere, mat)).toBe(sphere);
    const box2 = Sphere_.bbox(sphere);

    expect(box1).toEqual(box2);
  });

  it('translate', () => {
    const a = Sphere_.create(1, 1, 1, 1);

    const sphere = Sphere_.create(1, 1, 1, 1);

    expect(Sphere_.translate(sphere, vec3(1, 1, 1))).toBe(sphere);
    expect(sphere.center).toEqual(vec3(2, 2, 2));

    expect(Sphere_.translate(sphere, vec3(-1, -1, -1))).toBe(sphere);
    expect(sphere.center).toEqual(vec3(1, 1, 1));
  });

  it('expandByVec', () => {
    const sphere = Sphere_.create(0, 0, 0, 1);
    const vec = vec3(2, 0, 0);

    expect(Sphere_.containsVec(sphere, vec)).toBe(false);
    Sphere_.expandByVec(sphere, vec);

    expect(Sphere_.containsVec(sphere, vec)).toBe(true);
    expectWithin(sphere, Sphere_.create(0.5, 0, 0, 1.5));
  });

  it('union', () => {
    const a = Sphere_.create(0, 0, 0, 1);
    const b = Sphere_.create(2, 0, 0, 1);

    expect(Sphere_.union(a, b)).toBe(a);
    expect(a).toEqual(Sphere_.create(1, 0, 0, 2));

    const c = Sphere_.create(0, 0, 0, 1);
    const d = Sphere_.create(1, 0, 0, 4);

    expect(Sphere_.union(c, d)).toBe(c);
    expect(c).toEqual(Sphere_.create(1, 0, 0, 4));

    const e = Sphere_.create(0, 0, 0, 1);
    const f = Sphere_.create(0, 0, 0, 4);

    expect(Sphere_.union(e, f)).toBe(e);
    expect(e).toEqual(Sphere_.create(0, 0, 0, 4));
  });

  it('equals', () => {
    const a = Sphere_.create(0, 0, 0, 0);
    const b = Sphere_.create(1, 0, 0, 0);
    const c = Sphere_.create(1, 0, 0, 1);

    expect(Sphere_.equals(a, b)).toBe(false);
    expect(Sphere_.equals(a, c)).toBe(false);
    expect(Sphere_.equals(b, c)).toBe(false);

    Sphere_.clone_(b, a);
    expect(Sphere_.equals(a, b)).toBe(true);
  });
});
