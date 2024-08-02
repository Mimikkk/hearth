import { createShaderNode, ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import { asNodes } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.asNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

interface TslInput {
  name: string;
  type: TypeName;
}

export interface TslLayout {
  name: string;
  type: TypeName;
  inputs: TslInput[];
}

interface TslFn<Fn extends (...params: any) => any> {
  (params: Parameters<Fn>): ShaderNode;
  shaderNode: ShaderNode;
  setLayout: (layout: TslLayout) => this;
}

export const tslFn = <Fn extends (...params: any) => any>(code: Fn, layout?: TslLayout): TslFn<Fn> => {
  const node = createShaderNode(code, layout);

  const fn = (...params: Parameters<Fn>) => {
    asNodes(params);

    return node.call(Node.is(params[0]) ? [...params] : params[0]);
  };

  fn.shaderNode = node;

  fn.setLayout = (layout: TslLayout) => {
    node.setLayout(layout);

    return fn;
  };

  return fn as unknown as TslFn<Fn>;
};
