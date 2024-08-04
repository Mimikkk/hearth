import { NodeCommands } from './ShaderNode.map.js';
import type { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';

export const handlers: ProxyHandler<Node> = {
  get(node, key, proxy) {
    if (typeof key !== 'string' || key in node) return Reflect.get(node, key, proxy);

    const command = NodeCommands.get(key);
    if (command) {
      return isStackNode(node)
        ? (...params) => proxy.add(command(...params))
        : (...params) => command(proxy, ...params);
    }

    if (key.endsWith('Assign')) {
      const as = NodeCommands.get(key.slice(0, key.length - 6));

      if (as) {
        return isStackNode(node)
          ? (...params) => proxy.assign(params[0], as(...params))
          : (...params) => proxy.assign(as(proxy, ...params));
      }
    }

    Reflect.get(node, key, proxy);
  },
};

const isStackNode = (value: any): value is StackNode => value.isStackNode === true;

export type XYZW = 'x' | 'xy' | 'xyz' | 'xyzw' | 'y' | 'yz' | 'yzw' | 'z' | 'zw' | 'w';
export type RGBA = 'r' | 'rg' | 'rgb' | 'rgba' | 'g' | 'gb' | 'gba' | 'b' | 'ba' | 'a';
