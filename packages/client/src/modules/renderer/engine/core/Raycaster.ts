import { Ray } from '../math/Ray.js';
import { RaycastLayers } from './RaycastLayers.js';
import type { Vec3 } from '../math/Vec3.js';
import type { Camera } from '../cameras/Camera.js';
import type { Entity } from './Entity.js';
import type { Face } from '../math/ConvexHull.js';
import type { Vec2 } from '../math/Vec2.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';

export interface RaycasterParameters {
  Mesh: any;
  Line: { threshold: number };
  Line2?: { threshold: number };
  LOD: any;
  Points: { threshold: number };
  Sprite: any;
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

const findIntersections = <T extends Entity>(
  object: Entity,
  raycaster: Raycaster,
  intersects: Intersection<T>[],
  recursive: boolean,
): Intersection<T>[] => {
  if (object.layers.test(raycaster.layers)) object.raycast(raycaster, intersects);

  if (!recursive) return intersects;

  const { children } = object;
  for (let i = 0, l = children.length; i < l; ++i) {
    findIntersections(children[i], raycaster, intersects, recursive);
  }

  return intersects;
};

export class Raycaster {
  ray: Ray;
  near: number;
  far: number;
  camera: Camera;
  layers: RaycastLayers;
  params: RaycasterParameters;

  constructor(origin?: Vec3, direction?: Vec3, near: number = 0, far: number = Infinity) {
    this.ray = new Ray(origin, direction);
    this.camera = null!;
    this.near = near;
    this.far = far;
    this.layers = new RaycastLayers();

    this.params = {
      Mesh: {},
      Line: { threshold: 1 },
      LOD: {},
      Points: { threshold: 1 },
      Sprite: {},
    };
  }

  set(origin: Vec3, direction: Vec3): this {
    this.ray.set(origin, direction);
    return this;
  }

  setFromCamera(coords: Vec2, camera: Camera): this {
    if (camera instanceof PerspectiveCamera) {
      this.ray.origin.fromMat4Position(camera.matrixWorld);
      this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
      this.camera = camera;
    } else if (camera instanceof OrthographicCamera) {
      // set origin in plane of camera
      this.ray.origin
        .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
        .unproject(camera);
      this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
      this.camera = camera;
    } else {
      console.error('engine.Raycaster: Unsupported camera type: ' + camera.type);
    }
    return this;
  }

  intersect<T extends Entity>(object: Entity, recursive: boolean = true, intersects: Intersection<T>[] = []) {
    return findIntersections(object, this, intersects, recursive).sort(asc);
  }

  intersects<T extends Entity>(
    objects: Entity[],
    recursive: boolean = true,
    intersects: Intersection<T>[] = [],
  ): Intersection<T>[] {
    for (let i = 0, l = objects.length; i < l; i++) findIntersections(objects[i], this, intersects, recursive);

    return intersects.sort(asc);
  }
}
