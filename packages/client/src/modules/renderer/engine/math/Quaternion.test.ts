import { describe, expect, it } from 'vitest';
import { Quaternion, QuaternionArray } from './Quaternion.js';
import { Euler } from './Euler.js';
import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Vec3 } from './Vec3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

const expectWithin = (actual: number, expected: number, epsilon: number = Number.EPSILON) => {
  expect(actual).within(expected - epsilon, expected + epsilon);
};
const expectQuaternionWithin = (actual: Quaternion, expected: Quaternion, epsilon: number = Number.EPSILON) => {
  expectWithin(actual.x, expected.x, epsilon);
  expectWithin(actual.y, expected.y, epsilon);
  expectWithin(actual.z, expected.z, epsilon);
  expectWithin(actual.w, expected.w, epsilon);
};

function slerpObject(aArr: readonly number[], bArr: readonly number[], t: number): SlerpResult {
  const a = Quaternion.fromArray(aArr, 0);
  const b = Quaternion.fromArray(bArr, 0);
  const c = Quaternion.fromArray(aArr, 0);

  expect(c.slerp(c, b, t)).toBe(c);

  return {
    equals: (x: number, y: number, z: number, w: number) =>
      Math.abs(x - c.x) <= Number.EPSILON &&
      Math.abs(y - c.y) <= Number.EPSILON &&
      Math.abs(z - c.z) <= Number.EPSILON &&
      Math.abs(w - c.w) <= Number.EPSILON,
    length: c.length(),
    dotA: c.dot(a),
    dotB: c.dot(b),
  };
}

const dot = (a: readonly number[], b: readonly number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

function slerpArray(a: readonly number[], b: readonly number[], t: number): SlerpResult {
  const result = [0, 0, 0, 0];
  QuaternionArray.slerp(result, 0, a, 0, b, 0, t);

  return {
    equals: (x: number, y: number, z: number, w: number) =>
      Math.abs(x - result[0]) <= Number.EPSILON &&
      Math.abs(y - result[1]) <= Number.EPSILON &&
      Math.abs(z - result[2]) <= Number.EPSILON &&
      Math.abs(w - result[3]) <= Number.EPSILON,
    length: Math.sqrt(dot(result, result)),
    dotA: dot(result, a),
    dotB: dot(result, b),
  };
}

type SlerpResult = {
  equals: (x: number, y: number, z: number, w: number) => boolean;
  length: number;
  dotA: number;
  dotB: number;
};

function expectSlerp(
  slerp: (a: readonly number[], b: readonly number[], step: number) => SlerpResult,
  maxError = Number.EPSILON,
) {
  let result;

  const a = [0.6753410084407496, 0.4087830051091744, 0.32856700410659473, 0.5185120064806223];
  const b = [0.6602792107657797, 0.43647413932562285, 0.35119011210236006, 0.5001871596632682];
  let maxNormError = 0;

  const isNormal = (result: SlerpResult) => {
    const normError = Math.abs(1 - result.length);
    maxNormError = Math.max(maxNormError, normError);
    return normError <= maxError;
  };

  result = slerp(a, b, 0);
  expect(result.equals(a[0], a[1], a[2], a[3])).toEqual(true);

  result = slerp(a, b, 1);
  expect(result.equals(b[0], b[1], b[2], b[3])).toEqual(true);

  result = slerp(a, b, 0.5);
  expect(Math.abs(result.dotA - result.dotB) <= Number.EPSILON).toEqual(true);
  expect(isNormal(result)).toEqual(true);

  result = slerp(a, b, 0.25);
  expect(result.dotA > result.dotB).toEqual(true);
  expect(isNormal(result)).toEqual(true);

  result = slerp(a, b, 0.75);
  expect(result.dotA < result.dotB).toEqual(true);

  const D = Math.SQRT1_2;

  result = slerp([1, 0, 0, 0], [0, 0, 1, 0], 0.5);
  expect(result.equals(D, 0, D, 0)).toEqual(true);
  expect(isNormal(result)).toEqual(true);

  result = slerp([0, D, 0, D], [0, -D, 0, D], 0.5);
  expect(result.equals(0, 0, 0, 1)).toEqual(true);
  expect(isNormal(result)).toEqual(true);
}

describe('Math - Quaternion', () => {
  it('Instancing', () => {
    const identity = Quaternion.identity();
    expect(identity).toEqual({ x: 0, y: 0, z: 0, w: 1 });

    const copy = Quaternion.clone(identity);
    expect(copy).not.toBe(identity);
    expect(copy).toEqual(identity);
  });

  it('slerpObject', () => {
    expectSlerp(slerpObject);
  });

  it('slerpArray', () => {
    expectSlerp(slerpArray);
  });

  it('fromAxisAngle', () => {
    const identity = Quaternion.identity();
    const a = Quaternion.identity();

    expect(a.fromAxisAngle(Vec3.new(1, 0, 0), 0)).toBe(a);
    expect(a).toEqual(identity);
    expect(a.fromAxisAngle(Vec3.new(0, 1, 0), 0)).toBe(a);
    expect(a).toEqual(identity);
    expect(a.fromAxisAngle(Vec3.new(0, 0, 1), 0)).toBe(a);
    expect(a).toEqual(identity);

    const b1 = Quaternion.fromAxisAngle(Vec3.new(1, 0, 0), Math.PI);
    expect(a).not.toEqual(b1);
    const b2 = Quaternion.fromAxisAngle(Vec3.new(1, 0, 0), -Math.PI);
    expect(a).not.toEqual(b2);

    expect(b1.mul(b2)).toBe(b1);
    expect(b1).toEqual(a);
  });

  it('fromEuler/fromRotation/fromQuaternion', () => {
    const euler = Euler.new(Math.random(), Math.random(), Math.random());
    const a = Quaternion.identity();
    const b = Quaternion.identity();
    const matrix = new Mat4();

    for (const order of Euler.orders) {
      euler.order = order;

      a.fromEuler(euler);
      matrix.asRotationFromEuler(euler);
      b.fromRotation(matrix);

      expect(a.angleTo(b)).toBeCloseTo(0);
    }
  });

  it('fromMat', () => {
    const a = Quaternion.identity();
    const b = Quaternion.new(-9, -2, 3, -4).normalize();
    const m = new Mat4().asRotationFromQuaternion(b);
    const expected = Quaternion.new(0.8581163303210332, 0.19069251784911848, -0.2860387767736777, 0.38138503569823695);

    a.fromRotation(m);
    expectQuaternionWithin(a, expected);

    b.set(-1, -2, 1, -1);
    m.asRotationFromQuaternion(b);
    expected.set(1, 2, -1, 1);

    a.fromRotation(m);
    expectQuaternionWithin(a, expected);
  });

  it('fromUnit', () => {
    const a = Quaternion.new();
    const b = Vec3.new(1, 0, 0);
    const c = Vec3.new(0, 1, 0);
    const expected = Quaternion.new(0, 0, Math.sqrt(2) / 2, Math.sqrt(2) / 2);

    a.fromUnit(b, c);
    expectQuaternionWithin(a, expected);
  });

  it('angleTo', () => {
    const a = Quaternion.identity();
    const b = Quaternion.fromEuler(Euler.new(0, Math.PI, 0));
    const c = Quaternion.fromEuler(Euler.new(0, 2 * Math.PI, 0));

    expect(a.angleTo(a)).toBe(0);
    expect(a.angleTo(b)).toBe(Math.PI);
    expect(a.angleTo(c)).toBe(0);
  });

  it('rotateTowards', () => {
    const a = Quaternion.new();
    const b = Quaternion.fromEuler(Euler.new(0, Math.PI, 0));
    const c = Quaternion.new();

    const halfPI = Math.PI * 0.5;

    a.rotateTowards(b, 0);
    expect(a).toEqual(a);

    a.rotateTowards(b, Math.PI * 2);
    expect(a).toEqual(b);

    a.set(0, 0, 0, 1);
    a.rotateTowards(b, halfPI);
    expect(a.angleTo(c)).closeTo(halfPI, Number.EPSILON);
  });

  it('conjugate', () => {
    const a = Quaternion.new(1, 2, 3, 4);
    const c = Quaternion.clone(a);

    expect(a.conjugate()).toBe(a);
    expect(a).toEqual({ x: -1, y: -2, z: -3, w: 4 });
    expect(a.conjugate()).toBe(a);
    expect(a).toEqual(c);

    const b = Quaternion.identity();
    expect(b.from(a).conjugate()).toBe(b);
    expect(a).toEqual(c);
    expect(b).toEqual({ x: -1, y: -2, z: -3, w: 4 });
  });

  it('invert', () => {
    const a = Quaternion.new(0, 1, 0, 1);
    expect(a.invert()).toBe(a);

    expectQuaternionWithin(a, Quaternion.new(-0, -1, -0, 1));
  });

  it('dot', () => {
    const a = Quaternion.identity();
    const b = Quaternion.identity();

    expect(a.dot(b)).toBe(1);
    expect(b.dot(a)).toBe(1);

    expect(a.set(1, 2, 3, 1)).toBe(a);
    expect(b.set(3, 2, 1, 1)).toBe(b);

    expect(a.dot(b)).toBe(11);
    expect(b.dot(a)).toBe(11);
  });

  it('normalize/length/lengthSq', () => {
    const a = Quaternion.new(1, 2, 3, 4);

    expect(a.lengthSq()).toBe(30);
    expect(a.length()).toBe(Math.sqrt(30));

    expect(a.normalize()).toBe(a);

    expectWithin(a.lengthSq(), 1);
    expectWithin(a.length(), 1);
  });

  it('multiply', () => {
    const a = Quaternion.new(2, -2, -2, 4);
    const b = Quaternion.new(1, 2, 3, 4);

    expect(a.mul(b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(a.set(4, -3, -8, 5)).toBe(a);
    expect(b.set(2, 3, 4, 5)).toBe(b);

    expect(a.mul(b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('premultiply', () => {
    const a = Quaternion.new(1, 2, 3, 4);
    const b = Quaternion.new(2, -2, -2, 4);

    expect(a.premul(b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(a.set(2, 3, 4, 5)).toBe(a);
    expect(b.set(4, -3, -8, 5)).toBe(b);

    expect(a.premul(b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('slerp', () => {
    const a = Quaternion.new(2, 3, 4, 5);
    const b = Quaternion.new(-2, -3, -4, -5);

    const c = Quaternion.slerp(a, b, 0);
    const d = Quaternion.slerp(a, b, 1);
    expect(c).toEqual(a);
    expect(d).toEqual(b);

    const D = Math.SQRT1_2;
    //
    const e = Quaternion.new(1, 0, 0, 0);
    const f = Quaternion.new(0, 0, 1, 0);
    let expected = Quaternion.new(D, 0, D, 0);
    let result = Quaternion.slerp(e, f, 0.5);
    expect(result).toEqual(expected);

    const g = Quaternion.new(0, D, 0, D);
    const h = Quaternion.new(0, -D, 0, D);
    expected = Quaternion.new(0, 0, 0, 1);
    result = Quaternion.slerp(g, h, 0.5);
    expect(result).toEqual(expected);
  });

  it('equals', () => {
    const a = Quaternion.identity();
    const b = Quaternion.identity();

    expect(a.equals(b)).toBe(true);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const a = Quaternion.fromArray(array, 0);
    expect(a).toEqual({ x: 1, y: 2, z: 3, w: 4 });

    expect(a.fromArray(array, 2)).toBe(a);
    expect(a).toEqual({ x: 3, y: 4, z: 5, w: 6 });
  });

  it('intoArray', () => {
    const a = Quaternion.new(1, 2, 3, 4);
    const array = a.intoArray();

    expect(array).toEqual([1, 2, 3, 4]);

    const array2 = [5, 6, 7, 8];

    expect(a.intoArray(array2, 0)).toBe(array2);
    expect(array2).toEqual([1, 2, 3, 4]);
  });

  it('fromAttribute', () => {
    const attribute = new BufferAttribute(new Float64Array([0, 0, 0, 1, 0.7, 0, 0, 0.7, 0, 0.7, 0, 0.7]), 4);

    const a = Quaternion.fromAttribute(attribute, 0);
    expectQuaternionWithin(a, Quaternion.identity());

    expect(a.fromAttribute(attribute, 1)).toBe(a);
    expectQuaternionWithin(a, Quaternion.new(0.7, 0, 0, 0.7));

    expect(a.fromAttribute(attribute, 2)).toBe(a);
    expectQuaternionWithin(a, Quaternion.new(0, 0.7, 0, 0.7));
  });
});
