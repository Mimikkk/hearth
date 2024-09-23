import { ColorRepresentation } from '../../math/Color.js';
import { Vec3 } from '../../math/Vec3.js';
import { LineSegments } from '../LineSegments.js';
import { Entity } from '../../core/Entity.js';
import { Geometry } from '../../core/Geometry.js';
import { Attribute } from '../../core/Attribute.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';

const _v1 = Vec3.new();
const _v2 = Vec3.new();

export class VertexTangentsHelper extends LineSegments {
  object: Entity;
  size: number;

  constructor(object: Entity, size: number = 1, color: ColorRepresentation = 0x00ffff) {
    const geometry = new Geometry();

    const nTangents = object.geometry!.attributes.tangent.count;
    const positions = new Attribute(new Float32Array(new Array(nTangents * 2 * 3)), 3);

    geometry.setAttribute('position', positions);

    super(geometry, new LineBasicMaterial({ color, toneMapped: false }));

    this.object = object;
    this.size = size;

    this.useLocalAutoUpdate = false;

    this.update();
  }

  update() {
    this.object.updateMatrixWorld(true);

    const matrixWorld = this.object.matrixWorld;

    const position = this.geometry.attributes.position;

    const objGeometry = this.object.geometry!;

    const objPos = objGeometry.attributes.position;

    const objTan = objGeometry.attributes.tangent;

    let idx = 0;

    for (let j = 0, jl = objPos.count; j < jl; j++) {
      _v1.fromAttribute(objPos, j).applyMat4(matrixWorld);

      _v2.fromAttribute(objTan, j);

      _v2.transformDirection(matrixWorld).scale(this.size).add(_v1);

      position.setXYZ(idx, _v1.x, _v1.y, _v1.z);

      idx = idx + 1;

      position.setXYZ(idx, _v2.x, _v2.y, _v2.z);

      idx = idx + 1;
    }

    position.useUpdate = true;
  }
}
