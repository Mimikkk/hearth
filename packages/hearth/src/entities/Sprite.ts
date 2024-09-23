import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Triangle } from '../math/Triangle.js';
import { Entity, EntityParameters } from '../core/Entity.js';
import { Geometry } from '../core/Geometry.js';
import { Buffer } from '../core/Buffer.js';
import { SpriteMaterial } from './materials/SpriteMaterial.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { PerspectiveCamera } from './cameras/PerspectiveCamera.js';
import { Attribute } from '../core/Attribute.js';
import { lazy } from '../math/types.js';

export class Sprite extends Entity {
  declare isSprite: true;
  center: Vec2;
  geometry: Geometry;

  constructor(
    public material: SpriteMaterial,
    parameters?: SpriteParameters,
  ) {
    super(parameters);

    this.geometry = geometry();
    this.center = parameters?.center ?? Vec2.new(0.5, 0.5);
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    _worldScale.fromMat4Scale(this.matrixWorld);

    _viewWorldMatrix.from(raycaster.camera.matrixWorld);
    this.modelViewMatrix.asMul(raycaster.camera.matrixWorldInverse, this.matrixWorld);

    _mv.fromMat4Position(this.modelViewMatrix);

    if (raycaster.camera instanceof PerspectiveCamera && this.material.sizeAttenuation === false) {
      _worldScale.scale(-_mv.z);
    }

    const rotation = this.material.rotation;
    let sin: number | undefined;
    let cos: number | undefined;

    if (rotation !== 0) {
      cos = Math.cos(rotation);
      sin = Math.sin(rotation);
    }

    const center = this.center;

    transformVertex(_v0.set(-0.5, -0.5, 0), _mv, center, _worldScale, sin, cos);
    transformVertex(_v1.set(0.5, -0.5, 0), _mv, center, _worldScale, sin, cos);
    transformVertex(_v2.set(0.5, 0.5, 0), _mv, center, _worldScale, sin, cos);

    _uv0.set(0, 0);
    _uv1.set(1, 0);
    _uv2.set(1, 1);

    _triangle.set(_v0, _v1, _v2);
    let intersect = raycaster.ray.intersectTriangle(_triangle, false, _intersect);

    if (intersect === null) {
      transformVertex(_v1.set(-0.5, 0.5, 0), _mv, center, _worldScale, sin, cos);
      _uv1.set(0, 1);

      _triangle.set(_v0, _v2, _v1);
      intersect = raycaster.ray.intersectTriangle(_triangle, false, _intersect);
      if (intersect === null) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(_intersect);

    if (distance < raycaster.near || distance > raycaster.far) return;

    _triangle1.set(_v0, _v1, _v2);
    _triangle2.set(_uv0, _uv1, _uv2);

    const { x, y } = Triangle.interpolate(_triangle1, _triangle2, _intersect);
    intersects.push({
      distance: distance,
      point: _intersect.clone(),
      uv: Vec2.new(x, y),
      face: null,
      object: this,
    });
  }
}

export interface SpriteParameters extends EntityParameters {
  center?: Vec2;
}

const _intersect = Vec3.new();
const _worldScale = Vec3.new();

const _mv = Vec3.new();
const _alignment = Vec2.new();
const _rotation = Vec2.new();

const _viewWorldMatrix = new Mat4();
const _v0 = Vec3.new();
const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _uv0 = Vec2.new();
const _uv1 = Vec2.new();
const _uv2 = Vec2.new();

const geometry = lazy(() => {
  const geometry = new Geometry();

  const buffer = Buffer.f32([-0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1], 5);
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('position', Attribute.use(buffer, 3, 0));
  geometry.setAttribute('uv', Attribute.use(buffer, 2, 3));

  return geometry;
});
Sprite.prototype.isSprite = true;

const _triangle = new Triangle();
const _triangle1 = new Triangle();
const _triangle2 = new Triangle();

function transformVertex(vertex: Vec3, mv: Vec3, center: Vec2, scale: Vec3, sin?: number, cos?: number) {
  _alignment.asSub(vertex, center).addScalar(0.5).mul(scale);

  if (sin !== undefined && cos !== undefined) {
    _rotation.x = cos * _alignment.x - sin * _alignment.y;
    _rotation.y = sin * _alignment.x + cos * _alignment.y;
  } else {
    _rotation.from(_alignment);
  }

  vertex.from(mv);
  vertex.x += _rotation.x;
  vertex.y += _rotation.y;

  vertex.applyMat4(_viewWorldMatrix);
}
