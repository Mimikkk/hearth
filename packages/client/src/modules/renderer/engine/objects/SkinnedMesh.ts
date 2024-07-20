import { Mesh } from './Mesh.js';
import { Box3 } from '../math/Box3.js';
import { Mat4 } from '../math/Mat4.js';
import { Sphere } from '../math/Sphere.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec4 } from '../math/Vec4.js';
import { Ray } from '../math/Ray.js';
import { BindMode } from '../constants.js';
import { BufferGeometry } from '@modules/renderer/engine/core/BufferGeometry.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Skeleton } from '@modules/renderer/engine/objects/Skeleton.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';

const _basePosition = /*@__PURE__*/ new Vec3();

const _skinIndex = /*@__PURE__*/ new Vec4();
const _skinWeight = /*@__PURE__*/ new Vec4();

const _Vec3 = /*@__PURE__*/ new Vec3();
const _Mat4 = /*@__PURE__*/ new Mat4();
const _vertex = /*@__PURE__*/ new Vec3();

const _sphere = /*@__PURE__*/ new Sphere();
const _inverseMatrix = /*@__PURE__*/ new Mat4();
const _ray = /*@__PURE__*/ new Ray();

export class SkinnedMesh extends Mesh {
  declare isSkinnedMesh: true;
  declare type: string | 'SkinnedMesh';

  bindMode: BindMode;
  bindMatrix: Mat4;
  bindMatrixInverse: Mat4;
  boundingSphere: Sphere | null;
  skeleton: Skeleton | null;
  declare geometry: BufferGeometry;
  declare material: Material;

  constructor(geometry: BufferGeometry, material: Material) {
    super(geometry, material);

    this.bindMode = BindMode.Attached;
    this.bindMatrix = new Mat4();
    this.bindMatrixInverse = new Mat4();

    this.boundingBox = null!;
    this.boundingSphere = null;
  }

  computeBoundingBox() {
    const geometry = this.geometry!;

    if (this.boundingBox === null) this.boundingBox = new Box3();

    this.boundingBox!.clear();

    const positionAttribute = geometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      this.getVertexPosition(i, _vertex);
      this.boundingBox!.expandCoord(_vertex);
    }
  }

  computeBoundingSphere() {
    const geometry = this.geometry!;

    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    this.boundingSphere.clear();

    const positionAttribute = geometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      this.getVertexPosition(i, _vertex);
      this.boundingSphere.expandCoord(_vertex);
    }
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.bindMode = source.bindMode;
    this.bindMatrix.copy(source.bindMatrix);
    this.bindMatrixInverse.copy(source.bindMatrixInverse);

    this.skeleton = source.skeleton;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const material = this.material;
    const matrixWorld = this.matrixWorld;

    if (material === undefined) return;

    // test with bounding sphere in world space

    if (this.boundingSphere === null) this.computeBoundingSphere();

    _sphere.from(this.boundingSphere!);
    _sphere.applyMat4(matrixWorld);

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;

    // convert ray to local space of skinned mesh

    _inverseMatrix.copy(matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMat4(_inverseMatrix);

    // test with bounding box in local space

    if (this.boundingBox !== null) {
      if (_ray.intersectsBox(this.boundingBox) === false) return;
    }

    // test for intersections with geometry

    this._computeIntersections(raycaster, intersects, _ray);
  }

  getVertexPosition(index: number, target: Vec3): Vec3 {
    super.getVertexPosition(index, target);

    this.applyBoneTransform(index, target);

    return target;
  }

  bind(skeleton: Skeleton, bindMatrix?: Mat4): void {
    this.skeleton = skeleton;

    if (bindMatrix === undefined) {
      this.updateMatrixWorld(true);

      this.skeleton.calculateInverses();

      bindMatrix = this.matrixWorld;
    }

    this.bindMatrix.copy(bindMatrix);
    this.bindMatrixInverse.copy(bindMatrix).invert();
  }

  pose() {
    this.skeleton?.pose();
  }

  normalizeSkinWeights() {
    const vector = new Vec4();

    const skinWeight = this.geometry.attributes.skinWeight;

    for (let i = 0, l = skinWeight.count; i < l; i++) {
      vector.fromBufferAttribute(skinWeight, i);

      const scale = 1.0 / vector.manhattanLength();

      if (scale !== Infinity) {
        vector.multiplyScalar(scale);
      } else {
        vector.set(1, 0, 0, 0); // do something reasonable
      }

      skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
    }
  }

  updateMatrixWorld(force: boolean): this {
    super.updateMatrixWorld(force);

    if (this.bindMode === BindMode.Attached) {
      this.bindMatrixInverse.copy(this.matrixWorld).invert();
    } else if (this.bindMode === BindMode.Detached) {
      this.bindMatrixInverse.copy(this.bindMatrix).invert();
    } else {
      console.warn('engine.SkinnedMesh: Unrecognized bindMode: ' + this.bindMode);
    }

    return this;
  }

  applyBoneTransform(index: number, vector: Vec3): Vec3 {
    const skeleton = this.skeleton!;
    const geometry = this.geometry!;

    _skinIndex.fromBufferAttribute(geometry.attributes.skinIndex, index);
    _skinWeight.fromBufferAttribute(geometry.attributes.skinWeight, index);

    _basePosition.from(vector).applyMat4(this.bindMatrix);

    vector.set(0, 0, 0);

    for (let i = 0; i < 4; i++) {
      const weight = _skinWeight.getComponent(i);

      if (weight !== 0) {
        const boneIndex = _skinIndex.getComponent(i);

        _Mat4.multiplyMatrices(skeleton.bones[boneIndex].matrixWorld, skeleton.boneInverses[boneIndex]);

        vector.addScaled(_Vec3.from(_basePosition).applyMat4(_Mat4), weight);
      }
    }

    return vector.applyMat4(this.bindMatrixInverse);
  }
}

SkinnedMesh.prototype.isSkinnedMesh = true;
SkinnedMesh.prototype.type = 'SkinnedMesh';
