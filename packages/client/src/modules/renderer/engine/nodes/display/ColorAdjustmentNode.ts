import { TempNode } from '../core/TempNode.js';
import { dot, mix } from '../math/MathNode.js';
import { add } from '../math/OperatorNode.js';
import { addNodeCommand, f32, hsl, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class ColorAdjustmentNode extends TempNode {
  method: NodeVariant;
  colorNode: Node;
  adjustmentNode: Node;

  constructor(colorNode: Node, adjustmentNode = f32(1)) {
    super(TypeName.vec3);

    this.colorNode = colorNode;
    this.adjustmentNode = adjustmentNode;
  }

  setup() {
    const { colorNode: color, adjustmentNode: adjustment } = this;
    const params = { color, adjustment };

    switch (this.method) {
      case NodeVariant.Saturation:
        return calculateSaturation(params);
      case NodeVariant.Vibrance:
        return calculateVibrance(params);
      case NodeVariant.Hue:
        return calculateHue(params);
    }
  }
}

enum NodeVariant {
  Saturation = 'saturation',
  Vibrance = 'vibrance',
  Hue = 'hue',
}

const calculateSaturation = hsl(({ color, adjustment }) => {
  return adjustment.mix(luminance(color.rgb), color.rgb);
});

export class SaturationAdjustmentNode extends ColorAdjustmentNode {
  method = NodeVariant.Saturation;
}

export class VibranceAdjustmentNode extends ColorAdjustmentNode {
  method = NodeVariant.Vibrance;
}

export class HueAdjustmentNode extends ColorAdjustmentNode {
  method = NodeVariant.Hue;
}

implCommand('saturation', SaturationAdjustmentNode);
implCommand('vibrance', VibranceAdjustmentNode);
implCommand('hue', HueAdjustmentNode);

export const saturation = proxyNode(SaturationAdjustmentNode);

const calculateVibrance = hsl(({ color, adjustment }) => {
  const average = add(color.r, color.g, color.b).div(3.0);

  const mx = color.r.max(color.g.max(color.b));
  const amt = mx.sub(average).mul(adjustment).mul(-3.0);

  return mix(color.rgb, mx, amt);
});
export const vibrance = proxyNode(VibranceAdjustmentNode);

const k = vec3(0.57735, 0.57735, 0.57735);
const calculateHue = hsl(({ color, adjustment }) => {
  const cosAngle = adjustment.cos();

  return vec3(
    color.rgb.mul(cosAngle).add(
      k
        .cross(color.rgb)
        .mul(adjustment.sin())
        .add(k.mul(dot(k, color.rgb).mul(cosAngle.oneMinus()))),
    ),
  );
});
export const hue = proxyNode(HueAdjustmentNode);

export const lumaCoeffs = vec3(0.2125, 0.7154, 0.0721);
export const luminance = (color, luma = lumaCoeffs) => dot(color, luma);

export const threshold = (color, threshold) => mix(vec3(0.0), color, luminance(color).sub(threshold).max(0));
addNodeCommand('threshold', threshold);
