import { AnalyticLightNode } from './AnalyticLightNode.js';
import { uniform } from '../core/UniformNode.js';
import { mix } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { normalView } from '../accessors/NormalNode.js';
import { objectPosition } from '../accessors/EntityNode.js';

import { Color, HemisphereLight } from '@modules/renderer/engine/engine.js';
import { PositionNode } from '@modules/renderer/engine/nodes/accessors/PositionNode.js';
import { UniformNode } from 'three/examples/jsm/nodes/core/UniformNode.js';
import { NodeBuilder } from '../builder/NodeBuilder.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class HemisphereLightNode extends AnalyticLightNode {
  declare isHemisphereLightNode: true;

  lightPositionNode: PositionNode;
  lightDirectionNode: PositionNode;
  groundColorNode: UniformNode<Color>;
  declare light: HemisphereLight;

  constructor(light: HemisphereLight) {
    super(light);

    this.lightPositionNode = objectPosition(light);
    this.lightDirectionNode = this.lightPositionNode.normalize();
    this.groundColorNode = uniform(Color.new());
  }

  update(frame: NodeFrame): void {
    super.update(frame);
    const { light } = this;

    this.lightPositionNode.entity = light;
    this.groundColorNode.value.from(light.groundColor).scale(light.intensity);
  }

  setup(builder: NodeBuilder): void {
    const { colorNode, groundColorNode, lightDirectionNode } = this;

    const dotNL = normalView.dot(lightDirectionNode);
    const diffuseWeight = dotNL.mul(0.5).add(0.5);
    const irradiance = mix(groundColorNode, colorNode, diffuseWeight);

    builder.context.irradiance.addAssign(irradiance);
  }
}

HemisphereLightNode.prototype.isHemisphereLightNode = true;
