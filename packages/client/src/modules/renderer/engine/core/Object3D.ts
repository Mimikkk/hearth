import { Quaternion } from '../math/Quaternion.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { EventDispatcher } from './EventDispatcher.js';
import { Euler } from '../math/Euler.js';
import { Layers } from './Layers.js';
import { Mat3 } from '../math/Mat3.js';
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
import { v4 } from 'uuid';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Const } from '@modules/renderer/engine/math/types.js';

let _id = 0;

const _v1 = Vec3.new();
const _q1 = Quaternion.identity();
const _m1 = new Mat4();
const _target = Vec3.new();

const _position = Vec3.new();
const _scale = Vec3.new();
const _quaternion = Quaternion.identity();

const _xAxis = Vec3.new(1, 0, 0);
const _yAxis = Vec3.new(0, 1, 0);
const _zAxis = Vec3.new(0, 0, 1);

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

export class Object3D<EventMap extends Object3DEventMap = any> {
  declare ['constructor']: typeof Object3D;
  declare isObject3D: true;
  declare isInstancedMesh: boolean;
  static Up: Vec3 = Vec3.new(0, 1, 0);
  static AutoUpdateLocalMat: boolean = true;
  static AutoUpdateWorldMat: boolean = true;

  eventDispatcher = new EventDispatcher<EventMap>();

  computeBoundingSphere?(): void;

  boundingSphere: Sphere | null;
  occlusionTest: boolean;
  geometry: BufferGeometry | null;

  computeBoundingBox?(): void;

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

    this.quaternion = Quaternion.identity();
    this.scale = Vec3.new(1, 1, 1);
    this.modelViewMatrix = new Mat4();
    this.normalMatrix = new Mat3();

    this.matrix = new Mat4();
    this.matrixWorld = new Mat4();

    this.matrixAutoUpdate = Object3D.AutoUpdateLocalMat;

    // checked by the renderer
    this.matrixWorldAutoUpdate = Object3D.AutoUpdateWorldMat;
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

  applyMat4(matrix: Const<Mat4>): this {
    if (this.matrixAutoUpdate) this.updateMatrix();

    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.quaternion, this.scale);

    return this;
  }

  applyQuaternion(quaternion: Const<Quaternion>): this {
    this.quaternion.premul(quaternion);
    return this;
  }

  setRotationFromAxisAngle(axis: Const<Vec3>, angle: number): this {
    this.quaternion.fromAxisAngle(axis, angle);
    return this;
  }

  setRotationFromEuler(euler: Const<Euler>): this {
    this.quaternion.fromEuler(euler);
    return this;
  }

  setRotationFromMatrix(mat: Const<Mat4>): this {
    this.quaternion.fromRotation(mat);
    return this;
  }

  setRotationFromQuaternion(quaternion: Quaternion): this {
    this.quaternion.from(quaternion);
    return this;
  }

  rotateOnLocalAxis(axis: Vec3, angle: number): this {
    _q1.fromAxisAngle(axis, angle);
    this.quaternion.mul(_q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vec3, angle: number): this {
    _q1.fromAxisAngle(axis, angle);
    this.quaternion.premul(_q1);

    return this;
  }

  setRotationX(angle: number): this {
    return this.setRotationFromEuler(Euler.new(angle, this.getRotationY(), this.getRotationZ()));
  }

  setRotationY(angle: number): this {
    return this.setRotationFromEuler(Euler.new(this.getRotationX(), angle, this.getRotationZ()));
  }

  setRotationZ(angle: number): this {
    return this.setRotationFromEuler(Euler.new(this.getRotationX(), this.getRotationY(), angle));
  }

  setRotation(angleX: number, angleY: number, angleZ: number): this {
    return this.setRotationFromEuler(Euler.new(angleX, angleY, angleZ));
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

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }

  rotateX(angle: number): this {
    return this.rotateOnLocalAxis(_xAxis, angle);
  }

  rotateY(angle: number): this {
    return this.rotateOnLocalAxis(_yAxis, angle);
  }

  rotateZ(angle: number): this {
    return this.rotateOnLocalAxis(_zAxis, angle);
  }

  rotate(angleX: number, angleY: number, angleZ: number): this {
    _q1.fromEuler(Euler.new(angleX, angleY, angleZ));
    this.quaternion.mul(_q1);

    return this;
  }

  translateOnAxis(axis: Const<Vec3>, distance: number): this {
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

  localToWorld(into: Vec3 = Vec3.new()): Vec3 {
    this.updateWorldMatrix(true, false);

    return into.applyMat4(this.matrixWorld);
  }

  worldToLocal(into: Vec3 = Vec3.new()): Vec3 {
    this.updateWorldMatrix(true, false);

    return into.applyMat4(_m1.from(this.matrixWorld).invert());
  }

  lookAt(x: Vec3): this;
  lookAt(x: number, y: number, z: number): this;
  lookAt(x: number | Vec3, y?: number, z?: number): this {
    // This method does not support objects having non-uniformly-scaled parent(s)

    if (Vec3.is(x)) {
      _target.from(x);
    } else {
      _target.set(x, y!, z!);
    }

    const parent = this.parent;

    this.updateWorldMatrix(true, false);

    _position.fromMat4Position(this.matrixWorld);

    if (isCamera(this) || isLight(this)) {
      _m1.lookAt(_position, _target, this.up);
    } else {
      _m1.lookAt(_target, _position, this.up);
    }

    this.setRotationFromMatrix(_m1);

    if (parent) {
      _m1.extractRotation(parent.matrixWorld);

      this.applyQuaternion(_q1.fromRotation(_m1).invert());
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

    _m1.from(this.matrixWorld).invert();

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

  getWorldPosition(into: Vec3 = Vec3.new()): Vec3 {
    this.updateWorldMatrix(true, false);

    return into.fromMat4Position(this.matrixWorld);
  }

  getWorldQuaternion(into: Quaternion = Quaternion.new()): Quaternion {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, into, _scale);

    return into;
  }

  getWorldScale(into: Vec3 = Vec3.new()): Vec3 {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, _quaternion, into);

    return into;
  }

  getWorldDirection(into: Vec3 = Vec3.new()): Vec3 {
    this.updateWorldMatrix(true, false);

    const e = this.matrixWorld.elements;

    return into.set(e[8], e[9], e[10]).normalize();
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]) {}

  traverse<T extends Object3D = Object3D>(callback: (object: T) => void, filter?: (o: Object3D) => o is T): this {
    const stack = this.children.toReversed().concat(this);

    while (stack.length > 0) {
      const object = stack.pop()!;

      if (filter?.(object) ?? true) callback(object as T);

      if (object.children.length > 0) {
        stack.unshift(...object.children);
      }
    }

    return this;
  }

  traverseVisible(callback: (object: Object3D) => void): this {
    if (!this.visible) return this;

    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; ++i) {
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
        this.matrixWorld.from(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }

      this.matrixWorldNeedsUpdate = false;

      force = true;
    }

    const children = this.children;
    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];

      if (child.matrixWorldAutoUpdate || force) {
        child.updateMatrixWorld(force);
      }
    }
    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    const parent = this.parent;

    if (updateParents && parent && parent.matrixWorldAutoUpdate) {
      parent.updateWorldMatrix(true, false);
    }

    if (this.matrixAutoUpdate) this.updateMatrix();

    if (!parent) {
      this.matrixWorld.from(this.matrix);
    } else {
      this.matrixWorld.multiplyMatrices(parent.matrixWorld, this.matrix);
    }

    // update children

    if (updateChildren) {
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
    this.quaternion.from(source.quaternion);
    this.scale.from(source.scale);

    this.matrix.from(source.matrix);
    this.matrixWorld.from(source.matrixWorld);

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
