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
import { AnimationClip } from '@modules/renderer/engine/animation/AnimationClip.js';

export class Entity {
  declare isEntity: true;
  static Up: Vec3 = Vec3.new(0, 1, 0);
  static UseLocalAutoUpdate: boolean = true;
  static UseWorldAutoUpdate: boolean = true;

  boundSphere: Sphere | null;

  calcBoundSphere(): void {}

  boundBox: Box3 | null;

  calcBoundBox(): void {}

  declare workgroup?: number[];
  geometry: Geometry | null;
  material: Material | null;
  animations: AnimationClip[] = [];
  id: number;
  uuid: string;
  name: string;
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

  useLocalAutoUpdate: boolean;
  useWorldAutoUpdate: boolean;
  useWorldUpdate: boolean;
  useOcclusion: boolean;
  useShadowCast: boolean;
  useShadowReceive: boolean;
  useFrustumCull: boolean;
  renderOrder: number;
  layers: RaycastLayers;
  visible: boolean;
  count: number = 1;
  extra: Record<string, any> = {};

  constructor(parameters?: EntityParameters) {
    this.name = parameters?.name ?? '';
    this.position = parameters?.position ?? Vec3.new();
    this.quaternion = parameters?.quaternion ?? Quaternion.identity();
    this.scale = parameters?.scale ?? Vec3.new(1, 1, 1);
    this.useLocalAutoUpdate = Entity.UseLocalAutoUpdate;
    this.useWorldAutoUpdate = Entity.UseWorldAutoUpdate;
    this.useWorldUpdate = parameters?.useWorldUpdate ?? false;
    this.layers = parameters?.layers ?? RaycastLayers.new();
    this.visible = parameters?.visible ?? true;
    this.useShadowReceive = parameters?.useShadowReceive ?? false;
    this.useShadowCast = parameters?.useShadowCast ?? false;
    this.useFrustumCull = parameters?.useFrustumCull ?? true;
    this.renderOrder = parameters?.renderOrder ?? 0;

    this.id = _id++;
    this.uuid = v4();
    this.parent = null;
    this.children = [];
    this.up = Entity.Up.clone();
    this.modelViewMatrix = Mat4.new();
    this.normalMatrix = Mat3.new();
    this.matrix = Mat4.new();
    this.matrixWorld = Mat4.new();
  }

  static is(object: any): object is Entity {
    return object.isEntity;
  }

  onBeforeShadow(
    hearth: Hearth,
    scene: Scene,
    shadowCamera: Camera,
    geometry: Geometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onAfterShadow(
    hearth: Hearth,
    scene: Scene,
    shadowCamera: Camera,
    geometry: Geometry,
    depthMaterial: Material,
    group: Group,
  ): void {}

  onBeforeRender(
    hearth: Hearth,
    scene: Scene,
    camera: Camera,
    geometry: Geometry,
    material: Material,
    group: Group,
  ): void {}

  onAfterRender(
    hearth: Hearth,
    scene: Scene,
    camera: Camera,
    geometry: Geometry,
    material: Material,
    group: Group,
  ): void {}

  applyMat4(matrix: Mat4): this {
    if (this.useLocalAutoUpdate) this.updateMatrix();

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

  getWorldQuaternion(into: Quaternion = Quaternion.new()): Quaternion {
    this.updateWorldMatrix(true, false);

    this.matrixWorld.decompose(_position, into, _scale);

    return into;
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

    this.useWorldUpdate = true;
    return this;
  }

  updateMatrixWorld(force?: boolean): this {
    if (this.useLocalAutoUpdate) this.updateMatrix();

    if (this.useWorldUpdate || force) {
      if (this.parent === null) {
        this.matrixWorld.from(this.matrix);
      } else {
        this.matrixWorld.asMul(this.parent.matrixWorld, this.matrix);
      }

      this.useWorldUpdate = false;

      force = true;
    }

    const children = this.children;

    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];

      if (child.useWorldAutoUpdate === true || force === true) {
        child.updateMatrixWorld(force);
      }
    }
    return this;
  }

  updateWorldMatrix(updateParents: boolean, updateChildren: boolean): this {
    const parent = this.parent;

    if (updateParents === true && parent !== null && parent.useWorldAutoUpdate === true) {
      parent.updateWorldMatrix(true, false);
    }

    if (this.useLocalAutoUpdate) this.updateMatrix();

    if (this.parent === null) {
      this.matrixWorld.from(this.matrix);
    } else {
      this.matrixWorld.asMul(this.parent.matrixWorld, this.matrix);
    }

    if (updateChildren === true) {
      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        const child = children[i];

        if (child.useWorldAutoUpdate === true) {
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

    this.useLocalAutoUpdate = source.useLocalAutoUpdate;

    this.useWorldAutoUpdate = source.useWorldAutoUpdate;
    this.useWorldUpdate = source.useWorldUpdate;

    this.layers.mask = source.layers.mask;
    this.visible = source.visible;

    this.useShadowCast = source.useShadowCast;
    this.useShadowReceive = source.useShadowReceive;

    this.useFrustumCull = source.useFrustumCull;
    this.renderOrder = source.renderOrder;

    this.animations = source.animations.slice();

    this.extra = JSON.parse(JSON.stringify(source.extra));

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

interface EntityParameters {
  name?: string;
  position?: Vec3;
  quaternion?: Quaternion;
  scale?: Vec3;
  useLocalAutoUpdate?: boolean;
  useWorldAutoUpdate?: boolean;
  useWorldUpdate?: boolean;
  useShadowReceive?: boolean;
  useShadowCast?: boolean;
  useFrustumCull?: boolean;
  renderOrder?: number;
  layers?: RaycastLayers;
  visible?: boolean;
}

const isCamera = (object: any): object is Camera => object.isCamera;
const isLight = (object: any): object is Light => object.isLight;

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
