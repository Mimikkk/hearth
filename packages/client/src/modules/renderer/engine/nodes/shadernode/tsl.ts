import {
  createShaderNode,
  type ShaderCallNode,
  type ShaderNode,
} from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import { asNodes } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.asNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export interface TslParameter {
  name: string;
  type: TypeName;
}

export interface TslLayout {
  name: string;
  type: TypeName;
  inputs: TslParameter[];
}

export interface Tsl<Fn extends (...parameters: any) => any = any> {
  (...parameters: Parameters<Fn>): ShaderCallNode;

  node: ShaderNode;
  setLayout: (layout: TslLayout) => this;
}

export const tsl = <Fn extends ((parameters: Node[]) => any) | ((parameters: Record<string, Node>) => any)>(
  code: Fn,
  layout: TslLayout,
): Tsl<Fn> => {
  const node = createShaderNode(code, layout);

  const fn: Tsl<Fn> = (...params) => {
    asNodes(params);

    return node.call(Node.is(params[0]) ? [...params] : params[0]);
  };
  fn.node = node;
  fn.setLayout = layout => {
    node.setLayout(layout);

    return fn;
  };

  return fn;
};
