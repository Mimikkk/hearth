import { Geometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, Mat3, Vec3, Entity } from '../engine.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _normalMatrix = new Mat3();

export class VertexNormalsHelper extends LineSegments {
  declare type: string | 'VertexNormalsHelper';
  object: Entity;
  size: number;

  constructor(object: Entity, size: number = 1, color: ColorRepresentation = 0xff0000) {
    const geometry = new Geometry();

    const nNormals = object.geometry!.attributes.normal.count;
    const positions = new Float32BufferAttribute(new Array(nNormals * 2 * 3), 3);

    geometry.setAttribute('position', positions);

    super(geometry, new LineBasicMaterial({ color, toneMapped: false }));

    this.object = object;
    this.size = size;

    this.matrixAutoUpdate = false;

    this.update();
  }

  update() {
    this.object.updateMatrixWorld(true);

    _normalMatrix.fromNMat4(this.object.matrixWorld);

    const matrixWorld = this.object.matrixWorld;

    const position = this.geometry.attributes.position;

    //

    const objGeometry = this.object.geometry;

    if (objGeometry) {
      const objPos = objGeometry.attributes.position;

      const objNorm = objGeometry.attributes.normal;

      let idx = 0;

      // for simplicity, ignore index and drawcalls, and render every normal

      for (let j = 0, jl = objPos.count; j < jl; j++) {
        _v1.fromAttribute(objPos, j).applyMat4(matrixWorld);

        _v2.fromAttribute(objNorm, j);

        _v2.applyMat3(_normalMatrix).normalize().scale(this.size).add(_v1);

        position.setXYZ(idx, _v1.x, _v1.y, _v1.z);

        idx = idx + 1;

        position.setXYZ(idx, _v2.x, _v2.y, _v2.z);

        idx = idx + 1;
      }
    }

    position.needsUpdate = true;
  }
}

VertexNormalsHelper.prototype.type = 'VertexNormalsHelper';
