import { Vec3 } from './Vec3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';

export class Capsule {
  declare ['constructor']: typeof Capsule;
  declare isCapsule: true;

  constructor(
    public start: Vec3 = new Vec3(0, 0, 0),
    public end: Vec3 = new Vec3(0, 1, 0),
    public radius: number = 1,
  ) {}

  clone(): Capsule {
    return new Capsule(this.start.clone(), this.end.clone(), this.radius);
  }

  set(start: Vec3, end: Vec3, radius: number): this {
    this.start.copy(start);
    this.end.copy(end);
    this.radius = radius;

    return this;
  }

  copy(capsule: Capsule): this {
    this.start.copy(capsule.start);
    this.end.copy(capsule.end);
    this.radius = capsule.radius;

    return this;
  }

  getCenter(target: Vec3): Vec3 {
    return target.copy(this.end).add(this.start).multiplyScalar(0.5);
  }

  translate(v: Vec3): this {
    this.start.add(v);
    this.end.add(v);

    return this;
  }

  checkAABBAxis(
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

  intersectsBox(box: Box3): boolean {
    return (
      this.checkAABBAxis(
        this.start.x,
        this.start.y,
        this.end.x,
        this.end.y,
        box.min.x,
        box.max.x,
        box.min.y,
        box.max.y,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.x,
        this.start.z,
        this.end.x,
        this.end.z,
        box.min.x,
        box.max.x,
        box.min.z,
        box.max.z,
        this.radius,
      ) &&
      this.checkAABBAxis(
        this.start.y,
        this.start.z,
        this.end.y,
        this.end.z,
        box.min.y,
        box.max.y,
        box.min.z,
        box.max.z,
        this.radius,
      )
    );
  }
}
Capsule.prototype.isCapsule = true;
