import { ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import { createShaderNodeObjects } from '@modules/renderer/engine/nodes/shadernode/CreateShaderNodeObject.js';
import Node from '@modules/renderer/engine/nodes/core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

interface TslInput {
  name: string;
  type: TypeName;
}

interface Layout {
  name: string;
  type: TypeName;
  inputs: TslInput[];
}

interface TslFn {
  (params: Node | Node[]): Node;
  shaderNode: ShaderNode;
  setLayout: (layout: Layout) => Function;
}

export const tslFn = (jsFn: Function): TslFn => {
  const node = new ShaderNode(jsFn);

  const fn = (...params) => {
    let inputs;

    createShaderNodeObjects(params);

    if (Node.is(params[0])) {
      inputs = [...params];
    } else {
      inputs = params[0];
    }

    return node.call(inputs);
  };
  fn.shaderNode = node;
  fn.setLayout = layout => {
    node.setLayout(layout);
    return fn;
  };

  return fn;
};
