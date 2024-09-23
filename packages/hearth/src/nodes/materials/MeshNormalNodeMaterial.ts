import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor } from '../core/PropertyNode.js';
import { directionToColor } from '../utils/PackingNode.js';
import { materialOpacity } from '../accessors/MaterialNode.js';
import { transformedNormalView } from '../accessors/NormalNode.js';
import { f32, vec4 } from '../shadernode/ShaderNode.primitves.js';
import { MeshNormalMaterial, MeshNormalMaterialParameters } from '../../entities/materials/MeshNormalMaterial.js';

export class MeshNormalNodeMaterial extends NodeMaterial {
  constructor(parameters?: MeshNormalMaterialParameters) {
    super();

    this.colorSpaced = false;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupDiffuseColor() {
    const opacityNode = this.opacityNode ? f32(this.opacityNode) : materialOpacity;

    diffuseColor.assign(vec4(directionToColor(transformedNormalView), opacityNode));
  }
}

const _parameters = new MeshNormalMaterial();
