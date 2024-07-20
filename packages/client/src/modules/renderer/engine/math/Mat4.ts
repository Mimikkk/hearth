import { CoordinateSystem } from '../constants.js';
import { Vec3 } from './Vec3.js';
import { Mat3 } from './Mat3.js';
import type { Euler } from '@modules/renderer/engine/math/Euler.js';
import type { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

export class Mat4 {
  declare isMat4: true;

  constructor(public elements: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {}

  static new(elements: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]): Mat4 {
    return new Mat4(elements);
  }

  static empty(): Mat4 {
    return Mat4.new();
  }

  static identity(into = Mat4.new()): Mat4 {
    return into.asIdentity();
  }

  static clone(from: Const<Mat4>, into: Mat4 = Mat4.new()): Mat4 {
    return into.from(from);
  }

  static is(value: any): value is Mat4 {
    return value?.isMat4 === true;
  }

  static from(value: Const<Mat4>, into: Mat4 = Mat4.new()): Mat4 {
    return into.from(value);
  }

  static fromMat3(value: Const<Mat3>, into: Mat4 = Mat4.new()): Mat4 {
    return into.fromMat3(value);
  }

  static fromBasis(xAxis: Const<Vec3>, yAxis: Const<Vec3>, zAxis: Const<Vec3>, into: Mat4 = Mat4.new()): Mat4 {
    return into.fromBasis(xAxis, yAxis, zAxis);
  }

  static fromColumnOrder(
    n11: number,
    n12: number,
    n13: number,
    n14: number,
    n21: number,
    n22: number,
    n23: number,
    n24: number,
    n31: number,
    n32: number,
    n33: number,
    n34: number,
    n41: number,
    n42: number,
    n43: number,
    n44: number,
    into: Mat4 = Mat4.new(),
  ): Mat4 {
    return into.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
  }

  static fromRowOrder(
    n11: number,
    n12: number,
    n13: number,
    n14: number,
    n21: number,
    n22: number,
    n23: number,
    n24: number,
    n31: number,
    n32: number,
    n33: number,
    n34: number,
    n41: number,
    n42: number,
    n43: number,
    n44: number,
    into: Mat4 = Mat4.new(),
  ): Mat4 {
    return into.setRowOrder(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
  }

  static fromArray(array: Const<NumberArray>, offset = 0, into = Mat4.new()): Mat4 {
    return into.fromArray(array, offset);
  }

  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
    into = Mat4.new(),
  ): Mat4 {
    return into.asOrthographic(left, right, bottom, top, near, far);
  }

  static perspective(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
    into = Mat4.new(),
  ): Mat4 {
    return into.asPerspective(left, right, bottom, top, near, far);
  }

  static scale(x: number, y: number, z: number, into = Mat4.new()): Mat4 {
    return into.asScale(x, y, z);
  }

  static shear(xy: number, xz: number, yx: number, yz: number, zx: number, zy: number, into = Mat4.new()): Mat4 {
    return into.asShear(xy, xz, yx, yz, zx, zy);
  }

  static translation(x: number, y: number, z: number, into = Mat4.new()): Mat4 {
    return into.asTranslation(x, y, z);
  }

  static rotationX(theta: number, into = Mat4.new()): Mat4 {
    return into.asRotationX(theta);
  }

  static rotationY(theta: number, into = Mat4.new()): Mat4 {
    return into.asRotationY(theta);
  }

  static rotationZ(theta: number, into = Mat4.new()): Mat4 {
    return into.asRotationZ(theta);
  }

  static rotationAxis(axis: Const<Vec3>, angle: number, into = Mat4.new()): Mat4 {
    return into.asRotationAxis(axis, angle);
  }

  static rotationFromEuler(euler: Const<Euler>, into = Mat4.new()): Mat4 {
    return into.asRotationFromEuler(euler);
  }

  static rotationFromQuaternion(quaternion: Const<Quaternion>, into = Mat4.new()): Mat4 {
    return into.asRotationFromQuaternion(quaternion);
  }

  static lookAt(eye: Const<Vec3>, target: Const<Vec3>, up: Const<Vec3>, into = Mat4.new()): Mat4 {
    return into.lookAt(eye, target, up);
  }

  static compose(position: Const<Vec3>, quaternion: Const<Quaternion>, scale: Const<Vec3>, into = Mat4.new()): Mat4 {
    return into.compose(position, quaternion, scale);
  }

  static fromRotation(rotation: Const<Mat4>, into = Mat4.new()): Mat4 {
    return into.extractRotation(rotation);
  }

  set(
    n11: number,
    n12: number,
    n13: number,
    n14: number,
    n21: number,
    n22: number,
    n23: number,
    n24: number,
    n31: number,
    n32: number,
    n33: number,
    n34: number,
    n41: number,
    n42: number,
    n43: number,
    n44: number,
  ): this {
    const e = this.elements;

    e[0] = n11;
    e[1] = n21;
    e[2] = n31;
    e[3] = n41;
    e[4] = n12;
    e[5] = n22;
    e[6] = n32;
    e[7] = n42;
    e[8] = n13;
    e[9] = n23;
    e[10] = n33;
    e[11] = n43;
    e[12] = n14;
    e[13] = n24;
    e[14] = n34;
    e[15] = n44;

    return this;
  }

  setColumnOrder(
    n11: number,
    n12: number,
    n13: number,
    n14: number,
    n21: number,
    n22: number,
    n23: number,
    n24: number,
    n31: number,
    n32: number,
    n33: number,
    n34: number,
    n41: number,
    n42: number,
    n43: number,
    n44: number,
  ): this {
    return this.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
  }

  setRowOrder(
    n11: number,
    n21: number,
    n31: number,
    n41: number,
    n12: number,
    n22: number,
    n32: number,
    n42: number,
    n13: number,
    n23: number,
    n33: number,
    n43: number,
    n14: number,
    n24: number,
    n34: number,
    n44: number,
  ): this {
    return this.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
  }

  clone(into = Mat4.new()): Mat4 {
    return into.from(this);
  }

  from({ elements }: Const<Mat4>): this {
    return this.fromArray(elements);
  }

  fromPosition({ elements: me }: Const<Mat4>): this {
    const te = this.elements;

    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];

    return this;
  }

  fromMat3({ elements: [m11, m12, m13, m21, m22, m23, m31, m32, m33] }: Const<Mat3>): this {
    return this.set(m11, m12, m13, 0, m21, m22, m23, 0, m31, m32, m33, 0, 0, 0, 0, 1);
  }

  intoBasis(xAxis: Vec3, yAxis: Vec3, zAxis: Vec3): this {
    xAxis.fromMat4Column(this, 0);
    yAxis.fromMat4Column(this, 1);
    zAxis.fromMat4Column(this, 2);
    return this;
  }

  fromBasis(xAxis: Const<Vec3>, yAxis: Const<Vec3>, zAxis: Const<Vec3>): this {
    this.set(xAxis.x, yAxis.x, zAxis.x, 0, xAxis.y, yAxis.y, zAxis.y, 0, xAxis.z, yAxis.z, zAxis.z, 0, 0, 0, 0, 1);

    return this;
  }

  extractRotation(mat: Const<Mat4>): this {
    const scaleX = 1 / Vec3.fromMat4Column(mat, 0).length();
    const scaleY = 1 / Vec3.fromMat4Column(mat, 1).length();
    const scaleZ = 1 / Vec3.fromMat4Column(mat, 2).length();
    const [e0, e1, e2, , e4, e5, e6, , e8, e9, e10] = mat.elements;

    return this.setColumnOrder(
      e0 * scaleX,
      e1 * scaleX,
      e2 * scaleX,
      0,
      e4 * scaleY,
      e5 * scaleY,
      e6 * scaleY,
      0,
      e8 * scaleZ,
      e9 * scaleZ,
      e10 * scaleZ,
      0,
      0,
      0,
      0,
      1,
    );
  }

  lookAt(eye: Const<Vec3>, target: Const<Vec3>, up: Const<Vec3>): this {
    const te = this.elements;

    const _z = Vec3.from(eye).sub(target);

    if (_z.lengthSq() === 0) {
      // eye and target are in the same position

      _z.z = 1;
    }

    _z.normalize();
    const _x = Vec3.from(up).cross(_z);

    if (_x.lengthSq() === 0) {
      // up and z are parallel

      if (Math.abs(up.z) === 1) {
        _z.x += 0.0001;
      } else {
        _z.z += 0.0001;
      }

      _z.normalize();
      _x.from(up).cross(_z);
    }

    _x.normalize();
    const _y = Vec3.from(_z).cross(_x);

    te[0] = _x.x;
    te[4] = _y.x;
    te[8] = _z.x;
    te[1] = _x.y;
    te[5] = _y.y;
    te[9] = _z.y;
    te[2] = _x.z;
    te[6] = _y.z;
    te[10] = _z.z;

    return this;
  }

  mul(mat: Const<Mat4>): this {
    return multiply(this, mat, this) as this;
  }

  premul(mat: Const<Mat4>): this {
    return multiply(mat, this, this) as this;
  }

  mulScalar(scalar: number): this {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15] = this.elements;

    return this.setRowOrder(
      e0 * scalar,
      e1 * scalar,
      e2 * scalar,
      e3 * scalar,
      e4 * scalar,
      e5 * scalar,
      e6 * scalar,
      e7 * scalar,
      e8 * scalar,
      e9 * scalar,
      e10 * scalar,
      e11 * scalar,
      e12 * scalar,
      e13 * scalar,
      e14 * scalar,
      e15 * scalar,
    );
  }

  determinant(): number {
    const te = this.elements;

    const n11 = te[0];
    const n12 = te[4];
    const n13 = te[8];
    const n14 = te[12];
    const n21 = te[1];
    const n22 = te[5];
    const n23 = te[9];
    const n24 = te[13];
    const n31 = te[2];
    const n32 = te[6];
    const n33 = te[10];
    const n34 = te[14];
    const n41 = te[3];
    const n42 = te[7];
    const n43 = te[11];
    const n44 = te[15];

    return (
      n41 *
        (+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
      n42 *
        (+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
      n43 *
        (+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
      n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
    );
  }

  transpose(): this {
    const [e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15] = this.elements;
    return this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
  }

  setPosition({ x, y, z }: Const<Vec3>): this {
    const e = this.elements;
    e[12] = x;
    e[13] = y;
    e[14] = z;
    return this;
  }

  invert(): this {
    // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
    const te = this.elements,
      n11 = te[0],
      n21 = te[1],
      n31 = te[2],
      n41 = te[3],
      n12 = te[4],
      n22 = te[5],
      n32 = te[6],
      n42 = te[7],
      n13 = te[8],
      n23 = te[9],
      n33 = te[10],
      n43 = te[11],
      n14 = te[12],
      n24 = te[13],
      n34 = te[14],
      n44 = te[15],
      t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
      t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
      t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
      t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] =
      (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
      detInv;
    te[2] =
      (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
      detInv;
    te[3] =
      (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
      detInv;

    te[4] = t12 * detInv;
    te[5] =
      (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
      detInv;
    te[6] =
      (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
      detInv;
    te[7] =
      (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
      detInv;

    te[8] = t13 * detInv;
    te[9] =
      (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
      detInv;
    te[10] =
      (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
      detInv;
    te[11] =
      (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
      detInv;

    te[12] = t14 * detInv;
    te[13] =
      (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
      detInv;
    te[14] =
      (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
      detInv;
    te[15] =
      (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
      detInv;

    return this;
  }

  scale(v: Const<Vec3>): this {
    const te = this.elements;
    const x = v.x,
      y = v.y,
      z = v.z;

    te[0] *= x;
    te[4] *= y;
    te[8] *= z;
    te[1] *= x;
    te[5] *= y;
    te[9] *= z;
    te[2] *= x;
    te[6] *= y;
    te[10] *= z;
    te[3] *= x;
    te[7] *= y;
    te[11] *= z;

    return this;
  }

  maxScaleOnAxis(): number {
    const [e0, e1, e2, , e4, e5, e6, , e8, e9, e10] = this.elements;

    const scaleXSq = e0 * e0 + e1 * e1 + e2 * e2;
    const scaleYSq = e4 * e4 + e5 * e5 + e6 * e6;
    const scaleZSq = e8 * e8 + e9 * e9 + e10 * e10;

    return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
  }

  asRotationFromEuler(euler: Const<Euler>): this {
    const te = this.elements;

    const { x, y, z } = euler;
    const a = Math.cos(x);
    const b = Math.sin(x);
    const c = Math.cos(y);
    const d = Math.sin(y);
    const e = Math.cos(z);
    const f = Math.sin(z);

    if (euler.order === 'XYZ') {
      const ae = a * e;
      const af = a * f;
      const be = b * e;
      const bf = b * f;

      te[0] = c * e;
      te[1] = af + be * d;
      te[2] = bf - ae * d;

      te[4] = -c * f;
      te[5] = ae - bf * d;
      te[6] = be + af * d;

      te[8] = d;
      te[9] = -b * c;
      te[10] = a * c;
    } else if (euler.order === 'YXZ') {
      const ce = c * e,
        cf = c * f,
        de = d * e,
        df = d * f;

      te[0] = ce + df * b;
      te[4] = de * b - cf;
      te[8] = a * d;

      te[1] = a * f;
      te[5] = a * e;
      te[9] = -b;

      te[2] = cf * b - de;
      te[6] = df + ce * b;
      te[10] = a * c;
    } else if (euler.order === 'ZXY') {
      const ce = c * e,
        cf = c * f,
        de = d * e,
        df = d * f;

      te[0] = ce - df * b;
      te[4] = -a * f;
      te[8] = de + cf * b;

      te[1] = cf + de * b;
      te[5] = a * e;
      te[9] = df - ce * b;

      te[2] = -a * d;
      te[6] = b;
      te[10] = a * c;
    } else if (euler.order === 'ZYX') {
      const ae = a * e,
        af = a * f,
        be = b * e,
        bf = b * f;

      te[0] = c * e;
      te[4] = be * d - af;
      te[8] = ae * d + bf;

      te[1] = c * f;
      te[5] = bf * d + ae;
      te[9] = af * d - be;

      te[2] = -d;
      te[6] = b * c;
      te[10] = a * c;
    } else if (euler.order === 'YZX') {
      const ac = a * c,
        ad = a * d,
        bc = b * c,
        bd = b * d;

      te[0] = c * e;
      te[4] = bd - ac * f;
      te[8] = bc * f + ad;

      te[1] = f;
      te[5] = a * e;
      te[9] = -b * e;

      te[2] = -d * e;
      te[6] = ad * f + bc;
      te[10] = ac - bd * f;
    } else if (euler.order === 'XZY') {
      const ac = a * c,
        ad = a * d,
        bc = b * c,
        bd = b * d;

      te[0] = c * e;
      te[4] = -f;
      te[8] = d * e;

      te[1] = ac * f + bd;
      te[5] = a * e;
      te[9] = ad * f - bc;

      te[2] = bc * f - ad;
      te[6] = b * e;
      te[10] = bd * f + ac;
    }

    // bottom row
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;

    // last column
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;

    return this;
  }

  asRotationFromQuaternion(quaternion: Const<Quaternion>): this {
    return this.compose(zero, quaternion, one);
  }

  asTranslation(x: number, y: number, z: number): this {
    return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
  }

  asRotationX(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
  }

  asRotationY(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
  }

  asRotationZ(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  asRotationAxis(axis: Const<Vec3>, angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const x = axis.x;
    const y = axis.y;
    const z = axis.z;
    const tx = t * x;
    const ty = t * y;

    return this.set(
      tx * x + c,
      tx * y - s * z,
      tx * z + s * y,
      0,
      tx * y + s * z,
      ty * y + c,
      ty * z - s * x,
      0,
      tx * z - s * y,
      ty * z + s * x,
      t * z * z + c,
      0,
      0,
      0,
      0,
      1,
    );
  }

  asScale(x: number, y: number, z: number): this {
    return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
  }

  asShear(xy: number, xz: number, yx: number, yz: number, zx: number, zy: number): this {
    return this.set(1, yx, zx, 0, xy, 1, zy, 0, xz, yz, 1, 0, 0, 0, 0, 1);
  }

  compose(position: Const<Vec3>, quaternion: Const<Quaternion>, scale: Const<Vec3>): this {
    const te = this.elements;

    const x = quaternion.x,
      y = quaternion.y,
      z = quaternion.z,
      w = quaternion.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    const sx = scale.x,
      sy = scale.y,
      sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;

    return this;
  }

  decompose(position: Vec3, quaternion: Quaternion, scale: Vec3): this {
    const te = this.elements;

    let sx = new Vec3(te[0], te[1], te[2]).length();
    const sy = new Vec3(te[4], te[5], te[6]).length();
    const sz = new Vec3(te[8], te[9], te[10]).length();

    // if determine is negative, we need to invert one scale
    const det = this.determinant();
    if (det < 0) sx = -sx;

    position.x = te[12];
    position.y = te[13];
    position.z = te[14];

    // scale the rotation part
    const _m1 = new Mat4().from(this);

    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    _m1.elements[0] *= invSX;
    _m1.elements[1] *= invSX;
    _m1.elements[2] *= invSX;

    _m1.elements[4] *= invSY;
    _m1.elements[5] *= invSY;
    _m1.elements[6] *= invSY;

    _m1.elements[8] *= invSZ;
    _m1.elements[9] *= invSZ;
    _m1.elements[10] *= invSZ;

    quaternion.fromRotation(_m1);

    scale.x = sx;
    scale.y = sy;
    scale.z = sz;

    return this;
  }

  asIdentity(): this {
    this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

    return this;
  }

  asPerspective(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
    coordinateSystem: CoordinateSystem = CoordinateSystem.WebGL,
  ): this {
    const te = this.elements;
    const x = (2 * near) / (right - left);
    const y = (2 * near) / (top - bottom);

    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);

    let c, d;

    if (coordinateSystem === CoordinateSystem.WebGL) {
      c = -(far + near) / (far - near);
      d = (-2 * far * near) / (far - near);
    } else if (coordinateSystem === CoordinateSystem.WebGPU) {
      c = -far / (far - near);
      d = (-far * near) / (far - near);
    } else {
      throw new Error('engine.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem);
    }

    te[0] = x;
    te[4] = 0;
    te[8] = a;
    te[12] = 0;
    te[1] = 0;
    te[5] = y;
    te[9] = b;
    te[13] = 0;
    te[2] = 0;
    te[6] = 0;
    te[10] = c;
    te[14] = d;
    te[3] = 0;
    te[7] = 0;
    te[11] = -1;
    te[15] = 0;

    return this;
  }

  asOrthographic(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
    coordinateSystem: CoordinateSystem = CoordinateSystem.WebGL,
  ): this {
    const te = this.elements;
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const p = 1.0 / (far - near);

    const x = (right + left) * w;
    const y = (top + bottom) * h;

    let z, zInv;

    if (coordinateSystem === CoordinateSystem.WebGL) {
      z = (far + near) * p;
      zInv = -2 * p;
    } else if (coordinateSystem === CoordinateSystem.WebGPU) {
      z = near * p;
      zInv = -1 * p;
    } else {
      throw new Error('engine.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem);
    }

    te[0] = 2 * w;
    te[4] = 0;
    te[8] = 0;
    te[12] = -x;
    te[1] = 0;
    te[5] = 2 * h;
    te[9] = 0;
    te[13] = -y;
    te[2] = 0;
    te[6] = 0;
    te[10] = zInv;
    te[14] = -z;
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[15] = 1;

    return this;
  }

  equals(matrix: Mat4): boolean {
    const te = this.elements;
    const me = matrix.elements;

    if (te[0] !== me[0] || te[1] !== me[1] || te[2] !== me[2] || te[3] !== me[3]) return false;
    if (te[4] !== me[4] || te[5] !== me[5] || te[6] !== me[6] || te[7] !== me[7]) return false;
    if (te[8] !== me[8] || te[9] !== me[9] || te[10] !== me[10] || te[11] !== me[11]) return false;
    if (te[12] !== me[12] || te[13] !== me[13] || te[14] !== me[14] || te[15] !== me[15]) return false;
    return true;
  }

  fromArray(from: Const<NumberArray>, offset: number = 0): this {
    return this.setRowOrder(
      from[offset],
      from[offset + 1],
      from[offset + 2],
      from[offset + 3],
      from[offset + 4],
      from[offset + 5],
      from[offset + 6],
      from[offset + 7],
      from[offset + 8],
      from[offset + 9],
      from[offset + 10],
      from[offset + 11],
      from[offset + 12],
      from[offset + 13],
      from[offset + 14],
      from[offset + 15],
    );
  }

  intoArray<T extends NumberArray = number[]>(into: T = [] as never, offset: number = 0): T {
    const {
      elements: [e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15],
    } = this;

    into[offset] = e0;
    into[offset + 1] = e1;
    into[offset + 2] = e2;
    into[offset + 3] = e3;
    into[offset + 4] = e4;
    into[offset + 5] = e5;
    into[offset + 6] = e6;
    into[offset + 7] = e7;
    into[offset + 8] = e8;
    into[offset + 9] = e9;
    into[offset + 10] = e10;
    into[offset + 11] = e11;
    into[offset + 12] = e12;
    into[offset + 13] = e13;
    into[offset + 14] = e14;
    into[offset + 15] = e15;

    return into;
  }
}

Mat4.prototype.isMat4 = true;

function multiply(a: Const<Mat4>, b: Const<Mat4>, into: Mat4): Mat4 {
  const [a11, a21, a31, a41, a12, a22, a32, a42, a13, a23, a33, a43, a14, a24, a34, a44] = a.elements;
  const [b11, b21, b31, b41, b12, b22, b32, b42, b13, b23, b33, b43, b14, b24, b34, b44] = b.elements;

  return into.setRowOrder(
    a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41,
    a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41,
    a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41,
    a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41,
    a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42,
    a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42,
    a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42,
    a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42,
    a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43,
    a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43,
    a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43,
    a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43,
    a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44,
    a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44,
    a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44,
    a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44,
  );
}

const zero = Vec3.new(0, 0, 0);
const one = Vec3.new(1, 1, 1);
