import { NodeMaterial } from './NodeMaterial.js';
import { diffuseColor, metalness, roughness, specularColor } from '../core/PropertyNode.js';
import { mix } from '../../nodes/math/MathNode.js';
import { materialMetalness, materialRoughness } from '../accessors/MaterialNode.js';
import { getRoughness } from '../functions/material/getRoughness.js';
import { PhysicalLightModel } from '../functions/PhysicalLightModel.js';
import { f32, vec3, vec4 } from '../shadernode/ShaderNode.primitves.js';
import { Node } from '../core/Node.js';
import { MeshStandardMaterial, MeshStandardMaterialParameters } from '../../entities/materials/MeshStandardMaterial.js';
import { LightModel } from '../../nodes/functions/LightModel.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class MeshStandardNodeMaterial extends NodeMaterial {
  emissiveNode: Node | null;
  metalnessNode: Node | null;
  roughnessNode: Node | null;

  constructor(parameters?: MeshStandardMaterialParameters) {
    super();

    this.emissiveNode = null;
    this.metalnessNode = null;
    this.roughnessNode = null;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupLightingModel(): LightModel {
    return new PhysicalLightModel();
  }

  setupVariants(builder: NodeBuilder): void {
    const metalnessNode = this.metalnessNode ? f32(this.metalnessNode) : materialMetalness;
    metalness.assign(metalnessNode);

    let roughnessNode = this.roughnessNode ? f32(this.roughnessNode) : materialRoughness;
    roughnessNode = getRoughness({ roughness: roughnessNode });

    roughness.assign(roughnessNode);

    const specularColorNode = mix(vec3(0.04), diffuseColor.rgb, metalnessNode);
    specularColor.assign(specularColorNode);

    diffuseColor.assign(vec4(diffuseColor.rgb.mul(metalnessNode.oneMinus()), diffuseColor.a));
  }
}

const _parameters = new MeshStandardMaterial();
