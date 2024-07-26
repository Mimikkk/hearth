import Node from '../core/Node.js';
import { createShaderNodeObject } from '@modules/renderer/engine/nodes/shadernode/CreateShaderNodeObject.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';

const functionMapByBuilder = new WeakMap();

class ShaderCallNodeImpl extends Node {
  constructor(shaderNode, inputNodes) {
    super();

    this.shaderNode = shaderNode;
    this.inputNodes = inputNodes;
  }

  getNodeType(builder) {
    const { outputNode } = builder.getNodeProperties(this);

    return outputNode ? outputNode.getNodeType(builder) : super.getNodeType(builder);
  }

  call(builder) {
    const { shaderNode, inputNodes } = this;

    if (shaderNode.layout) {
      let functionNodesCacheMap = functionMapByBuilder.get(builder.constructor);

      if (functionNodesCacheMap === undefined) {
        functionNodesCacheMap = new WeakMap();

        functionMapByBuilder.set(builder.constructor, functionNodesCacheMap);
      }

      let functionNode = functionNodesCacheMap.get(shaderNode);

      if (functionNode === undefined) {
        functionNode = createShaderNodeObject(builder.buildFunctionNode(shaderNode));

        functionNodesCacheMap.set(shaderNode, functionNode);
      }

      if (builder.currentFunctionNode !== null) {
        builder.currentFunctionNode.includes.push(functionNode);
      }

      return createShaderNodeObject(functionNode.call(inputNodes));
    }

    const jsFunc = shaderNode.jsFunc;
    const outputNode =
      inputNodes !== null ? jsFunc(inputNodes, builder.stack, builder) : jsFunc(builder.stack, builder);

    return createShaderNodeObject(outputNode);
  }

  setup(builder) {
    builder.addStack();

    builder.stack.outputNode = this.call(builder);

    return builder.removeStack();
  }

  generate(builder, output) {
    const { outputNode } = builder.getNodeProperties(this);

    if (outputNode === null) {
      // TSL: It's recommended to use `tslFn` in setup() pass.

      return this.call(builder).build(builder, output);
    }

    return super.generate(builder, output);
  }
}

class ShaderNodeImpl extends Node {
  constructor(jsFunc) {
    super();

    this.jsFunc = jsFunc;
    this.layout = null;
  }

  get isArrayInput() {
    return /^\((\s+)?\[/.test(this.jsFunc.toString());
  }

  setLayout(layout) {
    this.layout = layout;

    return this;
  }

  call(inputs = null) {
    for (const name in inputs) {
      inputs[name] = createShaderNodeObject(inputs[name]);
    }

    return createShaderNodeObject(new ShaderCallNodeImpl(this, inputs));
  }

  setup() {
    return this.call();
  }
}

export class ShaderNode {
  static type = 'ShaderNode';

  constructor(jsFn) {
    return new Proxy(new ShaderNodeImpl(jsFn), handlers);
  }
}
