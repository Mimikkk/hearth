import { describe, expect, it } from 'vitest';
import { Box3 } from './Box3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/objects/geometries/BoxGeometry.js';
import { SphereGeometry } from '@modules/renderer/engine/objects/geometries/SphereGeometry.js';
import { Sphere } from './Sphere.js';
import { Plane } from './Plane.js';
import { Triangle } from '@modules/renderer/engine/math/Triangle.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

const closeToBox = (a: Box3, b: Box3) => {
  expect(a.min.x).toBeCloseTo(b.min.x);
  expect(a.min.y).toBeCloseTo(b.min.y);
  expect(a.min.z).toBeCloseTo(b.min.z);
  expect(a.max.x).toBeCloseTo(b.max.x);
  expect(a.max.y).toBeCloseTo(b.max.y);
  expect(a.max.z).toBeCloseTo(b.max.z);
};

const vec3 = Vec3.new;
describe('Math - Box3', () => {
  it('instancing', () => {
    const box = Box3.fromParams(1, 2, 3, 4, 5, 6);
    expect(box.min.x).toBe(1);
    expect(box.min.y).toBe(2);
    expect(box.min.z).toBe(3);
    expect(box.max.x).toBe(4);
    expect(box.max.y).toBe(5);
    expect(box.max.z).toBe(6);

    const clone = Box3.clone(box);
    expect(clone.min).not.toBe(box.min);
    expect(clone.max).not.toBe(box.max);
    expect(clone.min.x).toBe(box.min.x);
    expect(clone.min.y).toBe(box.min.y);
    expect(clone.min.z).toBe(box.min.z);
    expect(clone.max.x).toBe(box.max.x);
    expect(clone.max.y).toBe(box.max.y);
    expect(clone.max.z).toBe(box.max.z);

    const empty = Box3.empty();
    expect(empty.min.x).toBe(Infinity);
    expect(empty.min.y).toBe(Infinity);
    expect(empty.min.z).toBe(Infinity);
    expect(empty.max.x).toBe(-Infinity);
    expect(empty.max.y).toBe(-Infinity);
    expect(empty.max.z).toBe(-Infinity);
  });

  it('isEmpty', () => {
    const box = Box3.empty();
    box.setParams(0, 0, 0, 0, 0, 0);
    expect(box.isEmpty()).toBe(false);
    box.setParams(0, 0, 0, 1, 1, 1);
    expect(box.isEmpty()).toBe(false);
    box.setParams(2, 2, 2, 1, 1, 1);
    expect(box.isEmpty()).toBe(true);
    box.clear();
    expect(box.isEmpty()).toBe(true);
  });

  it('fromVecs', () => {
    const box1 = Box3.fromCoords([]);
    expect(box1.isEmpty()).toBe(true);
    const box2 = Box3.fromCoords([vec3(0, 0, 0), vec3(1, 1, 1), vec3(2, 2, 2)]);
    expect(box2).toEqual(Box3.fromParams(0, 0, 0, 2, 2, 2));
  });

  it('fromArray', () => {
    const box = Box3.fromArray([1, 2, 3, 4, 5, 6]);
    expect(box).toEqual(Box3.fromParams(1, 2, 3, 4, 5, 6));
  });

  it('fromAttribute', () => {
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const bigger = new BufferAttribute(new Float32Array([-2, -2, -2, 2, 2, 2, 1.5, 1.5, 1.5, 0, 0, 0]), 3);
    const smaller = new BufferAttribute(new Float32Array([-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0, 0, 0]), 3);

    expect(box.fromAttribute(bigger)).toBe(box);
    expect(box).toEqual({ min: vec3(-2, -2, -2), max: vec3(2, 2, 2) });

    expect(box.fromAttribute(smaller)).toBe(box);
    expect(box).toEqual({ min: vec3(-0.5, -0.5, -0.5), max: vec3(0.5, 0.5, 0.5) });
  });

  it('fromCenterAndSize', () => {
    const box1 = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const box2 = Box3.clone(box1);
    const centerA = vec3();
    const sizeA = vec3();
    const sizeB = vec3();
    const newCenter = vec3(1, 1, 1);
    const newSize = vec3(2, 2, 2);

    box1.center(centerA);
    box2.size(sizeA);

    expect(box1.fromCenterAndSize(centerA, sizeA)).toBe(box1);
    expect(box1).toEqual(box2);

    box1.fromCenterAndSize(newCenter, sizeA);
    box1.center(centerA);
    box1.size(sizeA);
    box2.size(sizeB);
    expect(centerA).toEqual(newCenter);
    expect(sizeA).toEqual(sizeB);
    expect(box1).not.toEqual(box2);

    box1.fromCenterAndSize(centerA, newSize);
    box1.center(centerA);
    box1.size(sizeA);

    expect(centerA).toEqual(newCenter);
    expect(sizeA).toEqual(newSize);
    expect(box1).not.toEqual(box2);
  });

  it('fromObject/imprecise', () => {
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const object = new Mesh(new BoxGeometry(2, 2, 2));
    const child = new Mesh(new BoxGeometry(1, 1, 1));
    object.add(child);

    box.fromObject(object, false);
    expect(box).toEqual({ min: vec3(-1, -1, -1), max: vec3(1, 1, 1) });
  });

  it('fromObject/precise', () => {
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const object = new Mesh(new SphereGeometry(1, 32, 32));
    const child = new Mesh(new SphereGeometry(2, 32, 32));
    object.add(child);

    const c = Box3.fromParams(0, 0, 0, 1, 1, 1);

    object.setRotation(0, 0, Math.PI / 4);
    box.fromObject(object, false);
    c.fromObject(object);

    const rotatedBox = Box3.fromParams(-2 * Math.SQRT2, -2 * Math.SQRT2, -2, 2 * Math.SQRT2, 2 * Math.SQRT2, 2);
    closeToBox(box, rotatedBox);

    box.fromObject(object, true);
    c.fromObject(object, true);

    const rotatedMinBox = Box3.fromParams(-2, -2, -2, 2, 2, 2);
    closeToBox(box, rotatedMinBox);
  });

  it('clear/isEmpty', () => {
    const box = Box3.fromParams(1, 1, 1, 1, 1, 1);

    expect(box.isEmpty()).toBe(false);
    box.clear();
    expect(box.isEmpty()).toBe(true);
  });

  it('center', () => {
    const box = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const center = box.center();
    expect(center).toEqual(vec3(0, 0, 0));

    box.setParams(0, 0, 0, 1, 1, 1);
    box.center(center);
    expect(center).toEqual(vec3(0.5, 0.5, 0.5));
  });

  it('size', () => {
    let box = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const size = box.size();
    expect(size).toEqual(vec3(0, 0, 0));

    box.setParams(-1, -1, -1, 1, 1, 1);
    box.size(size);
    expect(size).toEqual(vec3(2, 2, 2));
  });

  it('expandCoord', () => {
    const box = Box3.fromParams(0, 0, 0, 0, 0, 0);

    box.expandCoord(vec3(0, 0, 0));
    expect(box.size()).toEqual(vec3(0, 0, 0));

    box.expandCoord(vec3(1, 1, 1));
    expect(box.size()).toEqual(vec3(1, 1, 1));

    box.expandCoord(vec3(-1, -1, -1));
    expect(box.size()).toEqual(vec3(2, 2, 2));
    expect(box.center()).toEqual(vec3(0, 0, 0));
  });

  it('expandVec', () => {
    const box = Box3.fromParams(0, 0, 0, 0, 0, 0);

    box.expandVec(vec3(0, 0, 0));
    expect(box.size()).toEqual(vec3(0, 0, 0));

    box.expandVec(vec3(1, 1, 1));
    expect(box.size()).toEqual(vec3(2, 2, 2));
    expect(box.center()).toEqual(vec3(0, 0, 0));
  });

  it('expandScalar', () => {
    const box = Box3.fromParams(0, 0, 0, 0, 0, 0);

    box.expandScalar(0);
    expect(box.size()).toEqual(vec3(0, 0, 0));

    box.expandScalar(1);
    expect(box.size()).toEqual(vec3(2, 2, 2));
    expect(box.center()).toEqual(vec3(0, 0, 0));
  });

  it('expandObject', () => {
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const bigger = new Mesh(new BoxGeometry(2, 2, 2));
    const smaller = new Mesh(new BoxGeometry(0.5, 0.5, 0.5));
    const child = new Mesh(new BoxGeometry(1, 1, 1));

    box.expandObject(bigger, false);
    expect(box.min).toEqual(vec3(-1, -1, -1));
    expect(box.max).toEqual(vec3(1, 1, 1));

    box.from(b);
    bigger.translateX(2);
    box.expandObject(bigger, false);
    expect(box.min).toEqual(vec3(0, -1, -1));
    expect(box.max).toEqual(vec3(3, 1, 1));

    box.from(b);
    bigger.add(child);
    box.expandObject(bigger, false);
    expect(box.min).toEqual(vec3(0, -1, -1));
    expect(box.max).toEqual(vec3(3, 1, 1));

    box.from(b);
    child.translateX(2);
    box.expandObject(bigger, false);
    expect(box.min).toEqual(vec3(0, -1, -1));
    expect(box.max).toEqual(vec3(4.5, 1, 1));

    box.from(b);
    box.expandObject(smaller, false);
    expect(box.min).toEqual(vec3(-0.25, -0.25, -0.25));
    expect(box.max).toEqual(vec3(1, 1, 1));

    box.clear();
    box.expandObject(new Mesh(), false);

    expect(box.isEmpty()).toBe(true);
  });

  it('containsVec', () => {
    const box = Box3.fromParams(0, 0, 0, 0, 0, 0);

    expect(box.containsCoord(vec3(0, 0, 0))).toBe(true);
    expect(box.containsCoord(vec3(1, 1, 1))).toBe(false);

    box.expandScalar(1);

    expect(box.containsCoord(vec3(0, 0, 0))).toBe(true);
    expect(box.containsCoord(vec3(1, 1, 1))).toBe(true);
    expect(box.containsCoord(vec3(-1, -1, -1))).toBe(true);
  });

  it('containsBox', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(a.containsBox(a)).toBe(true);
    expect(a.containsBox(b)).toBe(false);
    expect(a.containsBox(c)).toBe(false);

    expect(b.containsBox(a)).toBe(true);
    expect(c.containsBox(a)).toBe(true);
    expect(b.containsBox(c)).toBe(false);
  });

  it('intersectsBox', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(a.intersectsBox(a)).toBe(true);
    expect(a.intersectsBox(b)).toBe(true);
    expect(a.intersectsBox(c)).toBe(true);

    expect(b.intersectsBox(a)).toBe(true);
    expect(c.intersectsBox(a)).toBe(true);
    expect(b.intersectsBox(c)).toBe(true);

    b.translate(vec3(2, 2, 2));
    expect(a.intersectsBox(b)).toBe(false);
    expect(b.intersectsBox(a)).toBe(false);
    expect(b.intersectsBox(c)).toBe(false);
  });

  it('intersectsSphere', () => {
    const a = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const b = Sphere.fromParams(0, 0, 0, 1);

    expect(a.intersectsSphere(b)).toBe(true);

    b.translate(vec3(2, 2, 2));
    expect(a.intersectsSphere(b)).toBe(false);
  });

  it('intersectsPlane', () => {
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const plane1 = Plane.fromParams(0, 1, 0, 1);
    const plane2 = Plane.fromParams(0, 1, 0, 1.25);
    const plane3 = Plane.fromParams(0, -1, 0, 1.25);
    const plane4 = Plane.fromParams(0, 1, 0, 0.25);
    const plane5 = Plane.fromParams(0, 1, 0, -0.25);
    const plane6 = Plane.fromParams(0, 1, 0, -0.75);
    const plane7 = Plane.fromParams(0, 1, 0, -1);

    const { x, y, z } = vec3(1, 1, 1).normalize();
    const plane8 = Plane.fromParams(x, y, z, -1.732);
    const plane9 = Plane.fromParams(x, y, z, -1.733);

    expect(box.intersectsPlane(plane1)).toBe(false);
    expect(box.intersectsPlane(plane2)).toBe(false);
    expect(box.intersectsPlane(plane3)).toBe(false);
    expect(box.intersectsPlane(plane4)).toBe(false);
    expect(box.intersectsPlane(plane5)).toBe(true);
    expect(box.intersectsPlane(plane6)).toBe(true);
    expect(box.intersectsPlane(plane7)).toBe(true);
    expect(box.intersectsPlane(plane8)).toBe(true);
    expect(box.intersectsPlane(plane9)).toBe(false);
  });

  it('intersectsTriangle', () => {
    const a = Box3.fromParams(1, 1, 1, 2, 2, 2);
    const b = Triangle.fromCoords([vec3(1.5, 1.5, 2.5), vec3(2.5, 1.5, 1.5), vec3(1.5, 2.5, 1.5)]);
    const c = Triangle.fromCoords([vec3(1.5, 1.5, 3.5), vec3(3.5, 1.5, 1.5), vec3(1.5, 1.5, 1.5)]);
    const d = Triangle.fromCoords([vec3(1.5, 1.75, 3), vec3(3, 1.75, 1.5), vec3(1.5, 2.5, 1.5)]);
    const e = Triangle.fromCoords([vec3(1.5, 1.8, 3), vec3(3, 1.8, 1.5), vec3(1.5, 2.5, 1.5)]);
    const f = Triangle.fromCoords([vec3(1.5, 2.5, 3), vec3(3, 2.5, 1.5), vec3(1.5, 2.5, 1.5)]);

    expect(a.intersectsTriangle(b)).toBe(true);
    expect(a.intersectsTriangle(c)).toBe(true);
    expect(a.intersectsTriangle(d)).toBe(true);
    expect(a.intersectsTriangle(e)).toBe(false);
    expect(a.intersectsTriangle(f)).toBe(false);
  });

  it('clamp', () => {
    const box1 = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const box2 = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(box1.clamp(vec3(0, 0, 0))).toEqual(vec3(0, 0, 0));
    expect(box2.clamp(vec3(1, 1, 1))).toEqual(vec3(1, 1, 1));
    expect(box2.clamp(vec3(-1, -1, -1))).toEqual(vec3(-1, -1, -1));

    expect(box2.clamp(vec3(2, 2, 2))).toEqual(vec3(1, 1, 1));
    expect(box2.clamp(vec3(-2, -2, -2))).toEqual(vec3(-1, -1, -1));
  });

  it('distanceTo', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(a.distanceTo(vec3(0, 0, 0))).toBe(0);
    expect(a.distanceTo(vec3(1, 1, 1))).toBe(Math.sqrt(3));
    expect(a.distanceTo(vec3(-1, -1, -1))).toBe(Math.sqrt(3));

    expect(b.distanceTo(vec3(2, 2, 2))).toBe(Math.sqrt(3));
    expect(b.distanceTo(vec3(1, 1, 1))).toBe(0);
    expect(b.distanceTo(vec3(0, 0, 0))).toBe(0);
    expect(b.distanceTo(vec3(-1, -1, -1))).toBe(0);
    expect(b.distanceTo(vec3(-2, -2, -2))).toBe(Math.sqrt(3));
  });

  it('sphere', () => {
    const box1 = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const box2 = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const box3 = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(box1.sphere()).toEqual(Sphere.fromParams(0, 0, 0, 0));
    expect(box2.sphere()).toEqual(Sphere.fromParams(0.5, 0.5, 0.5, Math.sqrt(3) * 0.5));
    expect(box3.sphere()).toEqual(Sphere.fromParams(0, 0, 0, Math.sqrt(12) * 0.5));
    expect(Box3.empty().sphere().isEmpty()).toBe(true);
  });

  it('intersect', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(a.clone().intersect(a)).toEqual(a);
    expect(a.clone().intersect(b)).toEqual(a);
    expect(b.clone().intersect(b)).toEqual(b);
    expect(a.clone().intersect(c)).toEqual(a);
    expect(b.clone().intersect(c)).toEqual(b);
    expect(c.clone().intersect(c)).toEqual(c);
  });

  it('union', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 1, 1, 1);

    expect(a.clone().union(a)).toEqual(a);
    expect(a.clone().union(b)).toEqual(b);
    expect(b.clone().union(b)).toEqual(b);
    expect(a.clone().union(c)).toEqual(c);
  });

  it('applyMat4', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 1, 1, 1);
    const d = Box3.fromParams(-1, -1, -1, 0, 0, 0);

    const m = new Mat4().asTranslation(Vec3.new(1, -2, 1));
    const t1 = vec3(1, -2, 1);

    closeToBox(a.clone().applyMat4(m), a.translate(t1));
    closeToBox(b.clone().applyMat4(m), b.translate(t1));
    closeToBox(c.clone().applyMat4(m), c.translate(t1));
    closeToBox(d.clone().applyMat4(m), d.translate(t1));
  });

  it('translate', () => {
    const a = Box3.fromParams(0, 0, 0, 0, 0, 0);
    const b = Box3.fromParams(0, 0, 0, 1, 1, 1);
    const c = Box3.fromParams(-1, -1, -1, 0, 0, 0);

    expect(a.translate(vec3(1, 1, 1))).toBe(a);
    expect(a).toEqual(Box3.fromParams(1, 1, 1, 1, 1, 1));
    expect(b.translate(vec3(1, 1, 1))).toEqual(Box3.fromParams(1, 1, 1, 2, 2, 2));
    expect(c.translate(vec3(1, 1, 1))).toEqual(Box3.fromParams(0, 0, 0, 1, 1, 1));
  });
});
