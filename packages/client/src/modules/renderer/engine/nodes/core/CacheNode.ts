import { Node } from './Node.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class CacheNode extends Node {
  constructor(
    public node: Node,
    public cache: WeakMap<any, any> | null = new WeakMap(),
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  build(builder: NodeBuilder, type?: TypeName): string {
    const previous = builder.cache;

    builder.cache = this.cache ?? builder.globalCache;
    const code = this.node.build(builder, type);
    builder.cache = previous;

    return code;
  }
}

export const cache = asCommand(CacheNode);

export class GlobalCacheNode extends CacheNode {
  constructor(node: Node) {
    super(node, null);
  }
}

export const globalCache = <T extends Node>(node: T) => cache(node, null);

implCommand('cache', CacheNode);
implCommand('globalCache', GlobalCacheNode);
