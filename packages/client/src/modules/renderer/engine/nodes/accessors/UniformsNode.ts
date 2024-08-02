import { asNode } from '../shadernode/ShaderNodes.js';
import { NodeUpdateStage } from '../core/constants.js';
import { getValueType } from '../core/NodeUtils.js';
import ArrayElementNode from '../utils/ArrayElementNode.js';
import BufferNode from './BufferNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class UniformsElementNode extends ArrayElementNode {
  constructor(arrayBuffer, indexNode) {
    super(arrayBuffer, indexNode);

    this.isArrayBufferElementNode = true;
  }

  getNodeType(builder) {
    return this.array.getElementType(builder);
  }

  generate(builder) {
    const snippet = super.generate(builder);
    const type = this.getNodeType();

    return builder.format(snippet, 'vec4', type);
  }
}

class UniformsNode extends BufferNode {
  static type = 'UniformsNode';

  constructor(value, elementType = null) {
    super(null, 'vec4');

    this.array = value;
    this.elementType = elementType;

    this._elementType = null;
    this._elementLength = 0;

    this.stage = NodeUpdateStage.Render;

    this.isArrayBufferNode = true;
  }

  getElementType() {
    return this.elementType || this._elementType;
  }

  getElementLength() {
    return this._elementLength;
  }

  update() {
    const { array, value } = this;

    const elementLength = this.getElementLength();
    const elementType = this.getElementType();

    if (elementLength === 1) {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;

        value[index] = array[i];
      }
    } else if (elementType === 'color') {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;
        const vector = array[i];

        value[index] = vector.r;
        value[index + 1] = vector.g;
        value[index + 2] = vector.b || 0;
        //value[ index + 3 ] = vector.a || 0;
      }
    } else {
      for (let i = 0; i < array.length; i++) {
        const index = i * 4;
        const vector = array[i];

        value[index] = vector.x;
        value[index + 1] = vector.y;
        value[index + 2] = vector.z || 0;
        value[index + 3] = vector.w || 0;
      }
    }
  }

  setup(builder) {
    const length = this.array.length;

    this._elementType = this.elementType === null ? getValueType(this.array[0]) : this.elementType;
    this._elementLength = TypeName.size(this._elementType);

    this.value = new Float32Array(length * 4);
    this.bufferCount = length;

    return super.setup(builder);
  }

  element(indexNode) {
    return asNode(new UniformsElementNode(this, asNode(indexNode)));
  }
}

export default UniformsNode;

export const uniforms = (values, nodeType) => asNode(new UniformsNode(values, nodeType));
