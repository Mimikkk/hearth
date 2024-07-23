import { BoxGeometry, Vec3 } from '../engine.js';

const _tempNormal = Vec3.new();

function getUv(
  faceDirVector: Vec3,
  normal: Vec3,
  uvAxis: 'x' | 'y' | 'z',
  projectionAxis: 'x' | 'y' | 'z',
  radius: number,
  sideLength: number,
) {
  const totArcLength = (2 * Math.PI * radius) / 4;

  // length of the planes between the arcs on each axis
  const centerLength = Math.max(sideLength - 2 * radius, 0);
  const halfArc = Math.PI / 4;

  // Get the vector projected onto the Y plane
  _tempNormal.from(normal);
  _tempNormal[projectionAxis] = 0;
  _tempNormal.normalize();

  // total amount of UV space alloted to a single arc
  const arcUvRatio = (0.5 * totArcLength) / (totArcLength + centerLength);

  // the distance along one arc the point is at
  const arcAngleRatio = 1.0 - _tempNormal.angleTo(faceDirVector) / halfArc;

  if (Math.sign(_tempNormal[uvAxis]) === 1) {
    return arcAngleRatio * arcUvRatio;
  } else {
    // total amount of UV space alloted to the plane between the arcs
    const lenUv = centerLength / (totArcLength + centerLength);
    return lenUv + arcUvRatio + arcUvRatio * (1.0 - arcAngleRatio);
  }
}

export class RoundedBoxGeometry extends BoxGeometry {
  constructor(width: number = 1, height: number = 1, depth: number = 1, segments: number = 2, radius: number = 0.1) {
    // ensure segments is odd so we have a plane connecting the rounded corners
    segments = segments * 2 + 1;

    // ensure radius isn't bigger than shortest side
    radius = Math.min(width / 2, height / 2, depth / 2, radius);

    super(1, 1, 1, segments, segments, segments);

    // if we just have one segment we're the same as a regular box
    if (segments === 1) return;

    const geometry2 = this.toNonIndexed();

    this.index = null;
    this.attributes.position = geometry2.attributes.position;
    this.attributes.normal = geometry2.attributes.normal;
    this.attributes.uv = geometry2.attributes.uv;

    //

    const position = Vec3.new();
    const normal = Vec3.new();

    const box = Vec3.new(width, height, depth).divScalar(2).subScalar(radius);

    const positions = this.attributes.position.array;
    const normals = this.attributes.normal.array;
    const uvs = this.attributes.uv.array;

    const faceTris = positions.length / 6;
    const faceDirVector = Vec3.new();
    const halfSegmentSize = 0.5 / segments;

    for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
      position.fromArray(positions as never, i);
      normal.from(position);
      normal.x -= Math.sign(normal.x) * halfSegmentSize;
      normal.y -= Math.sign(normal.y) * halfSegmentSize;
      normal.z -= Math.sign(normal.z) * halfSegmentSize;
      normal.normalize();

      positions[i + 0] = box.x * Math.sign(position.x) + normal.x * radius;
      positions[i + 1] = box.y * Math.sign(position.y) + normal.y * radius;
      positions[i + 2] = box.z * Math.sign(position.z) + normal.z * radius;

      normals[i + 0] = normal.x;
      normals[i + 1] = normal.y;
      normals[i + 2] = normal.z;

      const side = Math.floor(i / faceTris);

      switch (side) {
        case 0: // right
          // generate UVs along Z then Y
          faceDirVector.set(1, 0, 0);
          uvs[j + 0] = getUv(faceDirVector, normal, 'z', 'y', radius, depth);
          uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'z', radius, height);
          break;

        case 1: // left
          // generate UVs along Z then Y
          faceDirVector.set(-1, 0, 0);
          uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'z', 'y', radius, depth);
          uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'z', radius, height);
          break;

        case 2: // top
          // generate UVs along X then Z
          faceDirVector.set(0, 1, 0);
          uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'z', radius, width);
          uvs[j + 1] = getUv(faceDirVector, normal, 'z', 'x', radius, depth);
          break;

        case 3: // bottom
          // generate UVs along X then Z
          faceDirVector.set(0, -1, 0);
          uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'z', radius, width);
          uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'z', 'x', radius, depth);
          break;

        case 4: // front
          // generate UVs along X then Y
          faceDirVector.set(0, 0, 1);
          uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'y', radius, width);
          uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'x', radius, height);
          break;

        case 5: // back
          // generate UVs along X then Y
          faceDirVector.set(0, 0, -1);
          uvs[j + 0] = getUv(faceDirVector, normal, 'x', 'y', radius, width);
          uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'x', radius, height);
          break;
      }
    }
  }
}
