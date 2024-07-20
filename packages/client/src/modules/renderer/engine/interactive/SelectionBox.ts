import { Vec3, Vector3 } from '../math/Vector3.js';
import type { Mesh } from '../objects/Mesh.js';
import type { Scene } from '../scenes/Scene.js';
import { Quaternion } from '../math/Quaternion.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Frustum } from '../math/Frustum.js';
import type { Object3D } from '../core/Object3D.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '@modules/renderer/engine/cameras/OrthographicCamera.js';
import { throttle } from 'lodash-es';
import { Plane_ } from '@modules/renderer/engine/math/Plane.js';

const _frustum = Frustum.empty();
const _center = new Vector3();

const _tmpPoint = new Vector3();

const _vecNear = new Vector3();
const _vecTopLeft = new Vector3();
const _vecTopRight = new Vector3();
const _vecDownRight = new Vector3();
const _vecDownLeft = new Vector3();

const _vecFarTopLeft = new Vector3();
const _vecFarTopRight = new Vector3();
const _vecFarDownRight = new Vector3();
const _vecFarDownLeft = new Vector3();

const _vectemp1 = new Vector3();
const _vectemp2 = new Vector3();
const _vectemp3 = new Vector3();

const _matrix = new Matrix4();
const _quaternion = Quaternion.identity();
const _scale = new Vector3();

const isPerspectiveCamera = (camera: any): camera is PerspectiveCamera => camera.isPerspectiveCamera;
const isOrthographicCamera = (camera: any): camera is OrthographicCamera => camera.isOrthographicCamera;

export class SelectionBox {
  startPoint: Vector3 = new Vector3();
  endPoint: Vector3 = new Vector3();
  collection: Mesh[] = [];
  instances: Record<string, number[]> = {};

  constructor(
    public camera: PerspectiveCamera | OrthographicCamera,
    public scene: Scene,
    public deep: number = Number.MAX_VALUE,
  ) {
    this.startPoint = new Vector3();
    this.endPoint = new Vector3();
    this.collection = [];
    this.instances = {};
  }

  select(startPoint: Vector3, endPoint: Vector3): Mesh[] {
    this.startPoint = startPoint || this.startPoint;
    this.endPoint = endPoint || this.endPoint;
    this.collection = [];

    this.updateFrustum(this.startPoint, this.endPoint);
    this.searchChildInFrustum(_frustum, this.scene);

    return this.collection;
  }

  updateFrustum(startPoint: Vector3, endPoint: Vector3): void {
    startPoint = startPoint || this.startPoint;
    endPoint = endPoint || this.endPoint;

    if (startPoint.x === endPoint.x) {
      endPoint.x += Number.EPSILON;
    }

    if (startPoint.y === endPoint.y) {
      endPoint.y += Number.EPSILON;
    }

    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    if (isPerspectiveCamera(this.camera)) {
      _tmpPoint.copy(startPoint);
      _tmpPoint.x = Math.min(startPoint.x, endPoint.x);
      _tmpPoint.y = Math.max(startPoint.y, endPoint.y);
      endPoint.x = Math.max(startPoint.x, endPoint.x);
      endPoint.y = Math.min(startPoint.y, endPoint.y);

      _vecNear.setFromMatrixPosition(this.camera.matrixWorld);
      _vecTopLeft.copy(_tmpPoint);
      _vecTopRight.set(endPoint.x, _tmpPoint.y, 0);
      _vecDownRight.copy(endPoint);
      _vecDownLeft.set(_tmpPoint.x, endPoint.y, 0);

      _vecTopLeft.unproject(this.camera);
      _vecTopRight.unproject(this.camera);
      _vecDownRight.unproject(this.camera);
      _vecDownLeft.unproject(this.camera);

      _vectemp1.copy(_vecTopLeft).sub(_vecNear);
      _vectemp2.copy(_vecTopRight).sub(_vecNear);
      _vectemp3.copy(_vecDownRight).sub(_vecNear);
      _vectemp1.normalize();
      _vectemp2.normalize();
      _vectemp3.normalize();

      _vectemp1.multiplyScalar(this.deep);
      _vectemp2.multiplyScalar(this.deep);
      _vectemp3.multiplyScalar(this.deep);
      _vectemp1.add(_vecNear);
      _vectemp2.add(_vecNear);
      _vectemp3.add(_vecNear);

      const planes = _frustum.planes;
      Plane_.fillCoplanar(planes[0], _vecNear, _vecTopLeft, _vecTopRight);
      Plane_.fillCoplanar(planes[1], _vecNear, _vecTopRight, _vecDownRight);
      Plane_.fillCoplanar(planes[2], _vecDownRight, _vecDownLeft, _vecNear);
      Plane_.fillCoplanar(planes[3], _vecDownLeft, _vecTopLeft, _vecNear);
      Plane_.fillCoplanar(planes[4], _vecTopRight, _vecDownRight, _vecDownLeft);
      Plane_.fillCoplanar(planes[5], _vectemp3, _vectemp2, _vectemp1);

      Vec3.negate(planes[5].normal);
    } else if (isOrthographicCamera(this.camera)) {
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
      Plane_.fillCoplanar(planes[0], _vecTopLeft, _vecFarTopLeft, _vecFarTopRight);
      Plane_.fillCoplanar(planes[1], _vecTopRight, _vecFarTopRight, _vecFarDownRight);
      Plane_.fillCoplanar(planes[2], _vecFarDownRight, _vecFarDownLeft, _vecDownLeft);
      Plane_.fillCoplanar(planes[3], _vecFarDownLeft, _vecFarTopLeft, _vecTopLeft);
      Plane_.fillCoplanar(planes[4], _vecTopRight, _vecDownRight, _vecDownLeft);
      Plane_.fillCoplanar(planes[5], _vecFarDownRight, _vecFarTopRight, _vecFarTopLeft);
      Vec3.negate(planes[5].normal);
    }
  }

  searchChildInFrustum(frustum: Frustum, object: Object3D): void {
    if (object.isMesh || object.isLine || object.isPoints) {
      if (object.isInstancedMesh) {
        this.instances[object.uuid] = [];

        for (let instanceId = 0; instanceId < object.count; instanceId++) {
          object.getMatrixAt(instanceId, _matrix);
          _matrix.decompose(_center, _quaternion, _scale);
          _center.applyMatrix4(object.matrixWorld);

          if (Frustum.containsVec(frustum, _center)) {
            this.instances[object.uuid].push(instanceId);
          }
        }
      } else {
        if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere();

        _center.copy(object.geometry!.boundingSphere!.center);

        _center.applyMatrix4(object.matrixWorld);

        if (Frustum.containsVec(frustum, _center)) {
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
