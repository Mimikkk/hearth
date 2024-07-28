import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor, metalness, roughness, specularColor } from '../core/PropertyNode.js';
import { mix } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { materialMetalness, materialRoughness } from '../accessors/MaterialNode.js';
import getRoughness from '../functions/material/getRoughness.js';
import PhysicalLightModel from '../functions/PhysicalLightModel.js';
import { f32, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { Node } from '../core/Node.js';

import { MeshStandardMaterial } from '@modules/renderer/engine/engine.js';

const _defaults = new MeshStandardMaterial();

export class MeshStandardNodeMaterial extends NodeMaterial {
  static type = 'MeshStandardNodeMaterial';
  emissiveNode: Node | null;
  metalnessNode: Node | null;
  roughnessNode: Node | null;

  constructor(parameters) {
    super();

    this.emissiveNode = null;
    this.metalnessNode = null;
    this.roughnessNode = null;

    this.setDefaultValues(_defaults);

    this.setValues(parameters);
  }

  setupLightingModel() {
    return new PhysicalLightModel();
  }

  setupVariants() {
    const metalnessNode = this.metalnessNode ? f32(this.metalnessNode) : materialMetalness;
    metalness.assign(metalnessNode);

    let roughnessNode = this.roughnessNode ? f32(this.roughnessNode) : materialRoughness;
    roughnessNode = getRoughness({ roughness: roughnessNode });

    roughness.assign(roughnessNode);

    const specularColorNode = mix(vec3(0.04), diffuseColor.rgb, metalnessNode);
    specularColor.assign(specularColorNode);

    diffuseColor.assign(vec4(diffuseColor.rgb.mul(metalnessNode.oneMinus()), diffuseColor.a));
  }

  copy(source) {
    this.emissiveNode = source.emissiveNode;

    this.metalnessNode = source.metalnessNode;
    this.roughnessNode = source.roughnessNode;

    return super.copy(source);
  }
}
