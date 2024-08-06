import { Node } from '../core/Node.js';
import { expression } from '../code/ExpressionNode.js';
import { context } from '../core/ContextNode.js';
import { asNode, asNodes } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class LoopNode extends Node {
  constructor(public params: Node[] = []) {
    super();
  }

  getVarName(index: number) {
    return String.fromCharCode('i'.charCodeAt(0) + index);
  }

  getProperties(builder: NodeBuilder): {
    stackNode: StackNode;
    returnsNode: Node;
  } {
    const properties = builder.getNodeProperties(this);

    if (properties.stackNode !== undefined) return properties;

    const inputs = {};

    for (let i = 0, l = this.params.length - 1; i < l; i++) {
      const param = this.params[i];

      const name = (param.isNode !== true && param.name) || this.getVarName(i);
      const type = (param.isNode !== true && param.type) || 'i32';

      inputs[name] = expression(name, type);
    }

    properties.returnsNode = this.params[this.params.length - 1](inputs, builder.addStack(), builder);
    properties.stackNode = builder.removeStack();

    return properties;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const { returnsNode } = this.getProperties(builder);

    return returnsNode ? returnsNode.getNodeType(builder) : TypeName.void;
  }

  setup(builder: NodeBuilder): void {
    this.getProperties(builder);
  }

  generate(builder: NodeBuilder): string {
    const properties = this.getProperties(builder);

    const contextData = { tempWrite: false };

    const params = this.params;
    const stackNode = properties.stackNode;

    for (let i = 0, l = params.length - 1; i < l; i++) {
      const param = params[i];

      let start = null,
        end = null,
        name = null,
        type = null,
        condition = null,
        update = null;

      if (param.isNode) {
        type = 'i32';
        name = this.getVarName(i);
        start = '0';
        end = param.build(builder, type);
        condition = '<';
      } else {
        type = param.type || 'i32';
        name = param.name || this.getVarName(i);
        start = param.start;
        end = param.end;
        condition = param.condition;
        update = param.update;

        if (typeof start === 'number') start = start.toString();
        else if (start && start.isNode) start = start.build(builder, type);

        if (typeof end === 'number') end = end.toString();
        else if (end && end.isNode) end = end.build(builder, type);

        if (start !== undefined && end === undefined) {
          start = start + ' - 1';
          end = '0';
          condition = '>=';
        } else if (end !== undefined && start === undefined) {
          start = '0';
          condition = '<';
        }

        if (condition === undefined) {
          if (Number(start) > Number(end)) {
            condition = '>=';
          } else {
            condition = '<';
          }
        }
      }

      const internalParam = { start, end, condition };

      const startSnippet = internalParam.start;
      const endSnippet = internalParam.end;

      let declarationSnippet = '';
      let conditionalSnippet = '';
      let updateSnippet = '';

      if (!update) {
        if (type === 'i32' || type === 'u32') {
          if (condition.includes('<')) update = '++';
          else update = '--';
        } else {
          if (condition.includes('<')) update = '+= 1.';
          else update = '-= 1.';
        }
      }

      declarationSnippet += builder.codeVariable(type, name) + ' = ' + startSnippet;

      conditionalSnippet += name + ' ' + condition + ' ' + endSnippet;
      updateSnippet += name + ' ' + update;

      const forSnippet = `for ( ${declarationSnippet}; ${conditionalSnippet}; ${updateSnippet} )`;

      builder.flow.code += (i === 0 ? '\n' : '') + forSnippet + ' {\n';
    }

    const stackSnippet = context(stackNode, contextData).build(builder, 'void');
    const returnsSnippet = properties.returnsNode ? properties.returnsNode.build(builder) : '';

    builder.flow.code += '\n' + stackSnippet;
    for (let i = 0, l = this.params.length - 1; i < l; i++) {
      builder.flow.code += '}\n';
    }

    return returnsSnippet;
  }
}

export const loop = (...params) => asNode(new LoopNode(asNodes(params))).append();
export const Continue = () => expression('continue').append();
export const Break = () => expression('break').append();

export class LoopLoopNode extends LoopNode {
  constructor(returns, ...params) {
    super(returns, loop(...params));
  }
}

implCommand('loop', LoopLoopNode);
