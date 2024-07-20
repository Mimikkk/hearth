import type { Vec3 } from './Vector3.js';
import { clamp as clampNumber } from './MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export interface Spherical {
  radius: number;
  phi: number;
  theta: number;
}

export namespace Spherical {
  export const create = (radius: number, phi: number, theta: number): Spherical => ({ radius, phi, theta });
  export const empty = (): Spherical => create(0, 0, 0);
  export const clear = (self: Spherical): Spherical => set(self, 0, 0, 0);

  export const set = (self: Spherical, radius: number, phi: number, theta: number): Spherical => {
    self.radius = radius;
    self.phi = phi;
    self.theta = theta;
    return self;
  };
  export const fill_ = (self: Spherical, { phi, radius, theta }: Const<Spherical>): Spherical =>
    set(self, radius, phi, theta);

  export const clone = (from: Const<Spherical>): Spherical => clone_(from, empty());
  export const clone_ = (from: Const<Spherical>, into: Spherical): Spherical => fill_(into, from);

  export const fromCartesian = (from: Const<Vec3>): Spherical => fromCartesian_(from, empty());
  export const fromCartesian_ = ({ x, y, z }: Const<Vec3>, into: Spherical): Spherical => {
    into.radius = Math.sqrt(x * x + y * y + z * z);

    if (into.radius === 0) {
      into.theta = 0;
      into.phi = 0;
    } else {
      into.theta = Math.atan2(x, z);
      into.phi = Math.acos(clampNumber(y / into.radius, -1, 1));
    }

    return into;
  };
  export const fillCartesian = (self: Spherical, from: Const<Vec3>): Spherical => fromCartesian_(from, self);

  export const clamp = (self: Spherical): Spherical => {
    self.phi = clampNumber(self.phi, Number.EPSILON, Math.PI - Number.EPSILON);
    return self;
  };
}
