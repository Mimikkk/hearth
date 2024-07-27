import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Entity } from '../../core/Entity.js';
import { LineSegments } from '../LineSegments.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { SpotLight } from '@modules/renderer/engine/objects/lights/SpotLight.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

const _vector = Vec3.new();

export class SpotLightHelper extends Entity {
  declare type: string | 'SpotLightHelper';
  light: SpotLight;
  color: Color;
  cone: LineSegments;

  constructor(light: SpotLight, color: Color) {
    super();

    this.light = light;

    this.matrixAutoUpdate = false;

    this.color = color;

    const geometry = new Geometry();

    const positions = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1];

    for (let i = 0, j = 1, l = 32; i < l; i++, j++) {
      const p1 = (i / l) * Math.PI * 2;
      const p2 = (j / l) * Math.PI * 2;

      positions.push(Math.cos(p1), Math.sin(p1), 1, Math.cos(p2), Math.sin(p2), 1);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));

    const material = new LineBasicMaterial({ fog: false, toneMapped: false });

    this.cone = new LineSegments(geometry, material);
    this.add(this.cone);

    this.update();
  }

  update() {
    this.light.updateWorldMatrix(true, false);
    this.light.target.updateWorldMatrix(true, false);

    // update the local matrix based on the parent and light target transforms
    if (this.parent) {
      this.parent.updateWorldMatrix(true, false);

      this.matrix.from(this.parent.matrixWorld).invert().mul(this.light.matrixWorld);
    } else {
      this.matrix.from(this.light.matrixWorld);
    }

    this.matrixWorld.from(this.light.matrixWorld);

    const coneLength = this.light.distance ? this.light.distance : 1000;
    const coneWidth = coneLength * Math.tan(this.light.angle);

    this.cone.scale.set(coneWidth, coneWidth, coneLength);

    _vector.fromMat4Position(this.light.target.matrixWorld);

    this.cone.lookAt(_vector);

    if (this.color !== undefined) {
      (this.cone.material as LineBasicMaterial).color.set(this.color);
    } else {
      (this.cone.material as LineBasicMaterial).color.from(this.light.color);
    }
  }
}

SpotLightHelper.prototype.type = 'SpotLightHelper';
