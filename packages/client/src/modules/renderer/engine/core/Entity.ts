import { Quaternion } from '../math/Quaternion.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Euler } from '../math/Euler.js';
import { RaycastLayers } from './RaycastLayers.js';
import { Mat3 } from '../math/Mat3.js';
import type { Intersection, Raycaster } from './Raycaster.js';
import type { Light } from '@modules/renderer/engine/entities/lights/Light.js';
import type { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import type { Geometry } from './Geometry.js';
import type { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import type { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import type { Group } from '@modules/renderer/engine/entities/Group.js';
import type { Box3 } from '@modules/renderer/engine/math/Box3.js';
import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import type { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { v4 } from 'uuid';
import type { Skeleton } from '@modules/renderer/engine/entities/Skeleton.js';
import { AnimationClip } from '@modules/renderer/engine/animation/AnimationClip.js';

const isCamera = (object: any): object is Camera => object.isCamera;
const isLight = (object: any): object is Light => object.isLight;

export class Entity {
  declare isEntity: true;
  static Up: Vec3 = Vec3.new(0, 1, 0);
  static UseLocalAutoUpdate: boolean = true;
  static UseWorldAutoUpdate: boolean = true;

  boundingSphere: Sphere | null;
  geometry: Geometry | null;

  computeBoundingSphere(): void {}

  computeBoundingBox(): void {}

  declare material: Material | null;
  declare skeleton: Skeleton | null;
  declare workgroupSize?: [number, number, number] | [number, number] | [number];
  occlusionTest: boolean;
  boundingBox: Box3 | null;
  id: number;
  uuid: string;
  name: string;
  type: string | 'Entity';
  parent: Entity | null;
  children: Entity[];
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
  layers: RaycastLayers;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  frustumCulled: boolean;
  renderOrder: number;
  animations: AnimationClip[];
  userData: Record<string, any>;
  count: number = 1;

  constructor() {
    this.id = _id++;
    this.uuid = v4();

    this.name = '';
    this.type = 'Entity';

    this.parent = null;
    this.children = [];

    this.up = Entity.Up.clone();

    this.position = Vec3.new();
    this.quaternion = Quaternion.new().asIdentity();
    this.scale = Vec3.new(1, 1, 1);
    this.modelViewMatrix = new Mat4();
    this.normalMatrix = new Mat3();

    this.matrix = new Mat4();
    this.matrixWorld = new Mat4();

    this.matrixAutoUpdate = Entity.UseLocalAutoUpdate;

    this.matrixWorldAutoUpdate = Entity.UseWorldAutoUpdate;
    this.matrixWorldNeedsUpdate = false;

    this.layers = RaycastLayers.new();
    this.visible = true;

    this.castShadow = false;
    this.receiveShadow = false;

    this.frustumCulled = true;
    this.renderOrder = 0;

    this.animations = [];

    this.userData = {};
  }

  static is(object: any): object is Entity {
    return object.isEntity;
  }

  onBeforeShadow(
    renderer: Hearth,
    scene: Scene,
    shadowCamera: Camera,
    geometry: Geometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onAfterShadow(
    renderer: Hearth,
    scene: Scene,
    shadowCamera: Camera,
    geometry: Geometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onBeforeRender(
    renderer: Hearth,
    scene: Scene,
    camera: Camera,
    geometry: Geometry,
    material: Material,
    group: Group,
  ): void {}

  onAfterRender(
    renderer: Hearth,
    scene: Scene,
    camera: Camera,
    geometry: Geometry,
    material: Material,
    group: Group,
  ): void {}

  applyMat4(matrix: Mat4): this {
    if (this.matrixAutoUpdate) this.updateMatrix();

    this.matrix.premul(matrix);

    this.matrix.decompose(this.position, this.quaternion, this.scale);

    return this;
  }

  applyQuaternion(q: Quaternion): this {
    this.quaternion.premul(q);
    return this;
  }

  setRotationFromAxisAngle(axis: Vec3, angle: number): this {
    this.quaternion.fromAxisAngle(axis, angle);
    return this;
  }

  setRotationFromEuler(euler: Euler): this {
    this.quaternion.fromEuler(euler);
    return this;
  }

  setRotationFromMatrix(m: Mat4): this {
    this.quaternion.fromRotation(m);
    return this;
  }

  setRotationFromQuaternion(q: Quaternion): this {
    this.quaternion.from(q);
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

    const { x, y, z, w } = this.quaternion;

    return Math.atan2(2 * (x * y - z * w), 1 - 2 * (x * x + y * y));
  }

  rotateOnAxis(axis: Vec3, angle: number): this {



    _q1.fromAxisAngle(axis, angle);

    this.quaternion.mul(_q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vec3, angle: number): this {




    _q1.fromAxisAngle(axis, angle);

    this.quaternion.premul(_q1);

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

    return vector.applyMat4(_m1.from(this.matrixWorld).invert());
  }

  lookAt(x: Vec3): this;
  lookAt(x: number, y: number, z: number): this;
  lookAt(x: number | Vec3, y?: number, z?: number): this {


    if (x instanceof Vec3) {
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

    this.quaternion.fromRotation(_m1);

    if (parent) {
      _m1.fromMat4Rotation(parent.matrixWorld);
      _q1.fromRotation(_m1);
      this.quaternion.premul(_q1.invert());
    }
    return this;
  }

  add(object: Entity): this;
  add(...object: Entity[]): this;
  add(object: Entity): this {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }

      return this;
    }

    if (object === this) return this;
    object.removeFromParent();
    object.parent = this!;
    this.children.push(object);

    return this;
  }

  remove(object: Entity): this;
  remove(...object: Entity[]): this;
  remove(object: Entity): this {
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

  attach(object: Entity): this {




    this.updateWorldMatrix(true, false);

    _m1.from(this.matrixWorld).invert();

    if (object.parent !== null) {
      object.parent.updateWorldMatrix(true, false);

      _m1.mul(object.parent.matrixWorld);
    }

    object.applyMat4(_m1);

    object.removeFromParent();
    object.parent = this!;
    this.children.push(object);

    object.updateWorldMatrix(false, true);

    return this;
  }

  getObjectById(id: number): Entity | undefined {
    return this.getObjectByProperty('id', id);
  }

  getObjectByName(name: string): Entity | undefined {
    return this.getObjectByProperty('name', name);
  }

  getObjectByProperty(name: string, value: any): Entity | undefined {
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

  getObjectsByProperty(name: string, value: any, result: Entity[] = []): Entity[] {

    if (this[name] === value) result.push(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].getObjectsByProperty(name, value, result);
    }

    return result;
  }

  getWorldPosition(target: Vec3): Vec3 {
    this.updateWorldMatrix(true, false);

    return target.fromMat4Position(this.matrixWorld);
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

  traverse(callback: (object: Entity) => void): this {
    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback);
    }

    return this;
  }

  traverseVisible(callback: (object: Entity) => void): this {
    if (this.visible === false) return this;

    callback(this);

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverseVisible(callback);
    }

    return this;
  }

  traverseAncestors(callback: (object: Entity) => void): this {
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
        this.matrixWorld.asMul(this.parent.matrixWorld, this.matrix);
      }

      this.matrixWorldNeedsUpdate = false;

      force = true;
    }



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
      this.matrixWorld.from(this.matrix);
    } else {
      this.matrixWorld.asMul(this.parent.matrixWorld, this.matrix);
    }



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

  clone(recursive: boolean = true): Entity {
    return new this.constructor().copy(this, recursive);
  }

  copy(source: Entity, recursive: boolean = true) {
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

Entity.prototype.isEntity = true;

const _euler = new Euler();

let _id = 0;

const _v1 = Vec3.new();
const _q1 = Quaternion.new();
const _m1 = new Mat4();
const _target = Vec3.new();

const _position = Vec3.new();
const _scale = Vec3.new();
const _quaternion = Quaternion.new();

const _xAxis = Vec3.new(1, 0, 0);
const _yAxis = Vec3.new(0, 1, 0);
const _zAxis = Vec3.new(0, 0, 1);
