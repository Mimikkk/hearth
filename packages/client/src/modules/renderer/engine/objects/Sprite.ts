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
import { Uint16BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { lazy } from '@modules/renderer/engine/math/types.js';

export class Sprite extends Object3D {
  declare isSprite: true;
  declare type: string | 'Sprite';
  declare attributes: {
    position: InterleavedBufferAttribute;
    uv: InterleavedBufferAttribute;
  };

  center: Vec2;
  geometry: BufferGeometry;
  material: SpriteMaterial;

  constructor(material: SpriteMaterial = new SpriteMaterial()) {
    super();
    this.material = material;
    this.geometry = geometry();
    this.center = Vec2.new(0.5, 0.5);
  }

  static is(object: any): object is Sprite {
    return object?.isSprite === true;
  }

  raycast(raycaster: Raycaster, into: Intersection[] = []): void {
    _worldScale.fromMat4Scale(this.matrixWorld);

    _viewWorldMatrix.from(raycaster.camera.matrixWorld);
    this.modelViewMatrix.from(raycaster.camera.matrixWorldInverse).mul(this.matrixWorld);

    _mv.fromMat4Position(this.modelViewMatrix);

    if (raycaster.camera instanceof PerspectiveCamera && !this.material.sizeAttenuation) {
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
    _vA.set(-0.5, -0.5, 0);
    _vB.set(0.5, -0.5, 0);
    _vC.set(0.5, 0.5, 0);

    _center.from(center);
    transformVertex(_vA, _mv, _center, _worldScale, sin, cos);
    transformVertex(_vB, _mv, _center, _worldScale, sin, cos);
    transformVertex(_vC, _mv, _center, _worldScale, sin, cos);
    _center.fill(center);

    _uvA.set(0, 0);
    _uvB.set(1, 0);
    _uvC.set(1, 1);
    _triangle1.set(_vA, _vB, _vC);

    let intersect = raycaster.ray.intersectTriangle(_triangle1, false, _intersect);

    if (intersect === null) {
      _vA.set(-0.5, 0.5, 0);
      transformVertex(_vB, _mv, _center, _worldScale, sin, cos);
      _center.fill(center);

      _uvB.set(0, 1);

      _triangle2.set(_vA, _vC, _vB);
      intersect = raycaster.ray.intersectTriangle(_triangle2, false, _intersect);
      if (intersect === null) return;
    }

    const distance = raycaster.ray.origin.distanceTo(_intersect);

    if (distance < raycaster.near || distance > raycaster.far) return;

    _triangle2.set(_vA, _vC, _vB);
    const uv = Triangle.interpolate(_triangle1, _triangle2, _intersect)!;

    into.push({
      distance: distance,
      point: _intersect.clone(),
      uv: Vec2.new(uv.x, uv.y),
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

function transformVertex(align: Vec3, mv: Vec3, center: Vec2, scale: Vec3, sin?: number, cos?: number) {
  _scale.set(scale.x, scale.y);
  _align.set(align.x, align.y).sub(center).scale(0.5).mul(_scale);

  if (sin !== undefined && cos !== undefined) {
    align.set(mv.x + (cos * _align.x - sin * _align.y), mv.y + (sin * _align.x + cos * _align.y), mv.z);
  } else {
    align.set(mv.x + _align.x, mv.y + _align.y, mv.z);
  }

  align.applyMat4(_viewWorldMatrix);
}

const geometry = lazy(() => {
  const geometry = new BufferGeometry();

  const interleavedBuffer = new InterleavedBuffer(
    new Float32Array([-0.5, -0.5, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0.5, 0.5, 0, 1, 1, -0.5, 0.5, 0, 0, 1]),
    5,
  );

  geometry.index = new Uint16BufferAttribute([0, 1, 2, 0, 2, 3], 1);
  geometry.attributes.position = new InterleavedBufferAttribute(interleavedBuffer, 3, 0, false);
  geometry.attributes.uv = new InterleavedBufferAttribute(interleavedBuffer, 2, 3, false);

  return geometry;
});

const _intersect = Vec3.new();
const _worldScale = Vec3.new();
const _mv = Vec3.new();
const _align = Vec2.new();
const _viewWorldMatrix = new Mat4();
const _vA = Vec3.new();
const _vB = Vec3.new();
const _vC = Vec3.new();
const _uvA = Vec2.new();
const _uvB = Vec2.new();
const _uvC = Vec2.new();
const _triangle1 = Triangle.empty();
const _triangle2 = Triangle.empty();
const _center = Vec2.new();
const _scale = Vec2.new();
