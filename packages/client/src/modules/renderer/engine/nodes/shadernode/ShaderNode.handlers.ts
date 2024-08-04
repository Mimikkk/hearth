import { NodeCommands } from './ShaderNode.map.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';
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

    const item = NodeCommands.get(key);
    if (item) {
      return isStackNode(node) ? (...params) => proxy.add(item(...params)) : (...params) => item(proxy, ...params);
    }

    if (key.endsWith('Assign')) {
      const assignAs = NodeCommands.get(key.slice(0, key.length - 6));
      if (assignAs) {
        return isStackNode(node)
          ? (...params) => proxy.assign(params[0], assignAs(...params))
          : (...params) => proxy.assign(assignAs(proxy, ...params));
      }
    }

    Reflect.get(node, key, proxy);
  },
};

const isStackNode = (value: any): value is StackNode => value.isStackNode === true;

export type XYZW = 'x' | 'xy' | 'xyz' | 'xyzw' | 'y' | 'yz' | 'yzw' | 'z' | 'zw' | 'w';
export type RGBA = 'r' | 'rg' | 'rgb' | 'rgba' | 'g' | 'gb' | 'gba' | 'b' | 'ba' | 'a';
