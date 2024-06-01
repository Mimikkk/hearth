import Node from '../core/Node.ts';
import ArrayElementNode from '../utils/ArrayElementNode.js';
import ConvertNode from '../utils/ConvertNode.js';
import JoinNode from '../utils/JoinNode.js';
import SplitNode from '../utils/SplitNode.js';
import SetNode from '../utils/SetNode.js';
import ConstNode from '../core/ConstNode.js';
import { getValueFromType, getValueType } from '../core/NodeUtils.js';
import { boolMap, constMap, floatMap, NodeElements, sintMap, uintMap } from './ShaderNode.map.js';
import { NodeStack } from '@modules/renderer/threejs/nodes/shadernode/ShaderNode.stack.js';

const parseSwizzle = props =>
  props.replace(/[rs]/g, 'x').replace(/[gt]/g, 'y').replace(/[bp]/g, 'z').replace(/[aq]/g, 'w');

class ShaderNodeObjects {
  constructor(objects, altType = null) {
    for (const name in objects) {
      objects[name] = nodeObject(objects[name], altType);
    }

    return objects;
  }
}

class ShaderNodeArray {
  constructor(array, altType = null) {
    const len = array.length;

    for (let i = 0; i < len; i++) {
      array[i] = nodeObject(array[i], altType);
    }

    return array;
  }
}

class ShaderNodeProxy {
  constructor(NodeClass, scope = null, factor = null, settings = null) {
    const assignNode = node => nodeObject(settings !== null ? Object.assign(node, settings) : node);

    if (scope === null) {
      return (...params) => {
        return assignNode(new NodeClass(...nodeArray(params)));
      };
    }
    if (factor !== null) {
      factor = nodeObject(factor);

      return (...params) => {
        return assignNode(new NodeClass(scope, ...nodeArray(params), factor));
      };
    }
    return (...params) => {
      return assignNode(new NodeClass(scope, ...nodeArray(params)));
    };
  }
}

class ShaderNodeImmutable {
  constructor(NodeClass, ...params) {
    return nodeObject(new NodeClass(...nodeArray(params)));
  }
}

const getConstNode = (value, type) => {
  if (constMap.has(value)) return constMap.get(value);
  if (value.isNode) return value;
  return new ConstNode(value, type);
};

const readType = node => {
  try {
    return node.getNodeType();
  } catch {
    return undefined;
  }
};
const convertNode =
  (type, cacheMap = null) =>
  (...params) => {
    if (
      params.length === 0 ||
      (!['bool', 'float', 'int', 'uint'].includes(type) && params.every(param => typeof param !== 'object'))
    ) {
      params = [getValueFromType(type, ...params)];
    }

    if (params.length === 1 && cacheMap !== null && cacheMap.has(params[0])) {
      return nodeObject(cacheMap.get(params[0]));
    }

    if (params.length === 1) {
      const node = getConstNode(params[0], type);
      if (readType(node) === type) return nodeObject(node);
      return nodeObject(new ConvertNode(node, type));
    }

    const nodes = params.map(param => getConstNode(param));
    return nodeObject(new JoinNode(nodes, type));
  };

export const getConstNodeType = value =>
  value !== undefined && value !== null
    ? value.nodeType || value.convertTo || (typeof value === 'string' ? value : null)
    : null;

const proxyHandlers = {
  setup(NodeClosure, params) {
    const inputs = params.shift();

    return NodeClosure(nodeObjects(inputs), ...params);
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
        prop = parseSwizzle(prop);

        return nodeObject(new SplitNode(nodeObj, prop));
      } else if (/^set[XYZWRGBASTPQ]{1,4}$/.test(prop) === true) {
        // set properties ( swizzle )

        prop = parseSwizzle(prop.slice(3).toLowerCase());

        // sort to xyzw sequence

        prop = prop.split('').sort().join('');

        return value => nodeObject(new SetNode(node, prop, value));
      } else if (prop === 'width' || prop === 'height' || prop === 'depth') {
        // accessing property

        if (prop === 'width') prop = 'x';
        else if (prop === 'height') prop = 'y';
        else if (prop === 'depth') prop = 'z';

        return nodeObject(new SplitNode(node, prop));
      } else if (/^\d+$/.test(prop) === true) {
        // accessing array

        return nodeObject(new ArrayElementNode(nodeObj, new ConstNode(Number(prop), 'uint')));
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
      let fnMap = functionMapMap.get(builder.constructor);

      if (fnMap === undefined) {
        fnMap = new WeakMap();

        functionMapMap.set(builder.constructor, fnMap);
      }

      let node = fnMap.get(shaderNode);

      if (node === undefined) {
        node = nodeObject(builder.buildFunctionNode(shaderNode));

        fnMap.set(shaderNode, node);
      }

      if (builder.currentFunctionNode !== null) {
        builder.currentFunctionNode.includes.push(node);
      }

      return nodeObject(node.call(inputNodes));
    }

    const jsFunc = shaderNode.jsFunc;
    const outputNode =
      inputNodes !== null ? jsFunc(inputNodes, builder.stack, builder) : jsFunc(builder.stack, builder);

    return nodeObject(outputNode);
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

const arrayInputRe = /^\((\s+)?\[/;

const functionMapMap = new WeakMap();
class ShaderNodeImpl extends Node {
  constructor(jsFn) {
    super();

    this.jsFunc = jsFn;
    this.layout = null;
  }

  get isArrayInput() {
    return arrayInputRe.test(this.jsFunc.toString());
  }

  setLayout(layout) {
    this.layout = layout;
    return this;
  }

  call(inputs = null) {
    nodeObjects(inputs);
    return nodeObject(new ShaderCallNodeImpl(this, inputs));
  }

  setup() {
    return this.call();
  }
}

export class ShaderNode {
  static type = 'ShaderNode';

  constructor(jsFn) {
    return new Proxy(new ShaderNodeImpl(jsFn), proxyHandlers);
  }
}

const nodeObjectMap = new WeakMap();
const ShaderNodeObject = function (obj, altType = null) {
  const type = getValueType(obj);

  if (type === 'node') {
    let nodeObject = nodeObjectMap.get(obj);

    if (nodeObject === undefined) {
      nodeObject = new Proxy(obj, proxyHandlers);

      nodeObjectMap.set(obj, nodeObject);
      nodeObjectMap.set(nodeObject, nodeObject);
    }

    return nodeObject;
  } else if (
    (altType === null && (type === 'float' || type === 'boolean')) ||
    (type && type !== 'shader' && type !== 'string')
  ) {
    return nodeObject(getConstNode(obj, altType));
  } else if (type === 'shader') {
    return tslFn(obj);
  }

  return obj;
};

export const nodeObject = (val, altType = null) => ShaderNodeObject(val, altType);
export const nodeObjects = (val, altType = null) => new ShaderNodeObjects(val, altType);
export const nodeArray = (val, altType = null) => new ShaderNodeArray(val, altType);
export const nodeProxy = (...params) => new ShaderNodeProxy(...params);
export const nodeImmutable = (...params) => new ShaderNodeImmutable(...params);

export const tslFn = jsFn => {
  const shaderNode = new ShaderNode(jsFn);

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

export const color = convertNode('color');
export const float = convertNode('float', floatMap);
export const int = convertNode('int', sintMap);
export const uint = convertNode('uint', uintMap);
export const bool = convertNode('bool', boolMap);
export const vec2 = convertNode('vec2');
export const ivec2 = convertNode('ivec2');
export const uvec2 = convertNode('uvec2');
export const bvec2 = convertNode('bvec2');
export const vec3 = convertNode('vec3');
export const ivec3 = convertNode('ivec3');
export const uvec3 = convertNode('uvec3');
export const bvec3 = convertNode('bvec3');
export const vec4 = convertNode('vec4');
export const ivec4 = convertNode('ivec4');
export const uvec4 = convertNode('uvec4');
export const bvec4 = convertNode('bvec4');
export const mat2 = convertNode('mat2');
export const imat2 = convertNode('imat2');
export const umat2 = convertNode('umat2');
export const bmat2 = convertNode('bmat2');
export const mat3 = convertNode('mat3');
export const imat3 = convertNode('imat3');
export const umat3 = convertNode('umat3');
export const bmat3 = convertNode('bmat3');
export const mat4 = convertNode('mat4');
export const imat4 = convertNode('imat4');
export const umat4 = convertNode('umat4');
export const bmat4 = convertNode('bmat4');
export const string = (value = '') => nodeObject(new ConstNode(value, 'string'));
export const arrayBuffer = value => nodeObject(new ConstNode(value, 'ArrayBuffer'));
export const element = nodeProxy(ArrayElementNode);
export const convert = (node, types) => nodeObject(new ConvertNode(nodeObject(node), types));
export const split = (node, channels) => nodeObject(new SplitNode(nodeObject(node), channels));
