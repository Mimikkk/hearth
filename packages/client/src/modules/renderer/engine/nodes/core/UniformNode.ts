import { InputNode } from './InputNode.js';
import { Node } from '../core/Node.js';
import { objectGroup } from './UniformGroupNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { UniformGroupNode } from '@modules/renderer/engine/nodes/Nodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

export const getConstNodeType = (value?: any | null) =>
  value !== undefined && value !== null
    ? value.nodeType || value.convertTo || (typeof value === 'string' ? value : null)
    : null;

export class UniformNode<T> extends InputNode<T> {
  static type = 'UniformNode';
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

export default UniformNode;

export const uniform = <T>(v: NodeUniform<T> | T, maybeType?: TypeName): UniformNode<T> => {
  const type = getConstNodeType(maybeType ?? v);
  const value = Node.is(v) ? (v.node?.value ?? v.value) : v;

  return asNode(new UniformNode(value, type));
};
