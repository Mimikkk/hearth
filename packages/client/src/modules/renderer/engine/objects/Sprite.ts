import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Triangle } from '../math/Triangle.js';
import { Object3D } from '../core/Object3D.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { InterleavedBuffer } from '../core/InterleavedBuffer.js';
import { InterleavedBufferAttribute } from '../core/InterleavedBufferAttribute.js';
import { SpriteMaterial } from '../materials/SpriteMaterial.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';

const _intersectPoint = /*@__PURE__*/ new Vec3();
const _worldScale = /*@__PURE__*/ new Vec3();
const _mvPosition = /*@__PURE__*/ new Vec3();

const _alignedPosition = /*@__PURE__*/ new Vec2();
const _rotatedPosition = /*@__PURE__*/ new Vec2();
const _viewWorldMatrix = /*@__PURE__*/ new Mat4();

const _vA = /*@__PURE__*/ new Vec3();
const _vB = /*@__PURE__*/ new Vec3();
const _vC = /*@__PURE__*/ new Vec3();

const _uvA = /*@__PURE__*/ new Vec2();
const _uvB = /*@__PURE__*/ new Vec2();
const _uvC = /*@__PURE__*/ new Vec2();

let _geometry: BufferGeometry;

export class Sprite extends Object3D {
  declare isSprite: true;
  declare type: string | 'Sprite';

  center: Vec2;
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

    this.center = new Vec2(0.5, 0.5);
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (raycaster.camera === null) {
      throw Error('engine.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.');
    }

    _worldScale.fromMat4Scale(this.matrixWorld);

    _viewWorldMatrix.from(raycaster.camera.matrixWorld);
    this.modelViewMatrix.asMul(raycaster.camera.matrixWorldInverse, this.matrixWorld);

    _mvPosition.fromMat4Position(this.modelViewMatrix);

    if (raycaster.camera instanceof PerspectiveCamera && this.material.sizeAttenuation === false) {
      _worldScale.scale(-_mvPosition.z);
    }

    const rotation = this.material.rotation;
    let sin: number | undefined;
    let cos: number | undefined;

    if (rotation !== 0) {
      cos = Math.cos(rotation);
      sin = Math.sin(rotation);
    }

    const center = this.center;

    transformVertex(_vA.set(-0.5, -0.5, 0), _mvPosition, center, _worldScale, sin, cos);
    transformVertex(_vB.set(0.5, -0.5, 0), _mvPosition, center, _worldScale, sin, cos);
    transformVertex(_vC.set(0.5, 0.5, 0), _mvPosition, center, _worldScale, sin, cos);

    _uvA.set(0, 0);
    _uvB.set(1, 0);
    _uvC.set(1, 1);

    // check first triangle
    _triangle.set(_vA, _vB, _vC);
    let intersect = raycaster.ray.intersectTriangle(_triangle, false, _intersectPoint);

    if (intersect === null) {
      transformVertex(_vB.set(-0.5, 0.5, 0), _mvPosition, center, _worldScale, sin, cos);
      _uvB.set(0, 1);

      _triangle.set(_vA, _vC, _vB);
      intersect = raycaster.ray.intersectTriangle(_triangle, false, _intersectPoint);
      if (intersect === null) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(_intersectPoint);

    if (distance < raycaster.near || distance > raycaster.far) return;

    intersects.push({
      distance: distance,
      point: _intersectPoint.clone(),
      uv: Triangle.getInterpolation(_intersectPoint, _vA, _vB, _vC, _uvA, _uvB, _uvC, new Vec2())!,
      face: null,
      object: this,
    });
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    if (source.center !== undefined) this.center.from(source.center);

    this.material = source.material;

    return this;
  }
}

Sprite.prototype.isSprite = true;
Sprite.prototype.type = 'Sprite';

const _triangle = new Triangle();

function transformVertex(
  vertexPosition: Vec3,
  mvPosition: Vec3,
  center: Vec2,
  scale: Vec3,
  sin?: number,
  cos?: number,
) {
  // compute position in camera space
  _alignedPosition.asSub(vertexPosition, center).addScalar(0.5).mul(scale);

  // to check if rotation is not zero
  if (sin !== undefined && cos !== undefined) {
    _rotatedPosition.x = cos * _alignedPosition.x - sin * _alignedPosition.y;
    _rotatedPosition.y = sin * _alignedPosition.x + cos * _alignedPosition.y;
  } else {
    _rotatedPosition.from(_alignedPosition);
  }

  vertexPosition.from(mvPosition);
  vertexPosition.x += _rotatedPosition.x;
  vertexPosition.y += _rotatedPosition.y;

  // transform to world space
  vertexPosition.applyMat4(_viewWorldMatrix);
}
