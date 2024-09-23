import { PhysicalLightModel } from '../../nodes/functions/PhysicalLightModel.js';
import { transformedNormalView } from '../../nodes/accessors/NormalNode.js';
import { f32, vec3 } from '../../nodes/shadernode/ShaderNode.primitves.js';
import { positionViewDirection } from '../../nodes/accessors/PositionNode.js';

export class SSSLightingModel extends PhysicalLightModel {
  constructor(useClearcoat, useSheen, useIridescence, useSSS) {
    super(useClearcoat, useSheen, useIridescence);

    this.useSSS = useSSS;
  }

  direct({ lightDirection, lightColor, reflectedLight }, stack, builder) {
    if (this.useSSS === true) {
      const material = builder.material;

      const {
        thicknessColorNode,
        thicknessDistortionNode,
        thicknessAmbientNode,
        thicknessAttenuationNode,
        thicknessPowerNode,
        thicknessScaleNode,
      } = material;

      const scatteringHalf = lightDirection.add(transformedNormalView.mul(thicknessDistortionNode)).normalize();
      const scatteringDot = f32(
        positionViewDirection.dot(scatteringHalf.negate()).saturate().pow(thicknessPowerNode).mul(thicknessScaleNode),
      );
      const scatteringIllu = vec3(scatteringDot.add(thicknessAmbientNode).mul(thicknessColorNode));

      reflectedLight.directDiffuse.addAssign(scatteringIllu.mul(thicknessAttenuationNode.mul(lightColor)));
    }

    super.direct({ lightDirection, lightColor, reflectedLight }, stack, builder);
  }
}
