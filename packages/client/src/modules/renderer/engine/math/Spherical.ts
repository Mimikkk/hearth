import type { Vector3 } from './Vector3.js';
import { clamp as clampNumber } from './MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Spherical_ {
  radius: number;
  phi: number;
  theta: number;
}

export namespace Spherical_ {
  export const create = (radius: number, phi: number, theta: number): Spherical_ => ({ radius, phi, theta });
  export const empty = (): Spherical_ => create(0, 0, 0);
  export const clear = (self: Spherical_): Spherical_ => set(self, 0, 0, 0);

  export const set = (self: Spherical_, radius: number, phi: number, theta: number): Spherical_ => {
    self.radius = radius;
    self.phi = phi;
    self.theta = theta;
    return self;
  };
  export const fill_ = (self: Spherical_, { phi, radius, theta }: Const<Spherical_>): Spherical_ =>
    set(self, radius, phi, theta);

  export const clone = (from: Const<Spherical_>): Spherical_ => clone_(from, empty());
  export const clone_ = (from: Const<Spherical_>, into: Spherical_): Spherical_ => fill_(into, from);

  export const fromCartesian = (from: Const<Vector3>): Spherical_ => fromCartesian_(from, empty());
  export const fromCartesian_ = ({ x, y, z }: Const<Vector3>, into: Spherical_): Spherical_ => {
    into.radius = Math.sqrt(x * x + y * y + z * z);

    if (into.radius === 0) {
      into.theta = 0;
      into.phi = 0;
    } else {
      into.theta = Math.atan2(x, z);
      into.phi = Math.acos(clamp(y / into.radius, -1, 1));
    }

    return into;
  };
  export const fillCartesian = (self: Spherical_, from: Const<Vector3>): Spherical_ => fromCartesian_(from, self);

  export const clamp = (self: Spherical_): Spherical_ => {
    self.phi = clampNumber(self.phi, Number.EPSILON, Math.PI - Number.EPSILON);
    return self;
  };
}
