import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { fixedNode, vec2 } from '../shadernode/ShaderNodes.js';

import { Vec2, Vec4 } from '@modules/renderer/engine/engine.js';

let resolution, viewportResult;

class ViewportNode extends Node {
  static type = 'ViewportNode';

  constructor(scope) {
    super();

    this.scope = scope;

    this.isViewportNode = true;
  }

  getNodeType() {
    return this.scope === ViewportNode.VIEWPORT ? 'vec4' : 'vec2';
  }

  getUpdateType() {
    let stage = NodeUpdateStage.None;

    if (this.scope === ViewportNode.RESOLUTION || this.scope === ViewportNode.VIEWPORT) {
      stage = NodeUpdateStage.Frame;
    }

    this.stage = stage;

    return stage;
  }

  update({ hearth }) {
    if (this.scope === ViewportNode.VIEWPORT) {
      viewportResult.from(hearth.viewport);
    } else {
      hearth.getDrawSize(resolution);
    }
  }

  setup(builder) {
    const scope = this.scope;

    let output = null;

    if (scope === ViewportNode.RESOLUTION) {
      output = uniform(resolution || (resolution = Vec2.new()));
    } else if (scope === ViewportNode.VIEWPORT) {
      output = uniform(viewportResult || (viewportResult = Vec4.new()));
    } else {
      output = viewportCoordinate.div(viewportResolution);

      let outX = output.x;
      let outY = output.y;

      if (/bottom/i.test(scope)) outY = outY.oneMinus();
      if (/right/i.test(scope)) outX = outX.oneMinus();

      output = vec2(outX, outY);
    }

    return output;
  }

  generate(builder) {
    if (this.scope === ViewportNode.COORDINATE) return builder.useFragCoord();
    return super.generate(builder);
  }
}

ViewportNode.COORDINATE = 'coordinate';
ViewportNode.RESOLUTION = 'resolution';
ViewportNode.VIEWPORT = 'viewport';
ViewportNode.TOP_LEFT = 'topLeft';
ViewportNode.BOTTOM_LEFT = 'bottomLeft';
ViewportNode.TOP_RIGHT = 'topRight';
ViewportNode.BOTTOM_RIGHT = 'bottomRight';

export default ViewportNode;

export const viewportCoordinate = fixedNode(ViewportNode, ViewportNode.COORDINATE);
export const viewportResolution = fixedNode(ViewportNode, ViewportNode.RESOLUTION);
export const viewport = fixedNode(ViewportNode, ViewportNode.VIEWPORT);
export const viewportTopLeft = fixedNode(ViewportNode, ViewportNode.TOP_LEFT);
export const viewportBottomLeft = fixedNode(ViewportNode, ViewportNode.BOTTOM_LEFT);
export const viewportTopRight = fixedNode(ViewportNode, ViewportNode.TOP_RIGHT);
export const viewportBottomRight = fixedNode(ViewportNode, ViewportNode.BOTTOM_RIGHT);
