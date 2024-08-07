import { Node } from '../core/Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TextureNode } from '@modules/renderer/engine/nodes/accessors/TextureNode.js';

export class TextureSizeNode extends Node {
  constructor(
    public textureNode: TextureNode,
    public levelNode: Node,
  ) {
    super(TypeName.uvec2);
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const textureProperty = this.textureNode.build(builder, 'property');
    const levelNode = this.levelNode.build(builder, 'i32');

    return builder.format(
      `${builder.codeMethod('textureDimensions')}( ${textureProperty}, ${levelNode} )`,
      this.getNodeType(builder),
      output,
    );
  }
}

export const textureSize = asCommand(TextureSizeNode);

implCommand('textureSize', TextureSizeNode);
