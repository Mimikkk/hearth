import { clamp, NumberArray } from './MathUtils.js';
import { Quaternion } from './Quaternion.js';
import type { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import type { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import type { Color } from '@modules/renderer/engine/math/Color.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';
import type { Matrix3 } from '@modules/renderer/engine/math/Matrix3.js';
import type { Matrix4 } from '@modules/renderer/engine/math/Matrix4.js';
import type { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import type { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import type { Camera } from '@modules/renderer/engine/cameras/Camera.js';

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export class Vector3 implements IVector3 {
  declare isVector3: true;
  declare ['constructor']: typeof Vector3;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  set(x: number, y: number, z?: number): this {
    this.x = x;
    this.y = y;
    this.z = z ?? this.z;

    return this;
  }

  setScalar(scalar: number): this {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;

    return this;
  }

  setX(x: number): this {
    this.x = x;

    return this;
  }

  setY(y: number): this {
    this.y = y;

    return this;
  }

  setZ(z: number): this {
    this.z = z;

    return this;
  }

  setComponent(index: 0 | 1 | 2 | number, value: number): this {
    switch (index) {
      case 0:
        this.x = value;
        break;
      case 1:
        this.y = value;
        break;
      case 2:
        this.z = value;
        break;
      default:
        throw new Error(`index is out of range: ${index}`);
    }

    return this;
  }

  getComponent(index: 0 | 1 | 2 | number): number {
    switch (index) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error('index is out of range: ' + index);
    }
  }

  clone(): Vector3 {
    return new this.constructor(this.x, this.y, this.z);
  }

  copy(v: Vector3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  }

  add(v: Vector3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  addScalar(scalar: number): this {
    this.x += scalar;
    this.y += scalar;
    this.z += scalar;

    return this;
  }

  addVectors(a: Vector3, b: Vector3): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
  }

  addScaledVector(vector: Vector3, scale: number): this {
    this.x += vector.x * scale;
    this.y += vector.y * scale;
    this.z += vector.z * scale;

    return this;
  }

  sub(vector: Vector3): this {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;

    return this;
  }

  subScalar(scalar: number): this {
    this.x -= scalar;
    this.y -= scalar;
    this.z -= scalar;

    return this;
  }

  subVectors(a: Vector3, b: Vector3): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;
  }

  multiply(vector: Vector3): this {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;

    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
  }

  multiplyVectors(a: Vector3, b: Vector3): this {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;
  }

  applyEuler(euler: Euler): this {
    return this.applyQuaternion(Quaternion.fromEuler(euler));
  }

  applyAxisAngle(axis: Vector3, angle: number): this {
    return this.applyQuaternion(Quaternion.fromAxisAngle(axis, angle));
  }

  applyMatrix3(matrix: Matrix3): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const e = matrix.elements;

    this.x = e[0] * x + e[3] * y + e[6] * z;
    this.y = e[1] * x + e[4] * y + e[7] * z;
    this.z = e[2] * x + e[5] * y + e[8] * z;

    return this;
  }

  applyNormalMatrix(matrix: Matrix3): this {
    return this.applyMatrix3(matrix).normalize();
  }

  applyMatrix4(matrix: Matrix4): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const e = matrix.elements;

    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

    return this;
  }

  applyQuaternion(quaternion: Quaternion): this {
    const vx = this.x;
    const vy = this.y;
    const vz = this.z;
    const qx = quaternion.x;
    const qy = quaternion.y;
    const qz = quaternion.z;
    const qw = quaternion.w;

    // t = 2 * cross( q.xyz, v );
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);

    // v + q.w * t + cross( q.xyz, t );
    this.x = vx + qw * tx + qy * tz - qz * ty;
    this.y = vy + qw * ty + qz * tx - qx * tz;
    this.z = vz + qw * tz + qx * ty - qy * tx;

    return this;
  }

  project(camera: Camera): this {
    return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
  }

  unproject(camera: Camera): this {
    return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
  }

  transformDirection(m: Matrix4): this {
    // input: engine.Matrix4 affine matrix
    // vector interpreted as a direction

    const x = this.x,
      y = this.y,
      z = this.z;
    const e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8] * z;
    this.y = e[1] * x + e[5] * y + e[9] * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;

    return this.normalize();
  }

  divide(vector: Vector3): this {
    this.x /= vector.x;
    this.y /= vector.y;
    this.z /= vector.z;

    return this;
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  min(vector: Vector3): this {
    this.x = Math.min(this.x, vector.x);
    this.y = Math.min(this.y, vector.y);
    this.z = Math.min(this.z, vector.z);

    return this;
  }

  max(vector: Vector3): this {
    this.x = Math.max(this.x, vector.x);
    this.y = Math.max(this.y, vector.y);
    this.z = Math.max(this.z, vector.z);

    return this;
  }

  clamp(min: Vector3, max: Vector3): this {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    this.z = Math.max(min.z, Math.min(max.z, this.z));

    return this;
  }

  clampScalar(min: number, max: number): this {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));
    this.z = Math.max(min, Math.min(max, this.z));

    return this;
  }

  clampLength(min: number, max: number): this {
    const length = this.length();

    return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);

    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);

    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);

    return this;
  }

  roundToZero(): this {
    this.x = Math.trunc(this.x);
    this.y = Math.trunc(this.y);
    this.z = Math.trunc(this.z);

    return this;
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
  }

  dot(vector: Vector3): number {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1);
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }

  lerp(vector: Vector3, step: number): this {
    this.x += (vector.x - this.x) * step;
    this.y += (vector.y - this.y) * step;
    this.z += (vector.z - this.z) * step;

    return this;
  }

  lerpVectors(from: Vector3, to: Vector3, step: number): this {
    this.x = from.x + (to.x - from.x) * step;
    this.y = from.y + (to.y - from.y) * step;
    this.z = from.z + (to.z - from.z) * step;

    return this;
  }

  cross(vector: Vector3): this {
    return this.crossVectors(this, vector);
  }

  crossVectors(a: Vector3, b: Vector3): this {
    const ax = a.x,
      ay = a.y,
      az = a.z;
    const bx = b.x,
      by = b.y,
      bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  }

  projectOnVector(vector: Vector3): this {
    const denominator = vector.lengthSq();

    if (denominator === 0) return this.set(0, 0, 0);

    const scalar = vector.dot(this) / denominator;

    return this.copy(vector).multiplyScalar(scalar);
  }

  projectOnPlane(normal: Vector3): this {
    return this.sub(this.clone().projectOnVector(normal));
  }

  reflect(normal: Vector3): this {
    return this.sub(normal.clone().multiplyScalar(2 * this.dot(normal)));
  }

  angleTo(vector: Vector3): number {
    const denominator = Math.sqrt(this.lengthSq() * vector.lengthSq());

    if (denominator === 0) return Math.PI / 2;

    const theta = this.dot(vector) / denominator;

    // clamp, to handle numerical problems

    return Math.acos(clamp(theta, -1, 1));
  }

  distanceTo(vector: Vector3): number {
    return Math.sqrt(this.distanceToSquared(vector));
  }

  distanceToSquared(vector: Vector3): number {
    const dx = this.x - vector.x,
      dy = this.y - vector.y,
      dz = this.z - vector.z;

    return dx * dx + dy * dy + dz * dz;
  }

  manhattanDistanceTo(vector: Vector3): number {
    return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
  }

  setFromSpherical(spherical: Spherical): this {
    return this.setFromSphericalCoords(spherical.radius, spherical.phi, spherical.theta);
  }

  setFromSphericalCoords(radius: number, phi: number, theta: number): this {
    const sinPhiRadius = Math.sin(phi) * radius;

    this.x = sinPhiRadius * Math.sin(theta);
    this.y = Math.cos(phi) * radius;
    this.z = sinPhiRadius * Math.cos(theta);

    return this;
  }

  setFromCylindrical(cylindrical: Cylindrical): this {
    return this.setFromCylindricalCoords(cylindrical.radius, cylindrical.theta, cylindrical.y);
  }

  setFromCylindricalCoords(radius: number, theta: number, y: number): this {
    this.x = radius * Math.sin(theta);
    this.y = y;
    this.z = radius * Math.cos(theta);

    return this;
  }

  setFromMatrixPosition(matrix: Matrix4): this {
    const e = matrix.elements;

    this.x = e[12];
    this.y = e[13];
    this.z = e[14];

    return this;
  }

  setFromMatrixScale(matrix: Matrix4): this {
    const sx = this.setFromMatrixColumn(matrix, 0).length();
    const sy = this.setFromMatrixColumn(matrix, 1).length();
    const sz = this.setFromMatrixColumn(matrix, 2).length();

    this.x = sx;
    this.y = sy;
    this.z = sz;

    return this;
  }

  setFromMatrixColumn(matrix: Matrix4, index: number): this {
    return this.fromArray(matrix.elements, index * 4);
  }

  setFromMatrix3Column(matrix: Matrix3, index: number): this {
    return this.fromArray(matrix.elements, index * 3);
  }

  setFromEuler(euler: Euler): this {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;

    return this;
  }

  setFromColor(color: Color): this {
    this.x = color.r;
    this.y = color.g;
    this.z = color.b;

    return this;
  }

  equals(vector: Vector3): boolean {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z;
  }

  fromArray(array: number[], offset = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;

    return array;
  }

  fromBufferAttribute(attribute: BufferAttribute<Float32Array> | InterleavedBufferAttribute, index: number): this {
    this.x = attribute.getX(index);
    this.y = attribute.getY(index);
    this.z = attribute.getZ(index);

    return this;
  }

  random(): this {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();

    return this;
  }

  randomDirection(): this {
    // https://mathworld.wolfram.com/SpherePointPicking.html

    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const c = Math.sqrt(1 - u * u);

    this.x = c * Math.cos(theta);
    this.y = u;
    this.z = c * Math.sin(theta);

    return this;
  }

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}

Vector3.prototype.isVector3 = true;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export namespace Vec3 {
  export const create = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
  export const empty = (): Vec3 => create(0, 0, 0);
  export const vec3 = create;

  export const is = (o: any): o is Vec3 =>
    !!o && typeof o.x === 'number' && typeof o.y === 'number' && typeof o.z === 'number';

  export const add = (a: Vec3, b: Readonly<Vec3>): Vec3 => add_(a, b, a);
  export const add_ = (a: Readonly<Vec3>, b: Readonly<Vec3>, into: Vec3): Vec3 =>
    fill(into, a.x + b.x, a.y + b.y, a.z + b.z);
  export const added = (a: Vec3, b: Readonly<Vec3>): Vec3 => add_(a, b, empty());

  export const sub = (a: Vec3, b: Readonly<Vec3>): Vec3 => sub_(a, b, a);
  export const sub_ = (a: Readonly<Vec3>, b: Readonly<Vec3>, into: Vec3): Vec3 =>
    fill(into, a.x - b.x, a.y - b.y, a.z - b.z);
  export const subbed = (a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 => sub_(a, b, empty());

  export const mul = (a: Vec3, b: Readonly<Vec3>): Vec3 => mul_(a, b, a);
  export const mul_ = (a: Readonly<Vec3>, b: Readonly<Vec3>, into: Vec3): Vec3 =>
    fill(into, a.x * b.x, a.y * b.y, a.z * b.z);
  export const mulled = (a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 => mul_(a, b, empty());

  export const mulScalar = (a: Vec3, scalar: number): Vec3 => mulScalar_(a, scalar, a);
  export const mulScalar_ = (a: Readonly<Vec3>, scalar: number, into: Vec3): Vec3 =>
    fill(into, a.x * scalar, a.y * scalar, a.z * scalar);
  export const mulledScalar = (a: Readonly<Vec3>, scalar: number): Vec3 => mulScalar_(a, scalar, empty());

  export const div = (a: Vec3, b: Readonly<Vec3>): Vec3 => div_(a, b, a);
  export const div_ = (a: Readonly<Vec3>, b: Readonly<Vec3>, into: Vec3): Vec3 =>
    fill(into, a.x / b.x, a.y / b.y, a.z / b.z);
  export const dived = (a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 => div_(a, b, empty());

  export const divScalar = (a: Vec3, scalar: number): Vec3 => divScalar_(a, scalar, a);
  export const divScalar_ = (a: Readonly<Vec3>, scalar: number, into: Vec3): Vec3 =>
    fill(into, a.x / scalar, a.y / scalar, a.z / scalar);
  export const divedScalar = (a: Readonly<Vec3>, scalar: number): Vec3 => divScalar_(a, scalar, empty());

  export const cross = (a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 => cross_(a, b, empty());
  export const cross_ = (a: Readonly<Vec3>, b: Readonly<Vec3>, into: Vec3): Vec3 =>
    fill(into, a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  export const crossed = (a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 => cross_(a, b, empty());

  export const normalize = (self: Vec3): Vec3 => normalize_(self, self);
  export const normalize_ = (self: Readonly<Vec3>, into: Vec3): Vec3 => {
    const length = Math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z);

    return fill(into, self.x / length, self.y / length, self.z / length);
  };
  export const normalized = (self: Readonly<Vec3>): Vec3 => normalize_(self, empty());

  export const lengthSq = (self: Readonly<Vec3>): number => self.x * self.x + self.y * self.y + self.z * self.z;
  export const length = (self: Readonly<Vec3>): number => Math.sqrt(lengthSq(self));

  export const dot = (a: Readonly<Vec3>, b: Readonly<Vec3>): number => a.x * b.x + a.y * b.y + a.z * b.z;

  export const fill = (self: Vec3, x: number, y: number, z: number): Vec3 => {
    self.x = x;
    self.y = y;
    self.z = z;

    return self;
  };
  export const fill_ = ({ x, y, z }: Readonly<Vec3>, into: Vec3): Vec3 => fill(into, x, y, z);

  export const fromArray = (array: Readonly<NumberArray>, offset: number): Vec3 => fromArray_(array, offset, empty());
  export const fromArray_ = (array: Readonly<NumberArray>, offset: number, into: Vec3): Vec3 =>
    fill(into, array[offset], array[offset + 1], array[offset + 2]);
  export const fillArray = (self: Vec3, array: Readonly<NumberArray>, offset: number): Vec3 =>
    fromArray_(array, offset, self);
  export const intoArray_ = <T extends NumberArray>({ x, y, z }: Readonly<Vec3>, offset: number, into: T): T => {
    into[offset] = x;
    into[offset + 1] = y;
    into[offset + 2] = z;

    return into;
  };
  export const intoArray = (self: Readonly<Vec3>): number[] => intoArray_(self, 0, [0, 0, 0]);

  export const fromAttribute = (attribute: BufferAttribute<Float32Array>, index: number): Vec3 =>
    fromAttribute_(attribute, index, empty());
  export const fromAttribute_ = (attribute: BufferAttribute<Float32Array>, index: number, into: Vec3): Vec3 =>
    fill(into, attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  export const fillAttribute = (self: Vec3, attribute: BufferAttribute<Float32Array>, index: number): Vec3 =>
    fromAttribute_(attribute, index, self);
  export const intoAttribute_ = (
    self: Readonly<Vec3>,
    attribute: BufferAttribute<Float32Array>,
    index: number,
  ): BufferAttribute<Float32Array> => attribute.setXYZ(index, self.x, self.y, self.z);

  export const distanceSqTo = (a: Readonly<Vec3>, b: Readonly<Vec3>): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;
  };
  export const distanceTo = (a: Readonly<Vec3>, b: Readonly<Vec3>): number => Math.sqrt(distanceSqTo(a, b));

  export const manhattanDistanceTo = (a: Readonly<Vec3>, b: Readonly<Vec3>): number =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

  export const applyMat4 = (self: Vec3, matrix: Readonly<Matrix4>): Vec3 => applyMat4_(self, matrix, self);
  export const applyMat4_ = (self: Readonly<Vec3>, { elements }: Readonly<Matrix4>, into: Vec3): Vec3 => {
    const { x, y, z } = self;

    const w = 1 / (elements[3] * x + elements[7] * y + elements[11] * z + elements[15]);

    return fill(
      into,
      (elements[0] * x + elements[4] * y + elements[8] * z + elements[12]) * w,
      (elements[1] * x + elements[5] * y + elements[9] * z + elements[13]) * w,
      (elements[2] * x + elements[6] * y + elements[10] * z + elements[14]) * w,
    );
  };

  export const equals = (a: Readonly<Vec3>, b: Readonly<Vec3>): boolean => a.x === b.x && a.y === b.y && a.z === b.z;

  export const temp0 = empty();
  export const temp1 = empty();
  export const temp2 = empty();
  export const temp3 = empty();
  export const temp4 = empty();
  export const temp5 = empty();
  export const temp6 = empty();
  export const temp7 = empty();
  export const temp8 = empty();
  export const temp9 = empty();
}
