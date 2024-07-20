import AnalyticLightNode from './AnalyticLightNode.js';

class AmbientLightNode extends AnalyticLightNode {
  static type = 'AmbientLightNode';

  constructor(light = null) {
    super(light);
  }

  setup({ context }) {
    context.irradiance.addAssign(this.colorNode);
  }
}

export default AmbientLightNode;
