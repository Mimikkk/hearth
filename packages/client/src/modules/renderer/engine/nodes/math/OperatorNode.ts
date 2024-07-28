import TempNode from '../core/TempNode.js';
import { addNodeCommand, proxyNode } from '../shadernode/ShaderNodes.js';
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
      case Operator.BitAnd:
      case Operator.BitOr:
      case Operator.BitXor:
      case Operator.BitShiftLeft:
      case Operator.BitShiftRight:
        return TypeName.int(typeA);
      case Operator.Not:
      case Operator.eq:
      case Operator.And:
      case Operator.Or:
        return TypeName.bool;
      case Operator.lt:
      case Operator.gt:
      case Operator.lte:
      case Operator.gte: {
        const len = output ? TypeName.size(output) : Math.max(TypeName.size(typeA), TypeName.size(typeB));

        return TypeName.ofSize(len, TypeName.bool);
      }
      default: {
        if (typeA === TypeName.f32 && TypeName.isMat(typeB)) return typeB;
        if (TypeName.isMat(typeA) && TypeName.isVec(typeB)) return TypeName.matAsVec(typeA);
        if (TypeName.isVec(typeA) && TypeName.isMat(typeB)) return TypeName.matAsVec(typeB);
        if (TypeName.size(typeB) > TypeName.size(typeA)) return typeB;
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
        if (TypeName.isVec(typeA)) {
          typeB = typeA;
        } else {
          typeA = TypeName.f32;
          typeB = TypeName.f32;
        }
      } else if (op === '>>' || op === '<<') {
        typeA = type;
        typeB = TypeName.withComponent(typeB, TypeName.u32);
      } else if (TypeName.isMat(typeA) && TypeName.isVec(typeB)) {
        typeB = TypeName.matAsVec(typeA);
      } else if (TypeName.isVec(typeA) && TypeName.isMat(typeB)) {
        typeA = TypeName.matAsVec(typeB);
      } else {
        typeA = typeB = type;
      }
    } else {
      typeA = type;
      typeB = type;
    }

    const a = aNode.build(builder, typeA);
    const b = bNode.build(builder, typeB);

    const outputLength = TypeName.size(output);

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
  BitAnd = '&',
  BitOr = '|',
  BitXor = '^',
  BitShiftLeft = '<<',
  BitShiftRight = '>>',
}

export default OperatorNode;

export const add = proxyNode(
  class extends OperatorNode {
    op = Operator.Add;
  },
);
export const sub = proxyNode(
  class extends OperatorNode {
    op = Operator.Sub;
  },
);
export const mul = proxyNode(
  class extends OperatorNode {
    op = Operator.Mul;
  },
);
export const div = proxyNode(
  class extends OperatorNode {
    op = Operator.Div;
  },
);
export const remainder = proxyNode(
  class extends OperatorNode {
    op = Operator.Remainder;
  },
);
export const equal = proxyNode(
  class extends OperatorNode {
    op = Operator.eq;
  },
);
export const notEqual = proxyNode(
  class extends OperatorNode {
    op = Operator.neq;
  },
);
export const lessThan = proxyNode(
  class extends OperatorNode {
    op = Operator.lt;
  },
);
export const greaterThan = proxyNode(
  class extends OperatorNode {
    op = Operator.gt;
  },
);
export const lessThanEqual = proxyNode(
  class extends OperatorNode {
    op = Operator.lte;
  },
);
export const greaterThanEqual = proxyNode(
  class extends OperatorNode {
    op = Operator.gte;
  },
);
export const and = proxyNode(
  class extends OperatorNode {
    op = Operator.And;
  },
);
export const or = proxyNode(
  class extends OperatorNode {
    op = Operator.Or;
  },
);
export const not = proxyNode(
  class extends OperatorNode {
    op = Operator.Not;
  },
);
export const bitAnd = proxyNode(
  class extends OperatorNode {
    op = Operator.BitAnd;
  },
);
export const bitNot = proxyNode(
  class extends OperatorNode {
    op = Operator.BitNot;
  },
);
export const bitOr = proxyNode(
  class extends OperatorNode {
    op = Operator.BitOr;
  },
);
export const bitXor = proxyNode(
  class extends OperatorNode {
    op = Operator.BitXor;
  },
);
export const shiftLeft = proxyNode(
  class extends OperatorNode {
    op = Operator.BitShiftLeft;
  },
);
export const shiftRight = proxyNode(
  class extends OperatorNode {
    op = Operator.BitShiftRight;
  },
);

addNodeCommand('add', add);
addNodeCommand('sub', sub);
addNodeCommand('mul', mul);
addNodeCommand('div', div);
addNodeCommand('remainder', remainder);
addNodeCommand('equal', equal);
addNodeCommand('notEqual', notEqual);
addNodeCommand('lessThan', lessThan);
addNodeCommand('greaterThan', greaterThan);
addNodeCommand('lessThanEqual', lessThanEqual);
addNodeCommand('greaterThanEqual', greaterThanEqual);
addNodeCommand('and', and);
addNodeCommand('or', or);
addNodeCommand('not', not);
addNodeCommand('bitAnd', bitAnd);
addNodeCommand('bitNot', bitNot);
addNodeCommand('bitOr', bitOr);
addNodeCommand('bitXor', bitXor);
addNodeCommand('shiftLeft', shiftLeft);
addNodeCommand('shiftRight', shiftRight);
