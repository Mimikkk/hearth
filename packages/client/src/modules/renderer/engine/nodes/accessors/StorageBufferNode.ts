import { BufferNode } from './BufferNode.js';
import { StorageArrayElementNode, storageElement } from '../utils/StorageArrayElementNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { IndexNode } from '@modules/renderer/engine/nodes/core/IndexNode.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { asCommand, asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';

export class StorageBufferNode<A extends Attribute = any> extends BufferNode<A> {
  declare isStorageBufferNode: true;

  constructor(value: A, type: TypeName, count: ConstNode<number> = asNode(0)) {
    super(value, type, count);
  }

  getInputType(): TypeName {
    return TypeName.storageBuffer;
  }

  element(indexNode: IndexNode): StorageArrayElementNode {
    return storageElement(this, indexNode);
  }
}

StorageBufferNode.prototype.isStorageBufferNode = true;

export const storage = asCommand(StorageBufferNode);
