import { NodeElements } from './ShaderNode.map.js';
import { parseSwizzle } from './utils.js';
import { asNode, asNodes } from './CreateShaderNodeObject.js';
import SplitNode from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import ArrayElementNode from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';
import SetNode from '@modules/renderer/engine/nodes/utils/SetNode.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';

export const handlers = {
  setup(NodeClosure, params) {
    const inputs = params.shift();

    return NodeClosure(asNodes(inputs), ...params);
  },

  get(node, prop, nodeObj) {
    if (typeof prop === 'string' && node[prop] === undefined) {
      if (node.isStackNode !== true && prop === 'assign') {
        return (...params) => {
          NodeStack.get().assign(nodeObj, ...params);

          return nodeObj;
        };
      } else if (NodeElements.has(prop)) {
        const nodeElement = NodeElements.get(prop);

        return node.isStackNode
          ? (...params) => nodeObj.add(nodeElement(...params))
          : (...params) => nodeElement(nodeObj, ...params);
      } else if (prop === 'self') {
        return node;
      } else if (prop.endsWith('Assign') && NodeElements.has(prop.slice(0, prop.length - 'Assign'.length))) {
        const nodeElement = NodeElements.get(prop.slice(0, prop.length - 'Assign'.length));

        return node.isStackNode
          ? (...params) => nodeObj.assign(params[0], nodeElement(...params))
          : (...params) => nodeObj.assign(nodeElement(nodeObj, ...params));
      } else if (/^[xyzwrgbastpq]{1,4}$/.test(prop) === true) {
        // accessing properties ( swizzle )

        prop = parseSwizzle(prop);

        return asNode(new SplitNode(nodeObj, prop));
      } else if (/^set[XYZWRGBASTPQ]{1,4}$/.test(prop) === true) {
        // set properties ( swizzle )

        prop = parseSwizzle(prop.slice(3).toLowerCase());

        // sort to xyzw sequence

        prop = prop.split('').sort().join('');

        return value => asNode(new SetNode(node, prop, value));
      } else if (prop === 'width' || prop === 'height' || prop === 'depth') {
        // accessing property

        if (prop === 'width') prop = 'x';
        else if (prop === 'height') prop = 'y';
        else if (prop === 'depth') prop = 'z';

        return asNode(new SplitNode(node, prop));
      } else if (/^\d+$/.test(prop) === true) {
        // accessing array

        return asNode(new ArrayElementNode(nodeObj, new ConstNode(Number(prop), 'u32')));
      }
    }

    return Reflect.get(node, prop, nodeObj);
  },

  set(node, prop, value, nodeObj) {
    if (typeof prop === 'string' && node[prop] === undefined) {
      // setting properties

      if (
        /^[xyzwrgbastpq]{1,4}$/.test(prop) === true ||
        prop === 'width' ||
        prop === 'height' ||
        prop === 'depth' ||
        /^\d+$/.test(prop) === true
      ) {
        nodeObj[prop].assign(value);

        return true;
      }
    }

    return Reflect.set(node, prop, value, nodeObj);
  },
};
