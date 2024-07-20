import { describe, expect, it } from 'vitest';
import { Vec4 } from './Vec4.js';
import { Vec2 } from './Vec2.ts';
import { Mat4 } from './Mat4.js';
import { Quaternion } from './Quaternion.js';
import { Euler } from './Euler.ts';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';

const expectCloseTo = (a: Vec4, b: Vec4) => {
  expect(a.x).toBeCloseTo(b.x);
  expect(a.y).toBeCloseTo(b.y);
  expect(a.z).toBeCloseTo(b.z);
  expect(a.w).toBeCloseTo(b.w);
};

describe('Math - Vec4', () => {
  it('instancning', () => {
    const a = Vec4.new();
    expect(a).toEqual(Vec4.new(0, 0, 0, 1));

    const b = Vec4.new(1, 2, 3, 4);
    expect(b).toEqual(Vec4.new(1, 2, 3, 4));

    const c = Vec4.clone(b);
    expect(c).toEqual(b);
    expect(c).not.toBe(b);

    b.set(5, 6, 7, 8);
    expect(b).toEqual(Vec4.new(5, 6, 7, 8));

    const d = Vec2.new();
    expect(Vec4.is(d)).toBe(false);
    expect(Vec4.is(c)).toBe(true);
  });

  it('setScalar', () => {
    const a = Vec4.new();
    a.setScalar(2);
    expect(a).toEqual(Vec4.new(2, 2, 2, 2));
  });

  it('setX,setY,setZ,setW', () => {
    const a = Vec4.new();
    a.setX(1);
    a.setY(2);
    a.setZ(3);
    a.setW(4);
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));
  });

  it('add', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.add(b);
    expect(a).toEqual(Vec4.new(6, 8, 10, 12));
  });

  it('addScalar', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.addScalar(2);
    expect(a).toEqual(Vec4.new(3, 4, 5, 6));
  });

  it('addScaled', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.addScaled(b, 2);
    expect(a).toEqual(Vec4.new(11, 14, 17, 20));
  });

  it('sub', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.sub(b);
    expect(a).toEqual(Vec4.new(-4, -4, -4, -4));
  });

  it('subScalar', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.subScalar(2);
    expect(a).toEqual(Vec4.new(-1, 0, 1, 2));
  });

  it('subScaled', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.subScaled(b, 2);
    expect(a).toEqual(Vec4.new(-9, -10, -11, -12));
  });

  it('mul', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.mul(b);
    expect(a).toEqual(Vec4.new(5, 12, 21, 32));
  });

  it('scale', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.scale(2);
    expect(a).toEqual(Vec4.new(2, 4, 6, 8));
  });

  it('applyMat4', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const m = new Mat4().asRotationX(Math.PI);
    a.applyMat4(m);

    expectCloseTo(a, Vec4.new(1, -2, -3, 4));
  });

  it('div', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.div(b);
    expect(a).toEqual(Vec4.new(0.2, 1 / 3, 3 / 7, 0.5));
  });

  it('divScalar', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.divScalar(2);
    expect(a).toEqual(Vec4.new(0.5, 1, 1.5, 2));
  });

  it('min', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.min(b);
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));
  });

  it('max', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    a.max(b);
    expect(a).toEqual(Vec4.new(5, 6, 7, 8));
  });

  it('clamp', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.clamp(Vec4.new(2, 3, 4, 5), Vec4.new(3, 4, 5, 6));
    expect(a).toEqual(Vec4.new(2, 3, 4, 5));
  });

  it('clampScalar', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.clampScalar(2, 4);
    expect(a).toEqual(Vec4.new(2, 2, 3, 4));
  });

  it('floor', () => {
    const a = Vec4.new(1.1, 2.2, 3.3, 4.4);
    a.floor();
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));
  });

  it('ceil', () => {
    const a = Vec4.new(1.1, 2.2, 3.3, 4.4);
    a.ceil();
    expect(a).toEqual(Vec4.new(2, 3, 4, 5));
  });

  it('round', () => {
    const a = Vec4.new(1.1, 2.2, 3.3, 4.4);
    a.round();
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));
  });

  it('truncate', () => {
    const a = Vec4.new(1.1, -2.2, 3.3, -4.4);
    a.truncate();
    expect(a).toEqual(Vec4.new(1, -2, 3, -4));
  });

  it('negate', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.negate();
    expect(a).toEqual(Vec4.new(-1, -2, -3, -4));
  });

  it('dot', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);
    expect(a.dot(b)).toBe(70);
  });

  it('lengthSq/length/euclidean/euclideanSq', () => {
    const a = Vec4.new(1, 2, 3, 4);

    expect(a.lengthSq()).toBe(30);
    expect(a.length()).toBe(Math.sqrt(30));
    expect(a.euclidean()).toBe(Math.sqrt(30));
    expect(a.euclideanSq()).toBe(30);
  });

  it('distanceSqTo/distanceTo', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(5, 6, 7, 8);

    expect(a.distanceSqTo(b)).toBe(64);
    expect(a.distanceTo(b)).toBe(Math.sqrt(64));
  });

  it('manhattan', () => {
    const a = Vec4.new(1, 2, 3, 4);
    expect(a.manhattan()).toBe(10);
  });

  it('normalize', () => {
    const a = Vec4.new(1, 2, 3, 4);
    a.normalize();
    expect(a.length()).toBeCloseTo(1);
  });

  it('equals', () => {
    const a = Vec4.new(1, 2, 3, 4);
    const b = Vec4.new(1, 2, 3, 4);
    const c = Vec4.new(5, 6, 7, 8);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('asAxisAngleFromQuaternion', () => {
    const a = Vec4.new();
    const q = Quaternion.fromEuler(Euler.new(0, Math.PI, 0));
    a.asAxisAngleFromQuaternion(q);
    expect(a).toEqual(Vec4.new(0, 1, 0, Math.PI));
  });

  it('asAxisAngleFromRotation', () => {
    const a = Vec4.new();
    const m = new Mat4().asRotationX(Math.PI);
    a.asAxisAngleFromRotation(m);
    expect(a).toEqual(Vec4.new(1, 0, 0, Math.PI));
  });

  it('fromMat4Position', () => {
    const a = Vec4.new();
    const m = new Mat4().set(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53);
    a.fromMat4Position(m);
    expect(a).toEqual(Vec4.new(7, 19, 37, 53));
  });

  it('fromArray/intoArray', () => {
    const a = Vec4.new();
    const array = [1, 2, 3, 4, 5, 6, 7, 8];

    a.fromArray(array);
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));

    a.fromArray(array, 4);
    expect(a).toEqual(Vec4.new(5, 6, 7, 8));

    a.intoArray(array, 2);
    expect(array).toEqual([1, 2, 5, 6, 7, 8, 7, 8]);
  });

  it('fromAttribute/intoAttribute', () => {
    const a = Vec4.new();
    const attr = new BufferAttribute(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]), 4);

    a.fromAttribute(attr, 0);
    expect(a).toEqual(Vec4.new(1, 2, 3, 4));

    a.fromAttribute(attr, 1);
    expect(a).toEqual(Vec4.new(5, 6, 7, 8));

    a.intoAttribute(attr, 0);

    expect(attr.array).toEqual(new Float32Array([5, 6, 7, 8, 5, 6, 7, 8]));
  });
});
