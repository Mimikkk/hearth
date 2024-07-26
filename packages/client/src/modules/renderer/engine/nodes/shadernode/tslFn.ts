import { ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import { asNode } from '@modules/renderer/engine/nodes/shadernode/asNode.js';

export const tslFn = jsFn => {
  const node = new ShaderNode(jsFn);

  const fn = (...params) => {
    let inputs;

    for (const name in params) {
      params[name] = asNode(params[name]);
    }

    if (params[0] && params[0].isNode) {
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
