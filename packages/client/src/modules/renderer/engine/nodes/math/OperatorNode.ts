import { TempNode } from '../core/TempNode.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export class OperatorNode extends TempNode {
  op: Operator;
  aNode: Node;
  bNode: Node;

  constructor(aNode: Node, bNode: Node, ...params: Node[]) {
    super();

    for (let i = 0; i < params.length; ++i) {
      bNode = new (this.constructor as typeof OperatorNode)(bNode, params[i]);
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

  generate(builder: NodeBuilder, output: TypeName): string {
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

export class AddNode extends OperatorNode {
  op = Operator.Add;
}

export class SubNode extends OperatorNode {
  op = Operator.Sub;
}

export class MulNode extends OperatorNode {
  op = Operator.Mul;
}

export class DivNode extends OperatorNode {
  op = Operator.Div;
}

export class RemainderNode extends OperatorNode {
  op = Operator.Remainder;
}

export class EqualNode extends OperatorNode {
  op = Operator.eq;
}

export class NotEqualNode extends OperatorNode {
  op = Operator.neq;
}

export class LessThanNode extends OperatorNode {
  op = Operator.lt;
}

export class GreaterThanNode extends OperatorNode {
  op = Operator.gt;
}

export class LessThanEqualNode extends OperatorNode {
  op = Operator.lte;
}

export class GreaterThanEqualNode extends OperatorNode {
  op = Operator.gte;
}

export class AndNode extends OperatorNode {
  op = Operator.And;
}

export class OrNode extends OperatorNode {
  op = Operator.Or;
}

export class NotNode extends OperatorNode {
  op = Operator.Not;
}

export class BitAndNode extends OperatorNode {
  op = Operator.BitAnd;
}

export class BitNotNode extends OperatorNode {
  op = Operator.BitNot;
}

export class BitOrNode extends OperatorNode {
  op = Operator.BitOr;
}

export class BitXorNode extends OperatorNode {
  op = Operator.BitXor;
}

export class ShiftLeftNode extends OperatorNode {
  op = Operator.BitShiftLeft;
}

export class ShiftRightNode extends OperatorNode {
  op = Operator.BitShiftRight;
}

export const add = asCommand(AddNode);
export const sub = asCommand(SubNode);
export const mul = asCommand(MulNode);
export const div = asCommand(DivNode);
export const remainder = asCommand(RemainderNode);
export const equal = asCommand(EqualNode);
export const notEqual = asCommand(NotEqualNode);
export const lessThan = asCommand(LessThanNode);
export const greaterThan = asCommand(GreaterThanNode);
export const lessThanEqual = asCommand(LessThanEqualNode);
export const greaterThanEqual = asCommand(GreaterThanEqualNode);
export const and = asCommand(AndNode);
export const or = asCommand(OrNode);
export const not = asCommand(NotNode);
export const bitAnd = asCommand(BitAndNode);
export const bitNot = asCommand(BitNotNode);
export const bitOr = asCommand(BitOrNode);
export const bitXor = asCommand(BitXorNode);
export const shiftLeft = asCommand(ShiftLeftNode);
export const shiftRight = asCommand(ShiftRightNode);

implCommand('add', AddNode);
implCommand('sub', SubNode);
implCommand('mul', MulNode);
implCommand('div', DivNode);
implCommand('remainder', RemainderNode);
implCommand('equal', EqualNode);
implCommand('notEqual', NotEqualNode);
implCommand('lessThan', LessThanNode);
implCommand('greaterThan', GreaterThanNode);
implCommand('lessThanEqual', LessThanEqualNode);
implCommand('greaterThanEqual', GreaterThanEqualNode);
implCommand('and', AndNode);
implCommand('or', OrNode);
implCommand('not', NotNode);
implCommand('bitAnd', BitAndNode);
implCommand('bitNot', BitNotNode);
implCommand('bitOr', BitOrNode);
implCommand('bitXor', BitXorNode);
implCommand('shiftLeft', ShiftLeftNode);
implCommand('shiftRight', ShiftRightNode);
