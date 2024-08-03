import { Node } from '../core/Node.js';
import { addNodeCommand, f32, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class ScriptableValueNode extends Node {
  declare isScriptableValueNode: true;
  inputType: string | null;
  outputType: string | null;
  _value: any;
  _cache: string | null;

  constructor(value = null) {
    super();

    this._value = value;
    this._cache = null;

    this.inputType = null;
    this.outputType = null;

    this.isScriptableValueNode = true;
  }

  get value() {
    return this._value;
  }

  set value(val) {
    if (this._value === val) return;

    if (this._cache && this.inputType === 'URL' && this.value.value instanceof ArrayBuffer) {
      URL.revokeObjectURL(this._cache);

      this._cache = null;
    }

    this._value = val;
  }

  getValue() {
    const value = this.value;

    if (value && this._cache === null && this.inputType === 'URL' && value.value instanceof ArrayBuffer) {
      this._cache = URL.createObjectURL(new Blob([value.value]));
    } else if (
      value &&
      value.value !== null &&
      value.value !== undefined &&
      (((this.inputType === 'URL' || this.inputType === 'String') && typeof value.value === 'string') ||
        (this.inputType === 'Number' && typeof value.value === 'number') ||
        (this.inputType === 'Vec2' && value.value.isVec2) ||
        (this.inputType === 'Vec3' && value.value.isVec3) ||
        (this.inputType === 'Vec4' && value.value.isVec4) ||
        (this.inputType === 'Color' && value.value.isColor) ||
        (this.inputType === 'Mat3' && value.value.isMat3) ||
        (this.inputType === 'Mat4' && value.value.isMat4))
    ) {
      return value.value;
    }

    return this._cache || value;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.value && this.value.isNode ? this.value.getNodeType(builder) : 'f32';
  }

  setup() {
    return this.value && this.value.isNode ? this.value : f32();
  }
}

export default ScriptableValueNode;

export const scriptableValue = proxyNode(ScriptableValueNode);

addNodeCommand('scriptableValue', scriptableValue);
