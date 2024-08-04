import type { SetNode } from '@modules/renderer/engine/nodes/utils/SetNode.js';
import type { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import { Node } from './Node.js';

// remove this and implement it directly.
export const implementSwizzle = () => {
  const swizzle = [
    'x',
    'y',
    'z',
    'w',
    'xy',
    'yx',
    'xz',
    'zx',
    'xw',
    'wx',
    'yz',
    'zy',
    'yw',
    'wy',
    'zw',
    'wz',
    'xyz',
    'xzy',
    'yxz',
    'yzx',
    'zxy',
    'zyx',
    'xyw',
    'xwy',
    'yxw',
    'ywx',
    'wxy',
    'wyx',
    'xzw',
    'xwz',
    'zxw',
    'zwx',
    'wxz',
    'wzx',
    'yzw',
    'ywz',
    'zyw',
    'zwy',
    'wyz',
    'wzy',
    'xyzw',
    'xywz',
    'xzyw',
    'xzwy',
    'xwyz',
    'xwzy',
    'yxzw',
    'yxwz',
    'yzxw',
    'yzwx',
    'ywxz',
    'ywzx',
    'zxyw',
    'zxwy',
    'zyxw',
    'zywx',
    'zwxy',
    'zwyx',
    'wxyz',
    'wxzy',
    'wyxz',
    'wyzx',
    'wzxy',
    'wzyx',
    'r',
    'g',
    'b',
    'a',
    'rg',
    'gr',
    'rb',
    'br',
    'ra',
    'ar',
    'gb',
    'bg',
    'ga',
    'ag',
    'ba',
    'ab',
    'rgb',
    'rbg',
    'grb',
    'gbr',
    'brg',
    'bgr',
    'rga',
    'rag',
    'gra',
    'gar',
    'arg',
    'agr',
    'rba',
    'rab',
    'bra',
    'bar',
    'arb',
    'abr',
    'gba',
    'gab',
    'bga',
    'bag',
    'agb',
    'abg',
    'rgba',
    'rgab',
    'rbga',
    'rbag',
    'ragb',
    'rabg',
    'grba',
    'grab',
    'garb',
    'gabr',
    'agrb',
    'agbr',
    'brga',
    'brag',
    'bgar',
    'bgra',
    'abgr',
    'abrg',
  ];

  const properties = Object.fromEntries(
    swizzle.map(key => [
      key,
      {
        get(): SplitNode {
          const split = Node.Map.get('split');

          return Node.as(new split(this, key)) as SplitNode;
        },
        set(value: any): void {
          this[key].assign(value);
        },
      },
    ]),
  );

  Object.defineProperties(Node.prototype, properties);

  for (const key of swizzle) {
    //@ts-expect-error
    Node.prototype[`set${key.toUpperCase()}`] = function (value: any): SetNode {
      const set = Node.Map.get('set');

      return Node.as(new set(this, key, value)) as SetNode;
    };
  }
};
