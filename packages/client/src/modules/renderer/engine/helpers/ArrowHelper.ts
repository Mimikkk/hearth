import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Geometry } from '../core/Geometry.js';
import { Entity } from '../core/Entity.js';
import { CylinderGeometry } from '../geometries/CylinderGeometry.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/objects/materials/MeshBasicMaterial.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { Mesh } from '../objects/Mesh.js';
import { Line } from '../objects/Line.js';
import { Vec3 } from '../math/Vec3.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

const _axis = Vec3.new();
let _lineGeometry!: Geometry;
let _coneGeometry!: CylinderGeometry;

export class ArrowHelper extends Entity {
  declare type: string | 'ArrowHelper';
  line: Line;
  cone: Mesh;

  constructor(
    dir = Vec3.new(0, 0, 1),
    origin = Vec3.new(0, 0, 0),
    length = 1,
    color = 0xffff00,
    headLength = length * 0.2,
    headWidth = headLength * 0.2,
  ) {
    super();

    this.type = 'ArrowHelper';

    if (_lineGeometry === undefined) {
      _lineGeometry = new Geometry();
      _lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 1, 0]), 3));

      _coneGeometry = new CylinderGeometry(0, 0.5, 1, 5, 1);
      _coneGeometry.translate(0, -0.5, 0);
    }

    this.position.from(origin);

    this.line = new Line(_lineGeometry, new LineBasicMaterial({ color: color, toneMapped: false }));
    this.line.matrixAutoUpdate = false;
    this.add(this.line);

    this.cone = new Mesh(_coneGeometry, new MeshBasicMaterial({ color: color, toneMapped: false }));
    this.cone.matrixAutoUpdate = false;
    this.add(this.cone);

    this.setDirection(dir);
    this.setLength(length, headLength, headWidth);
  }

  setDirection(dir: Vec3) {
    // dir is assumed to be normalized

    if (dir.y > 0.99999) {
      this.quaternion.set(0, 0, 0, 1);
    } else if (dir.y < -0.99999) {
      this.quaternion.set(1, 0, 0, 0);
    } else {
      _axis.set(dir.z, 0, -dir.x).normalize();

      const radians = Math.acos(dir.y);

      this.quaternion.fromAxisAngle(_axis, radians);
    }
  }

  setLength(length: number, headLength: number = length * 0.2, headWidth: number = headLength * 0.2) {
    this.line.scale.set(1, Math.max(0.0001, length - headLength), 1);
    this.line.updateMatrix();

    this.cone.scale.set(headWidth, headLength, headWidth);
    this.cone.position.y = length;
    this.cone.updateMatrix();
  }

  setColor(color: Color) {
    (this.line.material as MeshBasicMaterial).color.set(color);
    (this.cone.material as LineBasicMaterial).color.set(color);
  }

  copy(source: this): this {
    super.copy(source, false);

    this.line.copy(source.line);
    this.cone.copy(source.cone);

    return this;
  }
}

ArrowHelper.prototype.type = 'ArrowHelper';
