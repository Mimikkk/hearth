class Vertex {
  constructor(
    public i: number,
    public x: number,
    public y: number,
  ) {}

  prev: Vertex | null = null;
  next: Vertex | null = null;
  z: number = 0;
  prevZ: Vertex | null = null;
  nextZ: Vertex | null = null;
  steiner: boolean = false;
}

namespace LinkedList {
  export const create = (data: number[], start: number, end: number, dim: number, clockwise: boolean): Vertex => {
    let last: Vertex | null | undefined = undefined;

    if (clockwise === calculateSignedArea(data, start, end, dim) > 0) {
      for (let i = start; i < end; i += dim) last = insertNode(new Vertex(i, data[i], data[i + 1]), last);
    } else {
      for (let i = end - dim; i >= start; i -= dim) last = insertNode(new Vertex(i, data[i], data[i + 1]), last);
    }

    if (last && equals(last, last.next!)) {
      disposeNode(last);
      last = last.next;
    }

    return last!;
  };

  export const sort = (list: Vertex): Vertex => {
    let p: Vertex | null;
    let q: Vertex | null;
    let e: Vertex | null;
    let tail: Vertex | null;
    let numMerges: number;
    let pSize: number;
    let qSize: number;
    let inSize = 1;

    let head: Vertex | null = list;
    do {
      p = head;
      head = null;
      tail = null;
      numMerges = 0;

      while (p) {
        ++numMerges;
        q = p;
        pSize = 0;
        for (let i = 0; i < inSize; ++i) {
          pSize++;
          q = q.nextZ;
          if (!q) break;
        }

        qSize = inSize;

        while (pSize > 0 || (qSize > 0 && q)) {
          if (pSize !== 0 && (qSize === 0 || !q || p!.z <= q.z)) {
            e = p;
            p = p!.nextZ;
            pSize--;
          } else {
            e = q;
            q = q!.nextZ;
            qSize--;
          }

          if (tail) tail.nextZ = e;
          else head = e;

          e!.prevZ = tail;
          tail = e;
        }

        p = q;
      }

      tail!.nextZ = null;
      inSize *= 2;
    } while (numMerges > 1);

    return head!;
  };

  export const leftmost = (start: Vertex): Vertex => {
    let node = start;
    let leftmost = start;

    do {
      if (node.x < leftmost.x || (node.x === leftmost.x && node.y < leftmost.y)) leftmost = node;
      node = node.next!;
    } while (node !== start);

    return leftmost;
  };
}

const sign = (value: number): -1 | 0 | 1 => (value > 0 ? 1 : value < 0 ? -1 : 0);

const isOnSegment = (p: Vertex, q: Vertex, r: Vertex): boolean =>
  q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);

const isIntersecting = (p1: Vertex, q1: Vertex, p2: Vertex, q2: Vertex): boolean => {
  const o1 = sign(calculateArea(p1, q1, p2));
  const o2 = sign(calculateArea(p1, q1, q2));
  const o3 = sign(calculateArea(p2, q2, p1));
  const o4 = sign(calculateArea(p2, q2, q1));


  if (o1 !== o2 && o3 !== o4) return true;


  if (o1 === 0 && isOnSegment(p1, p2, q1)) return true;

  if (o2 === 0 && isOnSegment(p1, q2, q1)) return true;

  if (o3 === 0 && isOnSegment(p2, p1, q2)) return true;

  return o4 === 0 && isOnSegment(p2, q1, q2);
};
const isIntersectingPolygon = (a: Vertex, b: Vertex): boolean => {
  let p = a;

  do {
    if (p.i !== a.i && p.next!.i !== a.i && p.i !== b.i && p.next!.i !== b.i && isIntersecting(p, p.next!, a, b))
      return true;
    p = p.next!;
  } while (p !== a);

  return false;
};
const splitPolygon = (a: Vertex, b: Vertex): Vertex => {
  const a2 = new Vertex(a.i, a.x, a.y);
  const b2 = new Vertex(b.i, b.x, b.y);
  const an = a.next!;
  const bp = b.prev!;

  a.next = b;
  b.prev = a;

  a2.next = an;
  an.prev = a2;

  b2.next = a2;
  a2.prev = b2;

  bp.next = b2;
  b2.prev = bp;

  return b2;
};

const isLocallyInside = (a: Vertex, b: Vertex): boolean =>
  calculateArea(a.prev!, a, a.next!) < 0
    ? calculateArea(a, b, a.next!) >= 0 && calculateArea(a, a.prev!, b) >= 0
    : calculateArea(a, b, a.prev!) < 0 || calculateArea(a, a.next!, b) < 0;

const isMiddleInside = (a: Vertex, b: Vertex): boolean => {
  let p = a;
  let inside = false;
  const px = (a.x + b.x) / 2;
  const py = (a.y + b.y) / 2;

  do {
    if (
      p.y > py !== p.next!.y > py &&
      p.next!.y !== p.y &&
      px < ((p.next!.x - p.x) * (py - p.y)) / (p.next!.y - p.y) + p.x
    )
      inside = !inside;

    p = p.next!;
  } while (p !== a);

  return inside;
};

const isPointInTriangle = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  { x: px, y: py }: Vertex,
): boolean =>
  (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
  (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
  (bx - px) * (cy - py) >= (cx - px) * (by - py);

const findHoleBridge = (hole: Vertex, outer: Vertex): Vertex | null => {
  let point = outer;
  let qx = -Infinity;
  let middle;

  const { x: holeX, y: holeY } = hole;

  do {
    if (holeY <= point.y && holeY >= point.next!.y && point.next!.y !== point.y) {
      const x = point.x + ((holeY - point.y) * (point.next!.x - point.x)) / (point.next!.y - point.y);

      if (x <= holeX && x > qx) {
        qx = x;

        middle = point.x < point.next!.x ? point : point.next;


        if (x === holeX) return middle;
      }
    }

    point = point.next!;
  } while (point !== outer);

  if (!middle) return null;

  const stop = middle;
  const { x: mx, y: my } = middle;

  let tanMin = Infinity;

  point = middle;

  do {
    if (
      holeX >= point.x &&
      point.x >= mx &&
      holeX !== point.x &&
      isPointInTriangle(holeY < my ? holeX : qx, holeY, mx, my, holeY < my ? qx : holeX, holeY, point)
    ) {
      const tangential = Math.abs(holeY - point.y) / (holeX - point.x);

      if (
        isLocallyInside(point, hole) &&
        (tangential < tanMin ||
          (tangential === tanMin &&
            (point.x > middle.x || (point.x === middle.x && isSectorContainingSector(middle, point)))))
      ) {
        middle = point;
        tanMin = tangential;
      }
    }

    point = point.next!;
  } while (point !== stop);

  return middle;
};

const removeHole = (hole: Vertex, outerNode: Vertex): Vertex => {
  const bridge = findHoleBridge(hole, outerNode);
  if (!bridge) {
    return outerNode;
  }

  const bridgeReverse = splitPolygon(bridge, hole);

  filterPoints(bridgeReverse, bridgeReverse.next!);
  return filterPoints(bridge, bridge.next!);
};

const isSectorContainingSector = (m: Vertex, p: Vertex): boolean =>
  calculateArea(m.prev!, m, p.prev!) < 0 && calculateArea(p.next!, m, m.next!) < 0;

namespace Earcut {
  export const run = (
    ear: Vertex,
    triangles: number[],
    dim: number,
    minX: number,
    minY: number,
    invSize: number,
    pass: number,
  ): void => {
    if (!ear) return;


    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    let stop = ear;
    let prev;
    let next;


    while (ear.prev !== ear.next) {
      prev = ear.prev!;
      next = ear.next!;

      if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {

        triangles.push((prev.i / dim) | 0);
        triangles.push((ear.i / dim) | 0);
        triangles.push((next.i / dim) | 0);

        disposeNode(ear);


        ear = next.next!;
        stop = next.next!;

        continue;
      }

      ear = next;


      if (ear === stop) {

        if (pass === 0) {
          run(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);


        } else if (pass === 1) {
          ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
          run(ear, triangles, dim, minX, minY, invSize, 2);


        } else if (pass === 2) {
          split(ear, triangles, dim, minX, minY, invSize);
        }

        break;
      }
    }
  };

  const split = (
    start: Vertex,
    triangles: number[],
    dim: number,
    minX: number,
    minY: number,
    invSize: number,
  ): void => {

    let a = start;

    do {
      let b = a.next!.next!;
      while (b !== a.prev) {
        if (a.i !== b.i && isValidDiagonal(a, b)) {

          let c = splitPolygon(a, b);


          a = filterPoints(a, a.next!);
          c = filterPoints(c, c.next!);


          Earcut.run(a, triangles, dim, minX, minY, invSize, 0);
          Earcut.run(c, triangles, dim, minX, minY, invSize, 0);
          return;
        }

        b = b.next!;
      }

      a = a.next!;
    } while (a !== start);
  };
}

const calculateZOrder = (x: number, y: number, minX: number, minY: number, invSize: number): number => {

  x = ((x - minX) * invSize) | 0;
  y = ((y - minY) * invSize) | 0;

  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y = (y | (y << 8)) & 0x00ff00ff;
  y = (y | (y << 4)) & 0x0f0f0f0f;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
};

const indexCurve = (start: Vertex, minX: number, minY: number, invSize: number): void => {
  let p = start;

  do {
    if (p.z === 0) p.z = calculateZOrder(p.x, p.y, minX, minY, invSize);
    p.prevZ = p.prev;
    p.nextZ = p.next;

    p = p.next!;
  } while (p !== start);

  p.prevZ!.nextZ = null;
  p.prevZ = null;

  LinkedList.sort(p);
};

const isValidDiagonal = (a: Vertex, b: Vertex): boolean =>
  !!(
    a.next!.i !== b.i &&
    a.prev!.i !== b.i &&
    !isIntersectingPolygon(a, b) &&
    ((isLocallyInside(a, b) &&
      isLocallyInside(b, a) &&
      isMiddleInside(a, b) &&

      (calculateArea(a.prev!, a, b.prev!) || calculateArea(a, b.prev!, b))) ||

      (equals(a, b) && calculateArea(a.prev!, a, a.next!) > 0 && calculateArea(b.prev!, b, b.next!) > 0))
  );

const equals = (first: Vertex, second: Vertex) => first.x === second.x && first.y === second.y;

const insertNode = (node: Vertex, parent?: Vertex) => {
  if (!parent) {
    node.prev = node;
    node.next = node;
  } else {
    node.next = parent.next;
    node.prev = parent;

    parent.next!.prev = node;
    parent.next = node;
  }

  return node;
};
const disposeNode = (p: Vertex) => {
  p.next!.prev = p.prev;
  p.prev!.next = p.next;

  if (p.prevZ) p.prevZ.nextZ = p.nextZ;
  if (p.nextZ) p.nextZ.prevZ = p.prevZ;
};

const calculateArea = (a: Vertex, b: Vertex, c: Vertex): number =>
  (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

const calculateSignedArea = (data: number[], start: number, end: number, dim: number): number => {
  let sum = 0;

  for (let i = start, j = end - dim; i < end; i += dim) {
    sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
    j = i;
  }

  return sum;
};

const filterPoints = (start: Vertex, end: Vertex = start): Vertex => {
  if (!start) return start;
  if (!end) end = start;

  let point = start;
  let again;
  do {
    again = false;

    if (!point.steiner && (equals(point, point.next!) || calculateArea(point.prev!, point, point.next!) === 0)) {
      disposeNode(point);
      point = end = point.prev!;
      if (point === point.next) break;
      again = true;
    } else {
      point = point.next!;
    }
  } while (again || point !== end);

  return end;
};

const isEar = (ear: Vertex): boolean => {
  const a = ear.prev!;
  const b = ear;
  const c = ear.next!;


  if (calculateArea(a, b, c) >= 0) return false;


  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;


  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;

  let point = c.next!;
  while (point !== a) {
    if (
      point.x >= x0 &&
      point.x <= x1 &&
      point.y >= y0 &&
      point.y <= y1 &&
      isPointInTriangle(ax, ay, bx, by, cx, cy, point) &&
      calculateArea(point.prev!, point, point.next!) >= 0
    )
      return false;
    point = point.next!;
  }

  return true;
};

const isEarHashed = (ear: Vertex, minX: number, minY: number, invSize: number): boolean => {
  const a = ear.prev!;
  const b = ear;
  const c = ear.next!;


  if (calculateArea(a, b, c) >= 0) return false;


  const ax = a.x;
  const bx = b.x;
  const cx = c.x;
  const ay = a.y;
  const by = b.y;
  const cy = c.y;


  const x0 = ax < bx ? (ax < cx ? ax : cx) : bx < cx ? bx : cx;
  const y0 = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
  const x1 = ax > bx ? (ax > cx ? ax : cx) : bx > cx ? bx : cx;
  const y1 = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;


  const minZ = calculateZOrder(x0, y0, minX, minY, invSize);
  const maxZ = calculateZOrder(x1, y1, minX, minY, invSize);

  let point = ear.prevZ;
  let node = ear.nextZ;

  while (point && point.z >= minZ && node && node.z <= maxZ) {
    if (
      point.x >= x0 &&
      point.x <= x1 &&
      point.y >= y0 &&
      point.y <= y1 &&
      point !== a &&
      point !== c &&
      isPointInTriangle(ax, ay, bx, by, cx, cy, point) &&
      calculateArea(point.prev!, point, point.next!) >= 0
    )
      return false;
    point = point.prevZ;
    if (
      node.x >= x0 &&
      node.x <= x1 &&
      node.y >= y0 &&
      node.y <= y1 &&
      node !== a &&
      node !== c &&
      isPointInTriangle(ax, ay, bx, by, cx, cy, node) &&
      calculateArea(node.prev!, node, node.next!) >= 0
    )
      return false;
    node = node.nextZ!;
  }


  while (point && point.z >= minZ) {
    if (
      point.x >= x0 &&
      point.x <= x1 &&
      point.y >= y0 &&
      point.y <= y1 &&
      point !== a &&
      point !== c &&
      isPointInTriangle(ax, ay, bx, by, cx, cy, point) &&
      calculateArea(point.prev!, point, point.next!) >= 0
    )
      return false;
    point = point.prevZ!;
  }


  while (node && node.z <= maxZ) {
    if (
      node.x >= x0 &&
      node.x <= x1 &&
      node.y >= y0 &&
      node.y <= y1 &&
      node !== a &&
      node !== c &&
      isPointInTriangle(ax, ay, bx, by, cx, cy, node) &&
      calculateArea(node.prev!, node, node.next!) >= 0
    )
      return false;
    node = node.nextZ!;
  }

  return true;
};

const cureLocalIntersections = (start: Vertex, triangles: number[], dim: number): Vertex => {
  let p = start;

  do {
    const a = p.prev!;
    const b = p.next!.next!;

    if (!equals(a, b) && isIntersecting(a, p, p.next!, b) && isLocallyInside(a, b) && isLocallyInside(b, a)) {
      triangles.push((a.i / dim) | 0);
      triangles.push((p.i / dim) | 0);
      triangles.push((b.i / dim) | 0);


      disposeNode(p);
      disposeNode(p.next!);

      p = start = b;
    }

    p = p.next!;
  } while (p !== start);

  return filterPoints(p);
};

const eliminateHoles = (data: number[], indices: number[], outer: Vertex, dim: number): Vertex => {
  const holes = [];

  let start;
  let end;
  let head: Vertex;
  for (let i = 0, len = indices.length; i < len; ++i) {
    start = indices[i] * dim;
    end = i < len - 1 ? indices[i + 1] * dim : data.length;

    head = LinkedList.create(data, start, end, dim, false);
    if (head === head.next) head.steiner = true;

    holes.push(LinkedList.leftmost(head));
  }

  holes.sort((a, b) => a.x - b.x);
  for (let i = 0; i < holes.length; ++i) outer = removeHole(holes[i], outer);

  return outer;
};

export const triangulate = (data: number[], holeIndices?: number[], dim: number = 2): number[] => {
  const hasHoles = holeIndices && holeIndices.length;
  const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
  let outerNode = LinkedList.create(data, 0, outerLen, dim, true);
  const triangles: number[] = [];

  if (!outerNode || outerNode.next === outerNode.prev) return triangles;

  let minX;
  let minY;
  let maxX;
  let maxY;
  let x;
  let y;
  let invSize;

  if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

  if (data.length > 80 * dim) {
    minX = maxX = data[0];
    minY = maxY = data[1];

    for (let i = dim; i < outerLen; i += dim) {
      x = data[i];
      y = data[i + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }


    invSize = Math.max(maxX - minX, maxY - minY);
    invSize = invSize !== 0 ? 32767 / invSize : 0;
  }

  Earcut.run(outerNode!, triangles, dim, minX!, minY!, invSize!, 0);

  return triangles;
};
