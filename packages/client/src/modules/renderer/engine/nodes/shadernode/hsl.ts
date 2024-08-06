import { ShaderCallNode, ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import { asNodes } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export interface HslParameter {
  name: string;
  type: TypeName;
}

export interface HslLayout {
  name: string;
  type: TypeName;
  inputs: HslParameter[];
}

export interface Hsl<Fn extends (...parameters: any) => any = any> {
  (...parameters: Parameters<Fn>): ShaderCallNode;

  node: ShaderNode;
  setLayout: (layout: HslLayout) => this;
}

export const hsl = <Fn extends (...params: any) => any>(code: Fn, layout?: HslLayout): Hsl<Fn> => {
  const node = new ShaderNode<Fn>(code, layout);

  const fn: Hsl<Fn> = (...params) => {
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
