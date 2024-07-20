import { triangulate } from './Earcut.js';
import type { Vector2 } from '../math/Vector2.js';

export class ShapeUtils {
  static area(contour: Vector2[]): number {
    const n = contour.length;
    let a = 0.0;

    for (let p = n - 1, q = 0; q < n; p = q++) {
      a += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
    }

    return a * 0.5;
  }

  static isClockWise(pts: Vector2[]): boolean {
    return ShapeUtils.area(pts) < 0;
  }

  static triangulateShape(contour: Vector2[], holes: Vector2[][]): [number, number, number][] {
    const vertices: number[] = [];
    const holeIndices: number[] = [];
    const faces: [number, number, number][] = [];

    removeDuplicateEndPoints(contour);
    addContour(vertices, contour);

    let holeIndex = contour.length;
    holes.forEach(removeDuplicateEndPoints);

    for (let i = 0; i < holes.length; i++) {
      holeIndices.push(holeIndex);
      holeIndex += holes[i].length;
      addContour(vertices, holes[i]);
    }

    const triangles = triangulate(vertices, holeIndices);

    for (let i = 0; i < triangles.length; i += 3) {
      faces.push(triangles.slice(i, i + 3) as [number, number, number]);
    }

    return faces;
  }
}

function removeDuplicateEndPoints(points: Vector2[]) {
  const l = points.length;

  if (l > 2 && points[l - 1].equals(points[0])) {
    points.pop();
  }
}

function addContour(vertices: number[], contour: Vector2[]): void {
  for (let i = 0; i < contour.length; i++) {
    vertices.push(contour[i].x, contour[i].y);
  }
}
