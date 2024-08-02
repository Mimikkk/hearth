import { transformedNormalView } from '../../accessors/NormalNode.js';
import { positionViewDirection } from '../../accessors/PositionNode.js';
import { sheen, sheenRoughness } from '../../core/PropertyNode.js';
import { f32, tsl } from '../../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const D_Charlie = tsl(
  ({ roughness, dotNH }) => {
    const alpha = roughness.pow2();

    const invAlpha = f32(1.0).div(alpha);
    const cos2h = dotNH.pow2();
    const sin2h = cos2h.oneMinus().max(0.0078125);

    return f32(2.0)
      .add(invAlpha)
      .mul(sin2h.pow(invAlpha.mul(0.5)))
      .div(2.0 * Math.PI);
  },
  {
    name: 'D_Charlie',
    type: TypeName.f32,
    inputs: [
      { name: 'roughness', type: TypeName.f32 },
      { name: 'dotNH', type: TypeName.f32 },
    ],
  },
);

const V_Neubelt = tsl(
  ({ dotNV, dotNL }) => {
    return f32(1.0).div(f32(4.0).mul(dotNL.add(dotNV).sub(dotNL.mul(dotNV))));
  },
  {
    name: 'V_Neubelt',
    type: TypeName.f32,
    inputs: [
      { name: 'dotNV', type: TypeName.f32 },
      { name: 'dotNL', type: TypeName.f32 },
    ],
  },
);

export const BRDF_Sheen = tsl(({ lightDirection }) => {
  const halfDir = lightDirection.add(positionViewDirection).normalize();

  const dotNL = transformedNormalView.dot(lightDirection).clamp();
  const dotNV = transformedNormalView.dot(positionViewDirection).clamp();
  const dotNH = transformedNormalView.dot(halfDir).clamp();

  const D = D_Charlie({ roughness: sheenRoughness, dotNH });
  const V = V_Neubelt({ dotNV, dotNL });

  return sheen.mul(D).mul(V);
});
