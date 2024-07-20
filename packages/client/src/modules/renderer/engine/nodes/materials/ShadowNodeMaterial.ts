import { ShadowMaterial } from '@modules/renderer/engine/materials/ShadowMaterial.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { ShadowMaskModel } from '@modules/renderer/engine/nodes/functions/ShadowMaskModel.js';

const defaultValues = new ShadowMaterial();

export class ShadowNodeMaterial extends NodeMaterial {
  constructor(parameters) {
    super();

    this.isShadowNodeMaterial = true;

    this.lights = true;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupLightingModel(/*builder*/) {
    return new ShadowMaskModel();
  }
}
