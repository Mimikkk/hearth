import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor } from '../core/PropertyNode.js';
import { directionToColor } from '../utils/PackingNode.js';
import { materialOpacity } from '../accessors/MaterialNode.js';
import { transformedNormalView } from '../accessors/NormalNode.js';
import { float, vec4 } from '../shadernode/ShaderNodes.js';

import { MeshNormalMaterial } from '../../../threejs/Three.js';

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
    const opacityNode = this.opacityNode ? float(this.opacityNode) : materialOpacity;

    diffuseColor.assign(vec4(directionToColor(transformedNormalView), opacityNode));
  }
}
