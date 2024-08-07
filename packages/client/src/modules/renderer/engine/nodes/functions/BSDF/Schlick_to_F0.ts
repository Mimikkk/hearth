import { vec3 } from '../../shadernode/ShaderNode.primitves.ts';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';

export const Schlick_to_F0 = hsl(
  ({ f, f90, dotVH }) => {
    const x = dotVH.oneMinus().saturate();
    const x2 = x.mul(x);
    const x5 = x.mul(x2, x2).clamp(0, 0.9999);

    return f.sub(vec3(f90).mul(x5)).div(x5.oneMinus());
  },
  {
    name: 'Schlick_to_F0',
    type: TypeName.vec3,
    inputs: [
      { name: 'f', type: TypeName.vec3 },
      { name: 'f90', type: TypeName.f32 },
      { name: 'dotVH', type: TypeName.f32 },
    ],
  },
);
