import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor } from '../core/PropertyNode.js';
import { directionToColor } from '../utils/PackingNode.js';
import { materialOpacity } from '../accessors/MaterialNode.js';
import { transformedNormalView } from '../accessors/NormalNode.js';
import { f32, vec4 } from '../shadernode/ShaderNodes.js';
import { MeshNormalMaterial } from '@modules/renderer/engine/entities/materials/MeshNormalMaterial.js';

const defaultValues = new MeshNormalMaterial();

export class MeshNormalNodeMaterial extends NodeMaterial {
  static type = 'MeshNormalNodeMaterial';

  constructor(parameters) {
    super();

    this.isMeshNormalNodeMaterial = true;

    this.colorSpaced = false;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupDiffuseColor() {
    const opacityNode = this.opacityNode ? f32(this.opacityNode) : materialOpacity;

    diffuseColor.assign(vec4(directionToColor(transformedNormalView), opacityNode));
  }
}
