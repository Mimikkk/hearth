import { TextureNode } from './TextureNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { StorageTexture } from '@modules/renderer/engine/entities/textures/StorageTexture.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export class TextureStoreNode extends TextureNode {
  constructor(value, uvNode, storeNode = null) {
    super(value, uvNode);

    this.storeNode = storeNode;

    this.isStoreTextureNode = true;
  }

  getInputType() {
    return 'storageTexture';
  }

  setup(builder) {
    super.setup(builder);

    const properties = builder.getNodeProperties(this);
    properties.storeNode = this.storeNode;
  }

  generate(builder, output) {
    let snippet;

    if (this.storeNode !== null) {
      snippet = this.generateStore(builder);
    } else {
      snippet = super.generate(builder, output);
    }

    return snippet;
  }

  generateStore(builder) {
    const properties = builder.getNodeProperties(this);

    const { uvNode, storeNode } = properties;

    const textureProperty = super.generate(builder, 'property');
    const uvSnippet = uvNode.build(builder, 'uvec2');
    const storeSnippet = storeNode.build(builder, 'vec4');

    const snippet = builder.codeTextureStore(builder, textureProperty, uvSnippet, storeSnippet);

    builder.addLineFlowCode(snippet);
  }
}

const textureStoreBase = asCommand(TextureStoreNode);

export const textureStore = (value?: StorageTexture, uvNode?: Node, storeNode?: Node) => {
  const node = textureStoreBase(value, uvNode, storeNode);
  if (storeNode) node.append();
  return node;
};
