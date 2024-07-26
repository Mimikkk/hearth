import TempNode from '../core/TempNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';
import { Node } from '../core/Node.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

class OperatorNode extends TempNode {
  static type = 'OperatorNode';
  op: Operator;
  aNode: Node;
  bNode: Node;

  constructor(aNode: Node, bNode: Node, ...params: Node[]) {
    super();

    for (let i = 0; i < params.length; ++i) {
      bNode = new (this.constructor as new (a: Node, b: Node) => Node)(bNode, params[i]);
    }

    this.aNode = aNode;
    this.bNode = bNode;
  }

  getNodeType(builder: NodeBuilder, output: TypeName): TypeName {
    const op = this.op;

    const aNode = this.aNode;
    const bNode = this.bNode;

    const typeA = aNode.getNodeType(builder)!;
    const typeB = bNode.getNodeType(builder)!;

    if (typeA === TypeName.void || typeB === TypeName.void) return TypeName.void;

    switch (op) {
      case Operator.Remainder:
        return typeA;
      case Operator.BitNot:
      case Operator.BinAnd:
      case Operator.BinOr:
      case Operator.BinXor:
      case Operator.ShiftLeft:
      case Operator.ShiftRight:
        return builder.getIntegerType(typeA);
      case Operator.Not:
      case Operator.eq:
      case Operator.And:
      case Operator.Or:
        return TypeName.bool;
      case Operator.lt:
      case Operator.gt:
      case Operator.lte:
      case Operator.gte: {
        const typeLength = output
          ? builder.getTypeLength(output)
          : Math.max(builder.getTypeLength(typeA), builder.getTypeLength(typeB));

        return typeLength > 1
          ? (`bvec${typeLength}` as TypeName.bvec2 | TypeName.bvec3 | TypeName.bvec4)
          : TypeName.bool;
      }
      default: {
        if (typeA === TypeName.f32 && builder.isMatrix(typeB)) {
          return typeB;
        }

        if (builder.isMatrix(typeA) && builder.isVector(typeB)) {
          return builder.getVectorFromMatrix(typeA);
        }

        if (builder.isVector(typeA) && builder.isMatrix(typeB)) {
          return builder.getVectorFromMatrix(typeB);
        }

        if (builder.getTypeLength(typeB) > builder.getTypeLength(typeA)) {
          return typeB;
        }

        return typeA;
      }
    }
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    const op = this.op;

    const aNode = this.aNode;
    const bNode = this.bNode;

    const type = this.getNodeType(builder, output);

    let typeA;
    let typeB;
    if (type !== TypeName.void) {
      typeA = aNode.getNodeType(builder);
      typeB = bNode?.getNodeType(builder);

      if (op === '<' || op === '>' || op === '<=' || op === '>=' || op === '==') {
        if (builder.isVector(typeA)) {
          typeB = typeA;
        } else {
          typeA = TypeName.f32;
          typeB = TypeName.f32;
        }
      } else if (op === '>>' || op === '<<') {
        typeA = type;
        typeB = builder.changeComponentType(typeB, TypeName.u32);
      } else if (builder.isMatrix(typeA) && builder.isVector(typeB)) {
        typeB = builder.getVectorFromMatrix(typeA);
      } else if (builder.isVector(typeA) && builder.isMatrix(typeB)) {
        typeA = builder.getVectorFromMatrix(typeB);
      } else {
        typeA = typeB = type;
      }
    } else {
      typeA = type;
      typeB = type;
    }

    const a = aNode.build(builder, typeA);
    const b = bNode.build(builder, typeB);

    const outputLength = builder.getTypeLength(output);

    if (output !== TypeName.void) {
      // Polyfills for missing for bvec2/3/4
      if (op === Operator.lt && outputLength > 1) {
        return builder.format(`${builder.codeMethod('lessThan')}(${a}, ${b})`, type, output);
      }

      if (op === Operator.lte && outputLength > 1) {
        return builder.format(`${builder.codeMethod('lessThanEqual')}(${a}, ${b})`, type, output);
      }

      if (op === Operator.gt && outputLength > 1) {
        return builder.format(`${builder.codeMethod('greaterThan')}(${a}, ${b})`, type, output);
      }

      if (op === Operator.gte && outputLength > 1) {
        return builder.format(`${builder.codeMethod('greaterThanEqual')}(${a}, ${b})`, type, output);
      }

      if (op === Operator.Not || op === Operator.BitNot) {
        return builder.format(`(${op}${a})`, typeA, output);
      }
      return builder.format(`(${a} ${op} ${b})`, type, output);
    } else if (typeA !== TypeName.void) {
      return builder.format(`${a} ${op} ${b}`, type, output);
    }

    throw new Error('No output specified');
  }
}

enum Operator {
  Not = '!',
  BitNot = '~',

  Add = '+',
  Sub = '-',
  Mul = '*',
  Div = '/',
  Remainder = '%',
  eq = '==',
  neq = '!=',

  lt = '<',
  gt = '>',
  lte = '<=',
  gte = '>=',

  And = '&&',
  Or = '||',
  BinAnd = '&',
  BinOr = '|',
  BinXor = '^',
  ShiftLeft = '<<',
  ShiftRight = '>>',
}

export default OperatorNode;

export const add = nodeProxy(
  class extends OperatorNode {
    op = Operator.Add;
  },
);
export const sub = nodeProxy(
  class extends OperatorNode {
    op = Operator.Sub;
  },
);
export const mul = nodeProxy(
  class extends OperatorNode {
    op = Operator.Mul;
  },
);
export const div = nodeProxy(
  class extends OperatorNode {
    op = Operator.Div;
  },
);
export const remainder = nodeProxy(
  class extends OperatorNode {
    op = Operator.Remainder;
  },
);
export const equal = nodeProxy(
  class extends OperatorNode {
    op = Operator.eq;
  },
);
export const notEqual = nodeProxy(
  class extends OperatorNode {
    op = Operator.neq;
  },
);
export const lessThan = nodeProxy(
  class extends OperatorNode {
    op = Operator.lt;
  },
);
export const greaterThan = nodeProxy(
  class extends OperatorNode {
    op = Operator.gt;
  },
);
export const lessThanEqual = nodeProxy(
  class extends OperatorNode {
    op = Operator.lte;
  },
);
export const greaterThanEqual = nodeProxy(
  class extends OperatorNode {
    op = Operator.gte;
  },
);
export const and = nodeProxy(
  class extends OperatorNode {
    op = Operator.And;
  },
);
export const or = nodeProxy(
  class extends OperatorNode {
    op = Operator.Or;
  },
);
export const not = nodeProxy(
  class extends OperatorNode {
    op = Operator.Not;
  },
);
export const bitAnd = nodeProxy(
  class extends OperatorNode {
    op = Operator.BinAnd;
  },
);
export const bitNot = nodeProxy(
  class extends OperatorNode {
    op = Operator.BitNot;
  },
);
export const bitOr = nodeProxy(
  class extends OperatorNode {
    op = Operator.BinOr;
  },
);
export const bitXor = nodeProxy(
  class extends OperatorNode {
    op = Operator.BinXor;
  },
);
export const shiftLeft = nodeProxy(
  class extends OperatorNode {
    op = Operator.ShiftLeft;
  },
);
export const shiftRight = nodeProxy(
  class extends OperatorNode {
    op = Operator.ShiftRight;
  },
);
// export const sub = nodeProxy(OperatorNode, '-');
// export const mul = nodeProxy(OperatorNode, '*');
// export const div = nodeProxy(OperatorNode, '/');
// export const remainder = nodeProxy(OperatorNode, '%');
// export const equal = nodeProxy(OperatorNode, '==');
// export const notEqual = nodeProxy(OperatorNode, '!=');
// export const lessThan = nodeProxy(OperatorNode, '<');
// export const greaterThan = nodeProxy(OperatorNode, '>');
// export const lessThanEqual = nodeProxy(OperatorNode, '<=');
// export const greaterThanEqual = nodeProxy(OperatorNode, '>=');
// export const and = nodeProxy(OperatorNode, '&&');
// export const or = nodeProxy(OperatorNode, '||');
// export const not = nodeProxy(OperatorNode, '!');
// export const bitAnd = nodeProxy(OperatorNode, '&');
// export const bitNot = nodeProxy(OperatorNode, '~');
// export const bitOr = nodeProxy(OperatorNode, '|');
// export const bitXor = nodeProxy(OperatorNode, '^');
// export const shiftLeft = nodeProxy(OperatorNode, '<<');
// export const shiftRight = nodeProxy(OperatorNode, '>>');

addNodeElement('add', add);
addNodeElement('sub', sub);
addNodeElement('mul', mul);
addNodeElement('div', div);
addNodeElement('remainder', remainder);
addNodeElement('equal', equal);
addNodeElement('notEqual', notEqual);
addNodeElement('lessThan', lessThan);
addNodeElement('greaterThan', greaterThan);
addNodeElement('lessThanEqual', lessThanEqual);
addNodeElement('greaterThanEqual', greaterThanEqual);
addNodeElement('and', and);
addNodeElement('or', or);
addNodeElement('not', not);
addNodeElement('bitAnd', bitAnd);
addNodeElement('bitNot', bitNot);
addNodeElement('bitOr', bitOr);
addNodeElement('bitXor', bitXor);
addNodeElement('shiftLeft', shiftLeft);
addNodeElement('shiftRight', shiftRight);
