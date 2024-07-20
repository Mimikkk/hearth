import type { IVec3 } from './Vector3.js';
import type { Const } from './types.js';

export class Cylindrical implements ICylindrical {
  constructor(
    public radius: number,
    public theta: number,
    public height: number,
  ) {}

  static new(radius: number, theta: number, height: number): Cylindrical {
    return new C(radius, theta, height);
  }

  static empty(): Cylindrical {
    return C.new(0, 0, 0);
  }

  static from<S extends T>(from: Const<T>, into: S = I.empty()): S {
    return I.from.self(from, into);
  }

  static fromCartesian<S extends T>(from: Const<IVec3>, into: S = I.empty()): S {
    return I.from.cartesian(from, into);
  }

  into<S extends T = this>(into: S): S {
    return I.from.self(this, into);
  }

  clear(): this {
    return I.clear(this);
  }

  clone<S extends T = this>(into: S = I.empty()): S {
    return I.clone(this, into);
  }

  fillCartesian(from: Const<IVec3>): this {
    return C.fromCartesian(from, this);
  }

  fill(radius: number, theta: number, y: number): this {
    return I.fill(this, radius, theta, y);
  }

  setRadius(radius: number): this {
    return I.set.radius(this, radius);
  }

  setTheta(theta: number): this {
    return I.set.theta(this, theta);
  }

  setHeight(height: number): this {
    return I.set.height(this, height);
  }
}

export interface ICylindrical {
  radius: number;
  theta: number;
  height: number;
}

export namespace ICylindrical {
  export const create = Cylindrical.new as <S extends T>(radius: number, theta: number, y: number) => S;
  export const empty = Cylindrical.empty as <S extends T>() => S;

  export const fill = <S extends T>(self: S, radius: number, theta: number, y: number): S => {
    self.radius = radius;
    self.theta = theta;
    self.height = y;
    return self;
  };
  export const clear = <S extends T>(self: S): S => fill(self, 0, 0, 0);

  export namespace set {
    export const radius = <S extends T>(self: S, radius: number): S => {
      self.radius = radius;
      return self;
    };
    export const theta = <S extends T>(self: S, theta: number): S => {
      self.theta = theta;
      return self;
    };
    export const height = <S extends T>(self: S, height: number): S => {
      self.height = height;
      return self;
    };
  }

  export namespace from {
    export const self = <S extends T>({ radius, theta, height }: Const<T>, into: S = empty()): S =>
      fill(into, radius, theta, height);

    export const cartesian = <S extends T>({ x, y, z }: Const<IVec3>, into: S = empty()): S =>
      fill(into, Math.sqrt(x * x + z * z), Math.atan2(x, z), y);
  }

  export const clone = from.self;
}

const I = ICylindrical;
const C = Cylindrical;
type T = ICylindrical;
