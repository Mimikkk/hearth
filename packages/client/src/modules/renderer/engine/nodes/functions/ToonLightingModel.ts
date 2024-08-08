import { hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';
import { vec2 } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';
import { BRDF_Lambert } from './BSDF/BRDF_Lambert.ts';
import { normalGeometry } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { diffuseColor } from '@modules/renderer/engine/nodes/core/PropertyNode.js';

const getGradientIrradiance = hsl(({ normal, lightDirection, builder }) => {
  // dotNL will be from -1.0 to 1.0
  const dotNL = normal.dot(lightDirection);
  const coord = vec2(dotNL.mul(0.5).add(0.5), 0.0);

  if (builder.material.gradientMap) {
    const gradientMap = materialReference('gradientMap', 'texture').context({ getUV: () => coord });

    return vec3(gradientMap.r);
  } else {
    const fw = coord.fwidth().mul(0.5);

    return mix(vec3(0.7), vec3(1.0), smoothstep(float(0.7).sub(fw.x), float(0.7).add(fw.x), coord.x));
  }
});

export class ToonLightModel extends LightModel {
  direct({ lightDirection, lightColor, reflectedLight }, stack, builder) {
    const irradiance = getGradientIrradiance({ normal: normalGeometry, lightDirection, builder }).mul(lightColor);
    reflectedLight.directDiffuse.addAssign(irradiance.mul(BRDF_Lambert({ diffuseColor: diffuseColor.rgb })));
  }

  indirect({ ambientOcclusion, irradiance, reflectedLight }) {
    reflectedLight.indirectDiffuse.addAssign(irradiance.mul(BRDF_Lambert({ diffuseColor })));
    reflectedLight.indirectDiffuse.mulAssign(ambientOcclusion);
  }
}
