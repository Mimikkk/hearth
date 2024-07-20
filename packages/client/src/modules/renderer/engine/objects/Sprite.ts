import { IVec2, Vector2 } from '../math/Vector2.js';
import { IVec3, Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Triangle } from '../math/Triangle.js';
import { Object3D } from '../core/Object3D.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { InterleavedBuffer } from '../core/InterleavedBuffer.js';
import { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute.js';
import { SpriteMaterial } from '../materials/SpriteMaterial.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';

const _intersect = /*@__PURE__*/ new Vector3();
const _worldScale = new Vector3();
const _mv = /*@__PURE__*/ new Vector3();

const _align = IVec2.empty();
const _viewWorldMatrix = /*@__PURE__*/ new Matrix4();

const _vA = /*@__PURE__*/ new Vector3();
const _vB = /*@__PURE__*/ new Vector3();
const _vC = /*@__PURE__*/ new Vector3();

const _uvA = /*@__PURE__*/ new Vector2();
const _uvB = /*@__PURE__*/ new Vector2();
const _uvC = /*@__PURE__*/ new Vector2();
const _triangle1 = Triangle.empty();
const _triangle2 = Triangle.empty();

let _geometry: BufferGeometry;

export class Sprite extends Object3D {
  declare isSprite: true;
  declare type: string | 'Sprite';

  center: Vector2;
  geometry: BufferGeometry;
  material: SpriteMaterial;

  constructor(material: SpriteMaterial) {
    super();

    this.isSprite = true;

    this.type = 'Sprite';

    if (_geometry === undefined) {
      _geometry = new BufferGeometry();

      const float32Array = new Float32Array([
        -0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1,
      ]);

      const interleavedBuffer = new InterleavedBuffer(float32Array, 5);

      _geometry.setIndex([0, 1, 2, 0, 2, 3]);
      _geometry.setAttribute('position', new InterleavedBufferAttribute(interleavedBuffer, 3, 0, false));
      _geometry.setAttribute('uv', new InterleavedBufferAttribute(interleavedBuffer, 2, 3, false));
    }

    this.geometry = _geometry;
    this.material = material;

    this.center = new Vector2(0.5, 0.5);
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (raycaster.camera === null) {
      throw Error('engine.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.');
    }

    _worldScale.setFromMatrixScale(this.matrixWorld);

    _viewWorldMatrix.copy(raycaster.camera.matrixWorld);
    this.modelViewMatrix.multiplyMatrices(raycaster.camera.matrixWorldInverse, this.matrixWorld);

    _mv.setFromMatrixPosition(this.modelViewMatrix);

    if (raycaster.camera instanceof PerspectiveCamera && this.material.sizeAttenuation === false) {
      _worldScale.multiplyScalar(-_mv.z);
    }

    const rotation = this.material.rotation;
    let sin: number | undefined;
    let cos: number | undefined;

    if (rotation !== 0) {
      cos = Math.cos(rotation);
      sin = Math.sin(rotation);
    }

    const center = this.center;

    IVec3.set(_vA, -0.5, -0.5, 0);
    IVec3.set(_vB, 0.5, -0.5, 0);
    IVec3.set(_vC, 0.5, 0.5, 0);

    transformVertex(_vA, _mv, center, _worldScale, sin, cos);
    transformVertex(_vB, _mv, center, _worldScale, sin, cos);
    transformVertex(_vC, _mv, center, _worldScale, sin, cos);

    IVec2.set(_uvA, 0, 0);
    IVec2.set(_uvB, 1, 0);
    IVec2.set(_uvC, 1, 1);

    // check first triangle
    let intersect = raycaster.ray.intersectTriangle(_vA, _vB, _vC, false, _intersect);

    if (intersect === null) {
      IVec3.set(_vA, -0.5, 0.5, 0);
      transformVertex(_vB, _mv, center, _worldScale, sin, cos);
      IVec2.set(_uvB, 0, 1);

      intersect = raycaster.ray.intersectTriangle(_vA, _vC, _vB, false, _intersect);
      if (intersect === null) return;
    }

    const distance = IVec3.distanceTo(raycaster.ray.origin, _intersect);

    if (distance < raycaster.near || distance > raycaster.far) return;

    Triangle.set(_triangle1, _vA, _vB, _vC);
    Triangle.set(_triangle2, _vA, _vC, _vB);

    const uv = Triangle.interpolate(_triangle1, _triangle2, _intersect)!;

    intersects.push({
      distance: distance,
      point: _intersect.clone(),
      uv: new Vector2(uv.x, uv.y),
      face: null,
      object: this,
    });
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    if (source.center !== undefined) this.center.copy(source.center);

    this.material = source.material;

    return this;
  }
}

Sprite.prototype.isSprite = true;
Sprite.prototype.type = 'Sprite';

function transformVertex(vec: Vector3, mv: IVec3, center: IVec2, scale: IVec3, sin?: number, cos?: number) {
  IVec2.sub_(vec, center, _align);
  IVec2.scale(_align, 0.5);
  IVec2.mul(_align, scale);

  if (sin !== undefined && cos !== undefined) {
    IVec3.set(vec, mv.x + (cos * _align.x - sin * _align.y), mv.y + (sin * _align.x + cos * _align.y), mv.z);
  } else {
    IVec3.set(vec, mv.x + _align.x, mv.y + _align.y, mv.z);
  }

  IVec3.applyMat4(vec, _viewWorldMatrix);
}
