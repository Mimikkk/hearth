import { Line } from '../Line.js';
import { Mesh } from '../Mesh.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial.js';
import { Attribute } from '../../core/Attribute.js';
import { Geometry } from '../../core/Geometry.js';
import { Plane } from '../../math/Plane.js';
import { ColorRepresentation } from '../../math/Color.js';

export class PlaneHelper extends Line {
  plane: Plane;
  size: number;

  constructor(plane: Plane, size: number = 1, hex: ColorRepresentation = 0xffff00) {
    const color = hex;

    const positions = [1, -1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0];

    const geometry = new Geometry();
    geometry.setAttribute('position', new Attribute(new Float32Array(positions), 3));
    geometry.calcBoundSphere();

    super(geometry, new LineBasicMaterial({ color: color, toneMapped: false }));

    this.plane = plane;

    this.size = size;

    const positions2 = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];

    const geometry2 = new Geometry();
    geometry2.setAttribute('position', new Attribute(new Float32Array(positions2), 3));
    geometry2.calcBoundSphere();

    this.add(
      new Mesh(
        geometry2,
        new MeshBasicMaterial({
          color: color,
          opacity: 0.2,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      ),
    );
  }

  updateMatrixWorld(force?: boolean): this {
    this.position.set(0, 0, 0);

    this.scale.set(0.5 * this.size, 0.5 * this.size, 1);

    this.lookAt(this.plane.normal);

    this.translateZ(-this.plane.constant);

    return super.updateMatrixWorld(force);
  }
}
