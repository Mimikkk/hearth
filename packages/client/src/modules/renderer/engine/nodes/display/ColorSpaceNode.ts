import { TempNode } from '../core/TempNode.js';
import { mix } from '../math/MathNode.js';
import { addNodeCommand, asNode, hsl, proxyNode, vec4 } from '../shadernode/ShaderNodes.js';
import { ColorSpace } from '@modules/renderer/engine/engine.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class ColorSpaceNode extends TempNode {
  method: NodeVariant;

  constructor(public node: Node) {
    super(TypeName.vec4);
  }

  setup() {
    const { node } = this;

    switch (this.method) {
      case NodeVariant.LinearToLinear:
        return node;
      case NodeVariant.LinearTosRGB:
        return LinearTosRGBShader({ value: node });
      case NodeVariant.sRGBToLinear:
        return sRGBToLinearShader({ value: node });
    }
  }
}

enum NodeVariant {
  LinearToLinear = 'LinearToLinear',
  LinearTosRGB = 'LinearTosRGB',
  sRGBToLinear = 'sRGBToLinear',
}

interface Params {
  value: Node;
}

const sRGBToLinearShader = hsl(({ value }: Params) => {
  const { rgb } = value;

  const a = rgb.mul(0.9478672986).add(0.0521327014).pow(2.4);
  const b = rgb.mul(0.0773993808);
  const factor = rgb.lessThanEqual(0.04045);

  const rgbResult = mix(a, b, factor);

  return vec4(rgbResult, value.a);
});
const LinearTosRGBShader = hsl(({ value }: Params) => {
  const { rgb } = value;

  const a = rgb.pow(0.41666).mul(1.055).sub(0.055);
  const b = rgb.mul(12.92);
  const factor = rgb.lessThanEqual(0.0031308);

  const rgbResult = mix(a, b, factor);

  return vec4(rgbResult, value.a);
});

const getMethod = (source: ColorSpace, to: ColorSpace) => {
  if (source === ColorSpace.LinearSRGB && to === ColorSpace.SRGB) {
    return NodeVariant.LinearTosRGB;
  }
  if (source === ColorSpace.SRGB && to === ColorSpace.LinearSRGB) {
    return NodeVariant.sRGBToLinear;
  }
  return NodeVariant.LinearToLinear;
};

export const linearToColorSpace = (node: Node, colorSpace: ColorSpace) => {
  const method = getMethod(ColorSpace.LinearSRGB, colorSpace);

  const spaceNode = new ColorSpaceNode(asNode(node));
  spaceNode.method = method;

  return asNode(spaceNode);
};
export const colorSpaceToLinear = (node: Node, colorSpace: ColorSpace) => {
  const method = getMethod(colorSpace, ColorSpace.LinearSRGB);

  const spaceNode = new ColorSpaceNode(asNode(node));
  spaceNode.method = method;

  return asNode(spaceNode);
};

export class LinearToSRGBNode extends ColorSpaceNode {
  method = NodeVariant.LinearTosRGB;
}

export class SRGBToLinearNode extends ColorSpaceNode {
  method = NodeVariant.sRGBToLinear;
}

export const linearTosRGB = proxyNode(LinearToSRGBNode);
export const sRGBToLinear = proxyNode(SRGBToLinearNode);

implCommand('linearTosRGB', LinearToSRGBNode);
implCommand('sRGBToLinear', SRGBToLinearNode);
addNodeCommand('linearToColorSpace', linearToColorSpace);
addNodeCommand('colorSpaceToLinear', colorSpaceToLinear);
