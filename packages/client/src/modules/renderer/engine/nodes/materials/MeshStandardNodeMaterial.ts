import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor, metalness, roughness, specularColor } from '../core/PropertyNode.js';
import { mix } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { materialMetalness, materialRoughness } from '../accessors/MaterialNode.js';
import getRoughness from '../functions/material/getRoughness.js';
import PhysicalLightingModel from '../functions/PhysicalLightingModel.js';
import { float, vec3, vec4 } from '../shadernode/ShaderNode.js';

import { MeshStandardMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new MeshStandardMaterial();

export class MeshStandardNodeMaterial extends NodeMaterial {
  static type = 'MeshStandardNodeMaterial';

  constructor(parameters) {
    super();

    this.isMeshStandardNodeMaterial = true;

    this.emissiveNode = null;

    this.metalnessNode = null;
    this.roughnessNode = null;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupLightingModel(/*builder*/) {
    return new PhysicalLightingModel();
  }

  setupVariants() {
    // METALNESS

    const metalnessNode = this.metalnessNode ? float(this.metalnessNode) : materialMetalness;

    metalness.assign(metalnessNode);

    // ROUGHNESS

    let roughnessNode = this.roughnessNode ? float(this.roughnessNode) : materialRoughness;
    roughnessNode = getRoughness({ roughness: roughnessNode });

    roughness.assign(roughnessNode);

    // SPECULAR COLOR

    const specularColorNode = mix(vec3(0.04), diffuseColor.rgb, metalnessNode);

    specularColor.assign(specularColorNode);

    // DIFFUSE COLOR

    diffuseColor.assign(vec4(diffuseColor.rgb.mul(metalnessNode.oneMinus()), diffuseColor.a));
  }

  copy(source) {
    this.emissiveNode = source.emissiveNode;

    this.metalnessNode = source.metalnessNode;
    this.roughnessNode = source.roughnessNode;

    return super.copy(source);
  }
}
