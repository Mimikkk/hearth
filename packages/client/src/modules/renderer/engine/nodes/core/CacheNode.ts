import Node from './Node.js';
import NodeCache from './NodeCache.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

class CacheNode extends Node {
  static type = 'CacheNode';
  node: Node;
  cache: NodeCache;

  constructor(node: Node, cache = new NodeCache()) {
    super();

    this.node = node;
    this.cache = cache;
  }

  getNodeType(builder: NodeBuilder) {
    return this.node.getNodeType(builder);
  }

  build(builder: NodeBuilder, ...params) {
    const previousCache = builder.cache;
    builder.cache = this.cache || builder.globalCache;

    const data = this.node.build(builder, ...params);

    builder.cache = previousCache;

    return data;
  }
}

export default CacheNode;

export const cache = nodeProxy(CacheNode);
export const globalCache = node => cache(node, null);

addNodeElement('cache', cache);
addNodeElement('globalCache', globalCache);
