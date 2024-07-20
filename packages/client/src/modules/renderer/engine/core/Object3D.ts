import { Quaternion, Quaternion_ } from '../math/Quaternion.js';
import { Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';
import { EventDispatcher } from './EventDispatcher.js';
import { Euler } from '../math/Euler.js';
import { Layers } from './Layers.js';
import { Matrix3 } from '../math/Matrix3.js';
import * as MathUtils from '../math/MathUtils.js';
import type { Intersection, Raycaster } from './Raycaster.js';
import type { Light } from '../lights/Light.js';
import type { Scene } from '../scenes/Scene.js';
import type { BufferGeometry } from './BufferGeometry.js';
import type { Camera } from '../cameras/Camera.js';
import type { Material } from '../materials/Material.js';
import type { Group } from '../objects/Group.js';
import type { Vector2 } from '../math/Vector2.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Renderer } from '../renderers/webgpu/Renderer.js';

let _object3DId = 0;

const _v1 = /*@__PURE__*/ new Vector3();
const _q1 = /*@__PURE__*/ Quaternion_.identity();
const _m1 = /*@__PURE__*/ new Matrix4();
const _target = /*@__PURE__*/ new Vector3();

const _position = /*@__PURE__*/ new Vector3();
const _scale = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ Quaternion_.identity();

const _xAxis = /*@__PURE__*/ new Vector3(1, 0, 0);
const _yAxis = /*@__PURE__*/ new Vector3(0, 1, 0);
const _zAxis = /*@__PURE__*/ new Vector3(0, 0, 1);

export interface Object3DEventMap {
  added: {};
  removed: {};
  childadded: { child: Object3D };
  childremoved: { child: Object3D };
  pointerdown: { data: Vector2 };
  pointerup: { data: Vector2 };
  pointermove: { data: Vector2 };
  mousedown: { data: Vector2 };
  mouseup: { data: Vector2 };
  mousemove: { data: Vector2 };
  click: { data: Vector2 };
  dispose: {};
}

const isCamera = (object: any): object is Camera => object.isCamera;
const isLight = (object: any): object is Light<any> => object.isLight;

export class Object3D<EventMap extends Object3DEventMap = any> {
  declare ['constructor']: typeof Object3D;
  declare isObject3D: true;
  static DEFAULT_UP: Vector3 = new Vector3(0, 1, 0);
  static DEFAULT_MATRIX_AUTO_UPDATE: boolean = true;
  static DEFAULT_MATRIX_WORLD_AUTO_UPDATE: boolean = true;

  eventDispatcher = new EventDispatcher<EventMap>();

  occlusionTest: boolean;
  geometry: BufferGeometry | null;
  boundingBox: Box3 | null;
  id: number;
  uuid: string;
  name: string;
  type: string | 'Object3D';
  parent: Object3D | null;
  children: Object3D[];
  up: Vector3;
  position: Vector3;
  quaternion: Quaternion_;
  scale: Vector3;
  modelViewMatrix: Matrix4;
  normalMatrix: Matrix3;
  matrix: Matrix4;
  matrixWorld: Matrix4;
  matrixAutoUpdate: boolean;
  matrixWorldAutoUpdate: boolean;
  matrixWorldNeedsUpdate: boolean;
  layers: Layers;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;
  renderOrder: number;
  animations: any[];
  userData: Record<string, any>;

  constructor() {
    this.id = _object3DId++;
    this.uuid = MathUtils.generateUuid();

    this.name = '';
    this.type = 'Object3D';

    this.parent = null;
    this.children = [];

    this.up = Object3D.DEFAULT_UP.clone();

    this.position = new Vector3();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.modelViewMatrix = new Matrix4();
    this.normalMatrix = new Matrix3();

    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();

    this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

    // checked by the renderer
    this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE;
    this.matrixWorldNeedsUpdate = false;

    this.layers = new Layers();
    this.visible = true;

    this.castShadow = false;
    this.receiveShadow = false;

    this.frustumCulled = true;
    this.renderOrder = 0;

    this.animations = [];

    this.userData = {};
  }

  onBeforeShadow(
    renderer: Renderer,
    scene: Scene,
    shadowCamera: Camera,
    geometry: BufferGeometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onAfterShadow(
    renderer: Renderer,
    scene: Scene,
    shadowCamera: Camera,
    geometry: BufferGeometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onBeforeRender(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
  ): void {}

  onAfterRender(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
  ): void {}

  applyMatrix4(matrix: Matrix4): this {
    if (this.matrixAutoUpdate) this.updateMatrix();

    this.matrix.premultiply(matrix);

    this.matrix.decompose(this.position, this.quaternion, this.scale);

    return this;
  }

  applyQuaternion(q: Quaternion_): this {
    Quaternion_.premultiply(this.quaternion, q);
    return this;
  }

  setRotationFromAxisAngle(axis: Vector3, angle: number): this {
    Quaternion_.fillAxisAngle(this.quaternion, axis, angle);
    return this;
  }

  setRotationFromEuler(euler: Euler): this {
    Quaternion_.fillEuler(this.quaternion, euler);
    return this;
  }

  setRotationFromMatrix(m: Matrix4): this {
    Quaternion_.fillRotation(this.quaternion, m);
    return this;
  }

  setRotationFromQuaternion(q: Quaternion_): this {
    Quaternion_.fill_(q, this.quaternion);
    return this;
  }

  rotateOnAxis(axis: Vector3, angle: number): this {
    // rotate object on axis in object space
    // axis is assumed to be normalized

    Quaternion_.fillAxisAngle(_q1, axis, angle);
    Quaternion_.multiply(this.quaternion, _q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vector3, angle: number): this {
    // rotate object on axis in world space
    // axis is assumed to be normalized
    // method assumes no rotated parent

    Quaternion_.fillAxisAngle(_q1, axis, angle);
    Quaternion_.premultiply(this.quaternion, _q1);

    return this;
  }

  setRotationX(angle: number): this {
    return this.setRotationFromEuler(Euler.create(angle, this.getRotationY(), this.getRotationZ()));
  }

  setRotationY(angle: number): this {
    return this.setRotationFromEuler(Euler.create(this.getRotationX(), angle, this.getRotationZ()));
  }

  setRotationZ(angle: number): this {
    return this.setRotationFromEuler(Euler.create(this.getRotationX(), this.getRotationY(), angle));
  }

  setRotation(angleX: number, angleY: number, angleZ: number): this {
    return this.setRotationFromEuler(Euler.create(angleX, angleY, angleZ));
  }

  getRotationX(): number {
    const { x, y, z, w } = this.quaternion;

    return Math.atan2(2 * (x * w - y * z), 1 - 2 * (x * x - z * z));
  }

  getRotationY(): number {
    const { x, y, z, w } = this.quaternion;

    return Math.asin(2 * (x * z + y * w));
  }

  getRotationZ(): number {
    // get form quaternion
    const { x, y, z, w } = this.quaternion;

    return Math.atan2(2 * (x * y - z * w), 1 - 2 * (x * x + y * y));
  }

  rotateX(angle: number): this {
    return this.rotateOnAxis(_xAxis, angle);
  }

  rotateY(angle: number): this {
    return this.rotateOnAxis(_yAxis, angle);
  }

  rotateZ(angle: number): this {
    return this.rotateOnAxis(_zAxis, angle);
  }

  rotate(angleX: number, angleY: number, angleZ: number): this {
    Quaternion_.fillEuler(_q1, Euler.create(angleX, angleY, angleZ));
    Quaternion_.multiply(this.quaternion, _q1);

    return this;
  }

  translateOnAxis(axis: Vector3, distance: number): this {
    // translate object by distance along axis in object space
    // axis is assumed to be normalized

    _v1.copy(axis).applyQuaternion(this.quaternion);

    this.position.add(_v1.multiplyScalar(distance));

    return this;
  }

  translateX(distance: number): this {
    return this.translateOnAxis(_xAxis, distance);
  }

  translateY(distance: number): this {
    return this.translateOnAxis(_yAxis, distance);
  }

  translateZ(distance: number): this {
    return this.translateOnAxis(_zAxis, distance);
  }

  localToWorld(vector: Vector3): Vector3 {
    this.updateWorldMatrix(true, false);

    return vector.applyMatrix4(this.matrixWorld);
  }

  worldToLocal(vector: Vector3): Vector3 {
    this.updateWorldMatrix(true, false);

    return vector.applyMatrix4(_m1.copy(this.matrixWorld).invert());
  }

  lookAt(x: Vector3): this;
  lookAt(x: number, y: number, z: number): this;
  lookAt(x: number | Vector3, y?: number, z?: number): this {
    // This method does not support objects having non-uniformly-scaled parent(s)

    if (x instanceof Vector3) {
      _target.copy(x);
    } else {
      _target.set(x, y!, z!);
    }

    const parent = this.parent;

    this.updateWorldMatrix(true, false);

    _position.setFromMatrixPosition(this.matrixWorld);

    if (isCamera(this) || isLight(this)) {
      _m1.lookAt(_position, _target, this.up);
    } else {
      _m1.lookAt(_target, _position, this.up);
    }

    Quaternion_.fillRotation(this.quaternion, _m1);

    if (parent) {
      _m1.extractRotation(parent.matrixWorld);
      Quaternion_.fillRotation(_q1, _m1);
      Quaternion_.invert(_q1);
      Quaternion_.premultiply(this.quaternion, _q1);
    }
    return this;
  }

  add(object: Object3D): this;
  add(...object: Object3D[]): this;
  add(object: Object3D): this {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }

      return this;
    }

    if (object === this) {
      console.error("engine.Object3D.add: object can't be added as a child of itself.", object);
      return this;
    }

    if (object && object.isObject3D) {
      object.removeFromParent();
      object.parent = this!;
      this.children.push(object);

      object.eventDispatcher.dispatch({ type: 'added' }, this);

      this.eventDispatcher.dispatch({ child: object, type: 'childadded' }, this);
    } else {
      console.error('engine.Object3D.add: object not an instance of engine.Object3D.', object);
    }

    return this;
  }

  remove(object: Object3D): this;
  remove(...object: Object3D[]): this;
  remove(object: Object3D): this {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.remove(arguments[i]);
      }

      return this;
    }

    const index = this.children.indexOf(object);

    if (index !== -1) {
      object.parent = null;
      this.children.splice(index, 1);

      object.eventDispatcher.dispatch({ type: 'removed' }, this);

      this.eventDispatcher.dispatch({ type: 'childremoved', child: object }, this);
    }

    return this;
  }

  removeFromParent(): this {
    const parent = this.parent;

    if (parent !== null) {
      parent.remove(this);
    }

    return this;
  }

  clear(): this {
    return this.remove(...this.children);
  }

  attach(object: Object3D): this {
    // adds object as a child of this, while maintaining the object's world transform

    // Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

    this.updateWorldMatrix(true, false);

    _m1.copy(this.matrixWorld).invert();

    if (object.parent !== null) {
      object.parent.updateWorldMatrix(true, false);

      _m1.multiply(object.parent.matrixWorld);
    }

    object.applyMatrix4(_m1);

    object.removeFromParent();
    object.parent = this!;
    this.children.push(object);

    object.updateWorldMatrix(false, true);

    object.eventDispatcher.dispatch({ type: 'added' }, this);

    this.eventDispatcher.dispatch({ type: 'childadded', child: object }, this);

    return this;
  }

  getObjectById(id: number): Object3D | undefined {
    return this.getObjectByProperty('id', id);
  }

  getObjectByName(name: string): Object3D | undefined {
    return this.getObjectByProperty('name', name);
  }

  getObjectByProperty(name: string, value: any): Object3D | undefined {
    //@ts-expect-error
    if (this[name] === value) return this;

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      const object = child.getObjectByProperty(name, value);

      if (object !== undefined) {
        return object;
      }
    }

    return undefined;
  }

  getObjectsByProperty(name: string, value: any, result: Object3D[] = []): Object3D[] {
    // @ts-expect-error
    if (this[name] === value) result.push(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].getObjectsByProperty(name, value, result);
    }

    return result;
  }

  getWorldPosition(target: Vector3): Vector3 {
    this.updateWorldMatrix(true, false);

    return target.setFromMatrixPosition(this.matrixWorld);
  }

  getWorldQuaternion(target: Quaternion_): Quaternion_ {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, target, _scale);

    return target;
  }

  getWorldScale(target: Vector3): Vector3 {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, _quaternion, target);

    return target;
  }

  getWorldDirection(target: Vector3): Vector3 {
    this.updateWorldMatrix(true, false);

    const e = this.matrixWorld.elements;

    return target.set(e[8], e[9], e[10]).normalize();
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]) {}

  traverse(callback: (object: Object3D) => void): this {
    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback);
    }

    return this;
  }

  traverseVisible(callback: (object: Object3D) => void): this {
    if (this.visible === false) return this;

    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverseVisible(callback);
    }

    return this;
  }

  traverseAncestors(callback: (object: Object3D) => void): this {
    const parent = this.parent;

    if (parent !== null) {
      callback(parent);

      parent.traverseAncestors(callback);
    }

    return this;
  }

  updateMatrix(): this {
    this.matrix.compose(this.position, this.quaternion, this.scale);

    this.matrixWorldNeedsUpdate = true;
    return this;
  }

  updateMatrixWorld(force?: boolean): this {
    if (this.matrixAutoUpdate) this.updateMatrix();

    if (this.matrixWorldNeedsUpdate || force) {
      if (this.parent === null) {
        this.matrixWorld.copy(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }

      this.matrixWorldNeedsUpdate = false;

      force = true;
    }

    // update children

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];

      if (child.matrixWorldAutoUpdate === true || force === true) {
        child.updateMatrixWorld(force);
      }
    }
    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    const parent = this.parent;

    if (updateParents === true && parent !== null && parent.matrixWorldAutoUpdate === true) {
      parent.updateWorldMatrix(true, false);
    }

    if (this.matrixAutoUpdate) this.updateMatrix();

    if (this.parent === null) {
      this.matrixWorld.copy(this.matrix);
    } else {
      this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    }

    // update children

    if (updateChildren === true) {
      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        const child = children[i];

        if (child.matrixWorldAutoUpdate === true) {
          child.updateWorldMatrix(false, true);
        }
      }
    }
    return this;
  }

  clone(recursive: boolean = true): Object3D {
    return new this.constructor().copy(this, recursive);
  }

  copy(source: Object3D, recursive: boolean = true) {
    this.name = source.name;

    this.up.copy(source.up);

    this.position.copy(source.position);
    Quaternion_.fill_(source.quaternion, this.quaternion);
    this.scale.copy(source.scale);

    this.matrix.copy(source.matrix);
    this.matrixWorld.copy(source.matrixWorld);

    this.matrixAutoUpdate = source.matrixAutoUpdate;

    this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
    this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

    this.layers.mask = source.layers.mask;
    this.visible = source.visible;

    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;

    this.frustumCulled = source.frustumCulled;
    this.renderOrder = source.renderOrder;

    this.animations = source.animations.slice();

    this.userData = JSON.parse(JSON.stringify(source.userData));

    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i];
        this.add(child.clone());
      }
    }

    return this;
  }
}

Object3D.prototype.isObject3D = true;
