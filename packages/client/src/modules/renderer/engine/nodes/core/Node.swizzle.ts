import type { SetNode } from '@modules/renderer/engine/nodes/utils/SetNode.js';
import type { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import { Node } from './Node.js';
import type { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { asConst } from '@modules/renderer/engine/nodes/shadernode/utils.js';

export const implSwizzle = () => {
  const swizzleXyzw = [
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
  ];
  const swizzleRgba = [
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

  const propertiesXyzw = Object.fromEntries(
    swizzleXyzw.map(key => [
      key,
      {
        get(): SplitNode {
          const split = Node.Map.split;

          return new split(this, key);
        },
        set(value: any): void {
          this[key].assign(value);
        },
      },
    ]),
  );

  const propertiesRgba = Object.fromEntries(
    swizzleRgba.map((key, i) => [
      key,
      {
        get(): SplitNode {
          const split = Node.Map.split;

          return new split(this, swizzleXyzw[i]);
        },
        set(value: any): void {
          this[swizzleXyzw[i]].assign(value);
        },
      },
    ]),
  );

  Object.defineProperties(Node.prototype, propertiesXyzw);
  Object.defineProperties(Node.prototype, propertiesRgba);

  for (const key of swizzleXyzw) {
    //@ts-expect-error
    Node.prototype[`set${key.toUpperCase()}`] = function (value: any): SetNode {
      const set = Node.Map.set;

      return new set(this, key, value);
    };
  }

  for (let i = 0; i < swizzleRgba.length; ++i) {
    //@ts-expect-error
    Node.prototype[`set${swizzleRgba[i].toUpperCase()}`] = function (value: any): SetNode {
      const set = Node.Map.set;

      return new set(this, swizzleXyzw[i], value);
    };
  }
};

export const implIndexAccess = () => {
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  const properties = Object.fromEntries(
    indices.map(index => [
      index,
      {
        get(): ArrayElementNode {
          const element = Node.Map.element;

          return new element(this, asConst(index, TypeName.u32));
        },
        set(value: any): void {
          this[+index].assign(value);
        },
      },
    ]),
  );

  Object.defineProperties(Node.prototype, properties);
};
