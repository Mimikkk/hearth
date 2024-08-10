import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { texture } from './TextureNode.js';
import { buffer } from './BufferNode.js';
import { asCommand, asNode } from '../shadernode/ShaderNode.primitves.ts';
import { uniforms } from './UniformsNode.js';
import { ArrayElementNode } from '../utils/ArrayElementNode.js';
import { ConstNode, NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class ReferenceElementNode extends ArrayElementNode {
  constructor(
    public reference: ReferenceNode,
    index: ConstNode<number>,
  ) {
    super(reference, index);
  }

  getNodeType(): TypeName {
    return this.reference.uniformType;
  }

  generate(builder: NodeBuilder): string {
    const snippet = super.generate(builder);
    const arrayType = this.reference.getNodeType(builder);
    const componentType = this.getNodeType();

    return builder.format(snippet, arrayType, componentType);
  }
}

export class ReferenceNode extends Node {
  properties: string[];
  reference: any;
  node: Node;

  constructor(
    public property: string,
    public uniformType: TypeName,
    public object?: any,
    public count?: ConstNode<number>,
  ) {
    super();

    this.object = object ?? null;
    this.count = count?.value ?? null;

    this.properties = property.split('.');
    this.reference = null;
    this.node = null!;

    this.stage = NodeUpdateStage.Object;
  }

  element(index: NodeVal<number>): ReferenceElementNode {
    return new ReferenceElementNode(this, asNode(index));
  }

  setNodeType(uniformType: TypeName): void {
    let node = null;

    if (this.count !== null) {
      node = buffer(null, uniformType, this.count);
    } else if (Array.isArray(this.getValueFromReference())) {
      node = uniforms(null!, uniformType);
    } else if (uniformType === TypeName.texture) {
      node = texture(null!);
    } else {
      node = uniform(null, uniformType);
    }

    this.node = node;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  getValueFromReference(object = this.reference) {
    const { properties } = this;

    let value = object[properties[0]];

    for (let i = 1; i < properties.length; i++) {
      value = value[properties[i]];
    }

    return value;
  }

  updateReference(state: NodeFrame) {
    this.reference = this.object !== null ? this.object : state.object;

    return this.reference;
  }

  setup() {
    this.updateValue();

    return this.node;
  }

  update(frame: NodeFrame) {
    this.updateValue();
  }

  updateValue() {
    if (this.node === null) this.setNodeType(this.uniformType);

    const value = this.getValueFromReference();

    if (Array.isArray(value)) {
      this.node.array = value;
    } else {
      this.node.value = value;
    }
  }
}

export const ref = asCommand(ReferenceNode);
