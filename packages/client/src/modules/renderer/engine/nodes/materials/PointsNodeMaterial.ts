import { NodeMaterial } from './NodeMaterial.js';
import {
  PointsMaterial,
  PointsMaterialParameters,
} from '@modules/renderer/engine/entities/materials/PointsMaterial.js';

export class PointsNodeMaterial extends NodeMaterial {
  sizeNode: Node | null;

  constructor(parameters?: PointsMaterialParameters) {
    super();

    this.lights = false;
    this.normals = false;
    this.transparent = true;
    this.sizeNode = null;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }
}

const _parameters = new PointsMaterial();
