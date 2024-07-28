import { Node } from '../core/Node.js';
import { scriptableValue } from './ScriptableValueNode.js';
import { addNodeCommand, f32, proxyNode } from '../shadernode/ShaderNodes.js';
import CodeNode from '@modules/renderer/engine/nodes/code/CodeNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class Resources extends Map {
  get<Fn extends (...args: any) => any>(
    key: string,
    callback: Fn | null = null,
    ...params: Parameters<Fn>
  ): ReturnType<Fn> | undefined {
    if (this.has(key)) return super.get(key);
    if (callback === null) return undefined;

    const value = callback(...params);
    this.set(key, value);
    return value;
  }
}

class Params {
  constructor(public scriptableNode: ScriptableNode) {}

  get parameters() {
    return this.scriptableNode.parameters;
  }

  get layout() {
    return this.scriptableNode.getLayout();
  }

  get(name: string) {
    const param = this.parameters[name];
    const value = param ? param.getValue() : null;

    return value;
  }
}

export const global = new Resources();

class ScriptableNode extends Node {
  static type = 'ScriptableNode';
  declare isScriptableNode: true;
  _local: Resources;
  _output: any;
  _outputs: Record<string, any>;
  _source: string;
  _method: any;
  _object: any;
  _value: any;
  _needsOutputUpdate: boolean;

  constructor(
    public codeNode: CodeNode,
    public parameters: Record<string, any> = {},
  ) {
    super();

    this._local = new Resources();
    this._output = scriptableValue();
    this._outputs = {};
    this._source = this.source;
    this._method = null;
    this._object = null;
    this._value = null;
    this._needsOutputUpdate = true;
    this.onRefresh = this.onRefresh.bind(this);

    this.isScriptableNode = true;
  }

  get source(): string {
    return this.codeNode.code;
  }

  get needsUpdate(): boolean {
    return this.source !== this._source;
  }

  set needsUpdate(value: boolean) {
    if (value === true) this.dispose();
  }

  setLocal(name: string, value: any) {
    return this._local.set(name, value);
  }

  getLocal(name: string) {
    return this._local.get(name);
  }

  onRefresh() {
    this._refresh();
  }

  getInputLayout(id: string) {
    for (const element of this.getLayout()) {
      if (element.inputType && (element.id === id || element.name === id)) {
        return element;
      }
    }
  }

  getOutputLayout(id: string) {
    for (const element of this.getLayout()) {
      if (element.outputType && (element.id === id || element.name === id)) {
        return element;
      }
    }
  }

  setOutput(name: string, value: any) {
    const outputs = this._outputs;

    if (outputs[name] === undefined) {
      outputs[name] = scriptableValue(value);
    } else {
      outputs[name].value = value;
    }

    return this;
  }

  getOutput(name: string) {
    return this._outputs[name];
  }

  getParameter(name: string) {
    return this.parameters[name];
  }

  setParameter(name: string, value: any) {
    const parameters = this.parameters;

    if (value && value.isScriptableNode) {
      this.deleteParameter(name);

      parameters[name] = value;
      parameters[name].getDefaultOutput().events.add('refresh', this.onRefresh);
    } else if (value && value.isScriptableValueNode) {
      this.deleteParameter(name);

      parameters[name] = value;
      parameters[name].events.add('refresh', this.onRefresh);
    } else if (parameters[name] === undefined) {
      parameters[name] = scriptableValue(value);
      parameters[name].events.add('refresh', this.onRefresh);
    } else {
      parameters[name].value = value;
    }

    return this;
  }

  getValue() {
    return this.getDefaultOutput().getValue();
  }

  deleteParameter(name: string) {
    let valueNode = this.parameters[name];

    if (valueNode) {
      if (valueNode.isScriptableNode) valueNode = valueNode.getDefaultOutput();

      valueNode.events.removeEventListener('refresh', this.onRefresh);
    }

    return this;
  }

  clearParameters() {
    for (const name of Object.keys(this.parameters)) {
      this.deleteParameter(name);
    }

    this.needsUpdate = true;

    return this;
  }

  call(name: string, ...params: any) {
    const object = this.getObject();
    const method = object[name];

    if (typeof method === 'function') {
      return method(...params);
    }
  }

  async callAsync(name: string, ...params: any) {
    const object = this.getObject();
    const method = object[name];

    if (typeof method === 'function') {
      return method.constructor.name === 'AsyncFunction' ? await method(...params) : method(...params);
    }
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.getDefaultOutputNode().getNodeType(builder);
  }

  refresh(output = null) {
    if (output !== null) {
      this.getOutput(output).refresh();
    } else {
      this._refresh();
    }
  }

  getObject() {
    if (this.needsUpdate) this.dispose();
    if (this._object !== null) return this._object;

    //

    const refresh = () => this.refresh();
    const setOutput = (id: any, value: any) => this.setOutput(id, value);

    const parameters = new Params(this);

    const ENGINE = global.get('ENGINE');
    const TSL = global.get('TSL');

    const method = this.getMethod();
    const params = [parameters, this._local, global, refresh, setOutput, ENGINE, TSL];

    this._object = method(...params);

    const layout = this._object.layout;

    if (layout) {
      if (layout.cache === false) {
        this._local.clear();
      }

      // default output
      this._output.outputType = layout.outputType || null;

      if (Array.isArray(layout.elements)) {
        for (const element of layout.elements) {
          const id = element.id || element.name;

          if (element.inputType) {
            if (this.getParameter(id) === undefined) this.setParameter(id, null);

            this.getParameter(id).inputType = element.inputType;
          }

          if (element.outputType) {
            if (this.getOutput(id) === undefined) this.setOutput(id, null);

            this.getOutput(id).outputType = element.outputType;
          }
        }
      }
    }

    return this._object;
  }

  getLayout() {
    return this.getObject().layout;
  }

  getDefaultOutputNode() {
    const output = this.getDefaultOutput().value;

    if (output && output.isNode) {
      return output;
    }

    return f32();
  }

  getDefaultOutput() {
    return this._exec()._output;
  }

  getMethod() {
    if (this.needsUpdate) this.dispose();
    if (this._method !== null) return this._method;

    //

    const parametersProps = ['parameters', 'local', 'global', 'refresh', 'setOutput', 'ENGINE', 'TSL'];
    const interfaceProps = ['layout', 'init', 'main', 'dispose'];

    const properties = interfaceProps.join(', ');
    const declarations = 'var ' + properties + '; var output = {};\n';
    const returns = '\nreturn { ...output, ' + properties + ' };';

    const code = declarations + this.codeNode.code + returns;

    //

    this._method = new Function(...parametersProps, code);

    return this._method;
  }

  dispose() {
    if (this._method === null) return;
    this._method = null;
    this._object = null;
    this._source = null!;
    this._value = null;
    this._needsOutputUpdate = true;
    this._output.value = null;
    this._outputs = {};
  }

  setup() {
    return this.getDefaultOutputNode();
  }

  _exec() {
    if (this.codeNode === null) return this;

    if (this._needsOutputUpdate === true) {
      this._value = this.call('main');

      this._needsOutputUpdate = false;
    }

    this._output.value = this._value;

    return this;
  }

  _refresh() {
    this.needsUpdate = true;

    this._exec();

    this._output.refresh();
  }
}

export default ScriptableNode;

export const scriptable = proxyNode(ScriptableNode);

addNodeCommand('scriptable', scriptable);
