import { AnalyticLightNode } from './AnalyticLightNode.js';

export class AmbientLightNode extends AnalyticLightNode {
  constructor(light = null) {
    super(light);
  }

  setup({ context }) {
    context.irradiance.addAssign(this.colorNode);
  }
}


