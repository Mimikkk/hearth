import { NodeElements } from './ShaderNode.map.js';
import { asNode } from './ShaderNode.asNode.js';
import SplitNode from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import ArrayElementNode from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';
import SetNode from '@modules/renderer/engine/nodes/utils/SetNode.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import type { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';

export const handlers: ProxyHandler<Node> = {
  get(node, key, proxy) {
    if (typeof key !== 'string' || key in node) return Reflect.get(node, key, proxy);

    if (!isStackNode(node) && key === 'assign') {
      return (...params) => {
        NodeStack.get()!.assign(proxy, ...params);
        return proxy;
      };
    }

    const item = NodeElements.get(key);
    if (item) {
      return isStackNode(node) ? (...params) => proxy.add(item(...params)) : (...params) => item(proxy, ...params);
    }

    if (key.endsWith('Assign')) {
      const assignAs = NodeElements.get(key.slice(0, key.length - 6));
      if (assignAs) {
        return isStackNode(node)
          ? (...params) => proxy.assign(params[0], assignAs(...params))
          : (...params) => proxy.assign(assignAs(proxy, ...params));
      }
    }

    // accessing properties ( swizzle )
    if (swizzleRe.test(key)) {
      key = parseSwizzle(key);

      return asNode(new SplitNode(proxy, key));
    }

    // set properties ( swizzle )
    if (setSwizzleRe.test(key)) {
      key = parseSwizzle(key.slice(3).toLowerCase());
      return value => asNode(new SetNode(node, key, value));
    }

    // TODO - remove accessing property
    if (key === 'width' || key === 'height' || key === 'depth') {
      throw Error('Invalid use removed!');
    }

    // accessing array
    if (arrayRe.test(key)) {
      return asNode(new ArrayElementNode(proxy, new ConstNode(Number(key), TypeName.u32)));
    }

    Reflect.get(node, key, proxy);
  },

  set(node, key, value, proxy) {
    if (typeof key !== 'string' || key in node) return Reflect.set(node, key, value, proxy);

    if (key !== 'width' && key !== 'height' && key !== 'depth' && !arrayRe.test(key) && !swizzleRe.test(key)) {
      return Reflect.set(node, key, value, proxy);
    }

    proxy[key].assign(value);
    return true;
  },
};

const isStackNode = (value: any): value is StackNode => value.isStackNode === true;
const setSwizzleRe = /^set[XYZWRGBA]{1,4}$/;
const swizzleRe = /^[xyzwrgba]{1,4}$/;
const arrayRe = /^\d+$/;

export type XYZW = 'x' | 'xy' | 'xyz' | 'xyzw' | 'y' | 'yz' | 'yzw' | 'z' | 'zw' | 'w';
export type RGBA = 'r' | 'rg' | 'rgb' | 'rgba' | 'g' | 'gb' | 'gba' | 'b' | 'ba' | 'a';
export type Swizzle = XYZW | RGBA;

const parseSwizzle = (str: string): XYZW => {
  if (!str) throw new Error(`Invalid swizzle ${str}.`);
  let hasX = false;
  let hasY = false;
  let hasZ = false;
  let hasW = false;

  for (let character of str) {
    switch (character) {
      case 'x':
      case 'r':
        hasX = true;
        break;
      case 'y':
      case 'g':
        hasY = true;
        break;
      case 'z':
      case 'b':
        hasZ = true;
        break;
      case 'w':
      case 'a':
        hasW = true;
        break;
    }
  }

  return ((hasX ? 'x' : '') + (hasY ? 'y' : '') + (hasZ ? 'z' : '') + (hasW ? 'w' : '')) as XYZW;
};
