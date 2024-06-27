import { describe, expect, it } from 'vitest';
import { Quaternion_, QuaternionArray } from './Quaternion.ts';
import { Euler } from './Euler.ts';
import { BufferAttribute } from '../core/BufferAttribute.ts';
import { Vec3 } from './Vector3.ts';

const expectWithin = (actual: number, expected: number, epsilon: number = Number.EPSILON) => {
  expect(actual).within(expected - epsilon, expected + epsilon);
};
const expectQuaternionWithin = (actual: Quaternion_, expected: Quaternion_, epsilon: number = Number.EPSILON) => {
  expectWithin(actual.x, expected.x, epsilon);
  expectWithin(actual.y, expected.y, epsilon);
  expectWithin(actual.z, expected.z, epsilon);
  expectWithin(actual.w, expected.w, epsilon);
};
const orders: Euler.Order[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];

const quaternionSub = (a: Quaternion_, b: Quaternion_): Quaternion_ =>
  Quaternion_.create(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);

function slerpObject(aArr: readonly number[], bArr: readonly number[], t: number): SlerpResult {
  const a = Quaternion_.fromArray(aArr, 0);
  const b = Quaternion_.fromArray(bArr, 0);
  const c = Quaternion_.fromArray(aArr, 0);

  expect(Quaternion_.slerp(c, b, t)).toBe(c);

  return {
    equals: (x: number, y: number, z: number, w: number) =>
      Math.abs(x - c.x) <= Number.EPSILON &&
      Math.abs(y - c.y) <= Number.EPSILON &&
      Math.abs(z - c.z) <= Number.EPSILON &&
      Math.abs(w - c.w) <= Number.EPSILON,
    length: Quaternion_.length(c),
    dotA: Quaternion_.dot(c, a),
    dotB: Quaternion_.dot(c, b),
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
    const identity = Quaternion_.identity();
    expect(identity).toEqual({ x: 0, y: 0, z: 0, w: 1 });

    const copy = Quaternion_.copy(identity);
    expect(copy).not.toBe(identity);
    expect(copy).toEqual(identity);

    const fill = Quaternion_.create(1, 2, 3, 4);
    expect(Quaternion_.fill(fill, 5, 6, 7, 8)).toBe(fill);
    expect(fill).toEqual({ x: 5, y: 6, z: 7, w: 8 });

    expect(Quaternion_.fill_(fill, copy)).toBe(copy);
    expect(copy).toEqual(fill);
  });

  it('slerpObject', () => {
    expectSlerp(slerpObject);
  });

  it('slerpArray', () => {
    expectSlerp(slerpArray);
  });

  it('fromEuler/fromQuaternion', () => {
    const angles = [Vec3.create(1, 0, 0), Vec3.create(0, 1, 0), Vec3.create(0, 0, 1)];

    for (const order of orders) {
      for (const angle of angles) {
        const eulers2 = Euler.fromQuaternion(
          Quaternion_.fromEuler(Euler.create(angle.x, angle.y, angle.z, order)),
          order,
        );

        const newAngle = Vec3.create(eulers2.x, eulers2.y, eulers2.z);

        // assert.ok(newAngle.distanceTo(angles[j]) < 0.001, 'Passed!');
      }
    }
  });

  it('fromAxisAngle', () => {
    const zero = Quaternion_.identity();
    const a = Quaternion_.identity();

    expect(Quaternion_.fromAxisAngle_(Vec3.create(1, 0, 0), 0, a)).toBe(a);
    expect(a).toEqual(zero);
    expect(Quaternion_.fromAxisAngle_(Vec3.create(0, 1, 0), 0, a)).toBe(a);
    expect(a).toEqual(zero);
    expect(Quaternion_.fromAxisAngle_(Vec3.create(0, 0, 1), 0, a)).toBe(a);
    expect(a).toEqual(zero);

    const b1 = Quaternion_.fromAxisAngle(Vec3.create(1, 0, 0), Math.PI);
    expect(a).not.toEqual(b1);
    const b2 = Quaternion_.fromAxisAngle(Vec3.create(1, 0, 0), -Math.PI);
    expect(a).not.toEqual(b2);

    expect(Quaternion_.multiply(b1, b2)).toBe(b1);
    expect(b1).toEqual(a);
  });

  // it('setFromEuler/setFromRotationMatrix', () => {
  //   // ensure euler conversion for Quaternion matches that of Matrix4
  //   for (let i = 0; i < orders.length; i++) {
  //     const q = new Quaternion().setFromEuler(changeEulerOrder(eulerAngles, orders[i]));
  //     const m = new Matrix4().makeRotationFromEuler(changeEulerOrder(eulerAngles, orders[i]));
  //     const q2 = new Quaternion().setFromRotationMatrix(m);
  //
  //     assert.ok(qSub(q, q2).length() < 0.001, 'Passed!');
  //   }
  // });

  // it('setFromRotationMatrix', () => {
  //   // contrived examples purely to please the god of code coverage...
  //   // match conditions in various 'else [if]' blocks
  //
  //   const a = new Quaternion();
  //   let q = new Quaternion(-9, -2, 3, -4).normalize();
  //   const m = new Matrix4().makeRotationFromQuaternion(q);
  //   let expected = new Vector4(0.8581163303210332, 0.19069251784911848, -0.2860387767736777, 0.38138503569823695);
  //
  //   a.setFromRotationMatrix(m);
  //   assert.ok(Math.abs(a.x - expected.x) <= eps, 'm11 > m22 && m11 > m33: check x');
  //   assert.ok(Math.abs(a.y - expected.y) <= eps, 'm11 > m22 && m11 > m33: check y');
  //   assert.ok(Math.abs(a.z - expected.z) <= eps, 'm11 > m22 && m11 > m33: check z');
  //   assert.ok(Math.abs(a.w - expected.w) <= eps, 'm11 > m22 && m11 > m33: check w');
  //
  //   q = new Quaternion(-1, -2, 1, -1).normalize();
  //   m.makeRotationFromQuaternion(q);
  //   expected = new Vector4(0.37796447300922714, 0.7559289460184544, -0.37796447300922714, 0.37796447300922714);
  //
  //   a.setFromRotationMatrix(m);
  //   assert.ok(Math.abs(a.x - expected.x) <= eps, 'm22 > m33: check x');
  //   assert.ok(Math.abs(a.y - expected.y) <= eps, 'm22 > m33: check y');
  //   assert.ok(Math.abs(a.z - expected.z) <= eps, 'm22 > m33: check z');
  //   assert.ok(Math.abs(a.w - expected.w) <= eps, 'm22 > m33: check w');
  // });

  it('fromUnit', () => {
    const a = Quaternion_.fromUnit(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
    expectQuaternionWithin(a, { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 });
  });

  it('angleTo', () => {
    const a = Quaternion_.identity();
    const b = Quaternion_.fromEuler(Euler.create(0, Math.PI, 0));
    const c = Quaternion_.fromEuler(Euler.create(0, 2 * Math.PI, 0));

    expect(Quaternion_.angleTo(a, a)).toBe(0);
    expect(Quaternion_.angleTo(a, b)).toBe(Math.PI);
    expect(Quaternion_.angleTo(a, c)).toBe(0);
  });

  it('rotateTowards', () => {
    const a = Quaternion_.identity();
    const b = Quaternion_.fromEuler(Euler.create(0, Math.PI, 0));
    const c = Quaternion_.identity();

    expect(Quaternion_.rotateTowards_(a, b, 0, c)).toBe(c);
    expect(c).toEqual(a);

    expect(Quaternion_.rotateTowards_(a, b, Math.PI * 2, c)).toBe(c);
    expect(c).toEqual(b);

    expect(Quaternion_.rotateTowards_(a, b, Math.PI * 0.5, c)).toBe(c);

    expect(Quaternion_.angleTo(a, c)).within(Math.PI * 0.5 - Number.EPSILON, Math.PI * 0.5 + Number.EPSILON);
  });

  it('conjugate', () => {
    const a = Quaternion_.create(1, 2, 3, 4);
    const c = Quaternion_.copy(a);

    expect(Quaternion_.conjugate(a)).toBe(a);
    expect(a).toEqual({ x: -1, y: -2, z: -3, w: 4 });
    expect(Quaternion_.conjugate(a)).toBe(a);
    expect(a).toEqual(c);

    const b = Quaternion_.identity();
    expect(Quaternion_.conjugate_(a, b)).toBe(b);
    expect(a).toEqual(c);
    expect(b).toEqual({ x: -1, y: -2, z: -3, w: 4 });
  });

  it('invert', () => {
    const a = Quaternion_.create(0, 1, 0, 1);
    expect(Quaternion_.invert(a)).toBe(a);
    expectQuaternionWithin(a, { x: -0, y: -0.5, z: -0, w: 0.5 });
    expect(Quaternion_.fill(a, 4, 0, 0, 4)).toBe(a);
    expect(Quaternion_.invert(a)).toBe(a);
    expectQuaternionWithin(a, { x: -0.125, y: -0, z: -0, w: 0.125 });
  });

  it('dot', () => {
    const a = Quaternion_.identity();
    const b = Quaternion_.identity();

    expect(Quaternion_.dot(a, b)).toBe(1);
    expect(Quaternion_.dot(b, a)).toBe(1);

    expect(Quaternion_.fill(a, 1, 2, 3, 1)).toBe(a);
    expect(Quaternion_.fill(b, 3, 2, 1, 1)).toBe(b);

    expect(Quaternion_.dot(a, b)).toBe(11);
    expect(Quaternion_.dot(b, a)).toBe(11);
  });

  it('normalize/length/lengthSq', () => {
    const a = Quaternion_.create(1, 2, 3, 4);

    expect(Quaternion_.lengthSq(a)).toBe(30);
    expect(Quaternion_.length(a)).toBe(Math.sqrt(30));

    expect(Quaternion_.normalize(a)).toBe(a);

    expectWithin(Quaternion_.lengthSq(a), 1);
    expectWithin(Quaternion_.length(a), 1);
  });

  it('multiply', () => {
    const a = Quaternion_.create(2, -2, -2, 4);
    const b = Quaternion_.create(1, 2, 3, 4);

    expect(Quaternion_.multiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(Quaternion_.fill(a, 4, -3, -8, 5)).toBe(a);
    expect(Quaternion_.fill(b, 2, 3, 4, 5)).toBe(b);

    expect(Quaternion_.multiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('premultiply', () => {
    const a = Quaternion_.create(1, 2, 3, 4);
    const b = Quaternion_.create(2, -2, -2, 4);

    expect(Quaternion_.premultiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 10, y: -8, z: 10, w: 24 });

    expect(Quaternion_.fill(a, 2, 3, 4, 5)).toBe(a);
    expect(Quaternion_.fill(b, 4, -3, -8, 5)).toBe(b);

    expect(Quaternion_.premultiply(a, b)).toBe(a);
    expect(a).toEqual({ x: 42, y: -32, z: -2, w: 58 });
  });

  it('slerp', () => {
    const a = Quaternion_.create(1, 2, 3, 4);
    const b = Quaternion_.create(4, 3, 2, 1);
    const c = Quaternion_.identity();

    expect(Quaternion_.slerp_(a, b, 0, c)).toBe(c);
    expect(c).toEqual(a);
    expect(Quaternion_.slerp_(a, b, 1, c)).toBe(c);
    expect(c).toEqual(b);

    expect(Quaternion_.fill(a, 1, 0, 0, 0)).toBe(a);
    expect(Quaternion_.fill(b, 0, 0, 1, 0)).toBe(b);

    const Expected = Math.SQRT1_2;
    expect(Quaternion_.slerp_(a, b, 0.5, c)).toBe(c);
    expect(c.x).within(Expected - Number.EPSILON, Expected + Number.EPSILON);
    expect(c.y).within(0, 0);
    expect(c.z).within(Expected - Number.EPSILON, Expected + Number.EPSILON);
    expect(c.w).within(0, 0);

    expect(Quaternion_.fill(a, 0, Expected, 0, Expected)).toBe(a);
    expect(Quaternion_.fill(b, 0, -Expected, 0, Expected)).toBe(b);

    expect(Quaternion_.slerp_(a, b, 0.5, c)).toBe(c);
    expect(c.x).within(0, 0);
    expect(c.y).within(0, 0);
    expect(c.z).within(0, 0);
    expect(c.w).within(1 - Number.EPSILON, 1 + Number.EPSILON);
  });

  it('equals', () => {
    const a = Quaternion_.identity();
    const b = Quaternion_.identity();

    expect(Quaternion_.equals(a, b)).toBe(true);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const a = Quaternion_.fromArray(array, 0);
    expect(a).toEqual({ x: 1, y: 2, z: 3, w: 4 });

    expect(Quaternion_.fromArray_(array, 2, a)).toBe(a);
    expect(a).toEqual({ x: 3, y: 4, z: 5, w: 6 });
  });

  it('intoArray', () => {
    const a = Quaternion_.create(1, 2, 3, 4);
    const array = Quaternion_.intoArray(a);

    expect(array).toEqual([1, 2, 3, 4]);

    const array2 = [5, 6, 7, 8];

    expect(Quaternion_.intoArray_(a, 0, array2)).toBe(array2);
    expect(array2).toEqual([1, 2, 3, 4]);
  });

  it('fromAttribute', () => {
    const attribute = new BufferAttribute(new Float64Array([0, 0, 0, 1, 0.7, 0, 0, 0.7, 0, 0.7, 0, 0.7]), 4);

    const a = Quaternion_.fromAttribute(attribute, 0);
    expectQuaternionWithin(a, { x: 0, y: 0, z: 0, w: 1 });

    expect(Quaternion_.fromAttribute_(attribute, 1, a)).toBe(a);
    expectQuaternionWithin(a, { x: 0.7, y: 0, z: 0, w: 0.7 });

    expect(Quaternion_.fromAttribute_(attribute, 2, a)).toBe(a);
    expectQuaternionWithin(a, { x: 0, y: 0.7, z: 0, w: 0.7 });
  });
});
