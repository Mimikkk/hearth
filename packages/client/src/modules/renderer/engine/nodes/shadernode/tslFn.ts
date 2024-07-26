import { ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import {
  createShaderNodeObject,
  createShaderNodeObjects,
} from '@modules/renderer/engine/nodes/shadernode/CreateShaderNodeObject.js';
import Node from '@modules/renderer/engine/nodes/core/Node.js';

export const tslFn = (jsFn: Function): Function & { shaderNode: ShaderNode } => {
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
