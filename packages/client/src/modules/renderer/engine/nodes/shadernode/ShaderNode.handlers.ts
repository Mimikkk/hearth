import { NodeElements } from './ShaderNode.map.js';
import { parseSwizzle } from './utils.js';
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
      console.log('swizzle', key);
      key = parseSwizzle(key);

      return asNode(new SplitNode(proxy, key));
    }

    // set properties ( swizzle )
    if (setSwizzleRe.test(key)) {
      console.log('swizzle2', key);
      key = parseSwizzle(key.slice(3).toLowerCase());
      key = key.split('').sort().join('');
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
const setSwizzleRe = /^set[XYZWRGBASTPQ]{1,4}$/;
const swizzleRe = /^[xyzwrgbastpq]{1,4}$/;
const arrayRe = /^\d+$/;

type SwizzleCharacter = 'x' | 'y' | 'z' | 'w' | 'r' | 'g' | 'b' | 'a' | 's' | 't' | 'p' | 'q';
type Swizzle1 = SwizzleCharacter;
type Swizzle2 = `${SwizzleCharacter}${SwizzleCharacter}`;
type Swizzle3 = `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`;
type Swizzle4 = `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`;
