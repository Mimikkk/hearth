import AnalyticLightNode from './AnalyticLightNode.js';
import { addLightNode } from './LightsNode.js';

import { AmbientLight } from '../../../threejs/Three.js';

class AmbientLightNode extends AnalyticLightNode {
  static type = 'AmbientLight';

  constructor(light = null) {
    super(light);
  }

  setup({ context }) {
    context.irradiance.addAssign(this.colorNode);
  }
}

export default AmbientLightNode;

addLightNode(AmbientLight, AmbientLightNode);
