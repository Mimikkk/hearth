import { describe, expect, it } from 'vitest';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';

const expectArrayCloseTo = (a: number[], b: number[], epsilon: number = Number.EPSILON) => {
  expect(a[0]).toBeCloseTo(b[0], epsilon);
  expect(a[1]).toBeCloseTo(b[1], epsilon);
  expect(a[2]).toBeCloseTo(b[2], epsilon);
  expect(a[3]).toBeCloseTo(b[3], epsilon);

  expect(a[4]).toBeCloseTo(b[4], epsilon);
  expect(a[5]).toBeCloseTo(b[5], epsilon);
  expect(a[6]).toBeCloseTo(b[6], epsilon);
  expect(a[7]).toBeCloseTo(b[7], epsilon);

  expect(a[8]).toBeCloseTo(b[8], epsilon);
  expect(a[9]).toBeCloseTo(b[9], epsilon);
  expect(a[10]).toBeCloseTo(b[10], epsilon);
  expect(a[11]).toBeCloseTo(b[11], epsilon);

  expect(a[12]).toBeCloseTo(b[12], epsilon);
  expect(a[13]).toBeCloseTo(b[13], epsilon);
  expect(a[14]).toBeCloseTo(b[14], epsilon);
  expect(a[15]).toBeCloseTo(b[15], epsilon);
};
const expectCloseTo = (a: Mat4, b: Mat4, epsilon: number = Number.EPSILON) => {
  expectArrayCloseTo(a.elements, b.elements, epsilon);
};

describe('Math - Mat4', () => {
  it('Instancing', () => {
    const mat = Mat4.new();
    expect(mat).toEqual(Mat4.new());

    mat.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    expect(mat.elements).toEqual([
      1, 5, 9, 13,

      2, 6, 10, 14,

      3, 7, 11, 15,

      4, 8, 12, 16,
    ]);

    mat.setRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    expect(mat.elements).toEqual([
      1, 2, 3, 4,

      5, 6, 7, 8,

      9, 10, 11, 12,

      13, 14, 15, 16,
    ]);

    const clone = Mat4.from(mat);

    expect(clone).toEqual(mat);
  });

  it('fromArray/intoArray', () => {
    const mat = Mat4.new();
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    mat.fromArray(array);
    expect(mat.elements).toEqual(array);

    const out = mat.intoArray();
    expect(out).toEqual(array);
  });

  it('fromEuler/fromRotation', () => {
    const euler = Euler.new(Math.random(), Math.random(), Math.random());
    const a = new Mat4();
    const b = new Mat4();

    for (const order of Euler.orders) {
      euler.order = order;

      a.asRotationFromEuler(euler);
      const q = Quaternion.fromEuler(euler);
      b.asRotationFromQuaternion(q);

      expectCloseTo(a, b);
    }
  });

  it('fromMat3', () => {
    const mat3 = Mat3.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);

    const mat4 = Mat4.fromMat3(mat3);

    expect(mat4.elements).toEqual([1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0, 0, 0, 0, 1]);
  });

  it('fromBasis/intoBasis', () => {
    const mat = Mat4.new();

    const xAxis = Vec3.new(1, 0, 0);
    const yAxis = Vec3.new(0, 1, 0);
    const zAxis = Vec3.new(0, 0, 1);

    mat.fromBasis(xAxis, yAxis, zAxis);

    const x = Vec3.new();
    const y = Vec3.new();
    const z = Vec3.new();

    mat.intoBasis(x, y, z);

    expect(x).toEqual(xAxis);
    expect(y).toEqual(yAxis);
    expect(z).toEqual(zAxis);
  });

  it('mul', () => {
    const a = Mat4.identity();
    const b = Mat4.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

    expect(a.mul(b)).toBe(a);
    expect(a).toEqual(b);
  });

  it('premul', () => {
    const a = Mat4.identity();
    const b = Mat4.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

    expect(b.premul(a)).toBe(b);
    expect(b).toEqual(Mat4.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16));
  });

  it('asIdentity', () => {
    const a = Mat4.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

    a.asIdentity();

    expect(a).toEqual(Mat4.identity());
  });

  it('asRotationFromEuler', () => {
    const a = Mat4.rotationFromEuler(Euler.new(0, 0, 0));

    expectCloseTo(a, Mat4.identity());

    a.asRotationFromEuler(Euler.new(1, 2, 3));

    const expected = Mat4.fromArray([
      0.411982245665683, -0.6812427202564033, 0.6051272472413688, 0, 0.05872664492762098, -0.642872836134547,
      -0.7637183366502791, 0, 0.9092974268256817, 0.35017548837401463, -0.2248450953661529, 0, 0, 0, 0, 1,
    ]);

    expectCloseTo(a, expected);
  });

  it('asRotationFromQuaternion', () => {
    const a = Mat4.rotationFromQuaternion(Quaternion.new());
    expectCloseTo(a, Mat4.identity());

    a.asRotationFromQuaternion(Quaternion.fromEuler(Euler.new(1, 2, 3, 'XYZ')));

    const expected = Mat4.fromArray([
      0.411982245665683, -0.6812427202564033, 0.6051272472413688, 0, 0.05872664492762098, -0.642872836134547,
      -0.7637183366502791, 0, 0.9092974268256817, 0.35017548837401463, -0.2248450953661529, 0, 0, 0, 0, 1,
    ]);

    expectCloseTo(a, expected);
  });

  it('asTranslation', () => {
    const a = Mat4.translation(1, 2, 3);

    expect(a.elements).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]);
  });

  it('asScale', () => {
    const a = Mat4.scale(1, 2, 3);

    expect(a.elements).toEqual([1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1]);
  });

  it('asShear', () => {
    const a = Mat4.shear(1, 2, 3, 4, 5, 6);

    expect(a.elements).toEqual([1, 1, 2, 0, 3, 1, 4, 0, 5, 6, 1, 0, 0, 0, 0, 1]);
  });

  it('asPerspective', () => {
    const a = Mat4.perspective(1, 2, 3, 4, 5, 6);

    expect(a.elements).toEqual([10, 0, 0, 0, 0, -10, 0, 0, 3, -7, -6, -1, 0, 0, -30, 0]);
  });

  it('asOrthographic', () => {
    const a = Mat4.orthographic(1, 2, 3, 4, 5, 6);

    expect(a.elements).toEqual([2, 0, 0, 0, 0, -2, 0, 0, 0, 0, -1, 0, -3, 7, -5, 1]);
  });

  it('asRotationX', () => {
    const a = Mat4.rotationX(Math.PI / 2);

    expectArrayCloseTo(a.elements, [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]);
  });

  it('asRotationY', () => {
    const a = Mat4.rotationY(Math.PI / 2);

    expectArrayCloseTo(a.elements, [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]);
  });

  it('asRotationZ', () => {
    const a = Mat4.rotationZ(Math.PI / 2);

    expectArrayCloseTo(a.elements, [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });

  it('asRotationAxis', () => {
    const a = Mat4.rotationAxis(Vec3.new(1, 0, 0), Math.PI / 2);

    expectArrayCloseTo(a.elements, [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]);
  });

  it('determinant', () => {
    const a = Mat4.identity();
    expect(a.determinant()).toBe(1);

    const b = Mat4.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    expect(b.determinant()).toBe(0);
  });

  it('transpose', () => {
    const a = Mat4.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    expect(a.transpose()).toBe(a);
    expect(a.elements).toEqual([1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);
  });

  it('scale', () => {
    const a = Mat4.identity();
    const s = Vec3.new(1, 2, 3);

    expect(a.mulVec(s)).toBe(a);
    expect(a.elements).toEqual([1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1]);
  });

  it('lookAt', () => {
    const eye = Vec3.new(0, 0, 0);
    const target = Vec3.new(0, 0, -1);
    const up = Vec3.new(0, 1, 0);

    const matrix = Mat4.lookAt(eye, target, up);

    expect(matrix).toEqual(Mat4.identity());
  });

  it('mulScalar', () => {
    const m = Mat4.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    const scalar = 2;

    m.mulScalar(scalar);

    expect(m.elements).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]);
  });

  it('getMaxScaleOnAxis', () => {
    const m = Mat4.scale(2, 3, 4);
    expect(m.maxScaleOnAxis()).toBeCloseTo(4);
  });

  it('extractRotation', () => {
    const m = Mat4.identity().mulVec(Vec3.new(1, 2, 3));
    const r = Mat4.identity().fromMat4Rotation(m);

    expect(r).toEqual(Mat4.identity());
  });

  it('compose/decompose', () => {
    const position = Vec3.new();
    const quaternion = Quaternion.identity();
    const scale = Vec3.new(1, 1, 1);

    const matrix = Mat4.compose(position, quaternion, scale);

    const position2 = Vec3.new();
    const quaternion2 = Quaternion.identity();
    const scale2 = Vec3.new();

    matrix.decompose(position2, quaternion2, scale2);

    expect(position2).toEqual(position);
    expect(quaternion2).toEqual(quaternion);
    expect(scale2).toEqual(scale);
  });

  it('setPosition', () => {
    const matrix = Mat4.translation(1, 2, 3);

    expect(matrix.elements[12]).toBe(1);
    expect(matrix.elements[13]).toBe(2);
    expect(matrix.elements[14]).toBe(3);
  });

  it('fromRotation', () => {
    const matrix = Mat4.rotationFromEuler(Euler.new(1, 2, 3));
    const quaternion = Quaternion.fromEuler(Euler.new(1, 2, 3));

    const matrix2 = Mat4.rotationFromQuaternion(quaternion);

    expectCloseTo(matrix, matrix2);
  });

  it('invert', () => {
    const zero = Mat4.fromColumnOrder(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const identity = Mat4.identity();

    const a = Mat4.new();
    const b = Mat4.fromColumnOrder(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    a.clone(b).invert();
    expect(a).toEqual(zero);

    const testMatrices = [
      Mat4.rotationX(0.3),
      Mat4.rotationX(-0.3),
      Mat4.rotationY(0.3),
      Mat4.rotationY(-0.3),
      Mat4.rotationZ(0.3),
      Mat4.rotationZ(-0.3),
      Mat4.scale(1, 2, 3),
      Mat4.scale(1 / 8, 1 / 2, 1 / 3),
      Mat4.perspective(-1, 1, 1, -1, 1, 1000),
      Mat4.perspective(-16, 16, 9, -9, 0.1, 10000),
      Mat4.translation(1, 2, 3),
    ];

    for (const m of testMatrices) {
      const mInverse = Mat4.from(m).invert();
      const mSelfInverse = Mat4.from(m).invert();

      expect(mSelfInverse).toEqual(mInverse);

      expect(m.determinant() * mInverse.determinant()).toBeCloseTo(1);

      const mProduct = Mat4.from(m).mul(mInverse);

      expect(mProduct.determinant()).toBeCloseTo(1);
      expectCloseTo(mProduct, identity);
    }
  });
});
