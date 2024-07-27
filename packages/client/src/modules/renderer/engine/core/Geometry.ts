import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Box3 } from '../math/Box3.js';
import { BufferAttribute } from './BufferAttribute.js';
import { Sphere } from '../math/Sphere.js';
import { Entity } from './Entity.js';
import { Mat4 } from '../math/Mat4.js';
import { Mat3 } from '../math/Mat3.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { AttributeType } from '@modules/renderer/engine/core/types.js';
import { v4 } from 'uuid';

export class Geometry {
  declare isGeometry: true;
  declare type: 'Geometry';
  id: number;
  uuid: string;
  name: string;
  instanceCount: number;
  index: BufferAttribute<Uint32Array> | null;
  attributes: AttributeRecord;
  morphAttributes: AttributeRecord;
  morphTargetsRelative: boolean;
  groups: { start: number; count: number; materialIndex?: number }[];
  boundingBox: Box3 | null;
  boundingSphere: Sphere | null;
  drawRange: { start: number; count: number };
  userData: Record<string, any>;
  parameters?: Record<string, any>;

  constructor() {
    this.id = _id++;

    this.uuid = v4();

    this.name = '';
    this.type = 'Geometry';

    this.index = null;
    this.attributes = {};
    this.morphAttributes = {};
    this.morphTargetsRelative = false;

    this.groups = [];

    this.boundingBox = null;
    this.boundingSphere = null;

    this.drawRange = { start: 0, count: Infinity };

    this.userData = {};

    this.instanceCount = 1;
  }

  static is(value: any): value is Geometry {
    return value?.isGeometry === true;
  }

  getIndex(): BufferAttribute<Uint32Array> | null {
    return this.index;
  }

  setIndex(index: BufferAttribute<Uint32Array> | number[] | null): this {
    if (Array.isArray(index)) {
      this.index = new BufferAttribute(new Uint32Array(index), 1) as BufferAttribute<Uint32Array>;
    } else {
      this.index = index;
    }

    return this;
  }

  getAttribute(name: string): BufferAttribute {
    return this.attributes[name];
  }

  setAttribute(name: string, attribute: BufferAttribute): this {
    this.attributes[name] = attribute;
    return this;
  }

  deleteAttribute(name: string): this {
    delete this.attributes[name];

    return this;
  }

  hasAttribute(name: string): boolean {
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

  applyMat4(matrix: Mat4): this {
    const position = this.attributes.position;

    if (position !== undefined) {
      position.applyMat4(matrix);

      position.needsUpdate = true;
    }

    const normal = this.attributes.normal;

    if (normal !== undefined) {
      const normalMatrix = new Mat3().fromNMat4(matrix);

      normal.applyNMat3(normalMatrix);

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
    _m1.asRotationFromQuaternion(q);

    this.applyMat4(_m1);

    return this;
  }

  rotateX(angle: number): this {
    // rotate geometry around world x-axis

    _m1.asRotationX(angle);

    this.applyMat4(_m1);

    return this;
  }

  rotateY(angle: number): this {
    // rotate geometry around world y-axis

    _m1.asRotationY(angle);

    this.applyMat4(_m1);

    return this;
  }

  rotateZ(angle: number): this {
    // rotate geometry around world z-axis

    _m1.asRotationZ(angle);

    this.applyMat4(_m1);

    return this;
  }

  translate(x: number, y: number, z: number): this {
    _m1.asTranslation(_translate.set(x, y, z));

    this.applyMat4(_m1);

    return this;
  }

  scale(x: number, y: number, z: number): this {
    // scale geometry

    _m1.asScale(x, y, z);

    this.applyMat4(_m1);

    return this;
  }

  lookAt(vector: Vec3): this {
    _obj.lookAt(vector);

    _obj.updateMatrix();

    this.applyMat4(_obj.matrix);

    return this;
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

    this.setAttribute('position', new BufferAttribute(new Float32Array(position), 3) as never);

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = Box3.new();
    }

    const position = this.attributes.position as BufferAttribute<Float32Array>;
    const morphAttributesPosition = this.morphAttributes.position;

    if (position !== undefined) {
      this.boundingBox.fromAttribute(position);

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          _box.fromAttribute(morphAttribute);

          if (this.morphTargetsRelative) {
            _vector.asAdd(this.boundingBox.min, _box.min);
            this.boundingBox.expandCoord(_vector);

            _vector.asAdd(this.boundingBox.max, _box.max);
            this.boundingBox.expandCoord(_vector);
          } else {
            this.boundingBox.expandCoord(_box.min);
            this.boundingBox.expandCoord(_box.max);
          }
        }
      }
    } else {
      this.boundingBox.clear();
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

      _box.fromAttribute(position);

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          _boxMorphTargets.fromAttribute(morphAttribute);

          if (this.morphTargetsRelative) {
            _vector.asAdd(_box.min, _boxMorphTargets.min);
            _box.expandCoord(_vector);

            _vector.asAdd(_box.max, _boxMorphTargets.max);
            _box.expandCoord(_vector);
          } else {
            _box.expandCoord(_boxMorphTargets.min);
            _box.expandCoord(_boxMorphTargets.max);
          }
        }
      }

      _box.center(center);

      // second, try to find a boundingSphere with a radius smaller than the
      // boundingSphere of the boundingBox: sqrt(3) smaller in the best case

      let maxRadiusSq = 0;

      for (let i = 0, il = position.count; i < il; i++) {
        _vector.fromAttribute(position, i);

        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
      }

      // process morph attributes if present

      if (morphAttributesPosition) {
        //@ts-expect-error
        for (let i = 0, il = morphAttributesPosition.length; i < il; i++) {
          //@ts-expect-error
          const morphAttribute = morphAttributesPosition[i];
          const morphTargetsRelative = this.morphTargetsRelative;

          for (let j = 0, jl = morphAttribute.count; j < jl; j++) {
            _vector.fromAttribute(morphAttribute, j);

            if (morphTargetsRelative) {
              _offset.fromAttribute(position, j);
              _vector.add(_offset);
            }

            maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
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
      this.setAttribute('tangent', new BufferAttribute(new Float32Array(new Array(4 * positionAttribute.count)), 4));
    }

    const tangentAttribute = this.attributes.tangent;

    const tan1: Vec3[] = [];
    const tan2: Vec3[] = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      tan1[i] = Vec3.new();
      tan2[i] = Vec3.new();
    }

    const vA = Vec3.new(),
      vB = Vec3.new(),
      vC = Vec3.new(),
      uvA = Vec2.new(),
      uvB = Vec2.new(),
      uvC = Vec2.new(),
      sdir = Vec3.new(),
      tdir = Vec3.new();

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

    const tmp = Vec3.new(),
      tmp2 = Vec3.new();
    const n = Vec3.new(),
      n2 = Vec3.new();

    function handleVertex(v: number): void {
      n.fromAttribute(normalAttribute, v);
      n2.from(n);

      const t = tan1[v];

      // Gram-Schmidt orthogonalize

      tmp.from(t);
      tmp.sub(n.scale(n.dot(t))).normalize();

      // Calculate handedness

      tmp2.asCross(n2, t);
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

    const positionAttribute = this.attributes.position;

    if (positionAttribute !== undefined) {
      let normalAttribute = this.attributes.normal;

      if (normalAttribute === undefined) {
        normalAttribute = new BufferAttribute(new Float32Array(positionAttribute.count * 3), 3);
        this.setAttribute('normal', normalAttribute);
      } else {
        // reset existing normals to zero

        for (let i = 0, il = normalAttribute.count; i < il; i++) {
          normalAttribute.setXYZ(i, 0, 0, 0);
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

          pA.fromAttribute(positionAttribute, vA);
          pB.fromAttribute(positionAttribute, vB);
          pC.fromAttribute(positionAttribute, vC);

          cb.asSub(pC, pB);
          ab.asSub(pA, pB);
          cb.cross(ab);

          nA.fromAttribute(normalAttribute, vA);
          nB.fromAttribute(normalAttribute, vB);
          nC.fromAttribute(normalAttribute, vC);

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
          pA.fromAttribute(positionAttribute, i + 0);
          pB.fromAttribute(positionAttribute, i + 1);
          pC.fromAttribute(positionAttribute, i + 2);

          cb.asSub(pC, pB);
          ab.asSub(pA, pB);
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
      _vector.fromAttribute(normals, i);

      _vector.normalize();

      normals.setXYZ(i, _vector.x, _vector.y, _vector.z);
    }

    return this;
  }

  toNonIndexed(): this {
    function convertBufferAttribute(attribute: any, indices: any) {
      const array = attribute.array;
      const itemSize = attribute.stride;

      const array2 = new array.constructor(indices.length * itemSize);

      let index = 0,
        index2 = 0;

      for (let i = 0, l = indices.length; i < l; i++) {
        if (attribute.isInterleavedBufferAttribute) {
          index = indices[i] * attribute.source.stride + attribute.offset;
        } else {
          index = indices[i] * itemSize;
        }

        for (let j = 0; j < itemSize; j++) {
          array2[index2++] = array[index++];
        }
      }

      return new BufferAttribute(array2, itemSize);
    }

    //

    if (this.index === null) {
      console.warn('engine.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.');
      return this;
    }

    const geometry2 = new Geometry();

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
      const morphAttribute = morphAttributes[name];

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

  clone(): Geometry {
    return new this.constructor().copy(this) as Geometry;
  }

  copy(source: Geometry): this {
    // reset

    this.index = null;
    this.attributes = {};
    this.morphAttributes = {};
    this.groups = [];
    this.boundingBox = null;
    this.boundingSphere = null;
    this.instanceCount = Infinity;

    const data = {};

    this.name = source.name;
    const index = source.index;
    if (index !== null) {
      this.setIndex(index.clone(data));
    }

    const attributes = source.attributes;
    for (const name in attributes) {
      const attribute = attributes[name];
      this.setAttribute(name, attribute.clone(data));
    }

    const morphAttributes = source.morphAttributes;
    for (const name in morphAttributes) {
      const array = [];
      const morphAttribute = morphAttributes[name];

      //@ts-expect-error
      for (let i = 0, l = morphAttribute.length; i < l; i++) {
        //@ts-expect-error
        array.push(morphAttribute[i].clone(data));
      }

      //@ts-expect-error
      this.morphAttributes[name] = array;
    }

    this.morphTargetsRelative = source.morphTargetsRelative;

    const groups = source.groups;
    for (let i = 0, l = groups.length; i < l; i++) {
      const group = groups[i];
      this.addGroup(group.start, group.count, group.materialIndex);
    }

    const boundingBox = source.boundingBox;
    if (boundingBox !== null) {
      this.boundingBox = boundingBox.clone();
    }

    const boundingSphere = source.boundingSphere;
    if (boundingSphere !== null) {
      this.boundingSphere = boundingSphere.clone();
    }

    this.drawRange.start = source.drawRange.start;
    this.drawRange.count = source.drawRange.count;
    this.userData = source.userData;

    return this;
  }
}

Geometry.prototype.isGeometry = true;
Geometry.prototype.type = 'Geometry';

type AttributeRecord = Record<string, AttributeType>;

let _id = 0;
const _m1 = new Mat4();
const _obj = new Entity();
const _offset = Vec3.new();
const _box = Box3.new();
const _boxMorphTargets = Box3.new();
const _vector = Vec3.new();
const _translate = Vec3.new();
