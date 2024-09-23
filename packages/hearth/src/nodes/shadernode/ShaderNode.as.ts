import { asConst } from '../../nodes/shadernode/utils.js';
import { Hsl, hsl } from '../../nodes/shadernode/hsl.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { Node } from '../../nodes/core/Node.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';
import { Vec3 } from '../../math/Vec3.js';
import { Vec2 } from '../../math/Vec2.js';
import { Mat3 } from '../../math/Mat3.js';
import { Mat4 } from '../../math/Mat4.js';
import { Color } from '../../math/Color.js';
import { Vec4 } from '../../math/Vec4.js';

type Coerce<T> = T extends Node
  ? T
  : T extends null
    ? Coerce<NonNullable<T>> | null
    : T extends undefined
      ? Coerce<NonNullable<T>> | undefined
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

export const asCommand =
  <T extends new (...params: any) => any, P extends any[] = ConstructorParameters<T>>(
    NodeClass: T,
  ): ((...params: P) => InstanceType<T>) =>
  (...params) =>
    new NodeClass(...asNodes(params));
