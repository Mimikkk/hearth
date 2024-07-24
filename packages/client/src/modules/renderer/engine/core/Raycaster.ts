import { Ray } from '../math/Ray.js';
import { RaycastLayers } from './RaycastLayers.js';
import type { Vec3 } from '../math/Vec3.js';
import type { ICamera } from '../cameras/Camera.js';
import type { Entity } from './Entity.js';
import type { Face } from '../math/ConvexHull.js';
import type { Vec2 } from '../math/Vec2.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import type { Const } from '@modules/renderer/engine/math/types.js';

export class Raycaster {
  constructor(
    public camera: ICamera,
    public ray: Ray = new Ray(),
    public near: number = 0,
    public far: number = Infinity,
    public layers: RaycastLayers = new RaycastLayers(),
  ) {}

  static new(camera?: ICamera): Raycaster {
    return Raycaster.new(camera!);
  }

  static fromCamera(camera: ICamera, at: Const<Vec2>, into: Raycaster = Raycaster.new()): Raycaster {
    return into.fromCamera(at, camera);
  }

  set(origin: Const<Vec3>, direction: Const<Vec3>): this {
    this.ray.set(origin, direction);
    return this;
  }

  fromCamera({ x, y }: Const<Vec2>, camera: ICamera): this {
    if (PerspectiveCamera.is(camera)) {
      this.ray.origin.fromMat4Position(camera.matrixWorld);
      this.ray.direction.set(x, y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
    } else {
      this.ray.origin.set(x, y, (camera.near + camera.far) / (camera.near - camera.far)).unproject(camera);
      this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
    }
    this.camera = camera;

    return this;
  }

  intersect<T extends Entity>(object: Entity, recursive: boolean = true, into: Intersection<T>[] = []) {
    return this.#find(object, recursive, into).sort(asc);
  }

  intersects<T extends Entity>(
    objects: Entity[],
    recursive: boolean = true,
    into: Intersection<T>[] = [],
  ): Intersection<T>[] {
    for (let i = 0, it = objects.length; i < it; i++) {
      this.#find(objects[i], recursive, into);
    }

    return into.sort(asc);
  }

  #find<T extends Entity>(object: Entity, recursive: boolean, into: Intersection<T>[]): Intersection<T>[] {
    if (object.layers.test(this.layers)) object.raycast(this, into);

    if (!recursive) return into;

    const { children } = object;
    for (let i = 0, it = children.length; i < it; ++i) {
      this.#find(children[i], recursive, into);
    }

    return into;
  }
}

export interface Intersection<T extends Entity = Entity> {
  distance: number;
  distanceToRay?: number | undefined;
  point: Vec3;
  index?: number | undefined;
  face?: Face | null | undefined;
  faceIndex?: number | undefined;
  object: T;
  uv?: Vec2 | undefined;
  uv1?: Vec2 | undefined;
  normal?: Vec3;
  instanceId?: number | undefined;
  pointOnLine?: Vec3;
  batchId?: number;
}

const asc = <T extends Entity>(a: Intersection<T>, b: Intersection<T>): number => a.distance - b.distance;
