import { Vec3 } from '../math/Vec3.js';
import type { Mesh } from '../objects/Mesh.js';
import type { Scene } from '../scenes/Scene.js';
import { Quaternion } from '../math/Quaternion.js';
import { Mat4 } from '../math/Mat4.js';
import { Frustum } from '../math/Frustum.js';
import type { Entity } from '../core/Entity.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '@modules/renderer/engine/cameras/OrthographicCamera.js';

const _frustum = new Frustum();
const _center = Vec3.new();

const _tmpPoint = Vec3.new();

const _vecNear = Vec3.new();
const _vecTopLeft = Vec3.new();
const _vecTopRight = Vec3.new();
const _vecDownRight = Vec3.new();
const _vecDownLeft = Vec3.new();

const _vecFarTopLeft = Vec3.new();
const _vecFarTopRight = Vec3.new();
const _vecFarDownRight = Vec3.new();
const _vecFarDownLeft = Vec3.new();

const _vectemp1 = Vec3.new();
const _vectemp2 = Vec3.new();
const _vectemp3 = Vec3.new();

const _matrix = new Mat4();
const _quaternion = Quaternion.new().asIdentity();
const _scale = Vec3.new();

export class SelectionControl {
  start: Vec3 = Vec3.new();
  end: Vec3 = Vec3.new();
  collection: Mesh[] = [];
  instances: Record<string, number[]> = {};

  constructor(
    public camera: PerspectiveCamera | OrthographicCamera,
    public scene: Scene,
    public deep: number = Number.MAX_VALUE,
  ) {
    this.start = Vec3.new();
    this.end = Vec3.new();
    this.collection = [];
    this.instances = {};
  }

  select(startPoint?: Vec3, endPoint?: Vec3): Mesh[] {
    this.start = startPoint || this.start;
    this.end = endPoint || this.end;
    this.collection = [];

    this.updateFrustum(this.start, this.end);
    this.searchChildInFrustum(_frustum, this.scene);

    return this.collection;
  }

  updateFrustum(startPoint: Vec3, endPoint: Vec3): void {
    startPoint = startPoint || this.start;
    endPoint = endPoint || this.end;

    if (startPoint.x === endPoint.x) {
      endPoint.x += Number.EPSILON;
    }

    if (startPoint.y === endPoint.y) {
      endPoint.y += Number.EPSILON;
    }

    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    if (PerspectiveCamera.is(this.camera)) {
      _tmpPoint.from(startPoint);
      _tmpPoint.x = Math.min(startPoint.x, endPoint.x);
      _tmpPoint.y = Math.max(startPoint.y, endPoint.y);
      endPoint.x = Math.max(startPoint.x, endPoint.x);
      endPoint.y = Math.min(startPoint.y, endPoint.y);

      _vecNear.fromMat4Position(this.camera.matrixWorld);
      _vecTopLeft.from(_tmpPoint);
      _vecTopRight.set(endPoint.x, _tmpPoint.y, 0);
      _vecDownRight.from(endPoint);
      _vecDownLeft.set(_tmpPoint.x, endPoint.y, 0);

      _vecTopLeft.unproject(this.camera);
      _vecTopRight.unproject(this.camera);
      _vecDownRight.unproject(this.camera);
      _vecDownLeft.unproject(this.camera);

      _vectemp1.from(_vecTopLeft).sub(_vecNear);
      _vectemp2.from(_vecTopRight).sub(_vecNear);
      _vectemp3.from(_vecDownRight).sub(_vecNear);
      _vectemp1.normalize();
      _vectemp2.normalize();
      _vectemp3.normalize();

      _vectemp1.scale(this.deep);
      _vectemp2.scale(this.deep);
      _vectemp3.scale(this.deep);
      _vectemp1.add(_vecNear);
      _vectemp2.add(_vecNear);
      _vectemp3.add(_vecNear);

      const planes = _frustum.planes;
      planes[0].fromCoplanar(_vecNear, _vecTopLeft, _vecTopRight);
      planes[1].fromCoplanar(_vecNear, _vecTopRight, _vecDownRight);
      planes[2].fromCoplanar(_vecDownRight, _vecDownLeft, _vecNear);
      planes[3].fromCoplanar(_vecDownLeft, _vecTopLeft, _vecNear);
      planes[4].fromCoplanar(_vecTopRight, _vecDownRight, _vecDownLeft);
      planes[5].fromCoplanar(_vectemp3, _vectemp2, _vectemp1).negate();
    } else if (OrthographicCamera.is(this.camera)) {
      const left = Math.min(startPoint.x, endPoint.x);
      const top = Math.max(startPoint.y, endPoint.y);
      const right = Math.max(startPoint.x, endPoint.x);
      const down = Math.min(startPoint.y, endPoint.y);

      _vecTopLeft.set(left, top, -1);
      _vecTopRight.set(right, top, -1);
      _vecDownRight.set(right, down, -1);
      _vecDownLeft.set(left, down, -1);

      _vecFarTopLeft.set(left, top, 1);
      _vecFarTopRight.set(right, top, 1);
      _vecFarDownRight.set(right, down, 1);
      _vecFarDownLeft.set(left, down, 1);

      _vecTopLeft.unproject(this.camera);
      _vecTopRight.unproject(this.camera);
      _vecDownRight.unproject(this.camera);
      _vecDownLeft.unproject(this.camera);

      _vecFarTopLeft.unproject(this.camera);
      _vecFarTopRight.unproject(this.camera);
      _vecFarDownRight.unproject(this.camera);
      _vecFarDownLeft.unproject(this.camera);

      const planes = _frustum.planes;
      planes[0].fromCoplanar(_vecTopLeft, _vecFarTopLeft, _vecFarTopRight);
      planes[1].fromCoplanar(_vecTopRight, _vecFarTopRight, _vecFarDownRight);
      planes[2].fromCoplanar(_vecFarDownRight, _vecFarDownLeft, _vecDownLeft);
      planes[3].fromCoplanar(_vecFarDownLeft, _vecFarTopLeft, _vecTopLeft);
      planes[4].fromCoplanar(_vecTopRight, _vecDownRight, _vecDownLeft);
      planes[5].fromCoplanar(_vecFarDownRight, _vecFarTopRight, _vecFarTopLeft).negate();
    }
  }

  searchChildInFrustum(frustum: Frustum, object: Entity): void {
    if (object.isMesh || object.isLine || object.isPoints) {
      if (object.isInstancedMesh) {
        this.instances[object.uuid] = [];

        for (let instanceId = 0; instanceId < object.count; instanceId++) {
          object.getMatrixAt(instanceId, _matrix);
          _matrix.decompose(_center, _quaternion, _scale);
          _center.applyMat4(object.matrixWorld);

          if (frustum.contains(_center)) {
            this.instances[object.uuid].push(instanceId);
          }
        }
      } else {
        if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere();

        _center.from(object.geometry!.boundingSphere!.center);

        _center.applyMat4(object.matrixWorld);

        if (frustum.contains(_center)) {
          this.collection.push(object);
        }
      }
    }

    if (object.children.length > 0) {
      for (let x = 0; x < object.children.length; x++) {
        this.searchChildInFrustum(frustum, object.children[x]);
      }
    }
  }
}
