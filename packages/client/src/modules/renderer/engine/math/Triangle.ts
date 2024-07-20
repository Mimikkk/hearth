import { Vec3 } from './Vec3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';

export class Triangle {
  declare ['constructor']: typeof Triangle;

  constructor(
    public a = new Vec3(),
    public b = new Vec3(),
    public c = new Vec3(),
  ) {}

  static getNormal(a: Vec3, b: Vec3, c: Vec3, target: Vec3): Vec3 {
    target.subVectors(c, b);
    target.cross(new Vec3().subVectors(a, b));

    const targetLengthSq = target.lengthSq();
    if (targetLengthSq > 0) {
      return target.scale(1 / Math.sqrt(targetLengthSq));
    }

    return target.set(0, 0, 0);
  }

  static getBarycoord(point: Vec3, a: Vec3, b: Vec3, c: Vec3, target: Vec3): Vec3 | null {
    const _v0 = new Vec3().subVectors(c, a);
    const _v1 = new Vec3().subVectors(b, a);
    const _v2 = new Vec3().subVectors(point, a);

    const dot00 = _v0.dot(_v0);
    const dot01 = _v0.dot(_v1);
    const dot02 = _v0.dot(_v2);
    const dot11 = _v1.dot(_v1);
    const dot12 = _v1.dot(_v2);

    const denom = dot00 * dot11 - dot01 * dot01;

    // collinear or singular triangle
    if (denom === 0) {
      target.set(0, 0, 0);
      return null;
    }

    const invDenom = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    // barycentric coordinates must always sum to 1
    return target.set(1 - u - v, v, u);
  }

  static containsPoint(point: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean {
    // if the triangle is degenerate then we can't contain a point
    const _v3 = new Vec3();
    if (this.getBarycoord(point, a, b, c, _v3) === null) {
      return false;
    }

    return _v3.x >= 0 && _v3.y >= 0 && _v3.x + _v3.y <= 1;
  }

  static getInterpolation<T extends Vec2 | Vec3 | Vec4>(
    point: Vec3,
    p1: Vec3,
    p2: Vec3,
    p3: Vec3,
    v1: T,
    v2: T,
    v3: T,
    target: T,
  ): T | null {
    const _v3 = new Vec3();

    if (this.getBarycoord(point, p1, p2, p3, _v3) === null) {
      target.x = 0;
      target.y = 0;
      if ('z' in target) target.z = 0;
      if ('w' in target) target.w = 0;
      return null;
    }

    target.setScalar(0);
    target.addScaled(v1 as never, _v3.x);
    target.addScaled(v2 as never, _v3.y);
    target.addScaled(v3 as never, _v3.z);

    return target;
  }

  static isFrontFacing(a: Vec3, b: Vec3, c: Vec3, direction: Vec3): boolean {
    return new Vec3().subVectors(c, b).cross(new Vec3().subVectors(a, b)).dot(direction) < 0;
  }

  set(a: Vec3, b: Vec3, c: Vec3): this {
    this.a.from(a);
    this.b.from(b);
    this.c.from(c);

    return this;
  }

  setFromPointsAndIndices(points: Vec3[], i0: number, i1: number, i2: number): this {
    this.a.from(points[i0]);
    this.b.from(points[i1]);
    this.c.from(points[i2]);

    return this;
  }

  setFromAttributeAndIndices(
    attribute: BufferAttribute | InterleavedBufferAttribute,
    i0: number,
    i1: number,
    i2: number,
  ): this {
    this.a.fromAttribute(attribute, i0);
    this.b.fromAttribute(attribute, i1);
    this.c.fromAttribute(attribute, i2);

    return this;
  }

  clone(): Triangle {
    return new this.constructor().copy(this);
  }

  copy(triangle: Triangle): this {
    this.a.from(triangle.a);
    this.b.from(triangle.b);
    this.c.from(triangle.c);

    return this;
  }

  getArea(): number {
    return new Vec3().subVectors(this.c, this.b).cross(new Vec3().subVectors(this.a, this.b)).length() * 0.5;
  }

  getMidpoint(target: Vec3): Vec3 {
    return target
      .addVectors(this.a, this.b)
      .add(this.c)
      .scale(1 / 3);
  }

  getNormal(target: Vec3): Vec3 {
    return Triangle.getNormal(this.a, this.b, this.c, target);
  }

  getPlane(target: Plane): Plane {
    return target.fromCoplanar(this.a, this.b, this.c);
  }

  getBarycoord(point: Vec3, target: Vec3): Vec3 | null {
    return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
  }

  getInterpolation<T extends Vec2 | Vec3 | Vec4>(point: Vec3, v1: T, v2: T, v3: T, target: T): T | null {
    return Triangle.getInterpolation(point, this.a, this.b, this.c, v1, v2, v3, target);
  }

  containsPoint(point: Vec3): boolean {
    return Triangle.containsPoint(point, this.a, this.b, this.c);
  }

  isFrontFacing(direction: Vec3): boolean {
    return Triangle.isFrontFacing(this.a, this.b, this.c, direction);
  }

  intersectsBox(box: Box3): boolean {
    return box.intersectsTriangle(this);
  }

  closestPointToPoint(p: Vec3, target: Vec3): Vec3 {
    const a = this.a,
      b = this.b,
      c = this.c;
    let v, w;

    // algorithm thanks to Real-Time Collision Detection by Christer Ericson,
    // published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
    // under the accompanying license; see chapter 5.1.5 for detailed explanation.
    // basically, we're distinguishing which of the voronoi regions of the triangle
    // the point lies in with the minimum amount of redundant computation.

    const _vab = new Vec3().subVectors(b, a);
    const _vac = new Vec3().subVectors(c, a);
    const _vap = new Vec3().subVectors(p, a);
    const d1 = _vab.dot(_vap);
    const d2 = _vac.dot(_vap);
    if (d1 <= 0 && d2 <= 0) {
      // vertex region of A; barycentric coords (1, 0, 0)
      return target.from(a);
    }

    const _vbp = new Vec3().subVectors(p, b);
    const d3 = _vab.dot(_vbp);
    const d4 = _vac.dot(_vbp);
    if (d3 >= 0 && d4 <= d3) {
      // vertex region of B; barycentric coords (0, 1, 0)
      return target.from(b);
    }

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      v = d1 / (d1 - d3);
      // edge region of AB; barycentric coords (1-v, v, 0)
      return target.from(a).addScaled(_vab, v);
    }

    const _vcp = new Vec3().subVectors(p, c);
    const d5 = _vab.dot(_vcp);
    const d6 = _vac.dot(_vcp);
    if (d6 >= 0 && d5 <= d6) {
      // vertex region of C; barycentric coords (0, 0, 1)
      return target.from(c);
    }

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      w = d2 / (d2 - d6);
      // edge region of AC; barycentric coords (1-w, 0, w)
      return target.from(a).addScaled(_vac, w);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const _vbc = new Vec3().subVectors(c, b);
      w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      // edge region of BC; barycentric coords (0, 1-w, w)
      return target.from(b).addScaled(_vbc, w); // edge region of BC
    }

    const denom = 1 / (va + vb + vc);
    v = vb * denom;
    w = vc * denom;

    return target.from(a).addScaled(_vab, v).addScaled(_vac, w);
  }

  equals(triangle: Triangle): boolean {
    return triangle.a.equals(this.a) && triangle.b.equals(this.b) && triangle.c.equals(this.c);
  }
}
