import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';
import { Box3 } from '../math/Box3.js';
import { EventDispatcher } from './EventDispatcher.js';
import {
  BufferAttribute,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
} from './BufferAttribute.js';
import { Sphere } from '../math/Sphere.js';
import { Object3D } from './Object3D.js';
import { Mat4 } from '../math/Mat4.js';
import { Mat3 } from '../math/Mat3.js';
import { isArrayUint32 } from '../utils.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { v4 } from 'uuid';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Const } from '@modules/renderer/engine/math/types.js';

let _id = 0;

type AttributeRecord = Record<string, Attribute>;

export class BufferGeometry<
  AttributeMap extends AttributeRecord = AttributeRecord,
  MorphAttributeMap extends AttributeRecord = AttributeRecord,
  IndexT extends Uint32Array | Uint16Array = Uint32Array | Uint16Array,
> {
  declare ['constructor']: typeof BufferGeometry;
  declare isBufferGeometry: true;
  declare type: string | 'BufferGeometry' | 'InstancedBufferGeometry' | 'InterleavedBufferGeometry';
  id: number;
  uuid: string;
  name: string;
  index: BufferAttribute<IndexT> | null;
  attributes: AttributeMap;
  morphAttributes: MorphAttributeMap;
  morphTargetsRelative: boolean;
  groups: { start: number; count: number; materialIndex?: number }[];
  boundingBox: Box3 | null;
  boundingSphere: Sphere | null;
  drawRange: { start: number; count: number };
  userData: Record<string, any>;
  parameters?: Record<string, any>;

  eventDispatcher = new EventDispatcher<{ dispose: {} }>();

  constructor() {
    this.id = _id++;

    this.uuid = v4();

    this.name = '';
    this.type = 'BufferGeometry';

    this.index = null;
    this.attributes = {} as AttributeMap;

    this.morphAttributes = {} as MorphAttributeMap;
    this.morphTargetsRelative = false;

    this.groups = [];

    this.boundingBox = null;
    this.boundingSphere = null;

    this.drawRange = { start: 0, count: Infinity };

    this.userData = {};
  }

  getIndex(): BufferAttribute<IndexT> | null {
    return this.index;
  }

  setIndex(index: BufferAttribute<IndexT> | number[] | null): this {
    if (Array.isArray(index)) {
      this.index = new (isArrayUint32(index) ? Uint32BufferAttribute : Uint16BufferAttribute)(
        index,
        1,
      ) as BufferAttribute<IndexT>;
    } else {
      this.index = index;
    }

    return this;
  }

  getAttribute<K extends keyof AttributeMap>(name: K): AttributeMap[K] {
    return this.attributes[name];
  }

  setAttribute<K extends keyof AttributeMap>(name: K, attribute: AttributeMap[K]): this {
    this.attributes[name] = attribute;
    return this;
  }

  deleteAttribute(name: keyof AttributeMap): this {
    delete this.attributes[name];
    return this;
  }

  hasAttribute(name: keyof AttributeMap): boolean {
    return !!this.attributes[name];
  }

  addGroup(start: number, count: number, materialIndex: number = 0): this {
    this.groups.push({ start, count, materialIndex });
    return this;
  }

  clearGroups(): this {
    this.groups = [];
    return this;
  }

  setDrawRange(start: number, count: number): this {
    this.drawRange.start = start;
    this.drawRange.count = count;
    return this;
  }

  applyMat4(matrix: Const<Mat4>): this {
    const position = this.attributes.position;
    if (position) {
      position.applyMat4(matrix);
      position.needsUpdate = true;
    }

    const normal = this.attributes.normal;
    if (normal) {
      normal.applyNMat3(_mat3.fromNMat4(matrix));
      normal.needsUpdate = true;
    }

    const tangent = this.attributes.tangent;
    if (tangent) {
      tangent.transformDirection(matrix);
      tangent.needsUpdate = true;
    }

    if (this.boundingBox !== null) this.computeBoundingBox();
    if (this.boundingSphere !== null) this.computeBoundingSphere();

    return this;
  }

  applyQuaternion(quaternion: Const<Quaternion>): this {
    _mat4.asRotationFromQuaternion(quaternion);

    this.applyMat4(_mat4);

    return this;
  }

  rotateX(angle: number): this {
    return this.applyMat4(_mat4.asRotationX(angle));
  }

  rotateY(angle: number): this {
    return this.applyMat4(_mat4.asRotationY(angle));
  }

  rotateZ(angle: number): this {
    return this.applyMat4(_mat4.asRotationZ(angle));
  }

  translate(x: number, y: number, z: number): this {
    return this.applyMat4(_mat4.asTranslation(x, y, z));
  }

  scale(x: number, y: number, z: number): this {
    return this.applyMat4(_mat4.asScale(x, y, z));
  }

  lookAt(vec: Const<Vec3>): this {
    return this.applyMat4(_obj.lookAt(vec).updateMatrix().matrix);
  }

  center(): this {
    this.computeBoundingBox();
    this.boundingBox!.center(_offset).negate();
    this.translate(_offset.x, _offset.y, _offset.z);

    return this;
  }

  setFromPoints(points: Vec3[]): this {
    const position: number[] = [];

    for (let i = 0, l = points.length; i < l; i++) {
      const point = points[i];
      position.push(point.x, point.y, point.z);
    }

    this.setAttribute('position', new Float32BufferAttribute(position, 3) as never);

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) this.boundingBox = new Box3();

    const position = this.attributes.position as BufferAttribute<Float32Array>;

    if (!position) {
      this.boundingBox.clear();
      return this;
    }

    this.boundingBox.fromAttribute(position);

    const morphs = this.morphAttributes.position as never as BufferAttribute<Float32Array>[];
    if (!morphs) return this;

    for (let i = 0, il = morphs.length; i < il; i++) {
      const morph = morphs[i];
      _box.fromAttribute(morph);

      if (this.morphTargetsRelative) {
        _vector.from(this.boundingBox.min).add(_box.min);
        this.boundingBox.expandCoord(_vector);
        _vector.from(this.boundingBox.min).add(_box.max);
        this.boundingBox.expandCoord(_vector);
      } else {
        this.boundingBox.expandCoord(_box.min);
        this.boundingBox.expandCoord(_box.max);
      }
    }

    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    const position = this.attributes.position as BufferAttribute<Float32Array>;

    if (!position) return this;

    _box.fromAttribute(position);

    const morphs = this.morphAttributes.position as never as BufferAttribute<Float32Array>[];
    if (morphs) {
      for (let i = 0, il = morphs.length; i < il; ++i) {
        const morph = morphs[i];
        _boxMorph.fromAttribute(morph);

        if (this.morphTargetsRelative) {
          _vector.from(_box.min).add(_boxMorph.min);
          _box.expandCoord(_vector);
          _vector.from(_box.max).add(_boxMorph.max);
          _box.expandCoord(_vector);
        } else {
          _box.expandCoord(_boxMorph.min);
          _box.expandCoord(_boxMorph.max);
        }
      }
    }

    const center = _box.center(this.boundingSphere.center);

    let maxRadiusSq = 0;
    for (let i = 0, il = position.count; i < il; i++) {
      _vector.fromAttribute(position, i);

      const distance = center.distanceSqTo(_vector);
      if (distance > maxRadiusSq) maxRadiusSq = distance;
    }

    if (morphs) {
      const isRelative = this.morphTargetsRelative;
      for (let i = 0, il = morphs.length; i < il; ++i) {
        const morph = morphs[i];

        for (let j = 0, jl = morph.count; j < jl; j++) {
          _vector.fromAttribute(morph, j);

          if (isRelative) {
            _offset.fromAttribute(position, j);
            _vector.add(_offset);
          }

          const radiusSq = center.distanceSqTo(_vector);
          if (radiusSq > maxRadiusSq) maxRadiusSq = radiusSq;
        }
      }
    }

    this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

    return this;
  }

  computeTangents(): this {
    const index = this.index;
    const attributes = this.attributes;

    if (!index || !attributes.position || !attributes.normal || !attributes.uv) {
      throw Error("requires 'index', 'position', 'normal' and 'uv' attributes");
    }

    const positionAttribute = attributes.position;
    const normalAttribute = attributes.normal;
    const uvAttribute = attributes.uv;

    if (!this.attributes.tangent) {
      //@ts-expect-error
      this.attributes.tangent = new BufferAttribute(new Float32Array(4 * positionAttribute.count), 4);
    }
    const tangent = this.attributes.tangent;

    const tan1: Vec3[] = [];
    const tan2: Vec3[] = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      tan1[i] = Vec3.new();
      tan2[i] = Vec3.new();
    }

    const vA = Vec3.new();
    const vB = Vec3.new();
    const vC = Vec3.new();
    const uvA = Vec2.new();
    const uvB = Vec2.new();
    const uvC = Vec2.new();
    const sdir = Vec3.new();
    const tdir = Vec3.new();

    function handleTriangle(a: number, b: number, c: number): void {
      vA.fromAttribute(positionAttribute, a);
      vB.fromAttribute(positionAttribute, b);
      vC.fromAttribute(positionAttribute, c);
      uvA.fromAttribute(uvAttribute, a);
      uvB.fromAttribute(uvAttribute, b);
      uvC.fromAttribute(uvAttribute, c);

      vB.sub(vA);
      vC.sub(vA);

      uvB.sub(uvA);
      uvC.sub(uvA);

      const r = 1.0 / (uvB.x * uvC.y - uvC.x * uvB.y);

      // silently ignore degenerate uv triangles having coincident or colinear vertices
      if (!isFinite(r)) return this;
      sdir.from(vB).scale(uvC.y).addScaled(vC, -uvB.y).scale(r);
      tdir.from(vC).scale(uvB.x).addScaled(vB, -uvC.x).scale(r);

      tan1[a].add(sdir);
      tan1[b].add(sdir);
      tan1[c].add(sdir);

      tan2[a].add(tdir);
      tan2[b].add(tdir);
      tan2[c].add(tdir);
    }

    let groups = this.groups;

    if (groups.length === 0) {
      groups = [
        {
          start: 0,
          count: index.count,
        },
      ];
    }

    for (let i = 0, il = groups.length; i < il; ++i) {
      const group = groups[i];

      const start = group.start;
      const count = group.count;

      for (let j = start, jl = start + count; j < jl; j += 3) {
        handleTriangle(index.getX(j + 0), index.getX(j + 1), index.getX(j + 2));
      }
    }

    const t1 = Vec3.new();
    const t2 = Vec3.new();
    const n1 = Vec3.new();
    const n2 = Vec3.new();

    function handleVertex(v: number): void {
      n1.fromAttribute(normalAttribute, v);
      n2.from(n1);

      const t = tan1[v];

      // Gram-Schmidt orthogonalize

      t1.from(t);
      t1.sub(n1.scale(n1.dot(t))).normalize();

      // Calculate handedness
      t2.from(n2).cross(t);
      const test = t2.dot(tan2[v]);
      const w = test < 0 ? -1 : 1;

      tangent.setXYZW(v, t1.x, t1.y, t1.z, w);
    }

    for (let i = 0, il = groups.length; i < il; ++i) {
      const { start, count } = groups[i];

      for (let j = start, jl = start + count; j < jl; j += 3) {
        handleVertex(index.getX(j + 0));
        handleVertex(index.getX(j + 1));
        handleVertex(index.getX(j + 2));
      }
    }

    return this;
  }

  computeVertexNormals(): this {
    const index = this.index;
    const position = this.attributes.position;

    if (position) {
      let normal = this.attributes.normal;

      if (normal === undefined) {
        normal = new BufferAttribute(new Float32Array(position.count * 3), 3);
        //@ts-expect-error
        this.attributes.normal = normal;
      } else {
        // reset existing normals to zero

        for (let i = 0, il = normal.count; i < il; i++) {
          normal.setXYZ(i, 0, 0, 0);
        }
      }

      const pA = Vec3.new();
      const pB = Vec3.new();
      const pC = Vec3.new();
      const nA = Vec3.new();
      const nB = Vec3.new();
      const nC = Vec3.new();
      const cb = Vec3.new();
      const ab = Vec3.new();

      // indexed elements

      if (index) {
        for (let i = 0, il = index.count; i < il; i += 3) {
          const vA = index.getX(i + 0);
          const vB = index.getX(i + 1);
          const vC = index.getX(i + 2);

          pA.fromAttribute(position, vA);
          pB.fromAttribute(position, vB);
          pC.fromAttribute(position, vC);

          cb.from(pC).sub(pB);
          ab.from(pA).sub(pB);
          cb.cross(ab);

          nA.fromAttribute(normal, vA);
          nB.fromAttribute(normal, vB);
          nC.fromAttribute(normal, vC);

          nA.add(cb);
          nB.add(cb);
          nC.add(cb);

          normal.setXYZ(vA, nA.x, nA.y, nA.z);
          normal.setXYZ(vB, nB.x, nB.y, nB.z);
          normal.setXYZ(vC, nC.x, nC.y, nC.z);
        }
      } else {
        // non-indexed elements (unconnected triangle soup)
        for (let i = 0, il = position.count; i < il; i += 3) {
          pA.fromAttribute(position, i + 0);
          pB.fromAttribute(position, i + 1);
          pC.fromAttribute(position, i + 2);

          cb.from(pC).sub(pB);
          ab.from(pA).sub(pB);
          cb.cross(ab);

          normal.setXYZ(i + 0, cb.x, cb.y, cb.z);
          normal.setXYZ(i + 1, cb.x, cb.y, cb.z);
          normal.setXYZ(i + 2, cb.x, cb.y, cb.z);
        }
      }

      this.normalizeNormals();

      normal.needsUpdate = true;
    }

    return this;
  }

  normalizeNormals(): this {
    const normals = this.attributes.normal;

    for (let i = 0, il = normals.count; i < il; i++) {
      _vector.fromAttribute(normals, i);

      _vector.normalize();

      normals.setXYZ(i, _vector.x, _vector.y, _vector.z);
    }

    return this;
  }

  toNonIndexed(): this {
    function convertBufferAttribute(attribute: any, indices: any) {
      const array = attribute.array;
      const itemSize = attribute.itemSize;
      const normalized = attribute.normalized;

      const array2 = new array.constructor(indices.length * itemSize);

      let index = 0,
        index2 = 0;

      for (let i = 0, l = indices.length; i < l; i++) {
        if (attribute.isInterleavedBufferAttribute) {
          index = indices[i] * attribute.data.stride + attribute.offset;
        } else {
          index = indices[i] * itemSize;
        }

        for (let j = 0; j < itemSize; j++) {
          array2[index2++] = array[index++];
        }
      }

      return new BufferAttribute(array2, itemSize, normalized);
    }

    //

    if (this.index === null) {
      console.warn('engine.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.');
      return this;
    }

    const geometry2 = new BufferGeometry();

    const indices = this.index.array;
    const attributes = this.attributes;

    // attributes

    for (const name in attributes) {
      const attribute = attributes[name];

      const newAttribute = convertBufferAttribute(attribute, indices);

      geometry2.setAttribute(name, newAttribute);
    }

    // morph attributes

    const morphAttributes = this.morphAttributes;

    for (const name in morphAttributes) {
      const morphArray = [];
      const morphAttribute = morphAttributes[name]; // morphAttribute: array of Float32BufferAttributes

      //@ts-expect-error
      for (let i = 0, il = morphAttribute.length; i < il; i++) {
        //@ts-expect-error
        const attribute = morphAttribute[i];

        const newAttribute = convertBufferAttribute(attribute, indices);

        morphArray.push(newAttribute);
      }

      //@ts-expect-error
      geometry2.morphAttributes[name] = morphArray;
    }

    geometry2.morphTargetsRelative = this.morphTargetsRelative;

    // groups

    const groups = this.groups;

    for (let i = 0, l = groups.length; i < l; i++) {
      const group = groups[i];
      geometry2.addGroup(group.start, group.count, group.materialIndex);
    }

    return geometry2 as this;
  }

  clone(): BufferGeometry<AttributeMap, MorphAttributeMap, IndexT> {
    return new this.constructor().copy(this) as BufferGeometry<AttributeMap, MorphAttributeMap, IndexT>;
  }

  copy(source: this): this {
    // reset

    this.index = null;
    this.attributes = {} as AttributeMap;
    this.morphAttributes = {} as MorphAttributeMap;
    this.groups = [];
    this.boundingBox = null;
    this.boundingSphere = null;

    // used for storing cloned, shared data

    const data = {};

    // name

    this.name = source.name;

    // index

    const index = source.index;

    if (index !== null) {
      //@ts-expect-error
      this.setIndex(index.clone(data));
    }

    // attributes

    const attributes = source.attributes;

    for (const name in attributes) {
      const attribute = attributes[name];
      //@ts-expect-error
      this.setAttribute(name, attribute.clone(data));
    }

    // morph attributes

    const morphAttributes = source.morphAttributes;

    for (const name in morphAttributes) {
      const array = [];
      const morphAttribute = morphAttributes[name]; // morphAttribute: array of Float32BufferAttributes

      //@ts-expect-error
      for (let i = 0, l = morphAttribute.length; i < l; i++) {
        //@ts-expect-error
        array.push(morphAttribute[i].clone(data));
      }

      //@ts-expect-error
      this.morphAttributes[name] = array;
    }

    this.morphTargetsRelative = source.morphTargetsRelative;

    // groups

    const groups = source.groups;

    for (let i = 0, l = groups.length; i < l; i++) {
      const group = groups[i];
      this.addGroup(group.start, group.count, group.materialIndex);
    }

    // bounding box

    const boundingBox = source.boundingBox;
    if (boundingBox) this.boundingBox = Box3.from(boundingBox);

    // bounding sphere

    const boundingSphere = source.boundingSphere;
    if (boundingSphere) this.boundingSphere = Sphere.from(boundingSphere);

    // draw range
    this.drawRange.start = source.drawRange.start;
    this.drawRange.count = source.drawRange.count;

    // user data
    this.userData = source.userData;

    return this;
  }

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
  }
}

BufferGeometry.prototype.isBufferGeometry = true;
BufferGeometry.prototype.type = 'BufferGeometry';

const _mat4 = Mat4.new();
const _mat3 = Mat3.new();
const _obj = new Object3D();
const _offset = Vec3.new();
const _box = Box3.new();
const _boxMorph = Box3.new();
const _vector = Vec3.new();
