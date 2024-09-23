import { Mesh } from '../Mesh.js';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial.js';
import { SphereGeometry } from '../geometries/SphereGeometry.js';
import { PointLight } from '../lights/PointLight.js';
import { Color } from '../../math/Color.js';

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
    this.useLocalAutoUpdate = false;

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
