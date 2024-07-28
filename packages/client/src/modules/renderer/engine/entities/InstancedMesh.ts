import { Mesh } from './Mesh.js';
import { Box3 } from '../math/Box3.js';
import { Mat4 } from '../math/Mat4.js';
import { Sphere } from '../math/Sphere.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { TextureDataType, TextureFormat } from '../constants.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';

const _instanceLocalMatrix = new Mat4();
const _instanceWorldMatrix = new Mat4();

const _instanceIntersects: Intersection[] = [];

const _box3 = Box3.new();
const _identity = new Mat4();
const _mesh = new Mesh(null!, null!);
const _sphere = new Sphere();

export class InstancedMesh extends Mesh {
  declare isInstancedMesh: true;
  instanceMatrix: Attribute;
  instanceColor: Attribute | null;
  morphTexture: DataTexture | null;
  count: number;
  boundingBox: Box3 | null;
  boundingSphere: Sphere | null;

  constructor(geometry: Geometry, material: Material, count: number) {
    super(geometry, material);

    this.instanceMatrix = new Attribute(new Float32Array(count * 16), 16, 0, BufferStep.Instance);
    this.instanceColor = null;
    this.morphTexture = null;
    this.count = count;

    this.boundingBox = null;
    this.boundingSphere = null;

    for (let i = 0; i < count; i++) {
      this.setMatrixAt(i, _identity);
    }
  }

  static is(value: any): value is InstancedMesh {
    return value?.isInstancedMesh === true;
  }

  computeBoundingBox() {
    const geometry = this.geometry;
    const count = this.count;

    if (this.boundingBox === null) {
      this.boundingBox = Box3.new();
    }

    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    this.boundingBox.clear();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);

      _box3.from(geometry.boundingBox!).applyMat4(_instanceLocalMatrix);

      this.boundingBox.union(_box3);
    }
  }

  computeBoundingSphere() {
    const geometry = this.geometry;
    const count = this.count;

    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }

    this.boundingSphere.clear();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);

      _sphere.from(geometry.boundingSphere!).applyMat4(_instanceLocalMatrix);

      this.boundingSphere.union(_sphere);
    }
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.instanceMatrix.copy(source.instanceMatrix);

    if (source.instanceColor !== null) this.instanceColor = source.instanceColor.clone();

    this.count = source.count;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  getColorAt(index: number, color: Color): void {
    color.fromArray(this.instanceColor!.array as never, index * 3);
  }

  getMatrixAt(index: number, matrix: Mat4): void {
    matrix.fromArray(this.instanceMatrix.array as never, index * 16);
  }

  getMorphAt(index: number, object: Mesh): void {
    const objectInfluences = object.morphTargetInfluences;

    const array = this.morphTexture!.source.data.data;

    const len = objectInfluences.length + 1;

    const dataIndex = index * len + 1;

    for (let i = 0; i < objectInfluences.length; i++) {
      objectInfluences[i] = array[dataIndex + i];
    }
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const matrixWorld = this.matrixWorld;
    const raycastTimes = this.count;

    _mesh.geometry = this.geometry;
    _mesh.material = this.material;

    if (_mesh.material === undefined) return;



    if (this.boundingSphere === null) this.computeBoundingSphere();

    _sphere.from(this.boundingSphere!);
    _sphere.applyMat4(matrixWorld);

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;



    for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {


      this.getMatrixAt(instanceId, _instanceLocalMatrix);

      _instanceWorldMatrix.asMul(matrixWorld, _instanceLocalMatrix);



      _mesh.matrixWorld = _instanceWorldMatrix;

      _mesh.raycast(raycaster, _instanceIntersects);



      for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
        const intersect = _instanceIntersects[i];
        intersect.instanceId = instanceId;
        intersect.object = this;
        intersects.push(intersect);
      }

      _instanceIntersects.length = 0;
    }
  }

  setColorAt(index: number, color: Color) {
    if (this.instanceColor === null) {
      this.instanceColor = new Attribute(new Float32Array(this.instanceMatrix.count * 3), 3, 0, BufferStep.Instance);
    }

    color.intoArray(this.instanceColor.array, index * 3);
  }

  setMatrixAt(index: number, matrix: Mat4) {
    matrix.intoArray(this.instanceMatrix.array as never, index * 16);
  }

  setMorphAt(index: number, object: Mesh) {
    const objectInfluences = object.morphTargetInfluences;

    const len = objectInfluences.length + 1;

    if (this.morphTexture === null) {
      this.morphTexture = new DataTexture(
        new Float32Array(len * this.count),
        len,
        this.count,
        TextureFormat.Red,
        TextureDataType.Float,
        undefined!,
        undefined!,
        undefined!,
        undefined!,
        undefined!,
        undefined!,
        undefined!,
      );
    }

    const array = this.morphTexture.source.data.data;

    let morphInfluencesSum = 0;

    for (let i = 0; i < objectInfluences.length; i++) {
      morphInfluencesSum += objectInfluences[i];
    }

    const morphBaseInfluence = this.geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;

    const dataIndex = len * index;

    array[dataIndex] = morphBaseInfluence;

    array.set(objectInfluences, dataIndex + 1);
  }

  updateMorphTargets() {}
}

InstancedMesh.prototype.isInstancedMesh = true;
