import { describe, expect, it } from 'vitest';
import { Mat3 } from './Mat3.js';
import { Mat4 } from './Mat4.js';
import { Vec2 } from './Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

describe('Math - Mat3', () => {
  it('Instancing', () => {
    const a = Mat3.empty();
    expect(a.elements).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    const b = Mat3.clone(a);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);

    const c = Mat3.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);
    expect(c.elements).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);

    const d = Mat3.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);
    expect(d.elements).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('fromArray/intoArray', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const a = Mat3.fromArray(array);

    expect(a.elements).toEqual(array);

    const array2: number[] = [];
    a.intoArray(array2);

    expect(array2).toEqual(array);
  });
  //
  it('fromMat4', () => {
    const mat4 = Mat4.fromColumnOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    const mat3 = Mat3.fromMat4(mat4);

    expect(mat3.elements).toEqual([1, 5, 9, 2, 6, 10, 3, 7, 11]);
  });

  it('fromMat4Normal', () => {
    const a = Mat4.scale(2, 3, 4);
    const n = Mat3.fromNMat4(a);

    expect(n.elements).toEqual([0.5, 0, 0, 0, 1 / 3, 0, 0, 0, 0.25]);
  });

  it('fromBasis/intoBasis', () => {
    const a = Mat3.new();
    const xAxis = Vec3.new(0, 1, 0);
    const yAxis = Vec3.new(1, 0, 0);
    const zAxis = Vec3.new(0, 0, 1);

    const x = Vec3.new();
    const y = Vec3.new();
    const z = Vec3.new();

    a.fromBasis(xAxis, yAxis, zAxis);
    a.intoBasis(x, y, z);

    expect(xAxis).toEqual(x);
    expect(yAxis).toEqual(y);
    expect(zAxis).toEqual(z);
  });

  it('invert', () => {
    const zero = Mat3.fromColumnOrder(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const identity = Mat3.identity();

    const a = Mat3.new();
    const b = Mat3.fromColumnOrder(0, 0, 0, 0, 0, 0, 0, 0, 0);

    a.from(b).invert();
    expect(a).toEqual(zero);

    const testMatrices = [
      Mat3.rotation(0.3),
      Mat3.rotation(-0.3),
      Mat3.scale(Vec2.new(2, 3)),
      Mat3.scale(Vec2.new(1 / 8, 1 / 2)),
    ];

    for (const m of testMatrices) {
      const mInverse = Mat3.from(m).invert();
      const mProduct = Mat3.from(m).mul(mInverse);

      expect(mProduct).toEqual(identity);
    }
  });

  it('fromTranslation', () => {
    const a = Mat3.translation(Vec2.new(1, 2));

    expect(a.elements).toEqual([1, 0, 0, 0, 1, 0, 1, 2, 1]);
  });

  it('fromRotation', () => {
    const a = Mat3.rotation(Math.PI / 2);
    const expected = Mat3.fromRowOrder(
      Math.cos(Math.PI / 2),
      Math.sin(Math.PI / 2),
      0,
      -Math.sin(Math.PI / 2),
      Math.cos(Math.PI / 2),
      0,
      0,
      0,
      1,
    );

    expect(a).toEqual(expected);
  });

  it('fromScale', () => {
    const a = Mat3.scale(Vec2.new(2, 3));

    expect(a.elements).toEqual([2, 0, 0, 0, 3, 0, 0, 0, 1]);
  });

  it('mul', () => {
    const a = Mat3.rotation(Math.PI / 4);
    const b = Mat3.scale(Vec2.new(2, 3));

    const expected = Mat3.fromRowOrder(
      1.4142135623730951,
      1.414213562373095,
      0,
      -2.1213203435596424,
      2.121320343559643,
      0,
      0,
      0,
      1,
    );

    expect(a.mul(b)).toEqual(expected);
  });

  it('premul', () => {
    const a = Mat3.rotation(Math.PI / 4);
    const b = Mat3.scale(Vec2.new(2, 3));

    const expected = Mat3.fromRowOrder(
      1.4142135623730951,
      1.414213562373095,
      0,
      -2.1213203435596424,
      2.121320343559643,
      0,
      0,
      0,
      1,
    );

    expect(b.premul(a)).toEqual(expected);
  });

  it('mulScalar', () => {
    const a = Mat3.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);
    a.mulScalar(2);

    expect(a.elements).toEqual([2, 8, 14, 4, 10, 16, 6, 12, 18]);
  });

  it('determinant', () => {
    expect(Mat3.identity().determinant()).toBe(1);
    expect(Mat3.scale(Vec2.new(2, 3)).determinant()).toBe(6);
    expect(Mat3.fromColumnOrder(2, 3, 5, 7, 11, 13, 17, 19, 23).determinant()).toBe(-78);
  });

  it('transpose', () => {
    const a = Mat3.fromRowOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);
    a.transpose();

    expect(a.elements).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it('divScalar', () => {
    const a = Mat3.fromRowOrder(2, 4, 6, 8, 10, 12, 14, 16, 18);
    a.divScalar(2);

    expect(a.elements).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it('scale', () => {
    const a = Mat3.identity();
    a.scale(Vec2.new(2, 3));

    expect(a.elements).toEqual([2, 0, 0, 0, 3, 0, 0, 0, 1]);
  });

  it('rotate', () => {
    const a = Mat3.identity();
    a.rotate(Math.PI / 2);

    const cos = Math.cos(-Math.PI / 2);
    const sin = Math.sin(-Math.PI / 2);
    const expected = Mat3.fromRowOrder(cos, sin, 0, -sin, cos, 0, 0, 0, 1);

    expect(a).toEqual(expected);
  });

  it('translate', () => {
    const a = Mat3.identity();
    a.translate(Vec2.new(2, 3));

    expect(a.elements).toEqual([1, 0, 0, 0, 1, 0, 2, 3, 1]);
  });
});
