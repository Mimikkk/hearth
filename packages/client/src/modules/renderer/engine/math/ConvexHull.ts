import { Vec3 } from './Vec3.js';
import { Line3 } from './Line3.js';
import { Plane } from './Plane.js';
import { Triangle } from './Triangle.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Ray } from '@modules/renderer/engine/math/Ray.js';

const Visible = 0;
const Deleted = 1;

const _v1 = Vec3.new();
const _line3 = new Line3();
const _plane = new Plane();
const _closestPoint = Vec3.new();
const _triangle = new Triangle();

export class ConvexHull {
  tolerance: number;
  faces: Face[];
  newFaces: Face[];
  assigned: VertexList;
  unassigned: VertexList;
  vertices: VertexNode[];

  constructor() {
    this.tolerance = -1;

    this.faces = [];

    this.newFaces = [];


    //


    //




    //
    this.assigned = new VertexList();
    this.unassigned = new VertexList();


    this.vertices = [];
  }

  setFromPoints(points: Vec3[]): this {
    if (points.length >= 4) {
      this.makeEmpty();

      for (let i = 0, l = points.length; i < l; i++) {
        this.vertices.push(new VertexNode(points[i]));
      }

      this.compute();
    }

    return this;
  }

  setFromObject(object: Entity): this {
    const points: Vec3[] = [];

    object.updateMatrixWorld(true);

    object.traverse(node => {
      const geometry = node.geometry;

      if (!geometry) return;
      const attribute = geometry.attributes.position;

      if (!attribute) return;
      for (let i = 0, l = attribute.count; i < l; i++) {
        const point = Vec3.new();

        point.fromAttribute(attribute, i).applyMat4(node.matrixWorld);

        points.push(point);
      }
    });

    return this.setFromPoints(points);
  }

  containsPoint(point: Vec3): boolean {
    const faces = this.faces;

    for (let i = 0, l = faces.length; i < l; i++) {
      const face = faces[i];



      if (face.distanceToPoint(point) > this.tolerance) return false;
    }

    return true;
  }

  intersectRay(ray: Ray, target: Vec3): Vec3 | null {


    const faces = this.faces;

    let tNear = -Infinity;
    let tFar = Infinity;

    for (let i = 0, l = faces.length; i < l; i++) {
      const face = faces[i];



      const vN = face.distanceToPoint(ray.origin);
      const vD = face.normal.dot(ray.direction);




      if (vN > 0 && vD >= 0) return null;



      const t = vD !== 0 ? -vN / vD : 0;




      if (t <= 0) continue;



      if (vD > 0) {


        tFar = Math.min(t, tFar);
      } else {


        tNear = Math.max(t, tNear);
      }

      if (tNear > tFar) {


        return null;
      }
    }





    if (tNear !== -Infinity) {
      ray.at(tNear, target);
    } else {
      ray.at(tFar, target);
    }

    return target;
  }

  intersectsRay(ray: Ray): boolean {
    return this.intersectRay(ray, _v1) !== null;
  }

  makeEmpty(): this {
    this.faces = [];
    this.vertices = [];

    return this;
  }



  addVertexToFace(vertex: VertexNode, face: Face): this {
    vertex.face = face;

    if (face.outside === null) {
      this.assigned.append(vertex);
    } else {
      this.assigned.insertBefore(face.outside, vertex);
    }

    face.outside = vertex;

    return this;
  }



  removeVertexFromFace(vertex: VertexNode, face: Face): this {
    if (vertex === face.outside) {


      if (vertex.next !== null && vertex.next.face === face) {


        face.outside = vertex.next;
      } else {


        face.outside = null;
      }
    }

    this.assigned.remove(vertex);

    return this;
  }



  removeAllVerticesFromFace(face: Face): VertexNode | undefined {
    if (face.outside !== null) {


      const start = face.outside;
      let end = face.outside;

      while (end.next !== null && end.next.face === face) {
        end = end.next;
      }

      this.assigned.removeSubList(start, end);



      start.prev = end.next = null;
      face.outside = null;

      return start;
    }
  }



  deleteFaceVertices(face: Face, absorbingFace?: Face): this {
    const faceVertices = this.removeAllVerticesFromFace(face);

    if (faceVertices !== undefined) {
      if (absorbingFace === undefined) {


        this.unassigned.appendChain(faceVertices);
      } else {


        let vertex = faceVertices;

        do {



          const nextVertex = vertex.next;

          const distance = absorbingFace.distanceToPoint(vertex.point);



          if (distance > this.tolerance) {
            this.addVertexToFace(vertex, absorbingFace);
          } else {
            this.unassigned.append(vertex);
          }



          vertex = nextVertex!;
        } while (vertex !== null);
      }
    }

    return this;
  }



  resolveUnassignedPoints(newFaces: Face[]): this {
    if (this.unassigned.isEmpty() === false) {
      let vertex = this.unassigned.first()!;

      do {


        const nextVertex = vertex.next;

        let maxDistance = this.tolerance;

        let maxFace = null;

        for (let i = 0; i < newFaces.length; i++) {
          const face = newFaces[i];

          if (face.mark === Visible) {
            const distance = face.distanceToPoint(vertex.point);

            if (distance > maxDistance) {
              maxDistance = distance;
              maxFace = face;
            }

            if (maxDistance > 1000 * this.tolerance) break;
          }
        }



        if (maxFace !== null) {
          this.addVertexToFace(vertex, maxFace);
        }

        vertex = nextVertex!;
      } while (vertex !== null);
    }

    return this;
  }



  computeExtremes(): { min: VertexNode[]; max: VertexNode[] } {
    const min = Vec3.new();
    const max = Vec3.new();

    const minVertices = [];
    const maxVertices = [];



    for (let i = 0; i < 3; i++) {
      minVertices[i] = maxVertices[i] = this.vertices[0];
    }

    min.from(this.vertices[0].point);
    max.from(this.vertices[0].point);



    for (let i = 0, l = this.vertices.length; i < l; i++) {
      const vertex = this.vertices[i];
      const point = vertex.point;

      if (point.x < min.x) {
        min.x = point.x;
        minVertices[0] = vertex;
      }
      if (point.y < min.y) {
        min.y = point.y;
        minVertices[1] = vertex;
      }
      if (point.z < min.z) {
        min.z = point.z;
        minVertices[2] = vertex;
      }

      if (point.x > max.x) {
        max.x = point.x;
        maxVertices[0] = vertex;
      }
      if (point.y > max.y) {
        max.y = point.y;
        maxVertices[1] = vertex;
      }
      if (point.z > max.z) {
        max.z = point.z;
        maxVertices[2] = vertex;
      }
    }



    this.tolerance =
      3 *
      Number.EPSILON *
      (Math.max(Math.abs(min.x), Math.abs(max.x)) +
        Math.max(Math.abs(min.y), Math.abs(max.y)) +
        Math.max(Math.abs(min.z), Math.abs(max.z)));

    return { min: minVertices, max: maxVertices };
  }




  computeInitialHull(): this {
    const vertices = this.vertices;
    const extremes = this.computeExtremes();
    const min = extremes.min;
    const max = extremes.max;






    let maxDistance = 0;

    let index = 0;
    const distanceX = max[0].point.x - min[0].point.x;
    if (distanceX > maxDistance) {
      maxDistance = distanceX;
      index = 0;
    }
    const distanceY = max[1].point.y - min[1].point.y;
    if (distanceY > maxDistance) {
      maxDistance = distanceY;
      index = 1;
    }
    const distanceZ = max[2].point.z - min[2].point.z;
    if (distanceZ > maxDistance) index = 2;

    const v0 = min[index];
    const v1 = max[index];
    let v2!: VertexNode;
    let v3!: VertexNode;



    maxDistance = 0;
    _line3.set(v0.point, v1.point);

    for (let i = 0, l = this.vertices.length; i < l; i++) {
      const vertex = vertices[i];

      if (vertex !== v0 && vertex !== v1) {
        _line3.closestTo(vertex.point, _closestPoint);

        const distance = _closestPoint.distanceSqTo(vertex.point);

        if (distance > maxDistance) {
          maxDistance = distance;
          v2 = vertex;
        }
      }
    }



    maxDistance = -1;
    _plane.fromCoplanar(v0.point, v1.point, v2.point);

    for (let i = 0, l = this.vertices.length; i < l; i++) {
      const vertex = vertices[i];

      if (vertex !== v0 && vertex !== v1 && vertex !== v2) {
        const distance = Math.abs(_plane.distanceTo(vertex.point));

        if (distance > maxDistance) {
          maxDistance = distance;
          v3 = vertex;
        }
      }
    }

    const faces = [];

    if (_plane.distanceTo(v3.point) < 0) {


      faces.push(Face.create(v0, v1, v2), Face.create(v3, v1, v0), Face.create(v3, v2, v1), Face.create(v3, v0, v2));



      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;



        faces[i + 1].getEdge(2).setTwin(faces[0].getEdge(j));



        faces[i + 1].getEdge(1).setTwin(faces[j + 1].getEdge(0));
      }
    } else {


      faces.push(Face.create(v0, v2, v1), Face.create(v3, v0, v1), Face.create(v3, v1, v2), Face.create(v3, v2, v0));



      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;



        faces[i + 1].getEdge(2).setTwin(faces[0].getEdge((3 - i) % 3));



        faces[i + 1].getEdge(0).setTwin(faces[j + 1].getEdge(1));
      }
    }



    for (let i = 0; i < 4; i++) {
      this.faces.push(faces[i]);
    }



    for (let i = 0, l = vertices.length; i < l; i++) {
      const vertex = vertices[i];

      if (vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3) {
        maxDistance = this.tolerance;
        let maxFace = null;

        for (let j = 0; j < 4; j++) {
          const distance = this.faces[j].distanceToPoint(vertex.point);

          if (distance > maxDistance) {
            maxDistance = distance;
            maxFace = this.faces[j];
          }
        }

        if (maxFace !== null) {
          this.addVertexToFace(vertex, maxFace);
        }
      }
    }

    return this;
  }



  reindexFaces() {
    const activeFaces = [];

    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];

      if (face.mark === Visible) {
        activeFaces.push(face);
      }
    }

    this.faces = activeFaces;

    return this;
  }



  nextVertexToAdd() {


    if (this.assigned.isEmpty() === false) {
      let eyeVertex,
        maxDistance = 0;



      const eyeFace = this.assigned.first()!.face!;
      let vertex = eyeFace.outside!;



      do {
        const distance = eyeFace.distanceToPoint(vertex.point);

        if (distance > maxDistance) {
          maxDistance = distance;
          eyeVertex = vertex;
        }

        vertex = vertex!.next!;
      } while (vertex !== null && vertex.face === eyeFace);

      return eyeVertex;
    }
  }





  computeHorizon(eyePoint: Vec3, crossEdge: HalfEdge | null, face: Face, horizon: HalfEdge[]): this {


    this.deleteFaceVertices(face);

    face.mark = Deleted;

    let edge!: HalfEdge;

    if (crossEdge === null) {
      edge = crossEdge = face.getEdge(0);
    } else {



      edge = crossEdge.next!;
    }

    do {
      const twinEdge = edge.twin!;
      const oppositeFace = twinEdge.face;

      if (oppositeFace.mark === Visible) {
        if (oppositeFace.distanceToPoint(eyePoint) > this.tolerance) {


          this.computeHorizon(eyePoint, twinEdge, oppositeFace, horizon);
        } else {


          horizon.push(edge);
        }
      }

      edge = edge.next!;
    } while (edge !== crossEdge);

    return this;
  }



  addAdjoiningFace(eyeVertex: VertexNode, horizonEdge: HalfEdge): HalfEdge {


    const face = Face.create(eyeVertex, horizonEdge.tail()!, horizonEdge.head());

    this.faces.push(face);



    face.getEdge(-1).setTwin(horizonEdge.twin!);

    return face.getEdge(0);
  }




  addNewFaces(eyeVertex: VertexNode, horizon: HalfEdge[]): this {
    this.newFaces = [];

    let firstSideEdge: HalfEdge | null = null;
    let previousSideEdge: HalfEdge | null = null;

    for (let i = 0; i < horizon.length; i++) {
      const horizonEdge = horizon[i];



      const sideEdge = this.addAdjoiningFace(eyeVertex, horizonEdge);

      if (firstSideEdge === null) {
        firstSideEdge = sideEdge;
      } else {


        sideEdge.next!.setTwin(previousSideEdge!);
      }

      this.newFaces.push(sideEdge.face);
      previousSideEdge = sideEdge;
    }



    firstSideEdge!.next!.setTwin(previousSideEdge!);

    return this;
  }



  addVertexToHull(eyeVertex: VertexNode): this {
    const horizon: HalfEdge[] = [];

    this.unassigned.clear();



    this.removeVertexFromFace(eyeVertex, eyeVertex.face!);

    this.computeHorizon(eyeVertex.point, null, eyeVertex.face!, horizon);

    this.addNewFaces(eyeVertex, horizon);



    this.resolveUnassignedPoints(this.newFaces);

    return this;
  }

  cleanup() {
    this.assigned.clear();
    this.unassigned.clear();
    this.newFaces = [];

    return this;
  }

  compute() {
    let vertex;

    this.computeInitialHull();



    while ((vertex = this.nextVertexToAdd()) !== undefined) {
      this.addVertexToHull(vertex);
    }

    this.reindexFaces();

    this.cleanup();

    return this;
  }
}

export class Face {
  normal: Vec3;
  midpoint: Vec3;
  area: number;
  constant: number;
  outside: VertexNode | null;
  mark: number;
  edge: HalfEdge | null;
  materialIndex: number;

  constructor() {
    this.normal = Vec3.new();
    this.midpoint = Vec3.new();
    this.area = 0;


    this.constant = 0;

    this.outside = null;
    this.mark = Visible;
    this.edge = null;
  }

  static create(a: VertexNode, b: VertexNode, c: VertexNode): Face {
    const face = new Face();

    const e0 = new HalfEdge(a, face);
    const e1 = new HalfEdge(b, face);
    const e2 = new HalfEdge(c, face);



    e0.next = e2.prev = e1;
    e1.next = e0.prev = e2;
    e2.next = e1.prev = e0;



    face.edge = e0;

    return face.compute();
  }

  getEdge(i: number): HalfEdge {
    let edge = this.edge!;

    while (i > 0) {
      edge = edge!.next!;
      i--;
    }

    while (i < 0) {
      edge = edge!.prev!;
      i++;
    }

    return edge;
  }

  compute() {
    const a = this.edge!.tail()!;
    const b = this.edge!.head()!;
    const c = this.edge!.next!.head()!;

    _triangle.set(a.point, b.point, c.point);

    _triangle.normal(this.normal);
    _triangle.midpoint(this.midpoint);
    this.area = _triangle.area();

    this.constant = this.normal.dot(this.midpoint);

    return this;
  }

  distanceToPoint(point: Vec3): number {
    return this.normal.dot(point) - this.constant;
  }
}

export class HalfEdge {
  prev: HalfEdge | null;
  next: HalfEdge | null;
  twin: HalfEdge | null;

  constructor(
    public vertex: VertexNode,
    public face: Face,
  ) {
    this.prev = null;
    this.next = null;
    this.twin = null;
  }

  head(): VertexNode {
    return this.vertex;
  }

  tail(): VertexNode | null {
    return this.prev ? this.prev.vertex : null;
  }

  length(): number {
    const head = this.head();
    const tail = this.tail();

    return tail === null ? -1 : tail.point.distanceTo(head.point);
  }

  lengthSquared(): number {
    const head = this.head();
    const tail = this.tail();

    return tail !== null ? tail.point.distanceSqTo(head.point) : -1;
  }

  setTwin(edge: HalfEdge): HalfEdge {
    this.twin = edge;
    edge.twin = this;

    return this;
  }
}

export class VertexNode {
  prev: VertexNode | null = null;
  next: VertexNode | null = null;
  face: Face | null = null;

  constructor(public point: Vec3) {}
}

export class VertexList {
  head: VertexNode | null;
  tail: VertexNode | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  first(): VertexNode | null {
    return this.head;
  }

  last(): VertexNode | null {
    return this.tail;
  }

  clear(): this {
    this.head = null;
    this.tail = null;

    return this;
  }

  insertBefore(target: VertexNode, vertex: VertexNode): this {
    vertex.prev = target.prev;
    vertex.next = target;

    if (vertex.prev === null) {
      this.head = vertex;
    } else {
      vertex.prev.next = vertex;
    }

    target.prev = vertex;

    return this;
  }

  insertAfter(target: VertexNode, vertex: VertexNode): this {
    vertex.prev = target;
    vertex.next = target.next;

    if (vertex.next === null) {
      this.tail = vertex;
    } else {
      vertex.next.prev = vertex;
    }

    target.next = vertex;

    return this;
  }

  append(vertex: VertexNode): this {
    if (this.head === null) {
      this.head = vertex;
    } else {
      this.tail!.next = vertex;
    }

    vertex.prev = this.tail;

    vertex.next = null;

    this.tail = vertex;

    return this;
  }

  appendChain(vertex: VertexNode): this {
    if (this.head === null) {
      this.head = vertex;
    } else {
      this.tail!.next = vertex;
    }

    vertex.prev = this.tail;

    while (vertex.next !== null) {
      vertex = vertex.next;
    }

    this.tail = vertex;

    return this;
  }

  remove(vertex: VertexNode): this {
    if (vertex.prev === null) {
      this.head = vertex.next;
    } else {
      vertex.prev.next = vertex.next;
    }

    if (vertex.next === null) {
      this.tail = vertex.prev;
    } else {
      vertex.next.prev = vertex.prev;
    }

    return this;
  }

  removeSubList(a: VertexNode, b: VertexNode): this {
    if (a.prev === null) {
      this.head = b.next;
    } else {
      a.prev.next = b.next;
    }

    if (b.next === null) {
      this.tail = a.prev;
    } else {
      b.next.prev = a.prev;
    }

    return this;
  }

  isEmpty() {
    return this.head === null;
  }
}
