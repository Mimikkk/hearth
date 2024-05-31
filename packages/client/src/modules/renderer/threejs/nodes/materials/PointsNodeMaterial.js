import { NodeMaterial } from './NodeMaterial.js';

import { PointsMaterial } from '../../../threejs/Three.js';

const defaultValues = new PointsMaterial();

export class PointsNodeMaterial extends NodeMaterial {
  static type = 'PointsNodeMaterial';

  constructor(parameters) {
    super();

    this.isPointsNodeMaterial = true;

    this.lights = false;
    this.normals = false;
    this.transparent = true;

    this.sizeNode = null;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  copy(source) {
    this.sizeNode = source.sizeNode;

    return super.copy(source);
  }
}
