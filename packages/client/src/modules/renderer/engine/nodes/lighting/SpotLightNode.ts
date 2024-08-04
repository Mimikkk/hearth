import { AnalyticLightNode } from './AnalyticLightNode.js';
import { lightTargetDirection } from './LightNode.js';
import { getDistanceAttenuation } from './LightUtils.js';
import { uniform } from '../core/UniformNode.js';
import { smoothstep } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { objectViewPosition } from '../accessors/EntityNode.js';
import { positionView } from '../accessors/PositionNode.js';

export class SpotLightNode extends AnalyticLightNode {
  constructor(light = null) {
    super(light);

    this.coneCosNode = uniform(0);
    this.penumbraCosNode = uniform(0);

    this.cutoffDistanceNode = uniform(0);
    this.decayExponentNode = uniform(0);
  }

  update(frame) {
    super.update(frame);

    const { light } = this;

    this.coneCosNode.value = Math.cos(light.angle);
    this.penumbraCosNode.value = Math.cos(light.angle * (1 - light.penumbra));

    this.cutoffDistanceNode.value = light.distance;
    this.decayExponentNode.value = light.decay;
  }

  getSpotAttenuation(angleCosine) {
    const { coneCosNode, penumbraCosNode } = this;

    return smoothstep(coneCosNode, penumbraCosNode, angleCosine);
  }

  setup(builder) {
    super.setup(builder);

    const lightingModel = builder.context.lightingModel;

    const { colorNode, cutoffDistanceNode, decayExponentNode, light } = this;

    const lVector = objectViewPosition(light).sub(positionView);

    const lightDirection = lVector.normalize();
    const angleCos = lightDirection.dot(lightTargetDirection(light));
    const spotAttenuation = this.getSpotAttenuation(angleCos);

    const lightDistance = lVector.length();

    const lightAttenuation = getDistanceAttenuation({
      lightDistance,
      cutoffDistance: cutoffDistanceNode,
      decayExponent: decayExponentNode,
    });

    const lightColor = colorNode.mul(spotAttenuation).mul(lightAttenuation);

    const reflectedLight = builder.context.reflectedLight;

    lightingModel.direct(
      {
        lightDirection,
        lightColor,
        reflectedLight,
      },
      builder.stack,
      builder,
    );
  }
}


