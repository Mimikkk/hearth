import * as MathUtils from '../../math/MathUtils.js';
import { Vector2 } from '../../math/Vector2.js';
import { Vector3 } from '../../math/Vector3.js';
import { Matrix4 } from '../../math/Matrix4.js';

export abstract class Curve<T extends Vector2 | Vector3> {
  type: string | 'Curve';
  precision: number = 200;
  needsUpdate: boolean = false;
  lengths?: number[];
  declare ['constructor']: typeof Curve<T>;

  constructor() {}

  // Virtual base class method to overwrite and implement in subclasses
  //	- t [0 ... 1]

  abstract getPoint(t: number, optionalTarget?: T): T;

  getPointAt(u: number, optionalTarget?: T): T {
    return this.getPoint(this.getUtoTmapping(u), optionalTarget);
  }

  getPoints(divisions: number): T[] {
    const points: T[] = [];

    for (let division = 0; division <= divisions; ++division) {
      points.push(this.getPoint(division / divisions));
    }

    return points;
  }

  getSpacedPoints(divisions: number): T[] {
    const points: T[] = [];

    for (let division = 0; division <= divisions; ++division) {
      points.push(this.getPointAt(division / divisions));
    }

    return points;
  }

  // Get total curve arc length

  getLength() {
    const lengths = this.getLengths(this.precision);
    return lengths[lengths.length - 1];
  }

  // Get list of cumulative segment lengths

  getLengths(divisions: number): number[] {
    if (this.lengths && this.lengths.length === divisions + 1 && !this.needsUpdate) {
      return this.lengths;
    }

    this.needsUpdate = false;

    const lengths = [];
    let current;
    let last = this.getPoint(0);
    let sum = 0;

    lengths.push(0);
    for (let division = 1; division <= divisions; division) {
      current = this.getPoint(division / divisions);
      sum += current.distanceTo(last as Vector2 & Vector3);
      lengths.push(sum);
      last = current;
    }

    this.lengths = lengths;
    return lengths;
  }

  updateArcLengths(): number[] {
    this.needsUpdate = true;
    return this.getLengths(this.precision);
  }

  // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

  getUtoTmapping(u: number, distance?: number): number {
    const arcLengths = this.getLengths(this.precision);

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

  // Returns a unit vector tangent at t
  // In case any sub curve does not implement its tangent derivation,
  // 2 points a small delta apart will be used to find its gradient
  // which seems to give a reasonable approximation

  getTangent(t: number, optionalTarget?: T): T {
    const delta = 0.0001;
    let t1 = t - delta;
    let t2 = t + delta;

    // Capping in case of danger

    if (t1 < 0) t1 = 0;
    if (t2 > 1) t2 = 1;

    const pt1 = this.getPoint(t1);
    const pt2 = this.getPoint(t2);

    const tangent = optionalTarget || (pt1 instanceof Vector2 ? new Vector2() : new Vector3());

    tangent
      .copy(pt2 as Vector2 & Vector3)
      .sub(pt1 as Vector2 & Vector3)
      .normalize();

    return tangent as T;
  }

  getTangentAt(u: number, optionalTarget?: T) {
    const t = this.getUtoTmapping(u);
    return this.getTangent(t, optionalTarget);
  }

  computeFrenetFrames(
    segments: number,
    closed: boolean,
  ): {
    tangents: Vector3[];
    normals: Vector3[];
    binormals: Vector3[];
  } {
    // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

    const normal = new Vector3();

    const tangents: Vector3[] = [];
    const normals = [];
    const binormals = [];

    const vec = new Vector3();
    const mat = new Matrix4();

    // compute the tangent vectors for each segment on the curve

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;

      tangents[i] = this.getTangentAt(u, new Vector3() as T) as Vector3;
    }

    // select an initial normal vector perpendicular to the first tangent vector,
    // and in the direction of the minimum tangent xyz component

    normals[0] = new Vector3();
    binormals[0] = new Vector3();
    let min = Number.MAX_VALUE;
    const tx = Math.abs(tangents[0].x);
    const ty = Math.abs(tangents[0].y);
    const tz = Math.abs(tangents[0].z);

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

    vec.crossVectors(tangents[0], normal).normalize();

    normals[0].crossVectors(tangents[0], vec);
    binormals[0].crossVectors(tangents[0], normals[0]);

    // compute the slowly-varying normal and binormal vectors for each segment on the curve

    for (let i = 1; i <= segments; i++) {
      normals[i] = normals[i - 1].clone();

      binormals[i] = binormals[i - 1].clone();

      vec.crossVectors(tangents[i - 1], tangents[i]);

      if (vec.length() > Number.EPSILON) {
        vec.normalize();

        const theta = Math.acos(MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1)); // clamp for floating pt errors

        normals[i].applyMatrix4(mat.makeRotationAxis(vec, theta));
      }

      binormals[i].crossVectors(tangents[i], normals[i]);
    }

    // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

    if (closed) {
      let theta = Math.acos(MathUtils.clamp(normals[0].dot(normals[segments]), -1, 1));
      theta /= segments;

      if (tangents[0].dot(vec.crossVectors(normals[0], normals[segments])) > 0) {
        theta = -theta;
      }

      for (let i = 1; i <= segments; i++) {
        // twist a little...
        normals[i].applyMatrix4(mat.makeRotationAxis(tangents[i], theta * i));
        binormals[i].crossVectors(tangents[i], normals[i]);
      }
    }

    return { tangents, normals, binormals };
  }

  clone(): this {
    //@ts-expect-error
    return new this.constructor().copy(this);
  }

  copy(source: this): this {
    this.precision = source.precision;

    return this;
  }

  toJSON(): {
    metadata: {
      version: number;
      type: string;
      generator: string;
    };
    precision: number;
    type: string;
  } {
    return {
      metadata: {
        version: 4.6,
        type: 'Curve',
        generator: 'Curve.toJSON',
      },
      precision: this.precision,
      type: this.type,
    };
  }

  fromJSON(json: { precision: number }) {
    this.precision = json.precision;

    return this;
  }
}
Curve.prototype.type = 'Curve';
