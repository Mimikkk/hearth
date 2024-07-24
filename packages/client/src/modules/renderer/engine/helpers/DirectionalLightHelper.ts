import { Vec3 } from '../math/Vec3.js';
import { Entity } from '../core/Entity.js';
import { Line } from '../objects/Line.js';
import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Geometry } from '../core/Geometry.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { DirectionalLight } from '@modules/renderer/engine/objects/lights/DirectionalLight.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _v3 = Vec3.new();

export class DirectionalLightHelper extends Entity {
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

    let geometry = new Geometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0, -size, size, 0]),
        3,
      ),
    );

    const material = new LineBasicMaterial({ fog: false, toneMapped: false });

    this.lightPlane = new Line(geometry, material);
    this.add(this.lightPlane);

    geometry = new Geometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 1]), 3));

    this.targetLine = new Line(geometry, material);
    this.add(this.targetLine);

    this.update();
  }

  update() {
    this.light.updateWorldMatrix(true, false);
    this.light.target.updateWorldMatrix(true, false);

    _v1.fromMat4Position(this.light.matrixWorld);
    _v2.fromMat4Position(this.light.target.matrixWorld);
    _v3.asSub(_v2, _v1);

    this.lightPlane.lookAt(_v2);

    if (this.color !== undefined) {
      (this.lightPlane.material as LineBasicMaterial).color.set(this.color);
      (this.targetLine.material as LineBasicMaterial).color.set(this.color);
    } else {
      (this.lightPlane.material as LineBasicMaterial).color.from(this.light.color);
      (this.targetLine.material as LineBasicMaterial).color.from(this.light.color);
    }

    this.targetLine.lookAt(_v2);
    this.targetLine.scale.z = _v3.length();
  }
}

DirectionalLightHelper.prototype.type = 'DirectionalLightHelper';
