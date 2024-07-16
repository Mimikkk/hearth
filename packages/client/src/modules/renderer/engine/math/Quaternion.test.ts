import { describe, expect, it } from 'vitest';
import { Quaternion, QuaternionArray } from './Quaternion.ts';
import { Euler } from './Euler.ts';
import { BufferAttribute } from '../core/BufferAttribute.ts';
import { IVec3 } from './Vector3.ts';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';
import { Vec4 } from '@modules/renderer/engine/math/Vector4.js';

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

  expect(Quaternion.slerp(c, b, t)).toBe(c);

  return {
    equals: (x: number, y: number, z: number, w: number) =>
      Math.abs(x - c.x) <= Number.EPSILON &&
      Math.abs(y - c.y) <= Number.EPSILON &&
      Math.abs(z - c.z) <= Number.EPSILON &&
      Math.abs(w - c.w) <= Number.EPSILON,
    length: Quaternion.length(c),
    dotA: Quaternion.dot(c, a),
    dotB: Quaternion.dot(c, b),
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

    const fill = Quaternion.create(1, 2, 3, 4);
    expect(Quaternion.set(fill, 5, 6, 7, 8)).toBe(fill);
    expect(fill).toEqual({ x: 5, y: 6, z: 7, w: 8 });

    expect(Quaternion.clone_(fill, copy)).toBe(copy);
    expect(copy).toEqual(fill);
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

    expect(Quaternion.fillAxisAngle(a, IVec3.create(1, 0, 0), 0)).toBe(a);
    expect(a).toEqual(identity);
    expect(Quaternion.fillAxisAngle(a, IVec3.create(0, 1, 0), 0)).toBe(a);
    expect(a).toEqual(identity);
    expect(Quaternion.fillAxisAngle(a, IVec3.create(0, 0, 1), 0)).toBe(a);
    expect(a).toEqual(identity);

    const b1 = Quaternion.fromAxisAngle(IVec3.create(1, 0, 0), Math.PI);
    expect(a).not.toEqual(b1);
    const b2 = Quaternion.fromAxisAngle(IVec3.create(1, 0, 0), -Math.PI);
    expect(a).not.toEqual(b2);

    expect(Quaternion.multiply(b1, b2)).toBe(b1);
    expect(b1).toEqual(a);
  });

  it('fromEuler/fromRotation/fromQuaternion', () => {
    const euler = Euler.create(Math.random(), Math.random(), Math.random());
    const a = Quaternion.identity();
    const b = Quaternion.identity();
    const matrix = new Matrix4();

    for (const order of Euler.orders) {
      euler.order = order;

      Quaternion.fillEuler(a, euler);
      matrix.makeRotationFromEuler(euler);
      Quaternion.fillRotation(b, matrix);

      expect(Quaternion.angleTo(a, b)).toBeCloseTo(0);
    }
  });

  it('fromMat', () => {
    const a = Quaternion.identity();
    const b = Quaternion.normalize(Quaternion.create(-9, -2, 3, -4));
    const m = new Matrix4().makeRotationFromQuaternion(b);
    const expected = Quaternion.create(
      0.8581163303210332,
      0.19069251784911848,
      -0.2860387767736777,
      0.38138503569823695,
    );

    Quaternion.fillRotation(a, m);
    expectQuaternionWithin(a, expected);

    Quaternion.set(b, -1, -2, 1, -1);
    m.makeRotationFromQuaternion(b);
    Quaternion.set(expected, 1, 2, -1, 1);

    Quaternion.fillRotation(a, m);
    expectQuaternionWithin(a, expected);
  });

  it('fromUnit', () => {
    const a = Quaternion.fromUnit(IVec3.create(1, 0, 0), IVec3.create(0, 1, 0));
    expectQuaternionWithin(a, { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 });
  });

  it('angleTo', () => {
    const a = Quaternion.identity();
    const b = Quaternion.fromEuler(Euler.create(0, Math.PI, 0));
    const c = Quaternion.fromEuler(Euler.create(0, 2 * Math.PI, 0));

    expect(Quaternion.angleTo(a, a)).toBe(0);
    expect(Quaternion.angleTo(a, b)).toBe(Math.PI);
    expect(Quaternion.angleTo(a, c)).toBe(0);
  });

  it('rotateTowards', () => {
    const a = Quaternion.identity();
    const b = Quaternion.fromEuler(Euler.create(0, Math.PI, 0));
    const c = Quaternion.identity();

    expect(Quaternion.rotateTowards_(a, b, 0, c)).toBe(c);
    expect(c).toEqual(a);

    expect(Quaternion.rotateTowards_(a, b, Math.PI * 2, c)).toBe(c);
    expect(c).toEqual(b);

    expect(Quaternion.rotateTowards_(a, b, Math.PI * 0.5, c)).toBe(c);

    expect(Quaternion.angleTo(a, c)).within(Math.PI * 0.5 - Number.EPSILON, Math.PI * 0.5 + Number.EPSILON);
  });

  it('conjugate', () => {
    const a = Quaternion.create(1, 2, 3, 4);
    const c = Quaternion.clone(a);

    expect(Quaternion.conjugate(a)).toBe(a);
    expect(a).toEqual({ x: -1, y: -2, z: -3, w: 4 });
    expect(Quaternion.conjugate(a)).toBe(a);
    expect(a).toEqual(c);

    const b = Quaternion.identity();
    expect(Quaternion.conjugate_(a, b)).toBe(b);
    expect(a).toEqual(c);
    expect(b).toEqual({ x: -1, y: -2, z: -3, w: 4 });
  });

  it('invert', () => {
    const a = Quaternion.create(0, 1, 0, 1);
    expect(Quaternion.invert(a)).toBe(a);
    expectQuaternionWithin(a, { x: -0, y: -0.5, z: -0, w: 0.5 });
    expect(Quaternion.set(a, 4, 0, 0, 4)).toBe(a);
    expect(Quaternion.invert(a)).toBe(a);
    expectQuaternionWithin(a, { x: -0.125, y: -0, z: -0, w: 0.125 });
  });

  it('dot', () => {
    const a = Quaternion.identity();
    const b = Quaternion.identity();

    expect(Quaternion.dot(a, b)).toBe(1);
    expect(Quaternion.dot(b, a)).toBe(1);

    expect(Quaternion.set(a, 1, 2, 3, 1)).toBe(a);
    expect(Quaternion.set(b, 3, 2, 1, 1)).toBe(b);

    expect(Quaternion.dot(a, b)).toBe(11);
    expect(Quaternion.dot(b, a)).toBe(11);
  });

  it('normalize/length/lengthSq', () => {
    const a = Quaternion.create(1, 2, 3, 4);

    expect(Quaternion.lengthSq(a)).toBe(30);
    expect(Quaternion.length(a)).toBe(Math.sqrt(30));

    expect(Quaternion.normalize(a)).toBe(a);

    expectWithin(Quaternion.lengthSq(a), 1);
    expectWithin(Quaternion.length(a), 1);
  });

  it('multiply', () => {
    const a = Quaternion.create(2, -2, -2, 4);
    const b = Quaternion.create(1, 2, 3, 4);

    expect(Quaternion.multiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(Quaternion.set(a, 4, -3, -8, 5)).toBe(a);
    expect(Quaternion.set(b, 2, 3, 4, 5)).toBe(b);

    expect(Quaternion.multiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('premultiply', () => {
    const a = Quaternion.create(1, 2, 3, 4);
    const b = Quaternion.create(2, -2, -2, 4);

    expect(Quaternion.premultiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(Quaternion.set(a, 2, 3, 4, 5)).toBe(a);
    expect(Quaternion.set(b, 4, -3, -8, 5)).toBe(b);

    expect(Quaternion.premultiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('slerp', () => {
    const a = Quaternion.create(1, 2, 3, 4);
    const b = Quaternion.create(4, 3, 2, 1);
    const c = Quaternion.identity();

    expect(Quaternion.slerp_(a, b, 0, c)).toBe(c);
    expect(c).toEqual(a);
    expect(Quaternion.slerp_(a, b, 1, c)).toBe(c);
    expect(c).toEqual(b);

    expect(Quaternion.set(a, 1, 0, 0, 0)).toBe(a);
    expect(Quaternion.set(b, 0, 0, 1, 0)).toBe(b);

    const Expected = Math.SQRT1_2;
    expect(Quaternion.slerp_(a, b, 0.5, c)).toBe(c);
    expect(c.x).within(Expected - Number.EPSILON, Expected + Number.EPSILON);
    expect(c.y).within(0, 0);
    expect(c.z).within(Expected - Number.EPSILON, Expected + Number.EPSILON);
    expect(c.w).within(0, 0);

    expect(Quaternion.set(a, 0, Expected, 0, Expected)).toBe(a);
    expect(Quaternion.set(b, 0, -Expected, 0, Expected)).toBe(b);

    expect(Quaternion.slerp_(a, b, 0.5, c)).toBe(c);
    expect(c.x).within(0, 0);
    expect(c.y).within(0, 0);
    expect(c.z).within(0, 0);
    expect(c.w).within(1 - Number.EPSILON, 1 + Number.EPSILON);
  });

  it('equals', () => {
    const a = Quaternion.identity();
    const b = Quaternion.identity();

    expect(Quaternion.equals(a, b)).toBe(true);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const a = Quaternion.fromArray(array, 0);
    expect(a).toEqual({ x: 1, y: 2, z: 3, w: 4 });

    expect(Quaternion.fromArray_(array, 2, a)).toBe(a);
    expect(a).toEqual({ x: 3, y: 4, z: 5, w: 6 });
  });

  it('intoArray', () => {
    const a = Quaternion.create(1, 2, 3, 4);
    const array = Quaternion.intoArray(a);

    expect(array).toEqual([1, 2, 3, 4]);

    const array2 = [5, 6, 7, 8];

    expect(Quaternion.intoArray_(a, 0, array2)).toBe(array2);
    expect(array2).toEqual([1, 2, 3, 4]);
  });

  it('fromAttribute', () => {
    const attribute = new BufferAttribute(new Float64Array([0, 0, 0, 1, 0.7, 0, 0, 0.7, 0, 0.7, 0, 0.7]), 4);

    const a = Quaternion.fromAttribute(attribute, 0);
    expectQuaternionWithin(a, { x: 0, y: 0, z: 0, w: 1 });

    expect(Quaternion.fromAttribute_(attribute, 1, a)).toBe(a);
    expectQuaternionWithin(a, { x: 0.7, y: 0, z: 0, w: 0.7 });

    expect(Quaternion.fromAttribute_(attribute, 2, a)).toBe(a);
    expectQuaternionWithin(a, { x: 0, y: 0.7, z: 0, w: 0.7 });
  });
});
