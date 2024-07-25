import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Triangle } from '../math/Triangle.js';
import { Entity } from '../core/Entity.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Buffer } from '../core/buffers/Buffer.js';
import { SpriteMaterial } from '@modules/renderer/engine/objects/materials/SpriteMaterial.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

const _intersectPoint = Vec3.new();
const _worldScale = Vec3.new();
const _mvPosition = Vec3.new();

const _alignedPosition = Vec2.new();
const _rotatedPosition = Vec2.new();
const _viewWorldMatrix = new Mat4();

const _vA = Vec3.new();
const _vB = Vec3.new();
const _vC = Vec3.new();

const _uvA = Vec2.new();
const _uvB = Vec2.new();
const _uvC = Vec2.new();

let _geometry: Geometry;

export class Sprite extends Entity {
  declare isSprite: true;
  declare type: string | 'Sprite';

  center: Vec2;
  geometry: Geometry;
  material: SpriteMaterial;

  constructor(material: SpriteMaterial) {
    super();

    this.isSprite = true;

    this.type = 'Sprite';

    if (_geometry === undefined) {
      _geometry = new Geometry();

      const float32Array = new Float32Array([
        -0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1,
      ]);

      const buffer = new Buffer(float32Array, 5);

      _geometry.setIndex([0, 1, 2, 0, 2, 3]);
      _geometry.setAttribute('position', new BufferAttribute(buffer, 3, 0, GPUVertexStepModeType.Vertex, undefined));
      _geometry.setAttribute('uv', new BufferAttribute(buffer, 2, 3, GPUVertexStepModeType.Vertex, undefined));
    }

    this.geometry = _geometry;
    this.material = material;

    this.center = Vec2.new(0.5, 0.5);
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

    _triangle1.set(_vA, _vB, _vC);
    _triangle2.set(_uvA, _uvB, _uvC);

    const { x, y } = Triangle.interpolate(_triangle1, _triangle2, _intersectPoint);
    intersects.push({
      distance: distance,
      point: _intersectPoint.clone(),
      uv: Vec2.new(x, y),
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
const _triangle1 = new Triangle();
const _triangle2 = new Triangle();

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
