import Node from '../core/Node.ts';
import ArrayElementNode from '../utils/ArrayElementNode.js';
import ConvertNode from '../utils/ConvertNode.js';
import JoinNode from '../utils/JoinNode.js';
import SplitNode from '../utils/SplitNode.js';
import SetNode from '../utils/SetNode.js';
import ConstNode from '../core/ConstNode.js';
import { getValueFromType, getValueType } from '../core/NodeUtils.js';
import {
  boolMap,
  floatMap,
  NodeElements,
  sintMap,
  uintMap,
} from '@modules/renderer/threejs/nodes/shadernode/ShaderNode.map.js';
import { getConstNode, parseSwizzle } from './utils.js';
import { NodeStack } from '@modules/renderer/threejs/nodes/shadernode/ShaderNode.stack.js';

//

export const addNodeElement = (name, nodeElement) => NodeElements.set(name, nodeElement);

const shaderNodeHandler = {
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
        // accessing properties ( swizzle )

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

const nodeObjectsCacheMap = new WeakMap();
const nodeBuilderFunctionsCacheMap = new WeakMap();

const ShaderNodeObject = function (obj, altType = null) {
  const type = getValueType(obj);

  if (type === 'node') {
    let nodeObject = nodeObjectsCacheMap.get(obj);

    if (nodeObject === undefined) {
      nodeObject = new Proxy(obj, shaderNodeHandler);

      nodeObjectsCacheMap.set(obj, nodeObject);
      nodeObjectsCacheMap.set(nodeObject, nodeObject);
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
    } else if (factor !== null) {
      factor = nodeObject(factor);

      return (...params) => {
        return assignNode(new NodeClass(scope, ...nodeArray(params), factor));
      };
    } else {
      return (...params) => {
        return assignNode(new NodeClass(scope, ...nodeArray(params)));
      };
    }
  }
}

class ShaderNodeImmutable {
  constructor(NodeClass, ...params) {
    return nodeObject(new NodeClass(...nodeArray(params)));
  }
}

class ShaderCallNodeInternal extends Node {
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
      let functionNodesCacheMap = nodeBuilderFunctionsCacheMap.get(builder.constructor);

      if (functionNodesCacheMap === undefined) {
        functionNodesCacheMap = new WeakMap();

        nodeBuilderFunctionsCacheMap.set(builder.constructor, functionNodesCacheMap);
      }

      let functionNode = functionNodesCacheMap.get(shaderNode);

      if (functionNode === undefined) {
        functionNode = nodeObject(builder.buildFunctionNode(shaderNode));

        functionNodesCacheMap.set(shaderNode, functionNode);
      }

      if (builder.currentFunctionNode !== null) {
        builder.currentFunctionNode.includes.push(functionNode);
      }

      return nodeObject(functionNode.call(inputNodes));
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

class ShaderNodeInternal extends Node {
  constructor(jsFunc) {
    super();

    this.jsFunc = jsFunc;
    this.layout = null;
  }

  get isArrayInput() {
    return /^\((\s+)?\[/.test(this.jsFunc.toString());
  }

  setLayout(layout) {
    this.layout = layout;

    return this;
  }

  call(inputs = null) {
    nodeObjects(inputs);

    return nodeObject(new ShaderCallNodeInternal(this, inputs));
  }

  setup() {
    return this.call();
  }
}

const ConvertType = function (type, cacheMap = null) {
  return (...params) => {
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

      try {
        if (node.getNodeType() === type) return nodeObject(node);
      } catch {}

      return nodeObject(new ConvertNode(node, type));
    }

    const nodes = params.map(param => getConstNode(param));
    return nodeObject(new JoinNode(nodes, type));
  };
};

export class ShaderNode {
  static type = 'ShaderNode';
  constructor(jsFunc) {
    return new Proxy(new ShaderNodeInternal(jsFunc), shaderNodeHandler);
  }
}

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

export const color = new ConvertType('color');
export const float = new ConvertType('float', floatMap);
export const int = new ConvertType('int', sintMap);
export const uint = new ConvertType('uint', uintMap);
export const bool = new ConvertType('bool', boolMap);
export const vec2 = new ConvertType('vec2');
export const ivec2 = new ConvertType('ivec2');
export const uvec2 = new ConvertType('uvec2');
export const bvec2 = new ConvertType('bvec2');
export const vec3 = new ConvertType('vec3');
export const ivec3 = new ConvertType('ivec3');
export const uvec3 = new ConvertType('uvec3');
export const bvec3 = new ConvertType('bvec3');
export const vec4 = new ConvertType('vec4');
export const ivec4 = new ConvertType('ivec4');
export const uvec4 = new ConvertType('uvec4');
export const bvec4 = new ConvertType('bvec4');
export const mat2 = new ConvertType('mat2');
export const imat2 = new ConvertType('imat2');
export const umat2 = new ConvertType('umat2');
export const bmat2 = new ConvertType('bmat2');
export const mat3 = new ConvertType('mat3');
export const imat3 = new ConvertType('imat3');
export const umat3 = new ConvertType('umat3');
export const bmat3 = new ConvertType('bmat3');
export const mat4 = new ConvertType('mat4');
export const imat4 = new ConvertType('imat4');
export const umat4 = new ConvertType('umat4');
export const bmat4 = new ConvertType('bmat4');
export const string = (value = '') => nodeObject(new ConstNode(value, 'string'));
export const arrayBuffer = value => nodeObject(new ConstNode(value, 'ArrayBuffer'));
export const element = nodeProxy(ArrayElementNode);
export const convert = (node, types) => nodeObject(new ConvertNode(nodeObject(node), types));
export const split = (node, channels) => nodeObject(new SplitNode(nodeObject(node), channels));
