import { describe, expect, it } from 'vitest';
import { Euler } from './Euler.ts';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';

const expectMatrices = (a: Matrix4, b: Matrix4) => {
  for (let i = 0; i < 16; i++) {
    expect(a.elements[i]).within(b.elements[i] - Number.EPSILON, b.elements[i] + Number.EPSILON);
  }
};

const expectQuaternions = (a: Quaternion, b: Quaternion) => {
  expect(a.x).within(b.x - Number.EPSILON, b.x + Number.EPSILON);
  expect(a.y).within(b.y - Number.EPSILON, b.y + Number.EPSILON);
  expect(a.z).within(b.z - Number.EPSILON, b.z + Number.EPSILON);
  expect(a.w).within(b.w - Number.EPSILON, b.w + Number.EPSILON);
};

describe('Math - Quaternion', () => {
  it('Instancing', () => {
    const a = Euler.create(1, 2, 3, 'XYZ');

    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });
  });

  it('copy/equals', () => {
    const a = Euler.create(1, 2, 3, 'XYZ');
    const b = Euler.clone(a);

    expect(b).toEqual(a);
    expect(b).not.toBe(a);
    expect(Euler.equals(a, b)).toBe(true);
  });

  it('Quaternion.fromEuler/Euler.fromQuaternion', () => {
    const testValues = [Euler.create(0, 0, 1), Euler.create(1, 0, 0), Euler.create(0, 1, 0)];
    for (let i = 0; i < testValues.length; i++) {
      const v = testValues[i];
      const q = Quaternion.fromEuler(v);

      const v2 = Euler.fromQuaternion(q, v.order);
      const q2 = Quaternion.fromEuler(v2);

      expectQuaternions(q, q2);
    }
  });

  it('Mat4x4.fromEuler/Euler.fromMat', () => {
    const eulerZero = Euler.create(0, 0, 0, 'XYZ');
    const eulerAxyz = Euler.create(1, 0, 0, 'XYZ');
    const eulerAzyx = Euler.create(0, 1, 0, 'ZYX');

    const testValues = [eulerZero, eulerAxyz, eulerAzyx];
    for (let i = 0; i < testValues.length; i++) {
      const euler1 = testValues[i];
      const mat = new Matrix4().makeRotationFromEuler(euler1);

      const euler2 = Euler.fromMat(mat.elements, euler1.order);
      const expected = new Matrix4().makeRotationFromEuler(euler2);

      expectMatrices(mat, expected);
    }
  });

  it('fromVec', () => {
    const a = Euler.fromVec({ x: 1, y: 2, z: 3 }, 'XYZ');
    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });
  });

  it('reorder', () => {
    const eulers = [Euler.create(0, 0, 1, 'YZX'), Euler.create(1, 0, 0, 'XYZ'), Euler.create(0, 1, 0, 'ZYX')];
    const expectedQuaternion = Quaternion.identity();
    const resultQuaternion = Quaternion.identity();
    const resultEuler = Euler.empty();

    for (let euler of eulers) {
      Quaternion.fillEuler(expectedQuaternion, euler);

      for (let order of Euler.orders) {
        Euler.reorder_(euler, order, resultEuler);
        Quaternion.fillEuler(resultQuaternion, resultEuler);

        expectQuaternions(expectedQuaternion, resultQuaternion);
      }
    }
  });

  it('intoArray', () => {
    const order = 'YXZ';
    const x = 1;
    const y = 2;
    const z = 3;
    const a = Euler.create(x, y, z, order);

    expect(Euler.intoArray(a)).toEqual([x, y, z, order]);

    const array = [0, 0, 0, '', '', ''];

    expect(Euler.intoArray_(a, array, 0)).toBe(array);
    expect(array).toEqual([x, y, z, order, '', '']);

    expect(Euler.intoArray_(a, array, 2)).toBe(array);
    expect(array).toEqual([x, y, x, y, z, order]);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 'XYZ'];
    const a = Euler.fromArray(array, 0);

    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });

    const into = Euler.empty();
    expect(Euler.fromArray_(array, 0, into)).toEqual(a);
    expect(into).toEqual(a);
  });
});
