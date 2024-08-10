import { asConst } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { Hsl, hsl } from '@modules/renderer/engine/nodes/shadernode/hsl.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';

type Coerce<T> = T extends Node
  ? T
  : T extends null
    ? T | null
    : T extends undefined
      ? T | undefined
      : T extends string
        ? T
        : T extends number | boolean | Vec2 | Vec3 | Vec4 | Mat3 | Mat4 | Color
          ? ConstNode<T>
          : T extends (...params: any) => any
            ? Hsl<T>
            : T extends {}
              ? T
              : never;

export const asNode = <T>(value: T): Coerce<T> => {
  switch (TypeName.ofValue(value)) {
    case null:
    case undefined:
    case TypeName.string:
    case TypeName.node:
      return value as Coerce<T>;
    case TypeName.shader:
      return hsl(value as any) as unknown as Coerce<T>;
    default:
      return asConst(value) as Coerce<T>;
  }
};

export const asNodes = (array: any[]): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i]);
  return array;
};

type ReverseCoerce<T> = T extends Node
  ? T
  : T extends ConstNode<infer U>
    ? ConstNode<U> | U
    : T extends null
      ? T | null
      : T extends undefined
        ? T | undefined
        : T extends Hsl<infer U>
          ? Hsl<U> | U
          : T;

export const asCommand =
  <T extends new (...params: any) => any>(NodeClass: T) =>
  (...params: ReverseCoerce<ConstructorParameters<T>>): InstanceType<T> =>
    new NodeClass(...asNodes(params));
