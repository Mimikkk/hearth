import { NodeCommands } from './ShaderNode.map.js';
import { asNode } from './ShaderNode.as.js';
import { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export const handlers: ProxyHandler<Node> = {
  get(node, key, proxy) {
    if (typeof key !== 'string' || key in node) return Reflect.get(node, key, proxy);

    const command = NodeCommands.get(key);
    if (command) {
      return isStackNode(node)
        ? (...params: Node[]) => proxy.add(command(...params))
        : (...params: Node[]) => command(proxy, ...params);
    }

    if (key.endsWith('Assign')) {
      const as = NodeCommands.get(key.slice(0, key.length - 6));

      if (as) {
        return isStackNode(node)
          ? (...params: Node[]) => proxy.assign(params[0], as(...params))
          : (...params: Node[]) => proxy.assign(as(proxy, ...params));
      }
    }

    if (indexRe.test(key)) {
      console.log('here', node, key);
      return asNode(new ArrayElementNode(proxy, new ConstNode(+key, TypeName.u32)));
    }

    Reflect.get(node, key, proxy);
  },
};

const isStackNode = (node: any): node is StackNode => node.isStackNode === true;
const indexRe = /^\d+$/;

export type XYZW = 'x' | 'xy' | 'xyz' | 'xyzw' | 'y' | 'yz' | 'yzw' | 'z' | 'zw' | 'w';
export type RGBA = 'r' | 'rg' | 'rgb' | 'rgba' | 'g' | 'gb' | 'gba' | 'b' | 'ba' | 'a';
export type Swizzle = XYZW | RGBA;
