import { Node } from '../core/Node.js';
import { addNodeElement, proxyNode } from '../shadernode/ShaderNodes.js';

class TextureSizeNode extends Node {
  static type = 'TextureSizeNode';

  constructor(textureNode, levelNode = null) {
    super('uvec2');

    this.isTextureSizeNode = true;

    this.textureNode = textureNode;
    this.levelNode = levelNode;
  }

  generate(builder, output) {
    const textureProperty = this.textureNode.build(builder, 'property');
    const levelNode = this.levelNode.build(builder, 'i32');

    return builder.format(
      `${builder.codeMethod('textureDimensions')}( ${textureProperty}, ${levelNode} )`,
      this.getNodeType(builder),
      output,
    );
  }
}

export default TextureSizeNode;

export const textureSize = proxyNode(TextureSizeNode);

addNodeElement('textureSize', textureSize);
