import { tsl, vec2, vec4 } from '../../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export const DFGApprox = tsl(
  ({ roughness, dotNV }) => {
    const c0 = vec4(-1, -0.0275, -0.572, 0.022);

    const c1 = vec4(1, 0.0425, 1.04, -0.04);

    const r = roughness.mul(c0).add(c1);

    const a004 = r.x.mul(r.x).min(dotNV.mul(-9.28).exp2()).mul(r.x).add(r.y);

    return vec2(-1.04, 1.04).mul(a004).add(r.zw);
  },
  {
    name: 'DFGApprox',
    type: TypeName.vec2,
    inputs: [
      { name: 'roughness', type: TypeName.f32 },
      { name: 'dotNV', type: TypeName.vec3 },
    ],
  },
);
