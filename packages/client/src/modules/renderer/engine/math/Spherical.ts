import type { Vector3 } from './Vector3.js';
import { clamp } from './MathUtils.js';

export class Spherical {
  declare isSpherical: true;
  declare ['constructor']: typeof Spherical;

  constructor(
    public radius: number = 1,
    public phi: number = 0,
    public theta: number = 0,
  ) {}

  set(radius: number, phi: number, theta: number): this {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;

    return this;
  }

  copy(other: Spherical): this {
    this.radius = other.radius;
    this.phi = other.phi;
    this.theta = other.theta;

    return this;
  }

  // restrict phi to be between EPS and PI-EPS
  makeSafe(): this {
    const EPS = 0.000001;
    this.phi = Math.max(EPS, Math.min(Math.PI - EPS, this.phi));

    return this;
  }

  setFromVector3(v: Vector3): this {
    return this.setFromCartesianCoords(v.x, v.y, v.z);
  }

  setFromCartesianCoords(x: number, y: number, z: number): this {
    this.radius = Math.sqrt(x * x + y * y + z * z);

    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else {
      this.theta = Math.atan2(x, z);
      this.phi = Math.acos(clamp(y / this.radius, -1, 1));
    }

    return this;
  }

  clone(): Spherical {
    return new this.constructor().copy(this);
  }
}
Spherical.prototype.isSpherical = true;
