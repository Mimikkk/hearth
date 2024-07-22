import * as MathUtils from '../../math/MathUtils.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec3 } from '../../math/Vec3.js';
import { Mat4 } from '../../math/Mat4.js';

export abstract class Curve<T extends Vec2 | Vec3> {
  declare type: 'Curve';
  arcLengthDivisions: number;
  needsUpdate: boolean;

  constructor() {
    this.type = 'Curve';
    this.arcLengthDivisions = 200;
  }

  abstract getPoint(t: number, into?: T): T;

  getPointAt(u: number, into?: T): T {
    const t = this.getUtoTmapping(u);
    return this.getPoint(t, into);
  }

  getPoints(divisions: number = 5): T[] {
    const points = [];

    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPoint(d / divisions));
    }

    return points;
  }

  getSpacedPoints(divisions: number = 5): T[] {
    const points = [];

    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPointAt(d / divisions));
    }

    return points;
  }

  getLength(): number {
    const lengths = this.getLengths();
    return lengths[lengths.length - 1];
  }

  getLengths(divisions: number = this.arcLengthDivisions): number[] {
    const lengths = [0];
    let current: T;
    let last = this.getPoint(0);

    let sum = 0;
    for (let p = 1; p <= divisions; p++) {
      current = this.getPoint(p / divisions);
      sum += current.distanceTo(last);
      lengths.push(sum);
      last = current;
    }

    return lengths;
  }

  getUtoTmapping(u: number, distance?: number): number {
    const arcLengths = this.getLengths();

    let i = 0;
    const il = arcLengths.length;

    let targetArcLength; // The targeted u distance value to get

    if (distance) {
      targetArcLength = distance;
    } else {
      targetArcLength = u * arcLengths[il - 1];
    }

    // binary search for the index with largest value smaller than target u distance

    let low = 0,
      high = il - 1,
      comparison;

    while (low <= high) {
      i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

      comparison = arcLengths[i] - targetArcLength;

      if (comparison < 0) {
        low = i + 1;
      } else if (comparison > 0) {
        high = i - 1;
      } else {
        high = i;
        break;

        // DONE
      }
    }

    i = high;

    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1);
    }

    // we could get finer grain at lengths, or use simple interpolation between two points

    const lengthBefore = arcLengths[i];
    const lengthAfter = arcLengths[i + 1];

    const segmentLength = lengthAfter - lengthBefore;

    // determine where we are between the 'before' and 'after' points

    const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

    // add that fractional amount to t

    const t = (i + segmentFraction) / (il - 1);

    return t;
  }

  getTangent(t: number, into?: T): T {
    const delta = 0.0001;
    let t1 = t - delta;
    let t2 = t + delta;

    if (t1 < 0) t1 = 0;
    if (t2 > 1) t2 = 1;

    const pt1 = this.getPoint(t1);
    const pt2 = this.getPoint(t2);

    into ??= Vec2.is(pt1) ? Vec2.new() : Vec3.new();

    return into.asSub(pt2, pt1).normalize();
  }

  getTangentAt(u: number, into?: T): T {
    const t = this.getUtoTmapping(u);
    return this.getTangent(t, into);
  }

  computeFrenetFrames(
    segments: number,
    closed?: number,
  ): {
    tangents: Vec3[];
    normals: Vec3[];
    binormals: Vec3[];
  } {
    const normal = new Vec3();

    const tangents: Vec3[] = [];
    const normals: Vec3[] = [];
    const binormals: Vec3[] = [];

    const vec = new Vec3();
    const mat = new Mat4();

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      tangents[i] = this.getTangentAt(u) as never as Vec3;
    }

    normals[0] = new Vec3();
    binormals[0] = new Vec3();
    const tx = Math.abs(tangents[0].x);
    const ty = Math.abs(tangents[0].y);
    const tz = Math.abs(tangents[0].z);

    let min = Number.MAX_VALUE;
    if (tx <= min) {
      min = tx;
      normal.set(1, 0, 0);
    }

    if (ty <= min) {
      min = ty;
      normal.set(0, 1, 0);
    }

    if (tz <= min) {
      normal.set(0, 0, 1);
    }

    vec.asCross(tangents[0], normal).normalize();

    normals[0].asCross(tangents[0], vec);
    binormals[0].asCross(tangents[0], normals[0]);

    for (let i = 1; i <= segments; i++) {
      normals[i] = normals[i - 1].clone();

      binormals[i] = binormals[i - 1].clone();

      vec.asCross(tangents[i - 1], tangents[i]);

      if (vec.length() > Number.EPSILON) {
        vec.normalize();

        const theta = Math.acos(MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));

        normals[i].applyMat4(mat.asRotationAxis(vec, theta));
      }

      binormals[i].asCross(tangents[i], normals[i]);
    }

    if (closed) {
      let theta = Math.acos(MathUtils.clamp(normals[0].dot(normals[segments]), -1, 1));
      theta /= segments;

      if (tangents[0].dot(vec.asCross(normals[0], normals[segments])) > 0) {
        theta = -theta;
      }

      for (let i = 1; i <= segments; i++) {
        normals[i].applyMat4(mat.asRotationAxis(tangents[i], theta * i));
        binormals[i].asCross(tangents[i], normals[i]);
      }
    }

    return { tangents, normals, binormals };
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(source: this): this {
    this.arcLengthDivisions = source.arcLengthDivisions;

    return this;
  }
}

Curve.prototype.type = 'Curve';
