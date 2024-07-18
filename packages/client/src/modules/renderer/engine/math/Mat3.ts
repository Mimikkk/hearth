import type { Mat4 } from './Mat4.js';
import type { Vec3 } from './Vec3.js';
import type { Const } from '@modules/renderer/engine/math/types.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class Mat3 {
  declare isMat3: true;

  constructor(public elements: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {}

  static new(elements: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]): Mat3 {
    return new Mat3(elements);
  }

  static empty(): Mat3 {
    return Mat3.new();
  }

  static clone(matrix: Const<Mat3>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.from(matrix);
  }

  static is(matrix: any): matrix is Mat3 {
    return matrix?.isMat3 === true;
  }

  static into(into: Mat3, matrix: Const<Mat3>): Mat3 {
    return into.from(matrix);
  }

  static from(matrix: Const<Mat3>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.from(matrix);
  }

  static fromArray(array: number[], offset: number = 0, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromArray(array, offset);
  }

  static fromColumnOrder(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
    into: Mat3 = Mat3.empty(),
  ): Mat3 {
    return into.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);
  }

  static fromRowOrder(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
    into: Mat3 = Mat3.empty(),
  ): Mat3 {
    return into.set(n11, n21, n31, n12, n22, n32, n13, n23, n33);
  }

  static fromMat4(matrix: Const<Mat4>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromMat4(matrix);
  }

  static fromMat4Normal(matrix: Const<Mat4>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromMat4Normal(matrix);
  }

  static rotation(theta: number, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromRotation(theta);
  }

  static scale(scale: Const<Vec2>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromScale(scale);
  }

  static translation(translation: Const<Vec2>, into: Mat3 = Mat3.empty()): Mat3 {
    return into.fromTranslation(translation);
  }

  set(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
  ): this {
    const { elements } = this;
    elements[0] = n11;
    elements[1] = n21;
    elements[2] = n31;
    elements[3] = n12;
    elements[4] = n22;
    elements[5] = n32;
    elements[6] = n13;
    elements[7] = n23;
    elements[8] = n33;

    return this;
  }

  identity(): this {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  from({ elements: e }: Const<Mat3>): this {
    return this.set(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]);
  }

  extractBasis(xAxis: Vec3, yAxis: Vec3, zAxis: Vec3): this {
    xAxis.fromMat3Column(this, 0);
    yAxis.fromMat3Column(this, 1);
    zAxis.fromMat3Column(this, 2);
    return this;
  }

  fromElements(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
  ): this {
    return this.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);
  }

  fromMat4(matrix: Const<Mat4>): this {
    const e = matrix.elements;
    return this.set(e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]);
  }

  fromMat4Normal(matrix: Const<Mat4>): this {
    return this.fromMat4(matrix).invert().transpose();
  }

  fromArray(array: NumberArray, offset: number = 0): Mat3 {
    for (let i = 0; i < 9; i++) {
      this.elements[i] = array[i + offset];
    }

    return this;
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    const { elements: e } = this;

    array[offset + 0] = e[0];
    array[offset + 1] = e[1];
    array[offset + 2] = e[2];
    array[offset + 3] = e[3];
    array[offset + 4] = e[4];
    array[offset + 5] = e[5];
    array[offset + 6] = e[6];
    array[offset + 7] = e[7];
    array[offset + 8] = e[8];
    return array;
  }

  fromTranslation({ x, y }: Const<Vec2>): this {
    return this.set(1, 0, x, 0, 1, y, 0, 0, 1);
  }

  fromRotation(theta: number): Mat3 {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return this.set(c, -s, 0, s, c, 0, 0, 0, 1);
  }

  fromScale({ x, y }: Const<Vec2>): Mat3 {
    return this.set(x, 0, 0, 0, y, 0, 0, 0, 1);
  }

  mul(mat: Const<Mat3>): this {
    return multiply(this, mat, this) as this;
  }

  premul(mat: Const<Mat3>): this {
    return multiply(mat, this, this) as this;
  }

  mulScalar(scalar: number): this {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8] = this.elements;
    return this.set(
      e0 * scalar,
      e1 * scalar,
      e2 * scalar,
      e3 * scalar,
      e4 * scalar,
      e5 * scalar,
      e6 * scalar,
      e7 * scalar,
      e8 * scalar,
    );
  }

  divScalar(scalar: number): this {
    return this.mulScalar(1 / scalar);
  }

  determinant(): number {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8] = this.elements;

    return e0 * e4 * e8 - e0 * e5 * e7 - e1 * e3 * e8 + e1 * e5 * e6 + e2 * e3 * e7 - e2 * e4 * e6;
  }

  invert(): this {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8] = this.elements;
    const t1 = e8 * e4 - e5 * e7;
    const t2 = e5 * e6 - e8 * e3;
    const t3 = e7 * e3 - e4 * e6;
    const det = e0 * t1 + e1 * t2 + e2 * t3;

    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const inv = 1 / det;

    return this.set(
      t1 * inv,
      (e2 * e7 - e8 * e1) * inv,
      (e5 * e1 - e2 * e4) * inv,
      t2 * inv,
      (e8 * e0 - e2 * e6) * inv,
      (e2 * e3 - e5 * e0) * inv,
      t3 * inv,
      (e1 * e6 - e7 * e0) * inv,
      (e4 * e0 - e1 * e3) * inv,
    );
  }

  transpose(): this {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8] = this.elements;

    return this.set(e0, e3, e6, e1, e4, e7, e2, e5, e8);
  }

  asUvTransform(
    transformX: number,
    transformY: number,
    scaleX: number,
    scaleY: number,
    rotation: number,
    centerX: number,
    centerY: number,
  ): Mat3 {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    return this.set(
      scaleX * cosine,
      scaleX * sine,
      -scaleX * (cosine * centerX + sine * centerY) + centerX + transformX,
      -scaleY * sine,
      scaleY * cosine,
      -scaleY * (-sine * centerX + cosine * centerY) + centerY + transformY,
      0,
      0,
      1,
    );
  }

  scale(scale: Const<Vec2>): Mat3 {
    return this.premul(_mat.fromScale(scale));
  }

  rotate(theta: number): Mat3 {
    return this.premul(_mat.fromRotation(-theta));
  }

  translate(translation: Const<Vec2>): Mat3 {
    return this.premul(_mat.fromTranslation(translation));
  }

  equals(matrix: Const<Mat3>): boolean {
    const te = this.elements;
    const me = matrix.elements;

    for (let i = 0; i < 9; i++) {
      if (te[i] !== me[i]) return false;
    }

    return true;
  }

  clone(): Mat3 {
    return Mat3.from(this);
  }
}

Mat3.prototype.isMat3 = true;

const _mat = Mat3.new();

function multiply(a: Const<Mat3>, b: Const<Mat3>, into: Mat3 = Mat3.new()): Mat3 {
  const ae = a.elements;
  const be = b.elements;

  const a11 = ae[0];
  const a12 = ae[3];
  const a13 = ae[6];
  const a21 = ae[1];
  const a22 = ae[4];
  const a23 = ae[7];
  const a31 = ae[2];
  const a32 = ae[5];
  const a33 = ae[8];

  const b11 = be[0];
  const b12 = be[3];
  const b13 = be[6];
  const b21 = be[1];
  const b22 = be[4];
  const b23 = be[7];
  const b31 = be[2];
  const b32 = be[5];
  const b33 = be[8];

  return into.set(
    a11 * b11 + a12 * b21 + a13 * b31,
    a21 * b11 + a22 * b21 + a23 * b31,
    a11 * b12 + a12 * b22 + a13 * b32,
    a31 * b11 + a32 * b21 + a33 * b31,
    a31 * b12 + a32 * b22 + a33 * b32,
    a21 * b12 + a22 * b22 + a23 * b32,
    a11 * b13 + a12 * b23 + a13 * b33,
    a21 * b13 + a22 * b23 + a23 * b33,
    a31 * b13 + a32 * b23 + a33 * b33,
  );
}
