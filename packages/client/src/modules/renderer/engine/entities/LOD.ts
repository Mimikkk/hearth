import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Entity, EntityParameters } from '../core/Entity.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';

const _v1 = Vec3.new();
const _v2 = Vec3.new();

export class LOD extends Entity {
  declare isLOD: true;

  #level: number;
  useAutoUpdate: boolean;
  levels: LODLevel[];

  constructor(parameters?: LODParameters) {
    super(parameters);

    this.levels = parameters?.levels ?? [];
    for (let i = 0; i < this.levels.length; ++i) {
      this.addLevel(this.levels[i].entity);
    }

    this.useAutoUpdate = parameters?.useAutoUpdate ?? true;
    this.#level = 0;
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

    levels.splice(l, 0, { distance: distance, hysteresis: hysteresis, entity: object });

    this.add(object);

    return this;
  }

  getObjectForDistance(distance: number): Entity | null {
    const levels = this.levels;

    if (levels.length > 0) {
      let i, l;

      for (i = 1, l = levels.length; i < l; i++) {
        let levelDistance = levels[i].distance;

        if (levels[i].entity.visible) {
          levelDistance -= levelDistance * levels[i].hysteresis;
        }

        if (distance < levelDistance) {
          break;
        }
      }

      return levels[i - 1].entity;
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

  update(camera: ICamera) {
    if (this.levels.length > 1) {
      _v1.fromMat4Position(camera.matrixWorld);
      _v2.fromMat4Position(this.matrixWorld);

      const distance = _v1.distanceTo(_v2) / camera.zoom;

      this.levels[0].entity.visible = true;

      let i, l;

      for (i = 1, l = this.levels.length; i < l; i++) {
        let levelDistance = this.levels[i].distance;

        if (this.levels[i].entity.visible) {
          levelDistance -= levelDistance * this.levels[i].hysteresis;
        }

        if (distance >= levelDistance) {
          this.levels[i - 1].entity.visible = false;
          this.levels[i].entity.visible = true;
        } else {
          break;
        }
      }

      this.#level = i - 1;
      for (; i < l; ++i) {
        this.levels[i].entity.visible = false;
      }
    }
  }
}

LOD.prototype.isLOD = true;

export interface LODLevel {
  distance: number;
  hysteresis: number;
  entity: Entity;
}

interface LODParameters extends EntityParameters {
  levels?: LODLevel[];
  useAutoUpdate?: boolean;
}
