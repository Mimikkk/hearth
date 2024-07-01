import { NodeMaterial } from './NodeMaterial.js';

import { LineBasicMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new LineBasicMaterial();

export class LineBasicNodeMaterial extends NodeMaterial {
  static type = 'LineBasicNodeMaterial';

  constructor(parameters) {
    super();

    this.isLineBasicNodeMaterial = true;

    this.lights = false;
    this.normals = false;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }
}
