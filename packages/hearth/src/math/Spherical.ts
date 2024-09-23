import type { Vec3 } from './Vec3.js';
import { clamp, type NumberArray } from './MathUtils.js';
import type { Const } from './types.js';

export class Spherical {
  declare isSpherical: true;

  constructor(
    public radius: number = 1,
    public phi: number = 0,
    public theta: number = 0,
  ) {}

  static new(radius: number = 1, phi: number = 0, theta: number = 0): Spherical {
    return new Spherical(radius, phi, theta);
  }

  static empty(): Spherical {
    return Spherical.new();
  }

  static clone({ radius, phi, theta }: Const<Spherical>, into: Spherical = Spherical.empty()): Spherical {
    return into.set(radius, phi, theta);
  }

  static is(spherical: any): spherical is Spherical {
    return spherical?.isSpherical === true;
  }

  static into(into: Spherical, { radius, phi, theta }: Const<Spherical>): Spherical {
    return into.set(radius, phi, theta);
  }

  static from({ radius, phi, theta }: Const<Spherical>, into: Spherical = Spherical.empty()): Spherical {
    return into.set(radius, phi, theta);
  }

  static fromCoord(coord: Const<Vec3>, into: Spherical = Spherical.new()): Spherical {
    return into.fromCoord(coord);
  }

  clone(into: Spherical = Spherical.new()): Spherical {
    return into.from(this);
  }

  clear(): this {
    return this.set(0, 0, 0);
  }

  from({ radius, phi, theta }: Const<Spherical>): this {
    return this.set(radius, phi, theta);
  }

  set(radius: number, phi: number, theta: number): this {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }

  fromCoord(vec: Const<Vec3>): this {
    const { x, y, z } = vec;
    this.radius = vec.length();

    if (this.radius === 0) return this.set(0, 0, 0);
    return this.set(this.radius, Math.acos(clamp(y / this.radius, -1, 1)), Math.atan2(x, z));
  }

  asClamp(): this {
    this.phi = clamp(this.phi, Number.EPSILON, Math.PI - Number.EPSILON);
    return this;
  }

  fromArray(array: Const<NumberArray>, offset: number = 0): this {
    return this.set(array[offset], array[offset + 1], array[offset + 2]);
  }

  intoArray<T extends NumberArray = number[]>(array: T = [] as never, offset: number = 0): T {
    array[offset] = this.radius;
    array[offset + 1] = this.phi;
    array[offset + 2] = this.theta;
    return array;
  }
}

Spherical.prototype.isSpherical = true;
