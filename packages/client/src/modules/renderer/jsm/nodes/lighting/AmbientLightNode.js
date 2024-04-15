import AnalyticLightNode from './AnalyticLightNode.js';
import { addLightNode } from './LightsNode.js';
import { addNodeClass } from '../core/Node.js';

import { AmbientLight } from '../../../threejs/Three.js';

class AmbientLightNode extends AnalyticLightNode {
  constructor(light = null) {
    super(light);
  }

  setup({ context }) {
    context.irradiance.addAssign(this.colorNode);
  }
}

export default AmbientLightNode;

addNodeClass('AmbientLightNode', AmbientLightNode);

addLightNode(AmbientLight, AmbientLightNode);
