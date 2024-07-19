import { ShaderNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';

export const tslFn = jsFunc => {
  const shaderNode = new ShaderNode(jsFunc);

  const fn = (...params) => {
    let inputs;

    nodeObjects(params);

    if (params[0] && params[0].isNode) {
      inputs = [...params];
    } else {
      inputs = params[0];
    }

    return shaderNode.call(inputs);
  };

  fn.shaderNode = shaderNode;
  fn.setLayout = layout => {
    shaderNode.setLayout(layout);

    return fn;
  };

  return fn;
};
