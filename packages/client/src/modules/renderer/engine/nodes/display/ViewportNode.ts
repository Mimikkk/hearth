import Node from '../core/Node.js';
import { NodeUpdateType } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { nodeImmutable, vec2 } from '../shadernode/ShaderNodes.js';

import { Vec4 } from '@modules/renderer/engine/engine.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { NodeBuilder } from '../Nodes.js';

let resolution = Vec2.new();
let viewportResult = Vec4.new();

export enum ViewportType {
  Coordinate = 'coordinate',
  Resolution = 'resolution',
  Viewport = 'viewport',
  TopLeft = 'topLeft',
  BottomLeft = 'bottomLeft',
  TopRight = 'topRight',
  BottomRight = 'bottomRight',
}

export class ViewportNode extends Node {
  static type = 'ViewportNode';

  constructor(public scope: ViewportType) {
    super();
  }

  getNodeType() {
    return this.scope === ViewportType.Viewport ? 'vec4' : 'vec2';
  }

  getUpdateType() {
    let updateType = NodeUpdateType.None;

    if (this.scope === ViewportType.Resolution || this.scope === ViewportType.Viewport) {
      updateType = NodeUpdateType.Frame;
    }

    this.updateType = updateType;

    return updateType;
  }

  update({ renderer }) {
    if (this.scope === ViewportType.Viewport) {
      renderer.getViewport(viewportResult);
    } else {
      renderer.getDrawingBufferSize(resolution);
    }
  }

  setup() {
    const { scope } = this;

    switch (scope) {
      case ViewportType.Resolution:
        return uniform(resolution);
      case ViewportType.Viewport:
        return uniform(viewportResult);
      default:
        const output = viewportCoordinate.div(viewportResolution);

        let outX = output.x;
        let outY = output.y;
        if (scope === ViewportType.BottomLeft || scope === ViewportType.BottomRight) outY = outY.oneMinus();
        if (scope === ViewportType.TopRight || scope === ViewportType.BottomRight) outX = outX.oneMinus();

        return vec2(outX, outY);
    }
  }

  generate(builder: NodeBuilder): undefined | string {
    if (this.scope !== ViewportType.Coordinate) return super.generate(builder);

    let coordinate = builder.getFragCoord();

    if (!builder.isFlipY()) return coordinate;

    const resolution = builder.getNodeProperties(viewportResolution).outputNode.build(builder);
    return `${builder.getType('vec2')}( ${coordinate}.x, ${resolution}.y - ${coordinate}.y )`;
  }
}

export default ViewportNode;

export const viewportCoordinate = nodeImmutable(ViewportNode, ViewportType.Coordinate);
export const viewportResolution = nodeImmutable(ViewportNode, ViewportType.Resolution);
export const viewport = nodeImmutable(ViewportNode, ViewportType.Viewport);
export const viewportTopLeft = nodeImmutable(ViewportNode, ViewportType.TopLeft);
export const viewportBottomLeft = nodeImmutable(ViewportNode, ViewportType.BottomLeft);
export const viewportTopRight = nodeImmutable(ViewportNode, ViewportType.TopRight);
export const viewportBottomRight = nodeImmutable(ViewportNode, ViewportType.BottomRight);
