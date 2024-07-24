import { Vec3 } from '../math/Vec3.js';
import { Entity } from '../core/Entity.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '@modules/renderer/engine/objects/cameras/OrthographicCamera.js';

const _v1 = Vec3.new();
const _v2 = Vec3.new();

export class LOD extends Entity {
  declare isLOD: true;
  declare type: string | 'LOD';

  _currentLevel: number;
  autoUpdate: boolean;
  levels: { distance: number; hysteresis: number; object: Entity }[];

  constructor() {
    super();

    this._currentLevel = 0;

    this.type = 'LOD';

    Object.defineProperties(this, {
      levels: {
        enumerable: true,
        value: [],
      },
      isLOD: {
        value: true,
      },
    });

    this.autoUpdate = true;
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    const levels = source.levels;

    for (let i = 0, l = levels.length; i < l; i++) {
      const level = levels[i];

      this.addLevel(level.object.clone(), level.distance, level.hysteresis);
    }

    this.autoUpdate = source.autoUpdate;

    return this;
  }

  addLevel(object: Entity, distance: number, hysteresis: number): this {
    distance = Math.abs(distance);

    const levels = this.levels;

    let l;

    for (l = 0; l < levels.length; l++) {
      if (distance < levels[l].distance) {
        break;
      }
    }

    levels.splice(l, 0, { distance: distance, hysteresis: hysteresis, object: object });

    this.add(object);

    return this;
  }

  getObjectForDistance(distance: number): Entity | null {
    const levels = this.levels;

    if (levels.length > 0) {
      let i, l;

      for (i = 1, l = levels.length; i < l; i++) {
        let levelDistance = levels[i].distance;

        if (levels[i].object.visible) {
          levelDistance -= levelDistance * levels[i].hysteresis;
        }

        if (distance < levelDistance) {
          break;
        }
      }

      return levels[i - 1].object;
    }

    return null;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const levels = this.levels;

    if (levels.length > 0) {
      _v1.fromMat4Position(this.matrixWorld);

      const distance = raycaster.ray.origin.distanceTo(_v1);

      this.getObjectForDistance(distance)?.raycast(raycaster, intersects);
    }
  }

  update(camera: PerspectiveCamera | OrthographicCamera) {
    const levels = this.levels;

    if (levels.length > 1) {
      _v1.fromMat4Position(camera.matrixWorld);
      _v2.fromMat4Position(this.matrixWorld);

      const distance = _v1.distanceTo(_v2) / camera.zoom;

      levels[0].object.visible = true;

      let i, l;

      for (i = 1, l = levels.length; i < l; i++) {
        let levelDistance = levels[i].distance;

        if (levels[i].object.visible) {
          levelDistance -= levelDistance * levels[i].hysteresis;
        }

        if (distance >= levelDistance) {
          levels[i - 1].object.visible = false;
          levels[i].object.visible = true;
        } else {
          break;
        }
      }

      this._currentLevel = i - 1;

      for (; i < l; i++) {
        levels[i].object.visible = false;
      }
    }
  }
}

LOD.prototype.isLOD = true;
LOD.prototype.type = 'LOD';
