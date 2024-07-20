import { Matrix4 } from './Matrix4.js';
import { Vector3 } from './Vector3.js';
import { Vector2 } from './Vector2.js';

export interface Matrix {
  elements: number[];
  identity(): Matrix;
  copy(m: this): this;
  multiplyScalar(s: number): Matrix;
  determinant(): number;
  transpose(): Matrix;
  invert(): Matrix;
  clone(): Matrix;
}

export class Matrix3 implements Matrix {
  declare ['constructor']: typeof Matrix3;
  declare isMatrix3: true;

  elements: number[];

  constructor();
  constructor(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
  );
  constructor(
    n11?: number,
    n12?: number,
    n13?: number,
    n21?: number,
    n22?: number,
    n23?: number,
    n31?: number,
    n32?: number,
    n33?: number,
  ) {
    this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    if (n11 !== undefined) {
      this.set(n11, n12!, n13!, n21!, n22!, n23!, n31!, n32!, n33!);
    }
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
  ): Matrix3 {
    const te = this.elements;

    te[0] = n11;
    te[1] = n21;
    te[2] = n31;
    te[3] = n12;
    te[4] = n22;
    te[5] = n32;
    te[6] = n13;
    te[7] = n23;
    te[8] = n33;

    return this;
  }

  identity(): Matrix3 {
    this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);

    return this;
  }

  copy(matrix: Matrix3): this {
    const te = this.elements;
    const me = matrix.elements;

    te[0] = me[0];
    te[1] = me[1];
    te[2] = me[2];
    te[3] = me[3];
    te[4] = me[4];
    te[5] = me[5];
    te[6] = me[6];
    te[7] = me[7];
    te[8] = me[8];

    return this;
  }

  extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): Matrix3 {
    xAxis.setFromMatrix3Column(this, 0);
    yAxis.setFromMatrix3Column(this, 1);
    zAxis.setFromMatrix3Column(this, 2);

    return this;
  }

  setFromMatrix4(matrix: Matrix4): Matrix3 {
    const me = matrix.elements;

    this.set(me[0], me[4], me[8], me[1], me[5], me[9], me[2], me[6], me[10]);

    return this;
  }

  multiply(matrix: Matrix3): Matrix3 {
    return this.multiplyMatrices(this, matrix);
  }

  premultiply(matrix: Matrix3): Matrix3 {
    return this.multiplyMatrices(matrix, this);
  }

  multiplyMatrices(a: Matrix3, b: Matrix3): Matrix3 {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;

    const a11 = ae[0],
      a12 = ae[3],
      a13 = ae[6];
    const a21 = ae[1],
      a22 = ae[4],
      a23 = ae[7];
    const a31 = ae[2],
      a32 = ae[5],
      a33 = ae[8];

    const b11 = be[0],
      b12 = be[3],
      b13 = be[6];
    const b21 = be[1],
      b22 = be[4],
      b23 = be[7];
    const b31 = be[2],
      b32 = be[5],
      b33 = be[8];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31;
    te[3] = a11 * b12 + a12 * b22 + a13 * b32;
    te[6] = a11 * b13 + a12 * b23 + a13 * b33;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31;
    te[4] = a21 * b12 + a22 * b22 + a23 * b32;
    te[7] = a21 * b13 + a22 * b23 + a23 * b33;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31;
    te[5] = a31 * b12 + a32 * b22 + a33 * b32;
    te[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  multiplyScalar(scalar: number): Matrix3 {
    const te = this.elements;

    te[0] *= scalar;
    te[3] *= scalar;
    te[6] *= scalar;
    te[1] *= scalar;
    te[4] *= scalar;
    te[7] *= scalar;
    te[2] *= scalar;
    te[5] *= scalar;
    te[8] *= scalar;

    return this;
  }

  determinant(): number {
    const te = this.elements;

    const a = te[0],
      b = te[1],
      c = te[2],
      d = te[3],
      e = te[4],
      f = te[5],
      g = te[6],
      h = te[7],
      i = te[8];

    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  }

  invert(): Matrix3 {
    const te = this.elements,
      n11 = te[0],
      n21 = te[1],
      n31 = te[2],
      n12 = te[3],
      n22 = te[4],
      n32 = te[5],
      n13 = te[6],
      n23 = te[7],
      n33 = te[8],
      t11 = n33 * n22 - n32 * n23,
      t12 = n32 * n13 - n33 * n12,
      t13 = n23 * n12 - n22 * n13,
      det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n31 * n23 - n33 * n21) * detInv;
    te[2] = (n32 * n21 - n31 * n22) * detInv;

    te[3] = t12 * detInv;
    te[4] = (n33 * n11 - n31 * n13) * detInv;
    te[5] = (n31 * n12 - n32 * n11) * detInv;

    te[6] = t13 * detInv;
    te[7] = (n21 * n13 - n23 * n11) * detInv;
    te[8] = (n22 * n11 - n21 * n12) * detInv;

    return this;
  }

  transpose(): Matrix3 {
    let tmp;
    const m = this.elements;

    tmp = m[1];
    m[1] = m[3];
    m[3] = tmp;
    tmp = m[2];
    m[2] = m[6];
    m[6] = tmp;
    tmp = m[5];
    m[5] = m[7];
    m[7] = tmp;

    return this;
  }

  getNormalMatrix(matrix: Matrix4): Matrix3 {
    return this.setFromMatrix4(matrix).invert().transpose();
  }

  transposeIntoArray(array: number[]): Matrix3 {
    const m = this.elements;

    array[0] = m[0];
    array[1] = m[3];
    array[2] = m[6];
    array[3] = m[1];
    array[4] = m[4];
    array[5] = m[7];
    array[6] = m[2];
    array[7] = m[5];
    array[8] = m[8];

    return this;
  }

  setUvTransform(
    transformX: number,
    transformY: number,
    scaleX: number,
    scaleY: number,
    rotation: number,
    centerX: number,
    centerY: number,
  ): Matrix3 {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    this.set(
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

    return this;
  }

  scale(scaleX: number, scaleY: number): Matrix3 {
    this.premultiply(new Matrix3().makeScale(scaleX, scaleY));

    return this;
  }

  rotate(theta: number): Matrix3 {
    this.premultiply(new Matrix3().makeRotation(-theta));

    return this;
  }

  translate(x: number, y: number): Matrix3 {
    this.premultiply(new Matrix3().makeTranslation(x, y));

    return this;
  }

  makeTranslation(x: number | Vector2, y?: number): this {
    if (x instanceof Vector2) {
      this.set(1, 0, x.x, 0, 1, x.y, 0, 0, 1);
    } else {
      this.set(1, 0, x, 0, 1, y!, 0, 0, 1);
    }

    return this;
  }

  makeRotation(theta: number): Matrix3 {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    this.set(c, -s, 0, s, c, 0, 0, 0, 1);

    return this;
  }

  makeScale(x: number, y: number): Matrix3 {
    this.set(x, 0, 0, 0, y, 0, 0, 0, 1);

    return this;
  }

  equals(matrix: Matrix3): boolean {
    const te = this.elements;
    const me = matrix.elements;

    for (let i = 0; i < 9; i++) {
      if (te[i] !== me[i]) return false;
    }

    return true;
  }

  fromArray(array: number[], offset: number = 0): Matrix3 {
    for (let i = 0; i < 9; i++) {
      this.elements[i] = array[i + offset];
    }

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    const te = this.elements;

    array[offset] = te[0];
    array[offset + 1] = te[1];
    array[offset + 2] = te[2];

    array[offset + 3] = te[3];
    array[offset + 4] = te[4];
    array[offset + 5] = te[5];

    array[offset + 6] = te[6];
    array[offset + 7] = te[7];
    array[offset + 8] = te[8];

    return array;
  }

  clone(): Matrix3 {
    return new this.constructor().fromArray(this.elements);
  }
}
Matrix3.prototype.isMatrix3 = true;
