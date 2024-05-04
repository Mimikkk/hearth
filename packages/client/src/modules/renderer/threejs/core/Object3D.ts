import { Quaternion } from '../math/Quaternion.js';
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
import { Box3 } from '@modules/renderer/threejs/math/Box3.js';
import { Renderer } from '../renderers/common/Renderer.js';

let _object3DId = 0;

const _v1 = /*@__PURE__*/ new Vector3();
const _q1 = /*@__PURE__*/ new Quaternion();
const _m1 = /*@__PURE__*/ new Matrix4();
const _target = /*@__PURE__*/ new Vector3();

const _position = /*@__PURE__*/ new Vector3();
const _scale = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ new Quaternion();

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

export class Object3D<EventMap extends Object3DEventMap = Object3DEventMap> {
  declare ['constructor']: typeof Object3D;
  declare isObject3D: true;
  static DEFAULT_UP: Vector3 = new Vector3(0, 1, 0);
  static DEFAULT_MATRIX_AUTO_UPDATE: boolean = true;
  static DEFAULT_MATRIX_WORLD_AUTO_UPDATE: boolean = true;

  eventDispatcher = new EventDispatcher<EventMap>();

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
  rotation: Euler;
  quaternion: Quaternion;
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

    const position = new Vector3();
    const rotation = new Euler();
    const quaternion = new Quaternion();
    const scale = new Vector3(1, 1, 1);

    function onRotationChange() {
      quaternion.setFromEuler(rotation, false);
    }

    function onQuaternionChange() {
      rotation.setFromQuaternion(quaternion, undefined!, false);
    }

    rotation._onChange(onRotationChange);
    quaternion._onChange(onQuaternionChange);

    Object.defineProperties(this, {
      position: {
        configurable: true,
        enumerable: true,
        value: position,
      },
      rotation: {
        configurable: true,
        enumerable: true,
        value: rotation,
      },
      quaternion: {
        configurable: true,
        enumerable: true,
        value: quaternion,
      },
      scale: {
        configurable: true,
        enumerable: true,
        value: scale,
      },
      modelViewMatrix: {
        value: new Matrix4(),
      },
      normalMatrix: {
        value: new Matrix3(),
      },
    });

    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();

    this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

    this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE; // checked by the renderer
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

  applyQuaternion(q: Quaternion): this {
    this.quaternion.premultiply(q);
    return this;
  }

  setRotationFromAxisAngle(axis: Vector3, angle: number): this {
    this.quaternion.setFromAxisAngle(axis, angle);
    return this;
  }

  setRotationFromEuler(euler: Euler): this {
    this.quaternion.setFromEuler(euler, true);
    return this;
  }

  setRotationFromMatrix(m: Matrix4): this {
    this.quaternion.setFromRotationMatrix(m);
    return this;
  }

  setRotationFromQuaternion(q: Quaternion): this {
    this.quaternion.copy(q);
    return this;
  }

  rotateOnAxis(axis: Vector3, angle: number): this {
    // rotate object on axis in object space
    // axis is assumed to be normalized

    _q1.setFromAxisAngle(axis, angle);

    this.quaternion.multiply(_q1);

    return this;
  }

  rotateOnWorldAxis(axis: Vector3, angle: number): this {
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
      console.error("THREE.Object3D.add: object can't be added as a child of itself.", object);
      return this;
    }

    if (object && object.isObject3D) {
      object.removeFromParent();
      object.parent = this!;
      this.children.push(object);

      object.eventDispatcher.dispatch({ type: 'added' }, this);

      this.eventDispatcher.dispatch({ child: object, type: 'childadded' }, this);
    } else {
      console.error('THREE.Object3D.add: object not an instance of THREE.Object3D.', object);
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

  getWorldQuaternion(target: Quaternion): Quaternion {
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

  toJSON(meta: any): any {
    //@ts-nocheck
    // meta is a string when called from JSON.stringify
    const isRootObject = meta === undefined || typeof meta === 'string';

    const output = {};

    // meta is a hash used to collect geometries, materials.
    // not providing it implies that this is the root object
    // being serialized.
    if (isRootObject) {
      // initialize meta obj
      meta = {
        geometries: {},
        materials: {},
        textures: {},
        images: {},
        shapes: {},
        skeletons: {},
        animations: {},
        nodes: {},
      };

      output.metadata = {
        version: 4.6,
        type: 'Object',
        generator: 'Object3D.toJSON',
      };
    }

    // standard Object3D serialization

    const object: any = {};

    object.uuid = this.uuid;
    object.type = this.type;

    if (this.name !== '') object.name = this.name;
    if (this.castShadow === true) object.castShadow = true;
    if (this.receiveShadow === true) object.receiveShadow = true;
    if (this.visible === false) object.visible = false;
    if (this.frustumCulled === false) object.frustumCulled = false;
    if (this.renderOrder !== 0) object.renderOrder = this.renderOrder;
    if (Object.keys(this.userData).length > 0) object.userData = this.userData;

    object.layers = this.layers.mask;
    object.matrix = this.matrix.toArray();
    object.up = this.up.toArray();

    if (this.matrixAutoUpdate === false) object.matrixAutoUpdate = false;

    // object specific properties

    if (this.isInstancedMesh) {
      object.type = 'InstancedMesh';
      object.count = this.count;
      object.instanceMatrix = this.instanceMatrix.toJSON();
      if (this.instanceColor !== null) object.instanceColor = this.instanceColor.toJSON();
    }

    if (this.isBatchedMesh) {
      object.type = 'BatchedMesh';
      object.perObjectFrustumCulled = this.perObjectFrustumCulled;
      object.sortObjects = this.sortObjects;

      object.drawRanges = this._drawRanges;
      object.reservedRanges = this._reservedRanges;

      object.visibility = this._visibility;
      object.active = this._active;
      object.bounds = this._bounds.map(bound => ({
        boxInitialized: bound.boxInitialized,
        boxMin: bound.box.min.toArray(),
        boxMax: bound.box.max.toArray(),

        sphereInitialized: bound.sphereInitialized,
        sphereRadius: bound.sphere.radius,
        sphereCenter: bound.sphere.center.toArray(),
      }));

      object.maxGeometryCount = this._maxGeometryCount;
      object.maxVertexCount = this._maxVertexCount;
      object.maxIndexCount = this._maxIndexCount;

      object.geometryInitialized = this._geometryInitialized;
      object.geometryCount = this._geometryCount;

      object.matricesTexture = this._matricesTexture.toJSON(meta);

      if (this.boundingSphere !== null) {
        object.boundingSphere = {
          center: object.boundingSphere.center.toArray(),
          radius: object.boundingSphere.radius,
        };
      }

      if (this.boundingBox !== null) {
        object.boundingBox = {
          min: object.boundingBox.min.toArray(),
          max: object.boundingBox.max.toArray(),
        };
      }
    }

    //

    function serialize(library, element) {
      if (library[element.uuid] === undefined) {
        library[element.uuid] = element.toJSON(meta);
      }

      return element.uuid;
    }

    if (this.isScene) {
      if (this.background) {
        if (this.background.isColor) {
          object.background = this.background.toJSON();
        } else if (this.background.isTexture) {
          object.background = this.background.toJSON(meta).uuid;
        }
      }

      if (this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true) {
        object.environment = this.environment.toJSON(meta).uuid;
      }
    } else if (this.isMesh || this.isLine || this.isPoints) {
      object.geometry = serialize(meta.geometries, this.geometry);

      const parameters = this.geometry.parameters;

      if (parameters !== undefined && parameters.shapes !== undefined) {
        const shapes = parameters.shapes;

        if (Array.isArray(shapes)) {
          for (let i = 0, l = shapes.length; i < l; i++) {
            const shape = shapes[i];

            serialize(meta.shapes, shape);
          }
        } else {
          serialize(meta.shapes, shapes);
        }
      }
    }

    if (this.isSkinnedMesh) {
      object.bindMode = this.bindMode;
      object.bindMatrix = this.bindMatrix.toArray();

      if (this.skeleton !== undefined) {
        serialize(meta.skeletons, this.skeleton);

        object.skeleton = this.skeleton.uuid;
      }
    }

    if (this.material !== undefined) {
      if (Array.isArray(this.material)) {
        const uuids = [];

        for (let i = 0, l = this.material.length; i < l; i++) {
          uuids.push(serialize(meta.materials, this.material[i]));
        }

        object.material = uuids;
      } else {
        object.material = serialize(meta.materials, this.material);
      }
    }

    //

    if (this.children.length > 0) {
      object.children = [];

      for (let i = 0; i < this.children.length; i++) {
        object.children.push(this.children[i].toJSON(meta).object);
      }
    }

    //

    if (this.animations.length > 0) {
      object.animations = [];

      for (let i = 0; i < this.animations.length; i++) {
        const animation = this.animations[i];

        object.animations.push(serialize(meta.animations, animation));
      }
    }

    if (isRootObject) {
      const geometries = extractFromCache(meta.geometries);
      const materials = extractFromCache(meta.materials);
      const textures = extractFromCache(meta.textures);
      const images = extractFromCache(meta.images);
      const shapes = extractFromCache(meta.shapes);
      const skeletons = extractFromCache(meta.skeletons);
      const animations = extractFromCache(meta.animations);
      const nodes = extractFromCache(meta.nodes);

      if (geometries.length > 0) output.geometries = geometries;
      if (materials.length > 0) output.materials = materials;
      if (textures.length > 0) output.textures = textures;
      if (images.length > 0) output.images = images;
      if (shapes.length > 0) output.shapes = shapes;
      if (skeletons.length > 0) output.skeletons = skeletons;
      if (animations.length > 0) output.animations = animations;
      if (nodes.length > 0) output.nodes = nodes;
    }

    output.object = object;

    return output;

    // extract data from the cache hash
    // remove metadata on each item
    // and return as array
    function extractFromCache(cache) {
      const values = [];
      for (const key in cache) {
        const data = cache[key];
        delete data.metadata;
        values.push(data);
      }

      return values;
    }
  }

  clone(recursive: boolean = true): Object3D {
    return new this.constructor().copy(this, recursive);
  }

  copy(source: Object3D, recursive: boolean = true) {
    this.name = source.name;

    this.up.copy(source.up);

    this.position.copy(source.position);
    this.rotation.order = source.rotation.order;
    this.quaternion.copy(source.quaternion);
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
