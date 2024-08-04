import { Node } from './Node.js';
import { NodeCache } from './NodeCache.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class CacheNode extends Node {
  node: Node;
  cache: NodeCache;

  constructor(node: Node, cache: NodeCache = new NodeCache()) {
    super();

    this.node = node;
    this.cache = cache;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  build(builder: NodeBuilder, type?: TypeName) {
    const previousCache = builder.cache;

    builder.cache = this.cache || builder.globalCache;
    const data = this.node.build(builder, type);
    builder.cache = previousCache;

    return data;
  }
}

export const cache = proxyNode(CacheNode);
export const globalCache = <T extends Node>(node: T) => cache(node, null);

addNodeCommand('cache', cache);
addNodeCommand('globalCache', globalCache);
