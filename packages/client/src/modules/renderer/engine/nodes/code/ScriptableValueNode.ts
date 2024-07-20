import Node from '../core/Node.ts';
import { addNodeElement, float, nodeProxy } from '../shadernode/ShaderNodes.js';
import { EventDispatcher } from '@modules/renderer/engine/engine.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

import { NodeTypeOption } from '@modules/renderer/engine/nodes/core/constants.js';

class ScriptableValueNode extends Node {
  static type = 'ScriptableValueNode';
  declare isScriptableValueNode: true;
  events = new EventDispatcher<{
    change: {};
    refresh: {};
  }>();
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

    this.events.dispatch({ type: 'change' }, this);

    this.refresh();
  }

  refresh() {
    this.events.dispatch({ type: 'refresh' }, this);
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

  getNodeType(builder: NodeBuilder): NodeTypeOption {
    return this.value && this.value.isNode ? this.value.getNodeType(builder) : 'float';
  }

  setup() {
    return this.value && this.value.isNode ? this.value : float();
  }
}

export default ScriptableValueNode;

export const scriptableValue = nodeProxy(ScriptableValueNode);

addNodeElement('scriptableValue', scriptableValue);
