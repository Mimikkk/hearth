import InputNode from './InputNode.js';
import { Node } from '../core/Node.js';
import { objectGroup } from './UniformGroupNode.js';
import { nodeObject } from '../shadernode/ShaderNodes.js';

export const getConstNodeType = value =>
  value !== undefined && value !== null
    ? value.nodeType || value.convertTo || (typeof value === 'string' ? value : null)
    : null;

class UniformNode extends InputNode {
  static type = 'UniformNode';

  constructor(value, nodeType = null) {
    super(value, nodeType);

    this.isUniformNode = true;

    this.groupNode = objectGroup;
  }

  setGroup(group) {
    this.groupNode = group;

    return this;
  }

  getGroup() {
    return this.groupNode;
  }

  getUniformHash(builder) {
    return this.getHash(builder);
  }

  generate(builder, output) {
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

    if (builder.context.label !== undefined) delete builder.context.label;

    return builder.format(propertyName, type, output);
  }
}

export default UniformNode;

export const uniform = <T>(nodeOrValue: Node | T, maybeValue?: T): UniformNode<T> => {
  const type = getConstNodeType(maybeValue ?? nodeOrValue);
  const value = Node.is(nodeOrValue) ? nodeOrValue.node?.value ?? nodeOrValue.value : nodeOrValue;

  return nodeObject(new UniformNode(value, type));
};
