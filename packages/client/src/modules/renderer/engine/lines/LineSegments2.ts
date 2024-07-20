import {
  Camera,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  Ray,
  Raycaster,
  Vector3,
  Vector4,
} from '../engine.js';
import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';
import { LineMaterial } from './LineMaterial.js';
import { Intersection } from '@modules/renderer/engine/core/Raycaster.js';
import { Line3 } from '@modules/renderer/engine/math/Line3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { Sphere_ } from '@modules/renderer/engine/math/Sphere.js';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';

const _start = new Vector3();
const _end = new Vector3();

const _start4 = new Vector4();
const _end4 = new Vector4();

const _ssOrigin = new Vector4();
const _ssOrigin3 = new Vector3();
const _mvMatrix = new Matrix4();
const _line = Line3.empty();
const _closestPoint = new Vector3();

const _box = Box3_.empty();
const _sphere = Sphere_.empty();
const _clipToWorldVector = new Vector4();

let _ray: Ray, _lineWidth: number;

// Returns the margin required to expand by in world space given the distance from the camera,
// line width, resolution, and camera projection
function getWorldSpaceHalfWidth(
  camera: Camera,
  distance: number,
  resolution: { width: number; height: number },
): number {
  // transform into clip space, adjust the x and y values by the pixel width offset, then
  // transform back into world space to get world offset. Note clip space is [-1, 1] so full
  // width does not need to be halved.
  _clipToWorldVector.set(0, 0, -distance, 1.0).applyMatrix4(camera.projectionMatrix);
  _clipToWorldVector.multiplyScalar(1.0 / _clipToWorldVector.w);
  _clipToWorldVector.x = _lineWidth / resolution.width;
  _clipToWorldVector.y = _lineWidth / resolution.height;
  _clipToWorldVector.applyMatrix4(camera.projectionMatrixInverse);
  _clipToWorldVector.multiplyScalar(1.0 / _clipToWorldVector.w);

  return Math.abs(Math.max(_clipToWorldVector.x, _clipToWorldVector.y));
}

function raycastWorldUnits(lineSegments: LineSegments, intersects: Intersection[]): void {
  const matrixWorld = lineSegments.matrixWorld;
  const geometry = lineSegments.geometry;
  const instanceStart = geometry.attributes.instanceStart;
  const instanceEnd = geometry.attributes.instanceEnd;
  const segmentCount = Math.min(geometry.instanceCount, instanceStart.count);

  for (let i = 0, l = segmentCount; i < l; i++) {
    Vec3.fromAttribute_(instanceStart, i, _line.start);
    Vec3.fromAttribute_(instanceEnd, i, _line.end);
    Line3.applyMat4(_line, matrixWorld);

    const pointOnLine = new Vector3();
    const point = new Vector3();

    _ray.distanceSqToSegment(_line.start, _line.end, point, pointOnLine);
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

function raycastScreenSpace(lineSegments: LineSegments, camera: Camera, intersects: Intersection[]): void {
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
  _ray.at(1, _ssOrigin);

  // ndc space [ - 1.0, 1.0 ]
  _ssOrigin.w = 1;
  _ssOrigin.applyMatrix4(camera.matrixWorldInverse);
  _ssOrigin.applyMatrix4(projectionMatrix);
  _ssOrigin.multiplyScalar(1 / _ssOrigin.w);

  // screen space
  _ssOrigin.x *= resolution.x / 2;
  _ssOrigin.y *= resolution.y / 2;
  _ssOrigin.z = 0;

  _ssOrigin3.copy(_ssOrigin);

  _mvMatrix.multiplyMatrices(camera.matrixWorldInverse, matrixWorld);

  for (let i = 0, l = segmentCount; i < l; i++) {
    _start4.fromBufferAttribute(instanceStart, i);
    _end4.fromBufferAttribute(instanceEnd, i);

    _start4.w = 1;
    _end4.w = 1;

    // camera space
    _start4.applyMatrix4(_mvMatrix);
    _end4.applyMatrix4(_mvMatrix);

    // skip the segment if it's entirely behind the camera
    const isBehindCameraNear = _start4.z > near && _end4.z > near;
    if (isBehindCameraNear) {
      continue;
    }

    // trim the segment if it extends behind camera near
    if (_start4.z > near) {
      const deltaDist = _start4.z - _end4.z;
      const t = (_start4.z - near) / deltaDist;
      _start4.lerp(_end4, t);
    } else if (_end4.z > near) {
      const deltaDist = _end4.z - _start4.z;
      const t = (_end4.z - near) / deltaDist;
      _end4.lerp(_start4, t);
    }

    // clip space
    _start4.applyMatrix4(projectionMatrix);
    _end4.applyMatrix4(projectionMatrix);

    // ndc space [ - 1.0, 1.0 ]
    _start4.multiplyScalar(1 / _start4.w);
    _end4.multiplyScalar(1 / _end4.w);

    // screen space
    _start4.x *= resolution.x / 2;
    _start4.y *= resolution.y / 2;

    _end4.x *= resolution.x / 2;
    _end4.y *= resolution.y / 2;

    // create 2d segment
    Vec3.set(_line.start, _start4.x, _start4.y, 0);
    _line.start.z = 0;

    Vec3.set(_line.end, _end4.x, _end4.y, 0);

    // get closest point on ray to segment
    const param = Line3.closestAt(_line, _ssOrigin3);
    Line3.at_(_line, param, _closestPoint);

    // check if the intersection point is within clip space
    const zPos = MathUtils.lerp(_start4.z, _end4.z, param);
    const isInClipSpace = zPos >= -1 && zPos <= 1;

    const isInside = _ssOrigin3.distanceTo(_closestPoint) < _lineWidth * 0.5;

    if (isInClipSpace && isInside) {
      Vec3.fromAttribute_(instanceStart, i, _line.start);
      Vec3.fromAttribute_(instanceEnd, i, _line.end);
      Vec3.applyMat4(_line.start, matrixWorld);
      Vec3.applyMat4(_line.end, matrixWorld);

      const pointOnLine = new Vector3();
      const point = new Vector3();

      _ray.distanceSqToSegment(_line.start, _line.end, point, pointOnLine);

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

export class LineSegments2 extends Mesh {
  constructor(
    geometry: LineSegmentsGeometry = new LineSegmentsGeometry(),
    material: LineMaterial = new LineMaterial({ color: Math.random() * 0xffffff }),
  ) {
    super(geometry, material);
  }

  // for backwards-compatibility, but could be a method of LineSegmentsGeometry...

  computeLineDistances(): this {
    const geometry = this.geometry;

    const instanceStart = geometry.attributes.instanceStart;
    const instanceEnd = geometry.attributes.instanceEnd;
    const lineDistances = new Float32Array(2 * instanceStart.count);

    for (let i = 0, j = 0, l = instanceStart.count; i < l; i++, j += 2) {
      _start.fromBufferAttribute(instanceStart, i);
      _end.fromBufferAttribute(instanceEnd, i);

      lineDistances[j] = j === 0 ? 0 : lineDistances[j - 1];
      lineDistances[j + 1] = lineDistances[j] + _start.distanceTo(_end);
    }

    const instanceDistanceBuffer = new InstancedInterleavedBuffer(lineDistances, 2, 1); // d0, d1

    geometry.setAttribute('instanceDistanceStart', new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 0)); // d0
    geometry.setAttribute('instanceDistanceEnd', new InterleavedBufferAttribute(instanceDistanceBuffer, 1, 1)); // d1

    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): Intersection[] {
    const worldUnits = this.material.worldUnits;
    const camera = raycaster.camera;

    if (camera === null && !worldUnits) {
      console.error(
        'LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.',
      );
    }

    const threshold = raycaster.params.Line2?.threshold ?? 0;

    _ray = raycaster.ray;

    const matrixWorld = this.matrixWorld;
    const geometry = this.geometry;
    const material = this.material;

    _lineWidth = material.linewidth + threshold;

    // check if we intersect the sphere bounds
    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }

    Sphere_.fill_(_sphere, geometry.boundingSphere!);
    Sphere_.applyMat4(_sphere, matrixWorld);

    // increase the sphere bounds by the worst case line screen space width
    let sphereMargin;
    if (worldUnits) {
      sphereMargin = _lineWidth * 0.5;
    } else {
      const distanceToSphere = Math.max(camera.near, Sphere_.distanceToVec(_sphere, _ray.origin));
      sphereMargin = getWorldSpaceHalfWidth(camera, distanceToSphere, material.resolution);
    }

    _sphere.radius += sphereMargin;

    if (_ray.intersectsSphere(_sphere) === false) return intersects;

    // check if we intersect the box bounds
    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    Box3_.fill_(_box, geometry.boundingBox!);
    Box3_.applyMat4(_box, matrixWorld);

    // increase the box bounds by the worst case line width
    let boxMargin;
    if (worldUnits) {
      boxMargin = _lineWidth * 0.5;
    } else {
      const distanceToBox = Math.max(camera.near, Box3_.distanceTo(_box, _ray.origin));
      boxMargin = getWorldSpaceHalfWidth(camera, distanceToBox, material.resolution);
    }

    Box3_.expandScalar(_box, boxMargin);

    if (_ray.intersectsBox(_box) === false) {
      return intersects;
    }

    if (worldUnits) {
      raycastWorldUnits(this, intersects);
    } else {
      raycastScreenSpace(this, camera, intersects);
    }

    return intersects;
  }
}
