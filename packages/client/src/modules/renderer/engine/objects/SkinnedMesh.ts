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

  static is(object: any): object is SkinnedMesh {
    return object?.isSkinnedMesh === true;
  }

  computeBoundingBox() {
    const geometry = this.geometry!;
    if (this.boundingBox === null) this.boundingBox = new Box3();

    this.boundingBox!.clear();
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
      this.getVertexPosition(i, _vertex);
      this.boundingBox!.expandCoord(_vertex);
    }
  }

  computeBoundingSphere() {
    const geometry = this.geometry!;

    if (this.boundingSphere === null) {
      this.boundingSphere = Sphere.new();
    }
    this.boundingSphere.clear();

    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      this.getVertexPosition(i, _vertex);
      this.boundingSphere.expandCoord(_vertex);
    }
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.bindMode = source.bindMode;
    this.bindMatrix.from(source.bindMatrix);
    this.bindMatrixInverse.from(source.bindMatrixInverse);

    this.skeleton = source.skeleton;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) {
      if (this.boundingSphere === null) {
        this.boundingSphere = Sphere.from(source.boundingSphere);
      } else {
        source.boundingSphere.from(source.boundingSphere);
      }
    }
    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const { material, matrixWorld } = this;
    if (material === undefined) return;

    // test with bounding sphere in world space
    if (this.boundingSphere === null) this.computeBoundingSphere();
    _sphere.from(this.boundingSphere!).applyMat4(matrixWorld);

    if (!raycaster.ray.intersectsSphere(_sphere)) return;

    // convert ray to local space of skinned mesh
    _inverseMatrix.from(matrixWorld).invert();
    _ray.clone(raycaster.ray).applyMat4(_inverseMatrix);

    // test with bounding box in local space
    if (this.boundingBox && !_ray.intersectsBox(this.boundingBox)) return;

    // test for intersections with geometry
    this._computeIntersections(raycaster, intersects, _ray);
  }

  getVertexPosition(index: number, into: Vec3 = Vec3.new()): Vec3 {
    super.getVertexPosition(index, into);
    this.applyBoneTransform(index, into);

    return into;
  }

  bind(skeleton: Skeleton, bindMatrix?: Mat4): void {
    this.skeleton = skeleton;

    if (bindMatrix === undefined) {
      this.updateMatrixWorld(true);

      this.skeleton.calculateInverses();

      bindMatrix = this.matrixWorld;
    }

    this.bindMatrix.from(bindMatrix);
    this.bindMatrixInverse.from(bindMatrix).invert();
  }

  pose() {
    this.skeleton?.pose();
  }

  normalizeSkinWeights() {
    const vector = new Vec4();

    const skinWeight = this.geometry.attributes.skinWeight;

    for (let i = 0, l = skinWeight.count; i < l; i++) {
      vector.fromAttribute(skinWeight, i);

      const scale = 1.0 / vector.manhattan();

      if (scale !== Infinity) {
        vector.scale(scale);
      } else {
        vector.set(1, 0, 0, 0); // do something reasonable
      }

      skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
    }
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    switch (this.bindMode) {
      case BindMode.Attached:
        this.bindMatrixInverse.from(this.matrixWorld).invert();
        break;
      case BindMode.Detached:
        this.bindMatrixInverse.from(this.bindMatrix).invert();
        break;
    }

    return this;
  }

  applyBoneTransform(index: number, into: Vec3 = Vec3.new()): Vec3 {
    const skeleton = this.skeleton!;
    const geometry = this.geometry!;

    _index.fromAttribute(geometry.attributes.skinIndex, index);
    _weight.fromAttribute(geometry.attributes.skinWeight, index);
    _position.from(into).applyMat4(this.bindMatrix);

    into.set(0, 0, 0);
    const weightX = _weight.x;
    if (weightX !== 0) {
      const boneIndex = _index.x;

      _matrix4.from(skeleton.bones[boneIndex].matrixWorld).mul(skeleton.boneInverses[boneIndex]);
      into.addScaled(_vector3.from(_position).applyMat4(_matrix4), weightX);
    }

    const weightY = _weight.y;
    if (weightY !== 0) {
      const boneIndex = _index.y;

      _matrix4.from(skeleton.bones[boneIndex].matrixWorld).mul(skeleton.boneInverses[boneIndex]);
      into.addScaled(_vector3.from(_position).applyMat4(_matrix4), weightY);
    }

    const weightZ = _weight.z;
    if (weightZ !== 0) {
      const boneIndex = _index.z;

      _matrix4.from(skeleton.bones[boneIndex].matrixWorld).mul(skeleton.boneInverses[boneIndex]);
      into.addScaled(_vector3.from(_position).applyMat4(_matrix4), weightZ);
    }

    const weightW = _weight.w;
    if (weightW !== 0) {
      const boneIndex = _index.w;

      _matrix4.from(skeleton.bones[boneIndex].matrixWorld).mul(skeleton.boneInverses[boneIndex]);
      into.addScaled(_vector3.from(_position).applyMat4(_matrix4), weightW);
    }

    return into.applyMat4(this.bindMatrixInverse);
  }
}

const _position = Vec3.new();
const _index = Vec4.new();

const _weight = Vec4.new();
const _vector3 = Vec3.new();
const _matrix4 = new Mat4();

const _vertex = Vec3.new();
const _sphere = Sphere.new();
const _inverseMatrix = new Mat4();

const _ray = Ray.new();

SkinnedMesh.prototype.isSkinnedMesh = true;
SkinnedMesh.prototype.type = 'SkinnedMesh';
