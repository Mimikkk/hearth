import { Node } from '../core/Node.js';
import { add } from '../math/OperatorNode.js';
import { normalLocal } from '../accessors/NormalNode.js';
import { positionLocal } from '../accessors/PositionNode.js';
import { texture } from '../accessors/TextureNode.js';
import { addNodeCommand, f32, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';

export class TriplanarTexturesNode extends Node {
  constructor(
    textureXNode,
    textureYNode = null,
    textureZNode = null,
    scaleNode = f32(1),
    positionNode = positionLocal,
    normalNode = normalLocal,
  ) {
    super('vec4');

    this.textureXNode = textureXNode;
    this.textureYNode = textureYNode;
    this.textureZNode = textureZNode;

    this.scaleNode = scaleNode;

    this.positionNode = positionNode;
    this.normalNode = normalNode;
  }

  setup() {
    const { textureXNode, textureYNode, textureZNode, scaleNode, positionNode, normalNode } = this;

    let bf = normalNode.abs().normalize();
    bf = bf.div(bf.dot(vec3(1.0)));

    const tx = positionNode.yz.mul(scaleNode);
    const ty = positionNode.zx.mul(scaleNode);
    const tz = positionNode.xy.mul(scaleNode);

    const textureX = textureXNode.value;
    const textureY = textureYNode !== null ? textureYNode.value : textureX;
    const textureZ = textureZNode !== null ? textureZNode.value : textureX;

    const cx = texture(textureX, tx).mul(bf.x);
    const cy = texture(textureY, ty).mul(bf.y);
    const cz = texture(textureZ, tz).mul(bf.z);

    return add(cx, cy, cz);
  }
}

export const triplanarTextures = proxyNode(TriplanarTexturesNode);
export const triplanarTexture = (...params) => triplanarTextures(...params);

addNodeCommand('triplanarTexture', triplanarTexture);
