import BufferNode from './BufferNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { StorageArrayElementNode, storageElement } from '../utils/StorageArrayElementNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import IndexNode from '@modules/renderer/engine/nodes/core/IndexNode.js';

export class StorageBufferNode extends BufferNode {
  declare isStorageBufferNode: true;
  bufferObject: boolean = false;

  getInputType(): TypeName {
    return TypeName.storageBuffer;
  }

  element(indexNode: IndexNode): StorageArrayElementNode {
    return storageElement(this, indexNode);
  }
}

StorageBufferNode.prototype.isStorageBufferNode = true;

export const storage = (value: Attribute, type: TypeName.vec2, count: number = 0): StorageBufferNode =>
  asNode(new StorageBufferNode(value, type, count));

export const storageObject = (value: Attribute, type: TypeName.vec2, count: number = 0): StorageBufferNode => {
  const node = new StorageBufferNode(value, type, count);
  node.bufferObject = true;

  return asNode(node);
};
