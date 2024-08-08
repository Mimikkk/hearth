import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { matcapUV } from '@modules/renderer/engine/nodes/utils/MatcapUVNode.js';
import {
  MeshMatcapMaterial,
  MeshMatcapMaterialParameters,
} from '@modules/renderer/engine/entities/materials/MeshMatcapMaterial.js';
import { vec3 } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { materialRef } from '@modules/renderer/engine/nodes/accessors/MaterialReferenceNode.js';
import { mix } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { diffuseColor } from '@modules/renderer/engine/nodes/core/PropertyNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

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
