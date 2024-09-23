import { NodeMaterial } from './NodeMaterial.js';
import { shininess, specularColor } from '../core/PropertyNode.js';
import { materialShininess, materialSpecularColor } from '../accessors/MaterialNode.js';
import { f32 } from '../shadernode/ShaderNode.primitves.js';
import { PhongLightModel } from '../functions/PhongLightModel.js';
import { MeshPhongMaterial, MeshPhongMaterialParameters } from '../../entities/materials/MeshPhongMaterial.js';
import { LightModel } from '../../nodes/functions/LightModel.js';

export class MeshPhongNodeMaterial extends NodeMaterial {
  shininessNode: Node | null;
  specularNode: Node | null;

  constructor(parameters?: MeshPhongMaterialParameters) {
    super();

    this.lights = true;
    this.shininessNode = null;
    this.specularNode = null;

    this.setDefaultValues(_parameters);

    this.setValues(parameters);
  }

  setupLightingModel(): LightModel {
    return new PhongLightModel();
  }

  setupVariants() {
    const shininessNode = (this.shininessNode ? f32(this.shininessNode) : materialShininess).max(1e-4);

    shininess.assign(shininessNode);

    const specularNode = this.specularNode || materialSpecularColor;

    specularColor.assign(specularNode);
  }
}

const _parameters = new MeshPhongMaterial();
