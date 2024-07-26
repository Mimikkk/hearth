import TempNode from '../core/TempNode.js';
import { mix } from '../math/MathNode.js';
import { addNodeElement, nodeObject, nodeProxy, tslFn, vec4 } from '../shadernode/ShaderNodes.js';
import { from } from '@modules/renderer/engine/engine.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ColorSpaceNode extends TempNode {
  static type = 'ColorSpaceNode';
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

export default ColorSpaceNode;

interface Params {
  value: Node;
}

const sRGBToLinearShader = tslFn(({ value }: Params) => {
  const { rgb } = value;

  const a = rgb.mul(0.9478672986).add(0.0521327014).pow(2.4);
  const b = rgb.mul(0.0773993808);
  const factor = rgb.lessThanEqual(0.04045);

  const rgbResult = mix(a, b, factor);

  return vec4(rgbResult, value.a);
});
const LinearTosRGBShader = tslFn(({ value }: Params) => {
  const { rgb } = value;

  const a = rgb.pow(0.41666).mul(1.055).sub(0.055);
  const b = rgb.mul(12.92);
  const factor = rgb.lessThanEqual(0.0031308);

  const rgbResult = mix(a, b, factor);

  return vec4(rgbResult, value.a);
});

const getMethod = (source: from, to: from) => {
  if (source === from.LinearSRGB && to === from.SRGB) {
    return NodeVariant.LinearTosRGB;
  }
  if (source === from.SRGB && to === from.LinearSRGB) {
    return NodeVariant.sRGBToLinear;
  }
  return NodeVariant.LinearToLinear;
};

export const linearToColorSpace = (node: Node, colorSpace: from) => {
  const method = getMethod(from.LinearSRGB, colorSpace);

  const spaceNode = new ColorSpaceNode(nodeObject(node));
  spaceNode.method = method;

  return nodeObject(spaceNode);
};
export const colorSpaceToLinear = (node: Node, colorSpace: from) => {
  const method = getMethod(colorSpace, from.LinearSRGB);

  const spaceNode = new ColorSpaceNode(nodeObject(node));
  spaceNode.method = method;

  return nodeObject(spaceNode);
};

export const linearTosRGB = nodeProxy(
  class extends ColorSpaceNode {
    method = NodeVariant.LinearTosRGB;
  },
);
export const sRGBToLinear = nodeProxy(
  class extends ColorSpaceNode {
    method = NodeVariant.sRGBToLinear;
  },
);

addNodeElement('linearTosRGB', linearTosRGB);
addNodeElement('sRGBToLinear', sRGBToLinear);
addNodeElement('linearToColorSpace', linearToColorSpace);
addNodeElement('colorSpaceToLinear', colorSpaceToLinear);
