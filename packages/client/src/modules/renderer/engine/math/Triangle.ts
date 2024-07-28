import { Vec3 } from './Vec3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';

export class Triangle {
  declare isTriangle: true;

  constructor(
    public a = Vec3.new(),
    public b = Vec3.new(),
    public c = Vec3.new(),
  ) {}

  static getNormal(a: Vec3, b: Vec3, c: Vec3, target: Vec3): Vec3 {
    target.asSub(c, b);
    target.cross(Vec3.new().asSub(a, b));

    const targetLengthSq = target.lengthSq();
    if (targetLengthSq > 0) {
      return target.scale(1 / Math.sqrt(targetLengthSq));
    }

    return target.set(0, 0, 0);
  }

  static getBarycoord(point: Vec3, a: Vec3, b: Vec3, c: Vec3, target: Vec3): Vec3 | null {
    const _v0 = Vec3.new().asSub(c, a);
    const _v1 = Vec3.new().asSub(b, a);
    const _v2 = Vec3.new().asSub(point, a);

    const dot00 = _v0.dot(_v0);
    const dot01 = _v0.dot(_v1);
    const dot02 = _v0.dot(_v2);
    const dot11 = _v1.dot(_v1);
    const dot12 = _v1.dot(_v2);

    const denom = dot00 * dot11 - dot01 * dot01;


    if (denom === 0) {
      target.set(0, 0, 0);
      return null;
    }

    const invDenom = 1 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;


    return target.set(1 - u - v, v, u);
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
    const _v3 = Vec3.new();

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

  clone(into = Triangle.new()): Triangle {
    return into.from(this);
  }

  static interpolate(from: Const<Triangle>, to: Const<Triangle>, vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    if (!from.barycoord(vec, _coord)) return into.set(0, 0, 0);

    return into.set(0, 0, 0).addScaled(to.a, _coord.x).addScaled(to.b, _coord.y).addScaled(to.c, _coord.z);
  }

  static new(a: Vec3 = Vec3.new(), b: Vec3 = Vec3.new(), c: Vec3 = Vec3.new()): Triangle {
    return new Triangle(a, b, c);
  }

  static empty(): Triangle {
    return Triangle.new();
  }

  static clone(from: Const<Triangle>, into: Triangle = Triangle.empty()): Triangle {
    return into.from(from);
  }

  static is(from: any): from is Triangle {
    return from?.isTriangle === true;
  }

  static into(into: Triangle, from: Const<Triangle>): Triangle {
    return into.from(from);
  }

  static from(from: Const<Triangle>, into: Triangle = Triangle.new()): Triangle {
    return into.from(from);
  }

  static fromCoords(
    points: Const<Vec3>[],
    i0: number = 0,
    i1: number = 1,
    i2: number = 2,
    into: Triangle = Triangle.new(),
  ): Triangle {
    return into.fromCoords(points, i0, i1, i2);
  }

  static fromAttribute(
    attribute: Const<Attribute>,
    i0: number = 0,
    i1: number = 1,
    i2: number = 2,
    into: Triangle = Triangle.new(),
  ): Triangle {
    return into.fromAttribute(attribute, i0, i1, i2);
  }

  set(a: Const<Vec3>, b: Const<Vec3>, c: Const<Vec3>): this {
    this.a.from(a);
    this.b.from(b);
    this.c.from(c);
    return this;
  }

  from({ a, b, c }: Const<Triangle>): this {
    return this.set(a, b, c);
  }

  fromCoords(coords: Const<Vec3>[], i0: number, i1: number, i2: number): this {
    return this.set(coords[i0], coords[i1], coords[i2]);
  }

  fromAttribute(attribute: Const<Attribute>, i0: number, i1: number, i2: number): this {
    this.a.fromAttribute(attribute, i0);
    this.b.fromAttribute(attribute, i1);
    this.c.fromAttribute(attribute, i2);
    return this;
  }

  equals({ a, b, c }: Const<Triangle>): boolean {
    return this.a.equals(a) && this.b.equals(b) && this.c.equals(c);
  }

  midpoint(into: Vec3 = Vec3.new()): Vec3 {
    const { a, b, c } = this;

    return into
      .from(a)
      .add(b)
      .add(c)
      .scale(1 / 3);
  }

  normal(into: Vec3 = Vec3.new()): Vec3 {
    const { a, b, c } = this;
    into.from(c).sub(b).cross(_normal.from(a).sub(b));

    const len = into.lengthSq();
    return len > 0 ? into.scale(1 / Math.sqrt(len)) : into.set(0, 0, 0);
  }

  plane(into: Plane = Plane.new()): Plane {
    return into.fromCoplanar(this.a, this.b, this.c);
  }

  barycoord(coord: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 | null {
    _ba.from(this.c).sub(this.a);
    _ca.from(this.b).sub(this.a);
    _pa.from(coord).sub(this.a);

    const dot00 = _ba.dot(_ba);
    const dot01 = _ba.dot(_ca);
    const dot02 = _ba.dot(_pa);
    const dot11 = _ca.dot(_ca);
    const dot12 = _ca.dot(_pa);

    const denominator = dot00 * dot11 - dot01 * dot01;

    if (denominator === 0) {
      into.set(0, 0, 0);
      return null;
    }

    const inverse = 1 / denominator;
    const u = (dot11 * dot02 - dot01 * dot12) * inverse;
    const v = (dot00 * dot12 - dot01 * dot02) * inverse;

    return into.set(1 - u - v, v, u);
  }

  contains(vec: Const<Vec3>): boolean {
    if (!this.barycoord(vec, _ba)) return false;
    return _ba.x >= 0 && _ba.y >= 0 && _ba.x + _ba.y <= 1;
  }

  isFrontFacing(direction: Const<Vec3>): boolean {
    const { a, b, c } = this;
    _ba.from(c).sub(b);
    _ca.from(a).sub(b);
    return _ba.cross(_ca).dot(direction) < 0;
  }

  intersectsBox(box: Const<Box3>): boolean {
    return box.intersectsTriangle(this);
  }

  interpolate(to: Const<Triangle>, vec: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    return Triangle.interpolate(this, to, vec, into);
  }

  area(): number {
    const { a, b, c } = this;
    _ba.from(c).sub(b);
    _ca.from(a).sub(b);
    return _ba.cross(_ca).length() * 0.5;
  }

  closestTo(point: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    const { a, b, c } = this;
    _ba.from(b).sub(a);
    _ca.from(c).sub(a);
    _pa.from(point).sub(a);

    const d1 = _ba.dot(_pa);
    const d2 = _ca.dot(_pa);
    if (d1 <= 0 && d2 <= 0) return into.from(a);

    _pa.from(point).sub(b);
    const d3 = _ba.dot(_pa);
    const d4 = _ca.dot(_pa);
    if (d3 >= 0 && d4 <= d3) return into.from(b);

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);

      return into.from(a).addScaled(_ba, v);
    }

    _pa.from(point).sub(c);
    const d5 = _ba.dot(_pa);
    const d6 = _ca.dot(_pa);
    if (d6 >= 0 && d5 <= d6) return into.from(c);

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);

      return into.from(b).addScaled(_ca, w);
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const _cb = _ba.from(c).sub(b);
      const w = (d4 - d3) / (d4 - d3 + d5 - d6);
      return into.from(b).addScaled(_cb, w);
    }

    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;

    return into.from(a).addScaled(_ba, v).addScaled(_ca, w);
  }
}

Triangle.prototype.isTriangle = true;

const _ba = Vec3.new();
const _ca = Vec3.new();
const _pa = Vec3.new();
const _normal = Vec3.new();
const _coord = Vec3.new();
