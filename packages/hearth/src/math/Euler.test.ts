import { describe, expect, it } from 'vitest';
import { Euler } from './Euler.js';
import { Quaternion } from './Quaternion.js';
import { Mat4 } from './Mat4.js';
import { Vec3 } from './Vec3.js';

const expectMatrices = (a: Mat4, b: Mat4) => {
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
    const a = Euler.new(1, 2, 3, 'XYZ');

    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });
  });

  it('copy/equals', () => {
    const a = Euler.new(1, 2, 3, 'XYZ');
    const b = Euler.clone(a);

    expect(b).toEqual(a);
    expect(b).not.toBe(a);
    expect(a.equals(b)).toBe(true);
  });

  it('Quaternion.fromEuler/Euler.fromQuaternion', () => {
    const testValues = [Euler.new(0, 0, 1), Euler.new(1, 0, 0), Euler.new(0, 1, 0)];
    for (let i = 0; i < testValues.length; i++) {
      const v = testValues[i];
      const q = Quaternion.fromEuler(v);

      const v2 = Euler.fromQuaternion(q, v.order);
      const q2 = Quaternion.fromEuler(v2);

      expectQuaternions(q, q2);
    }
  });

  it('Mat4.fromEuler/Euler.fromMat', () => {
    const eulerZero = Euler.new(0, 0, 0, 'XYZ');
    const eulerAxyz = Euler.new(1, 0, 0, 'XYZ');
    const eulerAzyx = Euler.new(0, 1, 0, 'ZYX');

    const testValues = [eulerZero, eulerAxyz, eulerAzyx];
    for (let i = 0; i < testValues.length; i++) {
      const euler1 = testValues[i];
      const mat = new Mat4().asRotationFromEuler(euler1);

      const euler2 = Euler.fromMat4(mat, euler1.order);
      const expected = new Mat4().asRotationFromEuler(euler2);

      expectMatrices(mat, expected);
    }
  });

  it('fromVec', () => {
    const a = Euler.fromVec(Vec3.new(1, 2, 3), 'XYZ');
    expect(a).toEqual(Euler.new(1, 2, 3, 'XYZ'));
  });

  it('reorder', () => {
    const eulers = [Euler.new(0, 0, 1, 'YZX'), Euler.new(1, 0, 0, 'XYZ'), Euler.new(0, 1, 0, 'ZYX')];
    const expectedQuaternion = Quaternion.identity();
    const resultQuaternion = Quaternion.identity();
    const resultEuler = Euler.empty();

    for (let euler of eulers) {
      expectedQuaternion.fromEuler(euler);

      for (let order of Euler.orders) {
        resultEuler.from(euler).reorder(order);
        resultQuaternion.fromEuler(resultEuler);

        expectQuaternions(expectedQuaternion, resultQuaternion);
      }
    }
  });

  it('intoArray', () => {
    const order = 'YXZ';
    const x = 1;
    const y = 2;
    const z = 3;
    const a = Euler.new(x, y, z, order);

    expect(a.intoArray()).toEqual([x, y, z, order]);

    const array = [0, 0, 0, '', '', ''];

    expect(a.intoArray(array, 0)).toBe(array);
    expect(array).toEqual([x, y, z, order, '', '']);

    expect(a.intoArray(array, 2)).toBe(array);
    expect(array).toEqual([x, y, x, y, z, order]);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 'XYZ'];
    const a = Euler.fromArray(array, 0);

    expect(a).toEqual(Euler.new(1, 2, 3, 'XYZ'));

    const into = Euler.empty();
    expect(into.fromArray(array, 0)).toEqual(a);
    expect(into).toEqual(a);
  });
});
