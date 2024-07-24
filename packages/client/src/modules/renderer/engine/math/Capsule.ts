import { Vec3 } from './Vec3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

export class Capsule {
  declare isCapsule: true;

  constructor(
    public start: Vec3 = Vec3.new(0, 0, 0),
    public end: Vec3 = Vec3.new(0, 1, 0),
    public radius: number = 1,
  ) {}

  static new(start: Vec3 = Vec3.new(), end: Vec3 = Vec3.new(), radius: number = 0): Capsule {
    return new Capsule(start, end, radius);
  }

  static empty(): Capsule {
    return Capsule.new();
  }

  static clone({ start, end, radius }: Const<Capsule>, into: Capsule = Capsule.new()): Capsule {
    return into.set(start, end, radius);
  }

  static is(capsule: any): capsule is Capsule {
    return capsule?.isCapsule === true;
  }

  static into(into: Capsule, { start, end, radius }: Const<Capsule>): Capsule {
    return into.set(start, end, radius);
  }

  static from({ start, end, radius }: Const<Capsule>, into: Capsule = Capsule.new()): Capsule {
    return into.set(start, end, radius);
  }

  static fromArray(array: Const<NumberArray>, offset: number = 0, into: Capsule = Capsule.new()): Capsule {
    return into.fromArray(array, offset);
  }

  clone(into: Capsule = Capsule.new()): Capsule {
    return into.from(this);
  }

  set(start: Const<Vec3>, end: Const<Vec3>, radius: number): this {
    this.start.from(start);
    this.end.from(end);
    this.radius = radius;

    return this;
  }

  from(capsule: Const<Capsule>): this {
    return this.set(capsule.start, capsule.end, capsule.radius);
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    this.start.fromArray(array, offset);
    this.end.fromArray(array, offset + 3);
    this.radius = array[offset + 6];

    return this;
  }

  intoArray<T extends NumberArray>(array: T = [] as never, offset: number = 0): T {
    this.start.intoArray(array, offset);
    this.end.intoArray(array, offset + 3);
    array[offset + 6] = this.radius;
    return array;
  }

  translate(vec: Const<Vec3>): this {
    this.start.add(vec);
    this.end.add(vec);

    return this;
  }

  center(into: Vec3 = Vec3.new()): Vec3 {
    return into.set(
      (this.start.x + this.end.x) * 0.5,
      (this.start.y + this.end.y) * 0.5,
      (this.start.z + this.end.z) * 0.5,
    );
  }

  static isAABBAxis(
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    minx: number,
    maxx: number,
    miny: number,
    maxy: number,
    radius: number,
  ): boolean {
    return (
      (minx - p1x < radius || minx - p2x < radius) &&
      (p1x - maxx < radius || p2x - maxx < radius) &&
      (miny - p1y < radius || miny - p2y < radius) &&
      (p1y - maxy < radius || p2y - maxy < radius)
    );
  }

  intersectsBox({ min, max }: Const<Box3>): boolean {
    const { start, end, radius } = this;

    return (
      Capsule.isAABBAxis(start.x, start.y, end.x, end.y, min.x, max.x, min.y, max.y, radius) &&
      Capsule.isAABBAxis(start.x, start.z, end.x, end.z, min.x, max.x, min.z, max.z, radius) &&
      Capsule.isAABBAxis(start.y, start.z, end.y, end.z, min.y, max.y, min.z, max.z, radius)
    );
  }
}

Capsule.prototype.isCapsule = true;
