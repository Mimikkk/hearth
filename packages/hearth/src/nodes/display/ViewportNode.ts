import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { vec2 } from '../shadernode/ShaderNode.primitves.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import NodeFrame from '../../nodes/core/NodeFrame.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec4 } from '../../math/Vec4.js';

export class ViewportNode extends Node {
  constructor(public scope: Variant) {
    super();
  }

  getNodeType(): TypeName {
    return this.scope === Variant.Viewport ? TypeName.vec4 : TypeName.vec2;
  }

  getUpdateType(): NodeUpdateStage {
    let stage = NodeUpdateStage.None;

    if (this.scope === Variant.Resolution || this.scope === Variant.Viewport) {
      stage = NodeUpdateStage.Frame;
    }

    this.stage = stage;

    return stage;
  }

  update({ hearth }: NodeFrame): void {
    if (this.scope === Variant.Viewport) {
      _viewport.from(hearth.viewport);
    } else {
      hearth.getDrawSize(_resolution);
    }
  }

  setup(builder: NodeBuilder): Node {
    const scope = this.scope;

    if (scope === Variant.Resolution) {
      return uniform(_resolution);
    }
    if (scope === Variant.Viewport) {
      return uniform(_viewport);
    }
    let { x, y } = viewportCoordinate.div(viewportResolution);

    if (scope === Variant.BottomLeft || scope === Variant.BottomRight) y = y.oneMinus();
    if (scope === Variant.TopRight || scope === Variant.BottomRight) x = x.oneMinus();

    return vec2(x, y);
  }

  generate(builder: NodeBuilder): string {
    if (this.scope === Variant.Coordinate) return builder.useFragCoord();
    return super.generate(builder);
  }
}

enum Variant {
  Coordinate = 'coordinate',
  Resolution = 'resolution',
  Viewport = 'viewport',
  TopLeft = 'topLeft',
  BottomLeft = 'bottomLeft',
  TopRight = 'topRight',
  BottomRight = 'bottomRight',
}

let _resolution = Vec2.new();
let _viewport = Vec4.new();

export const viewportCoordinate = new ViewportNode(Variant.Coordinate);
export const viewportResolution = new ViewportNode(Variant.Resolution);
export const viewport = new ViewportNode(Variant.Viewport);
export const viewportTopLeft = new ViewportNode(Variant.TopLeft);
export const viewportBottomLeft = new ViewportNode(Variant.BottomLeft);
export const viewportTopRight = new ViewportNode(Variant.TopRight);
export const viewportBottomRight = new ViewportNode(Variant.BottomRight);
