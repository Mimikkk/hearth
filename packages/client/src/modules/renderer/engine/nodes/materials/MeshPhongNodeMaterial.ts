import { NodeMaterial } from './NodeMaterial.js';
import { shininess, specularColor } from '../core/PropertyNode.js';
import { materialShininess, materialSpecularColor } from '../accessors/MaterialNode.js';
import { f32 } from '../shadernode/ShaderNodes.js';
import PhongLightModel from '../functions/PhongLightModel.js';

import { MeshPhongMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new MeshPhongMaterial();

export class MeshPhongNodeMaterial extends NodeMaterial {
  static type = 'MeshPhongNodeMaterial';

  constructor(parameters) {
    super();

    this.isMeshPhongNodeMaterial = true;

    this.lights = true;

    this.shininessNode = null;
    this.specularNode = null;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupLightingModel() {
    return new PhongLightModel();
  }

  setupVariants() {
    const shininessNode = (this.shininessNode ? f32(this.shininessNode) : materialShininess).max(1e-4);

    shininess.assign(shininessNode);

    const specularNode = this.specularNode || materialSpecularColor;

    specularColor.assign(specularNode);
  }

  copy(source) {
    this.shininessNode = source.shininessNode;
    this.specularNode = source.specularNode;

    return super.copy(source);
  }
}
