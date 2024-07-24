import Node from './Node.js';
import NodeCache from './NodeCache.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/nodes/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/renderers/nodes/NodeBuilder.types.js';

class CacheNode extends Node {
  static type = 'CacheNode';
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

export default CacheNode;

export const cache = nodeProxy(CacheNode);
export const globalCache = <T extends Node>(node: T) => cache(node, null);

addNodeElement('cache', cache);
addNodeElement('globalCache', globalCache);
