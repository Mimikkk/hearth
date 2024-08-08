import { Mesh } from '../Mesh.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/entities/materials/MeshBasicMaterial.js';
import { SphereGeometry } from '../geometries/SphereGeometry.js';
import { PointLight } from '@modules/renderer/engine/entities/lights/PointLight.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

export class PointLightHelper extends Mesh {
  light: PointLight;
  color: Color;

  constructor(light: PointLight, sphereSize: number, color: Color) {
    const geometry = new SphereGeometry(sphereSize, 4, 2);
    const material = new MeshBasicMaterial({ wireframe: true, fog: false, toneMapped: false });

    super(geometry, material);

    this.light = light;

    this.color = color;

    this.matrix = this.light.matrixWorld;
    this.matrixAutoUpdate = false;

    this.update();
  }

  update() {
    this.light.updateWorldMatrix(true, false);

    if (this.color !== undefined) {
      (this.material as MeshBasicMaterial).color.set(this.color);
    } else {
      (this.material as MeshBasicMaterial).color.from(this.light.color);
    }
  }
}
