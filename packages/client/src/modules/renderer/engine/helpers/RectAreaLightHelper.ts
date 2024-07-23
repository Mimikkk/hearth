import {
  Geometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  RectAreaLight,
  Side,
} from '../engine.js';

/**
 *  This helper must be added as a child of the light
 */

export class RectAreaLightHelper extends Line {
  declare type: string | 'RectAreaLightHelper';
  light: RectAreaLight;
  color: number | undefined;

  constructor(light: RectAreaLight, color?: number) {
    const positions = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0];

    const geometry = new Geometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    const material = new LineBasicMaterial({ fog: false });

    super(geometry, material);

    this.light = light;
    this.color = color;
    this.type = 'RectAreaLightHelper';

    //

    const positions2 = [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];

    const geometry2 = new Geometry();
    geometry2.setAttribute('position', new Float32BufferAttribute(positions2, 3));
    geometry2.computeBoundingSphere();

    this.add(new Mesh(geometry2, new MeshBasicMaterial({ side: Side.Back, fog: false })));
  }

  updateMatrixWorld() {
    this.scale.set(0.5 * this.light.width, 0.5 * this.light.height, 1);

    if (this.color !== undefined) {
      (this.material as MeshBasicMaterial).color.set(this.color);
      ((this.children[0] as Mesh).material as MeshBasicMaterial).color.set(this.color);
    } else {
      (this.material as MeshBasicMaterial).color.from(this.light.color).scale(this.light.intensity);

      // prevent hue shift
      const c = (this.material as MeshBasicMaterial).color;
      const max = Math.max(c.r, c.g, c.b);
      if (max > 1) c.scale(1 / max);

      ((this.children[0] as Mesh).material as MeshBasicMaterial).color.from((this.material as MeshBasicMaterial).color);
    }

    // ignore world scale on light
    this.matrixWorld
      .fromMat4Rotation(this.light.matrixWorld)
      .mulVec(this.scale)
      .fromMat4Position(this.light.matrixWorld);

    this.children[0].matrixWorld.from(this.matrixWorld);
    return this;
  }
}

RectAreaLightHelper.prototype.type = 'RectAreaLightHelper';
