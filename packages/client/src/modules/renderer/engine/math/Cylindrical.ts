import type { Vec3 } from './Vector3.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export interface Cylindrical {
  radius: number;
  theta: number;
  y: number;
}

export namespace Cylindrical {
  export const create = (radius: number, theta: number, y: number): Cylindrical => ({ radius, theta, y });
  export const empty = (): Cylindrical => create(0, 0, 0);

  export const set = (self: Cylindrical, radius: number, theta: number, y: number): Cylindrical => {
    self.radius = radius;
    self.theta = theta;
    self.y = y;

    return self;
  };
  export const fill_ = (self: Cylindrical, { radius, theta, y }: Const<Cylindrical>): Cylindrical =>
    set(self, radius, theta, y);

  export const clone = (from: Const<Cylindrical>): Cylindrical => clone_(from, empty());
  export const clone_ = (from: Const<Cylindrical>, into: Cylindrical): Cylindrical => fill_(into, from);

  export const fromCartesian = (from: Const<Vec3>): Cylindrical => fromCartesian_(from, empty());
  export const fromCartesian_ = ({ x, y, z }: Const<Vec3>, into: Cylindrical): Cylindrical =>
    set(into, Math.sqrt(x * x + z * z), Math.atan2(x, z), y);
  export const fillCartesian = (self: Cylindrical, from: Const<Vec3>): Cylindrical => fromCartesian_(from, self);
}
