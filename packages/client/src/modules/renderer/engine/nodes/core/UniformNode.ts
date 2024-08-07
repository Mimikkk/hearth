import { InputNode } from './InputNode.js';
import { Node } from '../core/Node.js';
import { objectGroup, UniformGroupNode } from './UniformGroupNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import type { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import type { Uniform } from '@modules/renderer/engine/nodes/core/Uniform.js';

export const getConstNodeType = (value?: any | null) =>
  value !== undefined && value !== null
    ? value.nodeType || value.convertTo || (typeof value === 'string' ? value : null)
    : null;

export class UniformNode<T = any> extends InputNode<T> {
  groupNode: UniformGroupNode;

  constructor(value: T, type: TypeName) {
    super(value, type);
    this.groupNode = objectGroup;
  }

  getUniformHash(builder: NodeBuilder): string {
    return this.getHash(builder);
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const type = this.getNodeType(builder);

    const hash = this.getUniformHash(builder);

    let sharedNode = builder.hashNodes[hash];
    if (sharedNode === undefined) {
      builder.hashNodes[hash] = this;
      sharedNode = this;
    }

    const sharedNodeType = sharedNode.getInputType(builder);

    const nodeUniform = builder.getUniformFromNode(
      sharedNode,
      sharedNodeType,
      builder.shaderStage,
      builder.context.label,
    );

    const propertyName = builder.getPropertyName(nodeUniform);
    if (builder.context.label) delete builder.context.label;

    return builder.format(propertyName, type, output);
  }
}

export const uniform = <T>(v: Uniform<T> | T, maybeType?: TypeName): UniformNode<T> => {
  const type = getConstNodeType(maybeType ?? v);
  const value = Node.is(v) ? (v.node?.value ?? v.value) : v;

  return new UniformNode(value, type);
};
