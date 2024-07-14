import { Ray } from '../math/Ray.js';
import { Layers } from './Layers.js';
import type { Vector3 } from '../math/Vector3.js';
import type { Camera } from '../cameras/Camera.js';
import type { Object3D } from './Object3D.js';
import type { Face } from '../math/ConvexHull.js';
import type { Vector2 } from '../math/Vector2.js';
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

export interface Intersection<T extends Object3D = Object3D> {
  distance: number;
  distanceToRay?: number | undefined;
  point: Vector3;
  index?: number | undefined;
  face?: Face | null | undefined;
  faceIndex?: number | undefined;
  object: T;
  uv?: Vector2 | undefined;
  uv1?: Vector2 | undefined;
  normal?: Vector3;
  instanceId?: number | undefined;
  pointOnLine?: Vector3;
  batchId?: number;
}

const asc = <T extends Object3D>(a: Intersection<T>, b: Intersection<T>): number => a.distance - b.distance;

const findIntersections = <T extends Object3D>(
  object: Object3D,
  raycaster: Raycaster,
  intersects: Intersection<T>[],
  recursive: boolean,
): Intersection<T>[] => {
  if (object.layers.test(raycaster.layers)) {
    console.log({ object });
    object.raycast(raycaster, intersects);
  }

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
  layers: Layers;
  params: RaycasterParameters;

  constructor(origin?: Vector3, direction?: Vector3, near: number = 0, far: number = Infinity) {
    this.ray = new Ray(origin, direction);
    this.camera = null!;
    this.near = near;
    this.far = far;
    this.layers = new Layers();

    this.params = {
      Mesh: {},
      Line: { threshold: 1 },
      LOD: {},
      Points: { threshold: 1 },
      Sprite: {},
    };
  }

  set(origin: Vector3, direction: Vector3): this {
    this.ray.set(origin, direction);
    return this;
  }

  setFromCamera(coords: Vector2, camera: Camera): this {
    if (camera instanceof PerspectiveCamera) {
      this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
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

  intersect<T extends Object3D>(object: Object3D, recursive: boolean = true, intersects: Intersection<T>[] = []) {
    return findIntersections(object, this, intersects, recursive).sort(asc);
  }

  intersects<T extends Object3D>(
    objects: Object3D[],
    recursive: boolean = true,
    intersects: Intersection<T>[] = [],
  ): Intersection<T>[] {
    console.log('start');
    for (let i = 0, l = objects.length; i < l; i++) findIntersections(objects[i], this, intersects, recursive);

    return intersects.sort(asc);
  }
}
