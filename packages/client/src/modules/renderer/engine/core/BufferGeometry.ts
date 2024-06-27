import { Vector3 } from '../math/Vector3.js';
import { Vector2 } from '../math/Vector2.js';
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
import { Matrix4 } from '../math/Matrix4.js';
import { Matrix3 } from '../math/Matrix3.js';
import * as MathUtils from '../math/MathUtils.js';
import { isArrayUint32 } from '../utils.js';
import { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';

let _id = 0;

const _m1 = /*@__PURE__*/ new Matrix4();
const _obj = /*@__PURE__*/ new Object3D();
const _offset = /*@__PURE__*/ new Vector3();
const _box = /*@__PURE__*/ new Box3();
const _boxMorphTargets = /*@__PURE__*/ new Box3();
const _vector = /*@__PURE__*/ new Vector3();

type AttributeRecord = Record<string, Float32BufferAttribute | InterleavedBufferAttribute>;

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

    this.uuid = MathUtils.generateUuid();

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
    return this.attributes[name] !== undefined;
  }

  addGroup(start: number, count: number, materialIndex: number = 0): this {
    this.groups.push({
      start: start,
      count: count,
      materialIndex: materialIndex,
    });
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

  applyMatrix4(matrix: Matrix4): this {
    const position = this.attributes.position;

    if (position !== undefined) {
      position.applyMatrix4(matrix);

      position.needsUpdate = true;
    }

    const normal = this.attributes.normal;

    if (normal !== undefined) {
      const normalMatrix = new Matrix3().getNormalMatrix(matrix);

      normal.applyNormalMatrix(normalMatrix);

      normal.needsUpdate = true;
    }

    const tangent = this.attributes.tangent;

    if (tangent !== undefined) {
      tangent.transformDirection(matrix);

      tangent.needsUpdate = true;
    }

    if (this.boundingBox !== null) {
      this.computeBoundingBox();
    }

    if (this.boundingSphere !== null) {
      this.computeBoundingSphere();
    }

    return this;
  }

  applyQuaternion(q: Quaternion): this {
    _m1.makeRotationFromQuaternion(q);

    this.applyMatrix4(_m1);

    return this;
  }

  rotateX(angle: number): this {
    // rotate geometry around world x-axis

    _m1.makeRotationX(angle);

    this.applyMatrix4(_m1);

    return this;
  }

  rotateY(angle: number): this {
    // rotate geometry around world y-axis

    _m1.makeRotationY(angle);

    this.applyMatrix4(_m1);

    return this;
  }

  rotateZ(angle: number): this {
    // rotate geometry around world z-axis

    _m1.makeRotationZ(angle);

    this.applyMatrix4(_m1);

    return this;
  }

  translate(x: number, y: number, z: number): this {
    // translate geometry

    _m1.makeTranslation(x, y, z);

    this.applyMatrix4(_m1);

    return this;
  }

  scale(x: number, y: number, z: number): this {
    // scale geometry

    _m1.makeScale(x, y, z);

    this.applyMatrix4(_m1);

    return this;
  }

  lookAt(vector: Vector3): this {
    _obj.lookAt(vector);

    _obj.updateMatrix();

    this.applyMatrix4(_obj.matrix);

    return this;
  }

  center(): this {
    this.computeBoundingBox();

    this.boundingBox!.getCenter(_offset).negate();

    this.translate(_offset.x, _offset.y, _offset.z);

    return this;
  }

  setFromPoints(points: Vector3[]): this {
    const position: number[] = [];

    for (let i = 0, l = points.length; i < l; i++) {
      const point = points[i];
      position.push(point.x, point.y, point.z);
    }

    this.setAttribute('position', new Float32BufferAttribute(position, 3) as never);

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const position = this.attributes.position as BufferAttribute<Float32Array>;
    const morphAttributesPosition = this.morphAttributes.position;

    if (position !== undefined) {
      this.boundingBox.setFromBufferAttribute(position);

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          _box.setFromBufferAttribute(morphAttribute);

          if (this.morphTargetsRelative) {
            _vector.addVectors(this.boundingBox.min, _box.min);
            this.boundingBox.expandByPoint(_vector);

            _vector.addVectors(this.boundingBox.max, _box.max);
            this.boundingBox.expandByPoint(_vector);
          } else {
            this.boundingBox.expandByPoint(_box.min);
            this.boundingBox.expandByPoint(_box.max);
          }
        }
      }
    } else {
      this.boundingBox.makeEmpty();
    }

    if (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) {
      console.error(
        'engine.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this,
      );
    }

    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    const position = this.attributes.position as BufferAttribute<Float32Array>;
    const morphAttributesPosition = this.morphAttributes.position;

    if (position) {
      // first, find the center of the bounding sphere

      const center = this.boundingSphere.center;

      _box.setFromBufferAttribute(position);

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          _boxMorphTargets.setFromBufferAttribute(morphAttribute);

          if (this.morphTargetsRelative) {
            _vector.addVectors(_box.min, _boxMorphTargets.min);
            _box.expandByPoint(_vector);

            _vector.addVectors(_box.max, _boxMorphTargets.max);
            _box.expandByPoint(_vector);
          } else {
            _box.expandByPoint(_boxMorphTargets.min);
            _box.expandByPoint(_boxMorphTargets.max);
          }
        }
      }

      _box.getCenter(center);

      // second, try to find a boundingSphere with a radius smaller than the
      // boundingSphere of the boundingBox: sqrt(3) smaller in the best case

      let maxRadiusSq = 0;

      for (let i = 0, il = position.count; i < il; i++) {
        _vector.fromBufferAttribute(position, i);

        maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
      }

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          const morphTargetsRelative = this.morphTargetsRelative;

          for (let j = 0, jl = morphAttribute.count; j < jl; j++) {
            _vector.fromBufferAttribute(morphAttribute, j);

            if (morphTargetsRelative) {
              _offset.fromBufferAttribute(position, j);
              _vector.add(_offset);
            }

            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_vector));
          }
        }
      }

      this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

      if (isNaN(this.boundingSphere.radius)) {
        console.error(
          'engine.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',
          this,
        );
      }
    }

    return this;
  }

  computeTangents(): this {
    const index = this.index;
    const attributes = this.attributes;

    // based on http://www.terathon.com/code/tangent.html
    // (per vertex tangents)

    if (
      index === null ||
      attributes.position === undefined ||
      attributes.normal === undefined ||
      attributes.uv === undefined
    ) {
      console.error(
        'engine.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)',
      );
      return this;
    }

    const positionAttribute = attributes.position;
    const normalAttribute = attributes.normal;
    const uvAttribute = attributes.uv;

    if (this.hasAttribute('tangent') === false) {
      // @ts-expect-error
      this.setAttribute('tangent', new BufferAttribute(new Float32Array(4 * positionAttribute.count), 4));
    }

    const tangentAttribute = this.getAttribute('tangent');

    const tan1: Vector3[] = [];
    const tan2: Vector3[] = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      tan1[i] = new Vector3();
      tan2[i] = new Vector3();
    }

    const vA = new Vector3(),
      vB = new Vector3(),
      vC = new Vector3(),
      uvA = new Vector2(),
      uvB = new Vector2(),
      uvC = new Vector2(),
      sdir = new Vector3(),
      tdir = new Vector3();

    function handleTriangle(a: number, b: number, c: number): void {
      vA.fromBufferAttribute(positionAttribute, a);
      vB.fromBufferAttribute(positionAttribute, b);
      vC.fromBufferAttribute(positionAttribute, c);

      uvA.fromBufferAttribute(uvAttribute, a);
      uvB.fromBufferAttribute(uvAttribute, b);
      uvC.fromBufferAttribute(uvAttribute, c);

      vB.sub(vA);
      vC.sub(vA);

      uvB.sub(uvA);
      uvC.sub(uvA);

      const r = 1.0 / (uvB.x * uvC.y - uvC.x * uvB.y);

      // silently ignore degenerate uv triangles having coincident or colinear vertices

      if (!isFinite(r)) return this;
      sdir.copy(vB).multiplyScalar(uvC.y).addScaledVector(vC, -uvB.y).multiplyScalar(r);
      tdir.copy(vC).multiplyScalar(uvB.x).addScaledVector(vB, -uvC.x).multiplyScalar(r);

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

    const tmp = new Vector3(),
      tmp2 = new Vector3();
    const n = new Vector3(),
      n2 = new Vector3();

    function handleVertex(v: number): void {
      n.fromBufferAttribute(normalAttribute, v);
      n2.copy(n);

      const t = tan1[v];

      // Gram-Schmidt orthogonalize

      tmp.copy(t);
      tmp.sub(n.multiplyScalar(n.dot(t))).normalize();

      // Calculate handedness

      tmp2.crossVectors(n2, t);
      const test = tmp2.dot(tan2[v]);
      const w = test < 0.0 ? -1.0 : 1.0;

      tangentAttribute.setXYZW(v, tmp.x, tmp.y, tmp.z, w);
    }

    for (let i = 0, il = groups.length; i < il; ++i) {
      const group = groups[i];

      const start = group.start;
      const count = group.count;

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
    const positionAttribute = this.getAttribute('position');

    if (positionAttribute !== undefined) {
      let normalAttribute = this.getAttribute('normal');

      if (normalAttribute === undefined) {
        //@ts-expect-error
        normalAttribute = new BufferAttribute(new Float32Array(positionAttribute.count * 3), 3);
        this.setAttribute('normal', normalAttribute);
      } else {
        // reset existing normals to zero

        for (let i = 0, il = normalAttribute.count; i < il; i++) {
          normalAttribute.setXYZ(i, 0, 0, 0);
        }
      }

      const pA = new Vector3(),
        pB = new Vector3(),
        pC = new Vector3();
      const nA = new Vector3(),
        nB = new Vector3(),
        nC = new Vector3();
      const cb = new Vector3(),
        ab = new Vector3();

      // indexed elements

      if (index) {
        for (let i = 0, il = index.count; i < il; i += 3) {
          const vA = index.getX(i + 0);
          const vB = index.getX(i + 1);
          const vC = index.getX(i + 2);

          pA.fromBufferAttribute(positionAttribute, vA);
          pB.fromBufferAttribute(positionAttribute, vB);
          pC.fromBufferAttribute(positionAttribute, vC);

          cb.subVectors(pC, pB);
          ab.subVectors(pA, pB);
          cb.cross(ab);

          nA.fromBufferAttribute(normalAttribute, vA);
          nB.fromBufferAttribute(normalAttribute, vB);
          nC.fromBufferAttribute(normalAttribute, vC);

          nA.add(cb);
          nB.add(cb);
          nC.add(cb);

          normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z);
          normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z);
          normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z);
        }
      } else {
        // non-indexed elements (unconnected triangle soup)

        for (let i = 0, il = positionAttribute.count; i < il; i += 3) {
          pA.fromBufferAttribute(positionAttribute, i + 0);
          pB.fromBufferAttribute(positionAttribute, i + 1);
          pC.fromBufferAttribute(positionAttribute, i + 2);

          cb.subVectors(pC, pB);
          ab.subVectors(pA, pB);
          cb.cross(ab);

          normalAttribute.setXYZ(i + 0, cb.x, cb.y, cb.z);
          normalAttribute.setXYZ(i + 1, cb.x, cb.y, cb.z);
          normalAttribute.setXYZ(i + 2, cb.x, cb.y, cb.z);
        }
      }

      this.normalizeNormals();

      normalAttribute.needsUpdate = true;
    }

    return this;
  }

  normalizeNormals(): this {
    const normals = this.attributes.normal;

    for (let i = 0, il = normals.count; i < il; i++) {
      _vector.fromBufferAttribute(normals, i);

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

    if (boundingBox !== null) {
      this.boundingBox = boundingBox.clone();
    }

    // bounding sphere

    const boundingSphere = source.boundingSphere;

    if (boundingSphere !== null) {
      this.boundingSphere = boundingSphere.clone();
    }

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
