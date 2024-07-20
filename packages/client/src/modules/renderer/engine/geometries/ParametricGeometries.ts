import { Curve, Vec3 } from '../engine.js';

import { ParametricGeometry } from './ParametricGeometry.js';

/**
 * Experimenting of primitive geometry creation using Surface Parametric equations
 */

class TubeGeometry extends ParametricGeometry {
  tangents: Vec3[];
  normals: Vec3[];
  binormals: Vec3[];
  path: Curve<Vec3>;
  segments: number;
  radius: number;
  segmentsRadius: number;
  closed: boolean;

  constructor(
    path: Curve<Vec3>,
    segments: number = 64,
    radius: number = 1,
    segmentsRadius: number = 8,
    closed: boolean = false,
  ) {
    const numpoints = segments + 1;

    const frames = path.computeFrenetFrames(segments, closed),
      tangents = frames.tangents,
      normals = frames.normals,
      binormals = frames.binormals;

    const position = new Vec3();

    function ParametricTube(u: number, v: number, target: Vec3) {
      v *= 2 * Math.PI;

      const i = Math.floor(u * (numpoints - 1));

      path.getPointAt(u, position);

      const normal = normals[i];
      const binormal = binormals[i];

      const cx = -radius * Math.cos(v); // TODO: Hack: Negating it so it faces outside.
      const cy = radius * Math.sin(v);

      position.x += cx * normal.x + cy * binormal.x;
      position.y += cx * normal.y + cy * binormal.y;
      position.z += cx * normal.z + cy * binormal.z;

      target.from(position);
    }

    super(ParametricTube, segments, segmentsRadius);

    // proxy internals

    this.tangents = tangents;
    this.normals = normals;
    this.binormals = binormals;

    this.path = path;
    this.segments = segments;
    this.radius = radius;
    this.segmentsRadius = segmentsRadius;
    this.closed = closed;
  }
}

class SphereGeometry extends ParametricGeometry {
  constructor(size: number, u: number, v: number) {
    function sphere(u: number, v: number, target: Vec3) {
      u *= Math.PI;
      v *= 2 * Math.PI;

      const x = size * Math.sin(u) * Math.cos(v);
      const y = size * Math.sin(u) * Math.sin(v);
      const z = size * Math.cos(u);

      target.set(x, y, z);
    }

    super(sphere, u, v);
  }
}

class PlaneGeometry extends ParametricGeometry {
  constructor(width: number, depth: number, segmentsWidth: number, segmentsDepth: number) {
    function plane(u: number, v: number, target: Vec3) {
      const x = u * width;
      const y = 0;
      const z = v * depth;

      target.set(x, y, z);
    }

    super(plane, segmentsWidth, segmentsDepth);
  }
}

class TorusKnotGeometry extends TubeGeometry {
  tube: number;
  segmentsT: number;
  segmentsR: number;
  p: number;
  q: number;

  constructor(
    radius: number = 200,
    tube: number = 40,
    segmentsT: number = 64,
    segmentsR: number = 8,
    p: number = 2,
    q: number = 3,
  ) {
    class TorusKnotCurve extends Curve<Vec3> {
      getPoint(t: number, optionalTarget: Vec3 = new Vec3()) {
        const point = optionalTarget;

        t *= Math.PI * 2;

        const r = 0.5;

        const x = (1 + r * Math.cos(q * t)) * Math.cos(p * t);
        const y = (1 + r * Math.cos(q * t)) * Math.sin(p * t);
        const z = r * Math.sin(q * t);

        return point.set(x, y, z).scale(radius);
      }
    }

    const segments = segmentsT;
    const radiusSegments = segmentsR;
    const extrudePath = new TorusKnotCurve();

    super(extrudePath, segments, tube, radiusSegments, true);

    this.radius = radius;
    this.tube = tube;
    this.segmentsT = segmentsT;
    this.segmentsR = segmentsR;
    this.p = p;
    this.q = q;
  }
}

export const ParametricGeometries = {
  klein: function (v: number, u: number, target: Vec3) {
    u *= Math.PI;
    v *= 2 * Math.PI;

    u = u * 2;
    let x, z;
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v);
      z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + 2 * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI);
      z = -8 * Math.sin(u);
    }

    const y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

    target.set(x, y, z);
  },

  plane: function (width: number, height: number) {
    return function (u: number, v: number, target: Vec3) {
      const x = u * width;
      const y = 0;
      const z = v * height;

      target.set(x, y, z);
    };
  },

  mobius: function (u: number, t: number, target: Vec3) {
    // flat mobius strip
    // http://www.wolframalpha.com/input/?i=M%C3%B6bius+strip+parametric+equations&lk=1&a=ClashPrefs_*Surface.MoebiusStrip.SurfaceProperty.ParametricEquations-
    u = u - 0.5;
    const v = 2 * Math.PI * t;

    const a = 2;

    const x = Math.cos(v) * (a + u * Math.cos(v / 2));
    const y = Math.sin(v) * (a + u * Math.cos(v / 2));
    const z = u * Math.sin(v / 2);

    target.set(x, y, z);
  },

  mobius3d: function (u: number, t: number, target: Vec3) {
    // volumetric mobius strip

    u *= Math.PI;
    t *= 2 * Math.PI;

    u = u * 2;
    const phi = u / 2;
    const major = 2.25,
      a = 0.125,
      b = 0.65;

    let x = a * Math.cos(t) * Math.cos(phi) - b * Math.sin(t) * Math.sin(phi);
    const z = a * Math.cos(t) * Math.sin(phi) + b * Math.sin(t) * Math.cos(phi);
    const y = (major + x) * Math.sin(u);
    x = (major + x) * Math.cos(u);

    target.set(x, y, z);
  },

  TubeGeometry,
  SphereGeometry,
  PlaneGeometry,
  TorusKnotGeometry,
};
