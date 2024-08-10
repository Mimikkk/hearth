import { asCommand, asNode } from '../shadernode/ShaderNode.primitves.ts';
import { NodeUpdateStage } from '../core/constants.js';
import { ArrayElementNode } from '../utils/ArrayElementNode.js';
import { BufferNode } from './BufferNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export class UniformsElementNode extends ArrayElementNode {
  constructor(arrayBuffer: UniformsNode, indexNode: ConstNode<number>) {
    super(arrayBuffer, indexNode);
  }

  getNodeType(): TypeName {
    return (this.array as UniformsNode).getElementType();
  }

  generate(builder: NodeBuilder): string {
    const snippet = super.generate(builder);
    const type = this.getNodeType();

    return builder.format(snippet, TypeName.vec4, type);
  }
}

export class UniformsNode<T extends Node = any> extends BufferNode<Float32Array> {
  array: T[];
  elementType: TypeName;
  _elementType: TypeName | null;
  _elementLength: number;

  constructor(array: T[], elementType: TypeName) {
    super(null!, TypeName.vec4);

    this.array = array;
    this.elementType = elementType;

    this._elementType = null;
    this._elementLength = 0;

    this.stage = NodeUpdateStage.Render;
  }

  getElementType(): TypeName {
    return this.elementType || this._elementType;
  }

  getElementLength(): number {
    return this._elementLength;
  }

  update() {
    const { array, value } = this;

    const elementLength = this.getElementLength();
    const elementType = this.getElementType();

    if (elementLength === 1) {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;

        //@ts-expect-error
        value[index] = array[i];
      }
    } else if (elementType === TypeName.color) {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;
        const vector = array[i];

        //@ts-expect-error
        value[index] = vector.r;
        //@ts-expect-error
        value[index + 1] = vector.g;
        //@ts-expect-error
        value[index + 2] = vector.b || 0;
        //@ts-expect-error
        value[index + 3] = vector.a || 0;
      }
    } else {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;
        const vector = array[i];

        //@ts-expect-error
        value[index] = vector.x;
        //@ts-expect-error
        value[index + 1] = vector.y;
        //@ts-expect-error
        value[index + 2] = vector.z || 0;
        //@ts-expect-error
        value[index + 3] = vector.w || 0;
      }
    }
  }

  setup(builder: NodeBuilder) {
    const length = this.array.length;

    this._elementType = this.elementType === null ? TypeName.ofValue(this.array[0]) : this.elementType;
    this._elementLength = TypeName.size(this._elementType);

    this.value = new Float32Array(length * 4);
    this.bufferCount.value = length;

    return super.setup(builder);
  }

  //@ts-expect-error
  element(index: number | ConstNode<number>): UniformsElementNode {
    return new UniformsElementNode(this, asNode(index));
  }
}

export const uniforms = asCommand(UniformsNode);
