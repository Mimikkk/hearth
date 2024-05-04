import { Vector3 } from '../math/Vector3.js';
import { Object3D } from '../core/Object3D.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';

const _v1 = /*@__PURE__*/ new Vector3();
const _v2 = /*@__PURE__*/ new Vector3();

export class LOD extends Object3D {
  declare isLOD: true;
  declare type: string | 'LOD';

  _currentLevel: number;
  autoUpdate: boolean;
  levels: { distance: number; hysteresis: number; object: Object3D }[];

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

  addLevel(object: Object3D, distance: number, hysteresis: number): this {
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

  getObjectForDistance(distance: number): Object3D | null {
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
      _v1.setFromMatrixPosition(this.matrixWorld);

      const distance = raycaster.ray.origin.distanceTo(_v1);

      this.getObjectForDistance(distance)?.raycast(raycaster, intersects);
    }
  }

  update(camera: PerspectiveCamera | OrthographicCamera) {
    const levels = this.levels;

    if (levels.length > 1) {
      _v1.setFromMatrixPosition(camera.matrixWorld);
      _v2.setFromMatrixPosition(this.matrixWorld);

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
