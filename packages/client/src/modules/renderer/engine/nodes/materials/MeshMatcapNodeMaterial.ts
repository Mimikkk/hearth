import { materialReference } from '../accessors/MaterialReferenceNode.js';
import { diffuseColor } from '../core/PropertyNode.js';
import { mix } from '../math/MathNode.js';
import { matcapUV } from '../utils/MatcapUVNode.js';
import { MeshMatcapMaterial } from '@modules/renderer/engine/materials/MeshMatcapMaterial.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { vec3 } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';

const defaultValues = new MeshMatcapMaterial();

export class MeshMatcapNodeMaterial extends NodeMaterial {
  constructor(parameters) {
    super();

    this.isMeshMatcapNodeMaterial = true;

    this.lights = false;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupVariants(builder) {
    const uv = matcapUV;

    let matcapColor;

    if (builder.material.matcap) {
      matcapColor = materialReference('matcap', 'texture').context({ getUV: () => uv });
    } else {
      matcapColor = vec3(mix(0.2, 0.8, uv.y)); // default if matcap is missing
    }

    diffuseColor.rgb.mulAssign(matcapColor.rgb);
  }
}
