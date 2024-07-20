import { Vec3, Vector3 } from './Vector3.js';
import { Box3, Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { Plane, Plane_ } from '@modules/renderer/engine/math/Plane.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import { Vector2 } from '@modules/renderer/engine/math/Vector2.js';
import { Vector4 } from '@modules/renderer/engine/math/Vector4.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class Triangle {
  declare ['constructor']: typeof Triangle;

  constructor(
    public a = new Vector3(),
    public b = new Vector3(),
    public c = new Vector3(),
  ) {}

  static getNormal(a: Vector3, b: Vector3, c: Vector3, target: Vector3): Vector3 {
    target.subVectors(c, b);
    target.cross(new Vector3().subVectors(a, b));

    const targetLengthSq = target.lengthSq();
    if (targetLengthSq > 0) {
      return target.multiplyScalar(1 / Math.sqrt(targetLengthSq));
    }

    return target.set(0, 0, 0);
  }

  static getBarycoord(point: Vec3, a: Vec3, b: Vec3, c: Vec3, target: Vec3): Vec3 | null {
    const _v0 = Vec3.subbed(c, a);
    const _v1 = Vec3.subbed(b, a);
    const _v2 = Vec3.subbed(point, a);

    const dot00 = Vec3.dot(_v0, _v0);
    const dot01 = Vec3.dot(_v0, _v1);
    const dot02 = Vec3.dot(_v0, _v2);
    const dot11 = Vec3.dot(_v1, _v1);
    const dot12 = Vec3.dot(_v1, _v2);

    const denom = dot00 * dot11 - dot01 * dot01;

    if (denom === 0) {
      Vec3.set(target, 0, 0, 0);
      return null;
    }

    const invDenom = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return Vec3.set(target, 1 - u - v, v, u);
  }

  static containsPoint(point: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean {
    // if the triangle is degenerate then we can't contain a point
    const _v3 = Vec3.empty();
    if (this.getBarycoord(point, a, b, c, _v3) === null) {
      return false;
    }

    return _v3.x >= 0 && _v3.y >= 0 && _v3.x + _v3.y <= 1;
  }

  static getInterpolation<T extends Vector2 | Vector3 | Vector4>(
    point: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3,
    v1: T,
    v2: T,
    v3: T,
    target: T,
  ): T | null {
    const _v3 = new Vector3();

    if (this.getBarycoord(point, p1, p2, p3, _v3) === null) {
      target.x = 0;
      target.y = 0;
      if ('z' in target) target.z = 0;
      if ('w' in target) target.w = 0;
      return null;
    }

    target.setScalar(0);
    target.addScaledVector(v1 as never, _v3.x);
    target.addScaledVector(v2 as never, _v3.y);
    target.addScaledVector(v3 as never, _v3.z);

    return target;
  }

  static isFrontFacing(a: Vector3, b: Vector3, c: Vector3, direction: Vector3): boolean {
    return new Vector3().subVectors(c, b).cross(new Vector3().subVectors(a, b)).dot(direction) < 0;
  }

  set(a: Vector3, b: Vector3, c: Vector3): this {
    this.a.copy(a);
    this.b.copy(b);
    this.c.copy(c);

    return this;
  }

  setFromPointsAndIndices(points: Vector3[], i0: number, i1: number, i2: number): this {
    this.a.copy(points[i0]);
    this.b.copy(points[i1]);
    this.c.copy(points[i2]);

    return this;
  }

  setFromAttributeAndIndices(
    attribute: BufferAttribute | InterleavedBufferAttribute,
    i0: number,
    i1: number,
    i2: number,
  ): this {
    this.a.fromBufferAttribute(attribute, i0);
    this.b.fromBufferAttribute(attribute, i1);
    this.c.fromBufferAttribute(attribute, i2);

    return this;
  }

  clone(): Triangle {
    return new this.constructor().copy(this);
  }

  copy(triangle: Triangle): this {
    this.a.copy(triangle.a);
    this.b.copy(triangle.b);
    this.c.copy(triangle.c);

    return this;
  }

  getArea(): number {
    return new Vector3().subVectors(this.c, this.b).cross(new Vector3().subVectors(this.a, this.b)).length() * 0.5;
  }

  getMidpoint(target: Vector3): Vector3 {
    return target
      .addVectors(this.a, this.b)
      .add(this.c)
      .multiplyScalar(1 / 3);
  }

  getNormal(target: Vector3): Vector3 {
    return Triangle.getNormal(this.a, this.b, this.c, target);
  }

  getPlane(target: Plane): Plane {
    return target.setFromCoplanarPoints(this.a, this.b, this.c);
  }

  getBarycoord(point: Vec3, target: Vec3): Vec3 | null {
    return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
  }

  getInterpolation<T extends Vector2 | Vector3 | Vector4>(point: Vector3, v1: T, v2: T, v3: T, target: T): T | null {
    return Triangle.getInterpolation(point, this.a, this.b, this.c, v1, v2, v3, target);
  }

  containsPoint(point: Vec3): boolean {
    return Triangle.containsPoint(point, this.a, this.b, this.c);
  }

  isFrontFacing(direction: Vector3): boolean {
    return Triangle.isFrontFacing(this.a, this.b, this.c, direction);
  }

  intersectsBox(box: Box3): boolean {
    return box.intersectsTriangle(this);
  }

  closestPointToPoint(p: Vector3, target: Vector3): Vector3 {
    const a = this.a,
      b = this.b,
      c = this.c;
    let v, w;

    // algorithm thanks to Real-Time Collision Detection by Christer Ericson,
    // published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
    // under the accompanying license; see chapter 5.1.5 for detailed explanation.
    // basically, we're distinguishing which of the voronoi regions of the triangle
    // the point lies in with the minimum amount of redundant computation.

    const _vab = new Vector3().subVectors(b, a);
    const _vac = new Vector3().subVectors(c, a);
    const _vap = new Vector3().subVectors(p, a);
    const d1 = _vab.dot(_vap);
    const d2 = _vac.dot(_vap);
    if (d1 <= 0 && d2 <= 0) {
      // vertex region of A; barycentric coords (1, 0, 0)
      return target.copy(a);
    }

    const _vbp = new Vector3().subVectors(p, b);
    const d3 = _vab.dot(_vbp);
    const d4 = _vac.dot(_vbp);
    if (d3 >= 0 && d4 <= d3) {
      // vertex region of B; barycentric coords (0, 1, 0)
      return target.copy(b);
    }

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      v = d1 / (d1 - d3);
      // edge region of AB; barycentric coords (1-v, v, 0)
      return target.copy(a).addScaledVector(_vab, v);
    }

    const _vcp = new Vector3().subVectors(p, c);
    const d5 = _vab.dot(_vcp);
    const d6 = _vac.dot(_vcp);
    if (d6 >= 0 && d5 <= d6) {
      // vertex region of C; barycentric coords (0, 0, 1)
      return target.copy(c);
    }

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      w = d2 / (d2 - d6);
      // edge region of AC; barycentric coords (1-w, 0, w)
      return target.copy(a).addScaledVector(_vac, w);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const _vbc = new Vector3().subVectors(c, b);
      w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      // edge region of BC; barycentric coords (0, 1-w, w)
      return target.copy(b).addScaledVector(_vbc, w); // edge region of BC
    }

    const denom = 1 / (va + vb + vc);
    v = vb * denom;
    w = vc * denom;

    return target.copy(a).addScaledVector(_vab, v).addScaledVector(_vac, w);
  }

  equals(triangle: Triangle): boolean {
    return triangle.a.equals(this.a) && triangle.b.equals(this.b) && triangle.c.equals(this.c);
  }
}

export interface Triangle_ {
  a: Vec3;
  b: Vec3;
  c: Vec3;
}

export namespace Triangle_ {
  export const create = (a: Vec3, b: Vec3, c: Vec3): Triangle_ => ({ a, b, c });
  export const empty = (): Triangle_ => ({ a: Vec3.empty(), b: Vec3.empty(), c: Vec3.empty() });

  export const set = (self: Triangle_, a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): Triangle_ => {
    Vec3.fill_(self.a, a);
    Vec3.fill_(self.b, b);
    Vec3.fill_(self.c, c);
    return self;
  };
  export const fill_ = (self: Triangle_, { a, b, c }: Const<Triangle_>): Triangle_ => set(self, a, b, c);

  export const fromPointsAndIndices = (points: Const<Vec3>[], i0: number, i1: number, i2: number): Triangle_ =>
    fromPointsAndIndices_(points, i0, i1, i2, empty());
  export const fromPointsAndIndices_ = (
    points: Const<Vec3>[],
    i0: number,
    i1: number,
    i2: number,
    into: Triangle_,
  ): Triangle_ => set(into, points[i0], points[i1], points[i2]);
  export const fillPointsAndIndices = (
    self: Triangle_,
    points: Const<Vec3>[],
    i0: number,
    i1: number,
    i2: number,
  ): Triangle_ => fromPointsAndIndices_(points, i0, i1, i2, self);

  export const fromAttributeAndIndices = (
    attribute: Const<BufferAttribute>,
    i0: number,
    i1: number,
    i2: number,
  ): Triangle_ => fromAttributeAndIndices_(attribute, i0, i1, i2, empty());
  export const fromAttributeAndIndices_ = (
    attribute: Const<BufferAttribute>,
    i0: number,
    i1: number,
    i2: number,
    into: Triangle_,
  ): Triangle_ => {
    Vec3.fromAttribute_(attribute, i0, into.a);
    Vec3.fromAttribute_(attribute, i1, into.b);
    Vec3.fromAttribute_(attribute, i2, into.c);
    return into;
  };

  export const clone = (from: Const<Triangle_>): Triangle_ => clone_(from, empty());
  export const clone_ = (from: Const<Triangle_>, into: Triangle_): Triangle_ => fill_(into, from);

  export const copy = (from: Triangle_): Triangle_ => copy_(from, empty());
  export const copy_ = (from: Triangle_, into: Triangle_): Triangle_ => {
    into.a = from.a;
    into.b = from.b;
    into.c = from.c;
    return into;
  };

  export const equals = (a: Const<Triangle_>, b: Const<Triangle_>): boolean =>
    Vec3.equals(a.a, b.a) && Vec3.equals(a.b, b.b) && Vec3.equals(a.c, b.c);

  const _vec = Vec3.empty();
  export const normal = (self: Const<Triangle_>): Vec3 => normal_(self, Vec3.empty());
  export const normal_ = ({ a, b, c }: Const<Triangle_>, into: Vec3): Vec3 => {
    Vec3.sub_(c, b, into);
    Vec3.sub_(a, b, _vec);
    Vec3.cross(into, _vec);

    const len = Vec3.lengthSq(into);
    return len > 0 ? Vec3.mulScalar(into, 1 / Math.sqrt(len)) : Vec3.clear(into);
  };

  export const plane = (self: Const<Triangle_>): Plane_ => plane_(self, Plane_.empty());
  export const plane_ = ({ a, b, c }: Const<Triangle_>, into: Plane_): Plane_ => Plane_.fillCoplanar(into, a, b, c);

  const _v0 = Vec3.empty();
  const _v1 = Vec3.empty();
  const _v2 = Vec3.empty();
  export const barycoord = (from: Const<Triangle_>, vec: Vec3): Vec3 | null => barycoord_(from, vec, Vec3.empty());
  export const barycoord_ = ({ a, b, c }: Const<Triangle_>, vec: Const<Vec3>, into: Vec3): Vec3 | null => {
    Vec3.sub_(c, a, _v0);
    Vec3.sub_(b, a, _v1);
    Vec3.sub_(vec, a, _v2);

    const dot00 = Vec3.dot(_v0, _v0);
    const dot01 = Vec3.dot(_v0, _v1);
    const dot02 = Vec3.dot(_v0, _v2);
    const dot11 = Vec3.dot(_v1, _v1);
    const dot12 = Vec3.dot(_v1, _v2);

    const denom = dot00 * dot11 - dot01 * dot01;

    if (denom === 0) {
      Vec3.set(into, 0, 0, 0);
      return null;
    }

    const inverse = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * inverse;
    const v = (dot00 * dot12 - dot01 * dot02) * inverse;

    return Vec3.set(into, 1 - u - v, v, u);
  };

  export const containsVec = (self: Const<Triangle_>, vec: Const<Vec3>): boolean => {
    if (barycoord_(self, vec, _v0) === null) return false;
    return _v0.x >= 0 && _v0.y >= 0 && _v0.x + _v0.y <= 1;
  };

  export const isFrontFacing = ({ a, b, c }: Const<Triangle_>, direction: Const<Vec3>): boolean => {
    Vec3.sub_(c, b, _v0);
    Vec3.sub_(a, b, _v1);
    Vec3.cross(_v0, _v1);

    return Vec3.dot(_v0, direction) < 0;
  };
  export const intersectsBox = (self: Const<Triangle_>, box: Const<Box3_>): boolean =>
    Box3_.intersectsTriangle(box, self);

  export const area = ({ a, b, c }: Const<Triangle_>): number => {
    Vec3.sub_(c, b, _v0);
    Vec3.sub_(a, b, _v1);
    Vec3.cross(_v0, _v1);

    return Vec3.length(_v0) * 0.5;
  };

  export const midpoint = (self: Const<Triangle_>): Vec3 => midpoint_(self, Vec3.empty());
  export const midpoint_ = ({ a, b, c }: Const<Triangle_>, into: Vec3): Vec3 => {
    Vec3.add_(a, b, into);
    Vec3.add(into, c);
    return Vec3.mulScalar(into, 1 / 3);
  };

  export const interpolate = (a: Const<Triangle_>, b: Const<Triangle_>, point: Const<Vec3>): Vec3 | null =>
    interpolate_(a, b, point, Vec3.empty());

  export const interpolate_ = (
    a: Const<Triangle_>,
    b: Const<Triangle_>,
    point: Const<Vec3>,
    into: Vec3,
  ): Vec3 | null => {
    Vec3.clear(into);
    if (barycoord_(a, point, _v0) === null) return null;

    Vec3.mulScalar_(b.a, _v0.x, _v1);
    Vec3.add_(into, _v1, into);

    Vec3.mulScalar_(b.b, _v0.y, _v1);
    Vec3.add_(into, _v1, into);

    Vec3.mulScalar_(b.c, _v0.z, _v1);
    Vec3.add_(into, _v1, into);

    return into;
  };

  export const closestTo = (self: Const<Triangle_>, point: Const<Vec3>, into: Vec3): Vec3 =>
    closestTo_(self, point, Vec3.empty(), into);
  export const closestTo_ = ({ a, b, c }: Const<Triangle_>, point: Const<Vec3>, temp: Vec3, into: Vec3): Vec3 => {
    Vec3.sub_(a, b, _v0);
    Vec3.sub_(c, b, _v1);
    Vec3.sub_(point, b, _v2);

    const d1 = Vec3.dot(_v0, _v2);
    const d2 = Vec3.dot(_v1, _v2);
    if (d1 <= 0 && d2 <= 0) return Vec3.fill_(into, a);

    Vec3.sub_(point, a, _v2);
    const d3 = Vec3.dot(_v0, _v2);
    const d4 = Vec3.dot(_v1, _v2);
    if (d3 >= 0 && d4 <= d3) return Vec3.fill_(into, b);

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return Vec3.fill_(into, a);

    Vec3.sub_(point, c, _v2);
    const d5 = Vec3.dot(_v0, _v2);
    const d6 = Vec3.dot(_v1, _v2);
    if (d6 >= 0 && d5 <= d6) return Vec3.fill_(into, c);

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return Vec3.fill_(into, b);

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return Vec3.fill_(into, a);

    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;

    Vec3.fill_(into, a);
    Vec3.mulScalar(_v0, v);
    Vec3.add(into, _v0);
    Vec3.mulScalar(_v1, w);
    Vec3.add(into, _v1);

    return into;
  };
}
