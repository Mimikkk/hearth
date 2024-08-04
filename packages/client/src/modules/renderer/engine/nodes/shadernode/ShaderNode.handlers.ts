import { NodeCommands } from './ShaderNode.map.js';
import { asNode } from './ShaderNode.as.js';
import { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { SetNode } from '@modules/renderer/engine/nodes/utils/SetNode.js';
import { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';

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
      const assignAs = NodeCommands.get(key.slice(0, key.length - 6));
      if (assignAs) {
        return isStackNode(node)
          ? (...params: Node[]) => proxy.assign(params[0], assignAs(...params))
          : (...params: Node[]) => proxy.assign(assignAs(proxy, ...params));
      }
    }

    if (swizzleRe.test(key)) {
      key = parseSwizzle(key);

      return asNode(new SplitNode(proxy, key));
    }

    if (setSwizzleRe.test(key)) {
      key = parseSwizzle(key.slice(3).toLowerCase());

      return (value: any) => asNode(new SetNode(node, key, value));
    }

    if (indexRe.test(key)) {
      console.log('here', key);
      return asNode(new ArrayElementNode(proxy, new ConstNode(+key, TypeName.u32)));
    }

    Reflect.get(node, key, proxy);
  },
  set(node, key, value, proxy) {
    if (typeof key !== 'string' || key in node || (!indexRe.test(key) && !swizzleRe.test(key)))
      return Reflect.set(node, key, value, proxy);

    proxy[key].assign(value);
    return true;
  },
};

const isStackNode = (node: any): node is StackNode => node.isStackNode === true;
const setSwizzleRe = /^set[XYZWRGBA]{1,4}$/;
const swizzleRe = /^[xyzwrgba]{1,4}$/;
const indexRe = /^\d+$/;

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
