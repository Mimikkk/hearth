/**
 *  This helper must be added as a child of the light
 */
import { Line } from '../Line.js';
import { RectAreaLight } from '../lights/RectAreaLight.js';
import { Geometry } from '../../core/Geometry.js';
import { Attribute } from '../../core/Attribute.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Mesh } from '../Mesh.js';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial.js';
import { Side } from '../../constants.js';

export class RectAreaLightHelper extends Line {
  light: RectAreaLight;
  color: number | undefined;

  constructor(light: RectAreaLight, color?: number) {
    const positions = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0];

    const geometry = new Geometry();
    geometry.setAttribute('position', new Attribute(new Float32Array(positions), 3));
    geometry.calcBoundSphere();

    const material = new LineBasicMaterial({ fog: false });

    super(geometry, material);

    this.light = light;
    this.color = color;
    this.type = 'RectAreaLightHelper';

    const positions2 = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];

    const geometry2 = new Geometry();
    geometry2.setAttribute('position', new Attribute(new Float32Array(positions2), 3));
    geometry2.calcBoundSphere();

    this.add(new Mesh(geometry2, new MeshBasicMaterial({ side: Side.Back, fog: false })));
  }

  updateMatrixWorld() {
    this.scale.set(0.5 * this.light.width, 0.5 * this.light.height, 1);

    if (this.color !== undefined) {
      (this.material as MeshBasicMaterial).color.set(this.color);
      ((this.children[0] as Mesh).material as MeshBasicMaterial).color.set(this.color);
    } else {
      (this.material as MeshBasicMaterial).color.from(this.light.color).scale(this.light.intensity);

      const c = (this.material as MeshBasicMaterial).color;
      const max = Math.max(c.r, c.g, c.b);
      if (max > 1) c.scale(1 / max);

      ((this.children[0] as Mesh).material as MeshBasicMaterial).color.from((this.material as MeshBasicMaterial).color);
    }

    this.matrixWorld
      .fromMat4Rotation(this.light.matrixWorld)
      .mulVec(this.scale)
      .fromMat4Position(this.light.matrixWorld);

    this.children[0].matrixWorld.from(this.matrixWorld);
    return this;
  }
}
