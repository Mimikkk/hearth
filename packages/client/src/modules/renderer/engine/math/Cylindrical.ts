import type { IVec3 } from './Vector3.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export class Cylindrical {
  declare isCylindrical: true;

  constructor(
    public radius: number = 0,
    public theta: number = 0,
    public height: number = 0,
  ) {}

  static new(radius: number = 0, theta: number = 0, height: number = 0): Cylindrical {
    return new Cylindrical(radius, theta, height);
  }

  static empty(): Cylindrical {
    return Cylindrical.new();
  }

  static clone({ radius, theta, height }: Const<Cylindrical>, into: Cylindrical = Cylindrical.empty()): Cylindrical {
    return into.set(radius, theta, height);
  }

  static is(cylindrical: any): cylindrical is Cylindrical {
    return cylindrical?.isCylindrical === true;
  }

  static into(into: Cylindrical, { radius, theta, height }: Const<Cylindrical>): Cylindrical {
    return into.set(radius, theta, height);
  }

  static from({ radius, theta, height }: Const<Cylindrical>, into: Cylindrical = Cylindrical.empty()): Cylindrical {
    return into.set(radius, theta, height);
  }

  static fromCoord(coord: Const<IVec3>, into: Cylindrical = Cylindrical.new()): Cylindrical {
    return into.fromCoord(coord);
  }

  from({ radius, height, theta }: Const<Cylindrical>): this {
    return this.set(radius, theta, height);
  }

  set(radius: number, theta: number, height: number): this {
    this.radius = radius;
    this.theta = theta;
    this.height = height;
    return this;
  }

  fromCoord({ x, y, z }: Const<IVec3>): this {
    return this.set(Math.sqrt(x * x + z * z), Math.atan2(x, z), y);
  }
}
