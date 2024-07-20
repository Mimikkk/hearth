import { Camera, Mat4, MathUtils, Mesh, PerspectiveCamera, Ray, Raycaster, Vec4 } from '../engine.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';
import { LineMaterial } from './LineMaterial.js';
import { Intersection } from '@modules/renderer/engine/core/Raycaster.js';
import { Line3 } from '@modules/renderer/engine/math/Line3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Random } from '../math/random.ts';

export class LineSegments2 extends Mesh {
  declare geometry: LineSegmentsGeometry;
  declare material: LineMaterial;

  constructor(
    geometry: LineSegmentsGeometry = new LineSegmentsGeometry(),
    material: LineMaterial = new LineMaterial({ color: Random.color() }),
  ) {
    super(geometry, material);
  }

  raycast(raycaster: Raycaster, into: Intersection[]): Intersection[] {
    const worldUnits = this.material.worldUnits;
    const camera = raycaster.camera as PerspectiveCamera;

    if (camera === null && !worldUnits) {
      console.error(
        'LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.',
      );
    }

    const threshold = raycaster.params.Line2?.threshold ?? 0;

    _ray = raycaster.ray;

    const matrixWorld = this.matrixWorld;
    const geometry = this.geometry;
    const material = this.material as LineMaterial;

    _lineWidth = material.linewidth + threshold;

    // check if we intersect the sphere bounds
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }

    _sphere.from(geometry.boundingSphere!).applyMat4(matrixWorld);

    // increase the sphere bounds by the worst case line screen space width
    let sphereMargin;
    if (worldUnits) {
      sphereMargin = _lineWidth * 0.5;
    } else {
      const distanceToSphere = Math.max(camera.near, _sphere.distanceTo(_ray.origin));
      sphereMargin = getWorldSpaceHalfWidth(camera, distanceToSphere, material.resolution);
    }

    _sphere.radius += sphereMargin;

    if (!_ray.intersectsSphere(_sphere)) return into;

    // check if we intersect the box bounds
    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    _box.from(geometry.boundingBox!).applyMat4(matrixWorld);

    // increase the box bounds by the worst case line width
    let boxMargin;
    if (worldUnits) {
      boxMargin = _lineWidth * 0.5;
    } else {
      const distanceToBox = Math.max(camera.near, _box.distanceTo(_ray.origin));
      boxMargin = getWorldSpaceHalfWidth(camera, distanceToBox, material.resolution);
    }

    _box.expandScalar(boxMargin);

    if (!_ray.intersectsBox(_box)) {
      return into;
    }

    if (worldUnits) {
      raycastWorldUnits(this, into);
    } else {
      raycastScreenSpace(this, camera, into);
    }

    return into;
  }
}

const _start4 = new Vec4();
const _end4 = new Vec4();

const _ssOrigin = new Vec4();
const _ssOrigin3 = Vec3.new();
const _mvMatrix = new Mat4();
const _line = Line3.new();
const _closestPoint = Vec3.new();

const _box = Box3.new();
const _sphere = Sphere.new();
const _clipToWorldVector = new Vec4();

let _ray: Ray, _lineWidth: number;

// Returns the margin required to expand by in world space given the distance from the camera,
// line width, resolution, and camera projection
function getWorldSpaceHalfWidth(camera: Camera, distance: number, resolution: { x: number; y: number }): number {
  // transform into clip space, adjust the x and y values by the pixel width offset, then
  // transform back into world space to get world offset. Note clip space is [-1, 1] so full
  // width does not need to be halved.
  _clipToWorldVector.set(0, 0, -distance, 1.0).applyMat4(camera.projectionMatrix);
  _clipToWorldVector.scale(1.0 / _clipToWorldVector.w);
  _clipToWorldVector.x = _lineWidth / resolution.x;
  _clipToWorldVector.y = _lineWidth / resolution.y;
  _clipToWorldVector.applyMat4(camera.projectionMatrixInverse);
  _clipToWorldVector.scale(1.0 / _clipToWorldVector.w);

  return Math.abs(Math.max(_clipToWorldVector.x, _clipToWorldVector.y));
}

function raycastWorldUnits(lineSegments: LineSegments2, intersects: Intersection[]): void {
  const matrixWorld = lineSegments.matrixWorld;
  const geometry = lineSegments.geometry;
  const instanceStart = geometry.attributes.instanceStart;
  const instanceEnd = geometry.attributes.instanceEnd;
  const segmentCount = Math.min(geometry.instanceCount, instanceStart.count);

  for (let i = 0, l = segmentCount; i < l; i++) {
    _line.start.fromAttribute(instanceStart, i);
    _line.end.fromAttribute(instanceEnd, i);
    _line.applyMat4(matrixWorld);

    const pointOnLine = Vec3.new();
    const point = Vec3.new();

    _ray.distanceSqToLine(_line, point, pointOnLine);
    const isInside = point.distanceTo(pointOnLine) < _lineWidth * 0.5;

    if (isInside) {
      intersects.push({
        point,
        pointOnLine,
        distance: _ray.origin.distanceTo(point),
        object: lineSegments,
        face: null,
        faceIndex: i,
      });
    }
  }
}

function raycastScreenSpace(lineSegments: LineSegments2, camera: Camera, intersects: Intersection[]): void {
  const projectionMatrix = camera.projectionMatrix;
  const material = lineSegments.material;
  const resolution = material.resolution;
  const matrixWorld = lineSegments.matrixWorld;

  const geometry = lineSegments.geometry;
  const instanceStart = geometry.attributes.instanceStart;
  const instanceEnd = geometry.attributes.instanceEnd;
  const segmentCount = Math.min(geometry.instanceCount, instanceStart.count);

  const near = -camera.near;

  //

  // pick a point 1 unit out along the ray to avoid the ray origin
  // sitting at the camera origin which will cause "w" to be 0 when
  // applying the projection matrix.
  _ray.at(1, _ssOrigin3);

  _ssOrigin.set(_ssOrigin3.x, _ssOrigin3.y, _ssOrigin3.z, 1);

  _ssOrigin.applyMat4(camera.matrixWorldInverse);
  _ssOrigin.applyMat4(projectionMatrix);
  _ssOrigin.scale(1 / _ssOrigin.w);

  // screen space
  _ssOrigin.x *= resolution.x / 2;
  _ssOrigin.y *= resolution.y / 2;

  _ssOrigin3.set(_ssOrigin.x, _ssOrigin.y, 0);

  _mvMatrix.multiplyMatrices(camera.matrixWorldInverse, matrixWorld);

  for (let i = 0, l = segmentCount; i < l; i++) {
    _start4.fromAttribute(instanceStart, i);
    _end4.fromAttribute(instanceEnd, i);

    _start4.w = 1;
    _end4.w = 1;

    // camera space
    _start4.applyMat4(_mvMatrix);
    _end4.applyMat4(_mvMatrix);

    // skip the segment if it's entirely behind the camera
    const isBehindCameraNear = _start4.z > near && _end4.z > near;
    if (isBehindCameraNear) {
      continue;
    }

    // trim the segment if it extends behind camera near
    if (_start4.z > near) {
      const deltaDist = _start4.z - _end4.z;
      const t = (_start4.z - near) / deltaDist;
      _start4.lerp(_start4, _end4, t);
    } else if (_end4.z > near) {
      const deltaDist = _end4.z - _start4.z;
      const t = (_end4.z - near) / deltaDist;
      _end4.lerp(_end4, _start4, t);
    }

    // clip space
    _start4.applyMat4(projectionMatrix);
    _end4.applyMat4(projectionMatrix);

    // ndc space [ - 1.0, 1.0 ]
    _start4.scale(1 / _start4.w);
    _end4.scale(1 / _end4.w);

    // screen space
    _start4.x *= resolution.x / 2;
    _start4.y *= resolution.y / 2;

    _end4.x *= resolution.x / 2;
    _end4.y *= resolution.y / 2;

    // create 2d segment
    _line.start.set(_start4.x, _start4.y, 0);
    _line.end.set(_end4.x, _end4.y, 0);

    // get closest point on ray to segment
    const param = _line.closestAt(_ssOrigin3);
    _line.at(param, _closestPoint);

    // check if the intersection point is within clip space
    const zPos = MathUtils.lerp(_start4.z, _end4.z, param);
    const isInClipSpace = zPos >= -1 && zPos <= 1;

    const isInside = _ssOrigin3.distanceTo(_closestPoint) < _lineWidth * 0.5;

    if (isInClipSpace && isInside) {
      _line.start.fromAttribute(instanceStart, i);
      _line.end.fromAttribute(instanceEnd, i);
      _line.applyMat4(matrixWorld);

      const pointOnLine = Vec3.new();
      const point = Vec3.new();

      _ray.distanceSqToLine(_line, point, pointOnLine);

      intersects.push({
        point: point,
        pointOnLine: pointOnLine,
        distance: _ray.origin.distanceTo(point),
        object: lineSegments,
        face: null,
        faceIndex: i,
      });
    }
  }
}
