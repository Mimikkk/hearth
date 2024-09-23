import { NodeMaterial } from '../../nodes/materials/NodeMaterial.js';
import { matcapUV } from '../../nodes/utils/MatcapUVNode.js';
import { MeshMatcapMaterial, MeshMatcapMaterialParameters } from '../../entities/materials/MeshMatcapMaterial.js';
import { vec3 } from '../../nodes/shadernode/ShaderNode.primitves.js';
import { materialRef } from '../../nodes/accessors/MaterialReferenceNode.js';
import { mix } from '../../nodes/math/MathNode.js';
import { diffuseColor } from '../../nodes/core/PropertyNode.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class MeshMatcapNodeMaterial extends NodeMaterial {
  constructor(parameters?: MeshMatcapMaterialParameters) {
    super();

    this.lights = false;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupVariants(builder: NodeBuilder): Node | void {
    const uv = matcapUV;

    let matcapColor;

    if (builder.material.matcap) {
      matcapColor = materialRef('matcap', 'texture').context({ getUV: () => uv });
    } else {
      matcapColor = vec3(mix(0.2, 0.8, uv.y));
    }

    diffuseColor.rgb.mulAssign(matcapColor.rgb);
  }
}

const _parameters = new MeshMatcapMaterial();
