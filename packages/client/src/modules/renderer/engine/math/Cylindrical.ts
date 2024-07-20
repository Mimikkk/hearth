import type { Vec3 } from './Vec3.js';

export class Cylindrical {
  declare ['constructor']: typeof Cylindrical;

  constructor(
    public radius: number = 1,
    public theta: number = 0,
    public y: number = 0,
  ) {}

  set(radius: number, theta: number, y: number): this {
    this.radius = radius;
    this.theta = theta;
    this.y = y;

    return this;
  }

  copy(other: Cylindrical): this {
    this.radius = other.radius;
    this.theta = other.theta;
    this.y = other.y;

    return this;
  }

  setFromVec3(v: Vec3): this {
    return this.setFromCartesianCoords(v.x, v.y, v.z);
  }

  setFromCartesianCoords(x: number, y: number, z: number): this {
    this.radius = Math.sqrt(x * x + z * z);
    this.theta = Math.atan2(x, z);
    this.y = y;

    return this;
  }

  clone(): Cylindrical {
    return new this.constructor().copy(this);
  }
}
