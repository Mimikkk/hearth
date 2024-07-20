import { Vec3 } from '../math/Vec3.js';
import { Object3D } from '../core/Object3D.js';
import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { SpotLight } from '@modules/renderer/engine/lights/SpotLight.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

const _vector = /*@__PURE__*/ new Vec3();

export class SpotLightHelper extends Object3D {
  declare type: string | 'SpotLightHelper';
  light: SpotLight;
  color: Color;
  cone: LineSegments;

  constructor(light: SpotLight, color: Color) {
    super();

    this.light = light;

    this.matrixAutoUpdate = false;

    this.color = color;

    const geometry = new BufferGeometry();

    const positions = [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1];

    for (let i = 0, j = 1, l = 32; i < l; i++, j++) {
      const p1 = (i / l) * Math.PI * 2;
      const p2 = (j / l) * Math.PI * 2;

      positions.push(Math.cos(p1), Math.sin(p1), 1, Math.cos(p2), Math.sin(p2), 1);
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new LineBasicMaterial({ fog: false, toneMapped: false });

    this.cone = new LineSegments(geometry, material);
    this.add(this.cone);

    this.update();
  }

  dispose() {
    this.cone.geometry.dispose();
    this.cone.material.dispose();
  }

  update() {
    this.light.updateWorldMatrix(true, false);
    this.light.target.updateWorldMatrix(true, false);

    // update the local matrix based on the parent and light target transforms
    if (this.parent) {
      this.parent.updateWorldMatrix(true, false);

      this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld);
    } else {
      this.matrix.copy(this.light.matrixWorld);
    }

    this.matrixWorld.copy(this.light.matrixWorld);

    const coneLength = this.light.distance ? this.light.distance : 1000;
    const coneWidth = coneLength * Math.tan(this.light.angle);

    this.cone.scale.set(coneWidth, coneWidth, coneLength);

    _vector.setFromMatrixPosition(this.light.target.matrixWorld);

    this.cone.lookAt(_vector);

    if (this.color !== undefined) {
      (this.cone.material as LineBasicMaterial).color.set(this.color);
    } else {
      (this.cone.material as LineBasicMaterial).color.copy(this.light.color);
    }
  }
}
SpotLightHelper.prototype.type = 'SpotLightHelper';
