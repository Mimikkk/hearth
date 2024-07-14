import { describe, expect, it } from 'vitest';
import { Box3, Box3_ } from './Box3.js';
import { Vec3, Vector3 } from '@modules/renderer/engine/math/Vector3.js';
import { BufferAttribute } from '../core/BufferAttribute.ts';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/geometries/BoxGeometry.js';
import { SphereGeometry } from '@modules/renderer/engine/geometries/SphereGeometry.js';
import { Sphere_ } from './Sphere.ts';
import { Plane_ } from './Plane.ts';
import { Triangle } from '@modules/renderer/engine/math/Triangle.js';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';

const closeToBox = (a: Box3_, b: Box3_) => {
  expect(a.min.x).toBeCloseTo(b.min.x);
  expect(a.min.y).toBeCloseTo(b.min.y);
  expect(a.min.z).toBeCloseTo(b.min.z);
  expect(a.max.x).toBeCloseTo(b.max.x);
  expect(a.max.y).toBeCloseTo(b.max.y);
  expect(a.max.z).toBeCloseTo(b.max.z);
};

const { vec3 } = Vec3;
describe('Math - Box3', () => {
  it('instancing', () => {
    const box = Box3_.create(1, 2, 3, 4, 5, 6);
    expect(box.min.x).toBe(1);
    expect(box.min.y).toBe(2);
    expect(box.min.z).toBe(3);
    expect(box.max.x).toBe(4);
    expect(box.max.y).toBe(5);
    expect(box.max.z).toBe(6);

    const copy = Box3_.copy(box);
    expect(copy.min).toBe(box.min);
    expect(copy.max).toBe(box.max);

    const clone = Box3_.clone(box);
    expect(clone.min).not.toBe(box.min);
    expect(clone.max).not.toBe(box.max);
    expect(clone.min.x).toBe(box.min.x);
    expect(clone.min.y).toBe(box.min.y);
    expect(clone.min.z).toBe(box.min.z);
    expect(clone.max.x).toBe(box.max.x);
    expect(clone.max.y).toBe(box.max.y);
    expect(clone.max.z).toBe(box.max.z);

    const empty = Box3_.empty();
    expect(empty.min.x).toBe(Infinity);
    expect(empty.min.y).toBe(Infinity);
    expect(empty.min.z).toBe(Infinity);
    expect(empty.max.x).toBe(-Infinity);
    expect(empty.max.y).toBe(-Infinity);
    expect(empty.max.z).toBe(-Infinity);

    const fill = Box3_.empty();
    Box3_.clone_(box, fill);
    expect(fill).not.toBe(box);
    expect(fill).toEqual(box);
  });

  it('isEmpty', () => {
    const box = Box3_.empty();
    Box3_.set(box, 0, 0, 0, 0, 0, 0);
    expect(Box3_.isEmpty(box)).toBe(false);
    Box3_.set(box, 0, 0, 0, 1, 1, 1);
    expect(Box3_.isEmpty(box)).toBe(false);
    Box3_.set(box, 2, 2, 2, 1, 1, 1);
    expect(Box3_.isEmpty(box)).toBe(true);
    Box3_.clear(box);
    expect(Box3_.isEmpty(box)).toBe(true);
  });

  it('fromVecs', () => {
    const box1 = Box3_.fromCoords([]);
    expect(Box3_.isEmpty(box1)).toBe(true);
    const box2 = Box3_.fromCoords([vec3(0, 0, 0), vec3(1, 1, 1), vec3(2, 2, 2)]);
    expect(box2).toEqual(Box3_.create(0, 0, 0, 2, 2, 2));
  });

  it('fromArray', () => {
    const box = Box3_.fromArray([1, 2, 3, 4, 5, 6], 0);
    expect(box).toEqual(Box3_.create(1, 2, 3, 4, 5, 6));
  });

  it('fromAttribute', () => {
    const box = Box3_.create(0, 0, 0, 1, 1, 1);
    const bigger = new BufferAttribute(new Float32Array([-2, -2, -2, 2, 2, 2, 1.5, 1.5, 1.5, 0, 0, 0]), 3);
    const smaller = new BufferAttribute(new Float32Array([-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0, 0, 0]), 3);

    expect(Box3_.fillAttribute(box, bigger)).toBe(box);
    expect(box).toEqual({ min: vec3(-2, -2, -2), max: vec3(2, 2, 2) });

    expect(Box3_.fillAttribute(box, smaller)).toBe(box);
    expect(box).toEqual({ min: vec3(-0.5, -0.5, -0.5), max: vec3(0.5, 0.5, 0.5) });
  });

  it('fromCenterAndSize', () => {
    const box1 = Box3_.create(0, 0, 0, 1, 1, 1);
    const box2 = Box3_.clone(box1);
    const centerA = Vec3.empty();
    const sizeA = Vec3.empty();
    const sizeB = Vec3.empty();
    const newCenter = Vec3.create(1, 1, 1);
    const newSize = Vec3.create(2, 2, 2);

    Box3_.center_(box1, centerA);
    Box3_.size_(box2, sizeA);

    expect(Box3_.fillCenterAndSize(box1, centerA, sizeA)).toBe(box1);
    expect(box1).toEqual(box2);

    Box3_.fillCenterAndSize(box1, newCenter, sizeA);
    Box3_.center_(box1, centerA);
    Box3_.size_(box1, sizeA);
    Box3_.size_(box2, sizeB);
    expect(centerA).toEqual(newCenter);
    expect(sizeA).toEqual(sizeB);
    expect(box1).not.toEqual(box2);

    Box3_.fillCenterAndSize(box1, centerA, newSize);
    Box3_.center_(box1, centerA);
    Box3_.size_(box1, sizeA);

    expect(centerA).toEqual(newCenter);
    expect(sizeA).toEqual(newSize);
    expect(box1).not.toEqual(box2);
  });

  it('fromObject/imprecise', () => {
    const box = Box3_.create(0, 0, 0, 1, 1, 1);
    const object = new Mesh(new BoxGeometry(2, 2, 2));
    const child = new Mesh(new BoxGeometry(1, 1, 1));
    object.add(child);

    Box3_.fillObject(box, object, false);
    expect(box).toEqual({ min: vec3(-1, -1, -1), max: vec3(1, 1, 1) });
  });

  it('fromObject/precise', () => {
    const box = Box3_.create(0, 0, 0, 1, 1, 1);
    const object = new Mesh(new SphereGeometry(1, 32, 32));
    const child = new Mesh(new SphereGeometry(2, 32, 32));
    object.add(child);

    const c = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

    object.setRotation(0, 0, Math.PI / 4);
    Box3_.fillObject(box, object, false);
    c.setFromObject(object);

    const rotatedBox = Box3_.create(-2 * Math.SQRT2, -2 * Math.SQRT2, -2, 2 * Math.SQRT2, 2 * Math.SQRT2, 2);
    closeToBox(box, rotatedBox);

    Box3_.fillObject(box, object, true);
    c.setFromObject(object, true);

    const rotatedMinBox = Box3_.create(-2, -2, -2, 2, 2, 2);
    closeToBox(box, rotatedMinBox);
  });

  it('clear/isEmpty', () => {
    const box = Box3_.create(1, 1, 1, 1, 1, 1);

    expect(Box3_.isEmpty(box)).toBe(false);
    Box3_.clear(box);
    expect(Box3_.isEmpty(box)).toBe(true);
  });

  it('center', () => {
    const box = Box3_.create(0, 0, 0, 0, 0, 0);
    const center = Box3_.center(box);
    expect(center).toEqual(vec3(0, 0, 0));

    Box3_.set(box, 0, 0, 0, 1, 1, 1);
    Box3_.center_(box, center);
    expect(center).toEqual(vec3(0.5, 0.5, 0.5));
  });

  it('size', () => {
    let box = Box3_.create(0, 0, 0, 0, 0, 0);
    const size = Box3_.size(box);
    expect(size).toEqual(vec3(0, 0, 0));

    Box3_.set(box, -1, -1, -1, 1, 1, 1);
    Box3_.size_(box, size);
    expect(size).toEqual(vec3(2, 2, 2));
  });

  it('expandCoord', () => {
    const box = Box3_.create(0, 0, 0, 0, 0, 0);

    Box3_.expandCoord(box, vec3(0, 0, 0));
    expect(Box3_.size(box)).toEqual(vec3(0, 0, 0));

    Box3_.expandCoord(box, vec3(1, 1, 1));
    expect(Box3_.size(box)).toEqual(vec3(1, 1, 1));

    Box3_.expandCoord(box, vec3(-1, -1, -1));
    expect(Box3_.size(box)).toEqual(vec3(2, 2, 2));
    expect(Box3_.center(box)).toEqual(vec3(0, 0, 0));
  });

  it('expandVec', () => {
    const box = Box3_.create(0, 0, 0, 0, 0, 0);

    Box3_.expandVec(box, vec3(0, 0, 0));
    expect(Box3_.size(box)).toEqual(vec3(0, 0, 0));

    Box3_.expandVec(box, vec3(1, 1, 1));
    expect(Box3_.size(box)).toEqual(vec3(2, 2, 2));
    expect(Box3_.center(box)).toEqual(vec3(0, 0, 0));
  });

  it('expandScalar', () => {
    const box = Box3_.create(0, 0, 0, 0, 0, 0);

    Box3_.expandScalar(box, 0);
    expect(Box3_.size(box)).toEqual(vec3(0, 0, 0));

    Box3_.expandScalar(box, 1);
    expect(Box3_.size(box)).toEqual(vec3(2, 2, 2));
    expect(Box3_.center(box)).toEqual(vec3(0, 0, 0));
  });

  it('expandObject', () => {
    const a = Box3_.create(0, 0, 0, 1, 1, 1);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const bigger = new Mesh(new BoxGeometry(2, 2, 2));
    const smaller = new Mesh(new BoxGeometry(0.5, 0.5, 0.5));
    const child = new Mesh(new BoxGeometry(1, 1, 1));

    Box3_.expandObject(a, bigger, false);
    expect(a.min).toEqual(vec3(-1, -1, -1));
    expect(a.max).toEqual(vec3(1, 1, 1));

    Box3_.fill_(a, b);
    bigger.translateX(2);
    Box3_.expandObject(a, bigger, false);
    expect(a.min).toEqual(vec3(0, -1, -1));
    expect(a.max).toEqual(vec3(3, 1, 1));

    Box3_.fill_(a, b);
    bigger.add(child);
    Box3_.expandObject(a, bigger, false);
    expect(a.min).toEqual(vec3(0, -1, -1));
    expect(a.max).toEqual(vec3(3, 1, 1));

    Box3_.fill_(a, b);
    child.translateX(2);
    Box3_.expandObject(a, bigger, false);
    expect(a.min).toEqual(vec3(0, -1, -1));
    expect(a.max).toEqual(vec3(4.5, 1, 1));

    Box3_.fill_(a, b);
    Box3_.expandObject(a, smaller, false);
    expect(a.min).toEqual(vec3(-0.25, -0.25, -0.25));
    expect(a.max).toEqual(vec3(1, 1, 1));

    const box = Box3_.empty();
    Box3_.expandObject(box, new Mesh(), false);

    expect(Box3_.isEmpty(box)).toBe(true);
  });

  it('containsVec', () => {
    const box = Box3_.create(0, 0, 0, 0, 0, 0);

    expect(Box3_.containsVec(box, vec3(0, 0, 0))).toBe(true);
    expect(Box3_.containsVec(box, vec3(1, 1, 1))).toBe(false);

    Box3_.expandScalar(box, 1);

    expect(Box3_.containsVec(box, vec3(0, 0, 0))).toBe(true);
    expect(Box3_.containsVec(box, vec3(1, 1, 1))).toBe(true);
    expect(Box3_.containsVec(box, vec3(-1, -1, -1))).toBe(true);
  });

  it('containsBox', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.contains(a, a)).toBe(true);
    expect(Box3_.contains(a, b)).toBe(false);
    expect(Box3_.contains(a, c)).toBe(false);

    expect(Box3_.contains(b, a)).toBe(true);
    expect(Box3_.contains(c, a)).toBe(true);
    expect(Box3_.contains(b, c)).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.intersects(a, a)).toBe(true);
    expect(Box3_.intersects(a, b)).toBe(true);
    expect(Box3_.intersects(a, c)).toBe(true);

    expect(Box3_.intersects(b, a)).toBe(true);
    expect(Box3_.intersects(c, a)).toBe(true);
    expect(Box3_.intersects(b, c)).toBe(true);

    Box3_.translate(b, vec3(2, 2, 2));
    expect(Box3_.intersects(a, b)).toBe(false);
    expect(Box3_.intersects(b, a)).toBe(false);
    expect(Box3_.intersects(b, c)).toBe(false);
  });

  it('intersectsSphere', () => {
    const a = Box3_.create(0, 0, 0, 1, 1, 1);
    const b = Sphere_.create(0, 0, 0, 1);

    expect(Box3_.intersectsSphere(a, b)).toBe(true);

    Sphere_.translate(b, vec3(2, 2, 2));
    expect(Box3_.intersectsSphere(a, b)).toBe(false);
  });

  it('intersectsPlane', () => {
    const box = Box3_.create(0, 0, 0, 1, 1, 1);
    const plane1 = Plane_.create(0, 1, 0, 1);
    const plane2 = Plane_.create(0, 1, 0, 1.25);
    const plane3 = Plane_.create(0, -1, 0, 1.25);
    const plane4 = Plane_.create(0, 1, 0, 0.25);
    const plane5 = Plane_.create(0, 1, 0, -0.25);
    const plane6 = Plane_.create(0, 1, 0, -0.75);
    const plane7 = Plane_.create(0, 1, 0, -1);

    const { x, y, z } = Vec3.normalize(vec3(1, 1, 1));
    const plane8 = Plane_.create(x, y, z, -1.732);
    const plane9 = Plane_.create(x, y, z, -1.733);

    expect(Box3_.intersectsPlane(box, plane1)).toBe(false);
    expect(Box3_.intersectsPlane(box, plane2)).toBe(false);
    expect(Box3_.intersectsPlane(box, plane3)).toBe(false);
    expect(Box3_.intersectsPlane(box, plane4)).toBe(false);
    expect(Box3_.intersectsPlane(box, plane5)).toBe(true);
    expect(Box3_.intersectsPlane(box, plane6)).toBe(true);
    expect(Box3_.intersectsPlane(box, plane7)).toBe(true);
    expect(Box3_.intersectsPlane(box, plane8)).toBe(true);
    expect(Box3_.intersectsPlane(box, plane9)).toBe(false);
  });

  it('intersectsTriangle', () => {
    const a = Box3_.create(1, 1, 1, 2, 2, 2);
    const b = Triangle.create(vec3(1.5, 1.5, 2.5), vec3(2.5, 1.5, 1.5), vec3(1.5, 2.5, 1.5));
    const c = Triangle.create(vec3(1.5, 1.5, 3.5), vec3(3.5, 1.5, 1.5), vec3(1.5, 1.5, 1.5));
    const d = Triangle.create(vec3(1.5, 1.75, 3), vec3(3, 1.75, 1.5), vec3(1.5, 2.5, 1.5));
    const e = Triangle.create(vec3(1.5, 1.8, 3), vec3(3, 1.8, 1.5), vec3(1.5, 2.5, 1.5));
    const f = Triangle.create(vec3(1.5, 2.5, 3), vec3(3, 2.5, 1.5), vec3(1.5, 2.5, 1.5));

    expect(Box3_.intersectsTriangle(a, b)).toBe(true);
    expect(Box3_.intersectsTriangle(a, c)).toBe(true);
    expect(Box3_.intersectsTriangle(a, d)).toBe(true);
    expect(Box3_.intersectsTriangle(a, e)).toBe(false);
    expect(Box3_.intersectsTriangle(a, f)).toBe(false);
  });

  it('clampVec', () => {
    const box1 = Box3_.create(0, 0, 0, 0, 0, 0);
    const box2 = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.clampVec(box1, vec3(0, 0, 0))).toEqual(vec3(0, 0, 0));
    expect(Box3_.clampVec(box2, vec3(1, 1, 1))).toEqual(vec3(1, 1, 1));
    expect(Box3_.clampVec(box2, vec3(-1, -1, -1))).toEqual(vec3(-1, -1, -1));

    expect(Box3_.clampVec(box2, vec3(2, 2, 2))).toEqual(vec3(1, 1, 1));
    expect(Box3_.clampVec(box2, vec3(-2, -2, -2))).toEqual(vec3(-1, -1, -1));
  });

  it('distanceToVec', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.distanceTo(a, vec3(0, 0, 0))).toBe(0);
    expect(Box3_.distanceTo(a, vec3(1, 1, 1))).toBe(Math.sqrt(3));
    expect(Box3_.distanceTo(a, vec3(-1, -1, -1))).toBe(Math.sqrt(3));

    expect(Box3_.distanceTo(b, vec3(2, 2, 2))).toBe(Math.sqrt(3));
    expect(Box3_.distanceTo(b, vec3(1, 1, 1))).toBe(0);
    expect(Box3_.distanceTo(b, vec3(0, 0, 0))).toBe(0);
    expect(Box3_.distanceTo(b, vec3(-1, -1, -1))).toBe(0);
    expect(Box3_.distanceTo(b, vec3(-2, -2, -2))).toBe(Math.sqrt(3));
  });

  it('sphere', () => {
    const box1 = Box3_.create(0, 0, 0, 0, 0, 0);
    const box2 = Box3_.create(0, 0, 0, 1, 1, 1);
    const box3 = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.sphere(box1)).toEqual(Sphere_.create(0, 0, 0, 0));
    expect(Box3_.sphere(box2)).toEqual(Sphere_.create(0.5, 0.5, 0.5, Math.sqrt(3) * 0.5));
    expect(Box3_.sphere(box3)).toEqual(Sphere_.create(0, 0, 0, Math.sqrt(12) * 0.5));
    expect(Sphere_.isEmpty(Box3_.sphere(Box3_.empty()))).toBe(true);
  });

  it('intersect', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.intersected(a, a)).toEqual(a);
    expect(Box3_.intersected(a, b)).toEqual(a);
    expect(Box3_.intersected(b, b)).toEqual(b);
    expect(Box3_.intersected(a, c)).toEqual(a);
    expect(Box3_.intersected(b, c)).toEqual(b);
    expect(Box3_.intersected(c, c)).toEqual(c);
  });

  it('union', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 1, 1, 1);

    expect(Box3_.united(a, a)).toEqual(a);
    expect(Box3_.united(a, b)).toEqual(b);
    expect(Box3_.united(b, b)).toEqual(b);
    expect(Box3_.united(a, c)).toEqual(c);
  });

  it('applyMat4', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 1, 1, 1);
    const d = Box3_.create(-1, -1, -1, 0, 0, 0);

    const m = new Matrix4().makeTranslation(1, -2, 1);
    const t1 = Vec3.create(1, -2, 1);

    closeToBox(Box3_.appliedMat4(a, m), Box3_.translated(a, t1));
    closeToBox(Box3_.appliedMat4(b, m), Box3_.translated(b, t1));
    closeToBox(Box3_.appliedMat4(c, m), Box3_.translated(c, t1));
    closeToBox(Box3_.appliedMat4(d, m), Box3_.translated(d, t1));
  });

  it('translate', () => {
    const a = Box3_.create(0, 0, 0, 0, 0, 0);
    const b = Box3_.create(0, 0, 0, 1, 1, 1);
    const c = Box3_.create(-1, -1, -1, 0, 0, 0);

    expect(Box3_.translated(a, vec3(1, 1, 1))).toEqual(Box3_.create(1, 1, 1, 1, 1, 1));
    expect(Box3_.translated(Box3_.translated(a, vec3(1, 1, 1)), vec3(-1, -1, -1))).toEqual(a);
    expect(Box3_.translated(c, vec3(1, 1, 1))).toEqual(b);
    expect(Box3_.translated(b, vec3(-1, -1, -1))).toEqual(c);
  });
});
