import { Quaternion } from '../math/Quaternion.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { EventDispatcher } from './EventDispatcher.js';
import { Euler } from '../math/Euler.js';
import { Layers } from './Layers.js';
import { Mat3 } from '../math/Mat3.js';
import * as MathUtils from '../math/MathUtils.js';
import type { Intersection, Raycaster } from './Raycaster.js';
import type { Light } from '../lights/Light.js';
import type { Scene } from '../scenes/Scene.js';
import type { BufferGeometry } from './BufferGeometry.js';
import type { Camera } from '../cameras/Camera.js';
import type { Material } from '../materials/Material.js';
import type { Group } from '../objects/Group.js';
import type { Vec2 } from '../math/Vec2.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Renderer } from '../renderers/webgpu/Renderer.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { v4 } from 'uuid';

let _id = 0;

const _v1 = /*@__PURE__*/ new Vec3();
const _q1 = /*@__PURE__*/ new Quaternion();
const _m1 = /*@__PURE__*/ new Mat4();
const _target = /*@__PURE__*/ new Vec3();

const _position = /*@__PURE__*/ new Vec3();
const _scale = /*@__PURE__*/ new Vec3();
const _quaternion = /*@__PURE__*/ new Quaternion();

const _xAxis = /*@__PURE__*/ new Vec3(1, 0, 0);
const _yAxis = /*@__PURE__*/ new Vec3(0, 1, 0);
const _zAxis = /*@__PURE__*/ new Vec3(0, 0, 1);

export interface Object3DEventMap {
  added: {};
  removed: {};
  childadded: { child: Object3D };
  childremoved: { child: Object3D };
  pointerdown: { data: Vec2 };
  pointerup: { data: Vec2 };
  pointermove: { data: Vec2 };
  mousedown: { data: Vec2 };
  mouseup: { data: Vec2 };
  mousemove: { data: Vec2 };
  click: { data: Vec2 };
  dispose: {};
}

const isCamera = (object: any): object is Camera => object.isCamera;
const isLight = (object: any): object is Light<any> => object.isLight;

export class Object3D<EventMap extends Object3DEventMap = Object3DEventMap> {
  declare ['constructor']: typeof Object3D;
  declare isObject3D: true;
  static Up: Vec3 = new Vec3(0, 1, 0);
  static UseLocalAutoUpdate: boolean = true;
  static UseWorldAutoUpdate: boolean = true;

  eventDispatcher = new EventDispatcher<EventMap>();

  boundingSphere: Sphere | null;
  geometry: BufferGeometry | null;

  computeBoundingSphere(): void {}
  computeBoundingBox(): void {}

  occlusionTest: boolean;
  boundingBox: Box3 | null;
  id: number;
  uuid: string;
  name: string;
  type: string | 'Object3D';
  parent: Object3D | null;
  children: Object3D[];
  up: Vec3;
  position: Vec3;
  quaternion: Quaternion;
  scale: Vec3;
  modelViewMatrix: Mat4;
  normalMatrix: Mat3;
  matrix: Mat4;
  matrixWorld: Mat4;
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
    this.id = _id++;
    this.uuid = v4();

    this.name = '';
    this.type = 'Object3D';

    this.parent = null;
    this.children = [];

    this.up = Object3D.Up.clone();

    this.position = Vec3.new();
    this.quaternion = new Quaternion().identity();
    this.scale = Vec3.new(1, 1, 1);
    this.modelViewMatrix = new Mat4();
    this.normalMatrix = new Mat3();

    this.matrix = new Mat4();
    this.matrixWorld = new Mat4();

    this.matrixAutoUpdate = Object3D.UseLocalAutoUpdate;

    this.matrixWorldAutoUpdate = Object3D.UseWorldAutoUpdate; // checked by the renderer
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

  applyMat4(matrix: Mat4): this {
    if (this.matrixAutoUpdate) this.updateMatrix();

    this.matrix.premultiply(matrix);

    this.matrix.decompose(this.position, this.quaternion, this.scale);

    return this;
  }

  applyQuaternion(q: Quaternion): this {
    this.quaternion.premultiply(q);
    return this;
  }

  setRotationFromAxisAngle(axis: Vec3, angle: number): this {
    this.quaternion.setFromAxisAngle(axis, angle);
    return this;
  }

  setRotationFromEuler(euler: Euler): this {
    this.quaternion.setFromEuler(euler, true);
    return this;
  }

  setRotationFromMatrix(m: Mat4): this {
    this.quaternion.setFromRotationMatrix(m);
    return this;
  }

  setRotationFromQuaternion(q: Quaternion): this {
    this.quaternion.copy(q);
    return this;
  }

  setRotationX(angle: number): this {
    return this.setRotationFromEuler(_euler.set(angle, this.getRotationY(), this.getRotationZ()));
  }

  setRotationY(angle: number): this {
    return this.setRotationFromEuler(_euler.set(this.getRotationX(), angle, this.getRotationZ()));
  }

  setRotationZ(angle: number): this {
    return this.setRotationFromEuler(_euler.set(this.getRotationX(), this.getRotationY(), angle));
  }

  setRotation(angleX: number, angleY: number, angleZ: number): this {
    return this.setRotationFromEuler(_euler.set(angleX, angleY, angleZ));
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

  rotateOnAxis(axis: Vec3, angle: number): this {
    // rotate object on axis in object space
    // axis is assumed to be normalized

    _q1.setFromAxisAngle(axis, angle);

    this.quaternion.multiply(_q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vec3, angle: number): this {
    // rotate object on axis in world space
    // axis is assumed to be normalized
    // method assumes no rotated parent

    _q1.setFromAxisAngle(axis, angle);

    this.quaternion.premultiply(_q1);

    return this;
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

  translateOnAxis(axis: Vec3, distance: number): this {
    // translate object by distance along axis in object space
    // axis is assumed to be normalized

    _v1.from(axis).applyQuaternion(this.quaternion);

    this.position.add(_v1.scale(distance));

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

  localToWorld(vector: Vec3): Vec3 {
    this.updateWorldMatrix(true, false);

    return vector.applyMat4(this.matrixWorld);
  }

  worldToLocal(vector: Vec3): Vec3 {
    this.updateWorldMatrix(true, false);

    return vector.applyMat4(_m1.copy(this.matrixWorld).invert());
  }

  lookAt(x: Vec3): this;
  lookAt(x: number, y: number, z: number): this;
  lookAt(x: number | Vec3, y?: number, z?: number): this {
    // This method does not support objects having non-uniformly-scaled parent(s)

    if (x instanceof Vec3) {
      _target.from(x);
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

    this.quaternion.setFromRotationMatrix(_m1);

    if (parent) {
      _m1.extractRotation(parent.matrixWorld);
      _q1.setFromRotationMatrix(_m1);
      this.quaternion.premultiply(_q1.invert());
    }
    return this;
  }

  add(object: Object3D<any>): this;
  add(...object: Object3D<any>[]): this;
  add(object: Object3D<any>): this {
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

    object.applyMat4(_m1);

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

  getWorldPosition(target: Vec3): Vec3 {
    this.updateWorldMatrix(true, false);

    return target.setFromMatrixPosition(this.matrixWorld);
  }

  getWorldQuaternion(target: Quaternion): Quaternion {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, target, _scale);

    return target;
  }

  getWorldScale(target: Vec3): Vec3 {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, _quaternion, target);

    return target;
  }

  getWorldDirection(target: Vec3): Vec3 {
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

    this.up.from(source.up);

    this.position.from(source.position);
    this.quaternion.copy(source.quaternion);
    this.scale.from(source.scale);

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

const _euler = new Euler();

Object3D.prototype.isObject3D = true;
