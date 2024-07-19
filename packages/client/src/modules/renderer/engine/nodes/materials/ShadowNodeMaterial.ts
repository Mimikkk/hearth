import { ShadowMaterial, ShadowMaterialParameters } from '@modules/renderer/engine/materials/ShadowMaterial.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { ShadowMaskModel } from '@modules/renderer/engine/nodes/functions/ShadowMaskModel.js';

const defaultValues = new ShadowMaterial();

export class ShadowNodeMaterial extends NodeMaterial {
  declare isShadowNodeMaterial: true;

  constructor(parameters?: ShadowMaterialParameters) {
    super();
    this.lights = true;

    this.setDefaultValues(defaultValues);
    this.setValues(parameters);
  }

  static is(value: any): value is ShadowNodeMaterial {
    return value?.isShadowNodeMaterial === true;
  }

  setupLightingModel() {
    return new ShadowMaskModel();
  }
}

ShadowNodeMaterial.prototype.isShadowNodeMaterial = true;
