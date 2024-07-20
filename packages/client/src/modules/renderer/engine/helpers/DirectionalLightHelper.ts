import { Vec3 } from '../math/Vec3.js';
import { Object3D } from '../core/Object3D.js';
import { Line } from '../objects/Line.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { DirectionalLight } from '@modules/renderer/engine/lights/DirectionalLight.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

const _v1 = /*@__PURE__*/ new Vec3();
const _v2 = /*@__PURE__*/ new Vec3();
const _v3 = /*@__PURE__*/ new Vec3();

export class DirectionalLightHelper extends Object3D {
  declare type: string | 'DirectionalLightHelper';
  light: DirectionalLight;
  lightPlane: Line;
  targetLine: Line;
  color: Color;

  constructor(light: DirectionalLight, size: number, color: Color) {
    super();

    this.light = light;

    this.matrix = light.matrixWorld;
    this.matrixAutoUpdate = false;

    this.color = color;

    let geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0, -size, size, 0], 3),
    );

    const material = new LineBasicMaterial({ fog: false, toneMapped: false });

    this.lightPlane = new Line(geometry, material);
    this.add(this.lightPlane);

    geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3));

    this.targetLine = new Line(geometry, material);
    this.add(this.targetLine);

    this.update();
  }

  dispose() {
    this.lightPlane.geometry.dispose();
    this.lightPlane.material.dispose();
    this.targetLine.geometry.dispose();
    this.targetLine.material.dispose();
  }

  update() {
    this.light.updateWorldMatrix(true, false);
    this.light.target.updateWorldMatrix(true, false);

    _v1.setFromMatrixPosition(this.light.matrixWorld);
    _v2.setFromMatrixPosition(this.light.target.matrixWorld);
    _v3.subVectors(_v2, _v1);

    this.lightPlane.lookAt(_v2);

    if (this.color !== undefined) {
      (this.lightPlane.material as LineBasicMaterial).color.set(this.color);
      (this.targetLine.material as LineBasicMaterial).color.set(this.color);
    } else {
      (this.lightPlane.material as LineBasicMaterial).color.copy(this.light.color);
      (this.targetLine.material as LineBasicMaterial).color.copy(this.light.color);
    }

    this.targetLine.lookAt(_v2);
    this.targetLine.scale.z = _v3.length();
  }
}

DirectionalLightHelper.prototype.type = 'DirectionalLightHelper';
