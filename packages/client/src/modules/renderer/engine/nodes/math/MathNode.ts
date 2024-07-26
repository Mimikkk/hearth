import { TempNode } from '../core/TempNode.js';
import { div, mul, sub } from './OperatorNode.js';
import { addNodeElement, f32, nodeObject, nodeProxy, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';

export class UnaryNode extends TempNode {
  declare method: UnaryVariant | BinaryVariant | TernaryVariant;

  constructor(public value: Node) {
    super();
  }

  getInputType(builder: NodeBuilder): TypeName {
    return this.value.getNodeType(builder);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    switch (this.method) {
      case UnaryVariant.Length:
        return TypeName.f32;
      case UnaryVariant.All:
        return TypeName.bool;
      case UnaryVariant.Equals:
        return builder.changeComponentType(this.value.getNodeType(builder), TypeName.bool);
      default:
        return this.getInputType(builder);
    }
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    const { method, value: a } = this;

    switch (this.method) {
      case UnaryVariant.Negate: {
        const inputType = this.getInputType(builder);
        const type = this.getNodeType(builder);

        return builder.format(`(-${a.build(builder, inputType)})`, type, output);
      }
      case UnaryVariant.OneMinus:
        return sub(1.0, a).build(builder, output);
      case UnaryVariant.Reciprocal:
        return div(1.0, a).build(builder, output);
      default: {
        const inputType = this.getInputType(builder);
        const type = this.getNodeType(builder);

        return builder.format(`${builder.codeMethod(method, type)}(${a.build(builder, inputType)})`, type, output);
      }
    }
  }
}

export class BinaryNode extends TempNode {
  declare method: UnaryVariant | BinaryVariant | TernaryVariant;

  constructor(
    public aNode: Node,
    public bNode: Node,
  ) {
    super();
  }

  getInputType(builder: NodeBuilder): TypeName {
    const { aNode, bNode } = this;

    const aType = aNode.getNodeType(builder);
    const bType = bNode.getNodeType(builder);

    const aLen = builder.isMatrix(aType) ? 0 : builder.getTypeLength(aType);
    const bLen = builder.isMatrix(bType) ? 0 : builder.getTypeLength(bType);

    return aLen > bLen ? aType : bType;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    switch (this.method) {
      case BinaryVariant.Distance:
      case BinaryVariant.Dot:
        return TypeName.f32;
      case BinaryVariant.Cross:
        return TypeName.vec3;
      case BinaryVariant.Mod:
        return this.aNode.getNodeType(builder);
      default:
        return this.getInputType(builder);
    }
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    const { method, aNode: a, bNode: b } = this;

    const type = this.getNodeType(builder);
    const inputType = this.getInputType(builder);

    switch (this.method) {
      case BinaryVariant.TransformDirection: {
        let tA = a;
        let tB = b;

        if (builder.isMatrix(tA.getNodeType(builder))) {
          tB = vec4(vec3(tB), 0.0);
        } else {
          tA = vec4(vec3(tA), 0.0);
        }
        return normalize(mul(tA, tB).xyz).build(builder, output);
      }
      case BinaryVariant.Difference:
        return abs(sub(a, b)).build(builder, output);
      default: {
        let paramA: string = '';
        let paramB: string = '';

        switch (this.method) {
          case BinaryVariant.Cross:
          case BinaryVariant.Mod:
            paramA = a.build(builder, type)!;
            paramB = b.build(builder, type)!;
            break;
          case BinaryVariant.Step:
            paramA = a.build(builder, builder.getTypeLength(a.getNodeType(builder)) === 1 ? TypeName.f32 : inputType)!;
            paramB = b.build(builder, inputType)!;
            break;
          default:
            paramA = a.build(builder, inputType)!;
            paramB = b.build(builder, inputType)!;
        }

        return builder.format(`${builder.codeMethod(method, type)}(${paramA}, ${paramB})`, type, output);
      }
    }
  }
}

export class TernaryNode extends TempNode {
  declare method: UnaryVariant | BinaryVariant | TernaryVariant;

  constructor(
    public aNode: Node,
    public bNode: Node,
    public cNode: Node,
  ) {
    super();
  }

  getInputType(builder: NodeBuilder): TypeName {
    const { aNode, bNode, cNode } = this;

    const aType = aNode.getNodeType(builder);
    const bType = bNode?.getNodeType(builder) ?? null;
    const cType = cNode?.getNodeType(builder) ?? null;

    const aLen = builder.isMatrix(aType) ? 0 : builder.getTypeLength(aType);
    const bLen = builder.isMatrix(bType) ? 0 : builder.getTypeLength(bType);
    const cLen = builder.isMatrix(cType) ? 0 : builder.getTypeLength(cType);

    if (aLen > bLen && aLen > cLen) {
      return aType;
    } else if (bLen > cLen) {
      return bType;
    } else if (cLen > aLen) {
      return cType;
    }

    return aType;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.getInputType(builder);
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    const method = this.method;

    const type = this.getNodeType(builder);
    const inputType = this.getInputType(builder);

    const a = this.aNode;
    const b = this.bNode;
    const c = this.cNode;
    let paramA = '';
    let paramB = '';
    let paramC = '';

    switch (this.method) {
      case TernaryVariant.Refract:
        paramA = a.build(builder, inputType)!;
        paramB = b.build(builder, inputType)!;
        paramC = c.build(builder, TypeName.f32)!;
        break;
      case TernaryVariant.Mix:
        paramA = a.build(builder, inputType)!;
        paramB = b.build(builder, inputType)!;
        paramC = c.build(builder, builder.getTypeLength(c!.getNodeType(builder)) === 1 ? TypeName.f32 : inputType)!;
        break;
      default:
        paramA = a.build(builder, inputType)!;
        paramB = b.build(builder, inputType)!;
        paramC = c.build(builder, inputType)!;
    }

    return builder.format(`${builder.codeMethod(method, type)}(${paramA}, ${paramB}, ${paramC})`, type, output);
  }
}

enum UnaryVariant {
  All = 'all',
  Any = 'any',
  Equals = 'equals',
  Radians = 'radians',
  Degrees = 'degrees',
  Exp = 'exp',
  Exp2 = 'exp2',
  Log = 'log',
  Log2 = 'log2',
  Sqrt = 'sqrt',
  InverseSqrt = 'inverseSqrt',
  Floor = 'floor',
  Ceil = 'ceil',
  Normalize = 'normalize',
  Fract = 'fract',
  Sin = 'sin',
  Cos = 'cos',
  Tan = 'tan',
  Asin = 'asin',
  Acos = 'acos',
  Atan = 'atan',
  Abs = 'abs',
  Sign = 'sign',
  Length = 'length',
  Negate = 'negate',
  OneMinus = 'oneMinus',
  Dpdx = 'dpdx',
  Dpdy = 'dpdy',
  Round = 'round',
  Reciprocal = 'reciprocal',
  Trunc = 'trunc',
  Fwidth = 'fwidth',
  Bitcast = 'bitcast',
}

enum BinaryVariant {
  Atan2 = 'atan2',
  Min = 'min',
  Max = 'max',
  Mod = 'mod',
  Step = 'step',
  Reflect = 'reflect',
  Distance = 'distance',
  Difference = 'difference',
  Dot = 'dot',
  Cross = 'cross',
  Pow = 'pow',
  TransformDirection = 'transformDirection',
}

enum TernaryVariant {
  Mix = 'mix',
  Clamp = 'clamp',
  Refract = 'refract',
  Smoothstep = 'smoothstep',
  FaceForward = 'faceforward',
}

export const EPSILON = f32(1e-6);
export const INFINITY = f32(1e6);
export const PI = f32(Math.PI);
export const PI2 = f32(Math.PI * 2);

export const all = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.All;
  },
);
export const any = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Any;
  },
);
export const equals = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Equals;
  },
);
export const radians = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Radians;
  },
);
export const degrees = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Degrees;
  },
);
export const exp = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Exp;
  },
);
export const exp2 = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Exp2;
  },
);
export const log = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Log;
  },
);
export const log2 = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Log2;
  },
);
export const sqrt = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Sqrt;
  },
);
export const inverseSqrt = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.InverseSqrt;
  },
);
export const floor = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Floor;
  },
);
export const ceil = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Ceil;
  },
);
export const normalize = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Normalize;
  },
);
export const fract = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Fract;
  },
);
export const sin = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Sin;
  },
);
export const cos = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Cos;
  },
);
export const tan = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Tan;
  },
);
export const asin = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Asin;
  },
);
export const acos = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Acos;
  },
);
export const atan = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Atan;
  },
);
export const abs = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Abs;
  },
);
export const sign = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Sign;
  },
);
export const length = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Length;
  },
);
export const negate = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Negate;
  },
);
export const oneMinus = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.OneMinus;
  },
);
export const dpdx = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Dpdx;
  },
);
export const dpdy = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Dpdy;
  },
);
export const round = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Round;
  },
);
export const reciprocal = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Reciprocal;
  },
);
export const trunc = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Trunc;
  },
);
export const fwidth = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Fwidth;
  },
);
export const bitcast = nodeProxy(
  class extends UnaryNode {
    method = UnaryVariant.Bitcast;
  },
);

export const atan2 = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Atan2;
  },
);
export const min = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Min;
  },
);
export const max = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Max;
  },
);
export const mod = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Mod;
  },
);
export const step = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Step;
  },
);
export const reflect = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Reflect;
  },
);
export const distance = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Distance;
  },
);
export const difference = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Difference;
  },
);
export const dot = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Dot;
  },
);
export const cross = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Cross;
  },
);
export const pow = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Pow;
  },
);
export const pow2 = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(2);
    }
  },
);
export const pow3 = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(3);
    }
  },
);
export const pow4 = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(4);
    }
  },
);
export const transformDirection = nodeProxy(
  class extends BinaryNode {
    method = BinaryVariant.TransformDirection;
  },
);

export const cbrt = (a: Node) => mul(sign(a), pow(abs(a), 1.0 / 3.0));
export const lengthSq = (a: Node) => dot(a, a);
export const mix = nodeProxy(
  class extends TernaryNode {
    method = TernaryVariant.Mix;
  },
);
export const clamp = (value: number, low: number = 0, high: number = 1): Node => {
  const math = new TernaryNode(nodeObject(value), nodeObject(low), nodeObject(high));
  math.method = TernaryVariant.Clamp;
  return nodeObject(math);
};
export const saturate = (value: number) => clamp(value);

export const refract = nodeProxy(
  class extends TernaryNode {
    method = TernaryVariant.Refract;
  },
);
export const smoothstep = nodeProxy(
  class extends TernaryNode {
    method = TernaryVariant.Smoothstep;
  },
);
export const faceForward = nodeProxy(
  class extends TernaryNode {
    method = TernaryVariant.FaceForward;
  },
);

export const mixElement = (t: Node, e1: Node, e2: Node): Node => mix(e1, e2, t);
export const smoothstepElement = (x: Node, low: Node, high: Node): Node => smoothstep(low, high, x);

addNodeElement('all', all);
addNodeElement('any', any);
addNodeElement('equals', equals);
addNodeElement('radians', radians);
addNodeElement('degrees', degrees);
addNodeElement('exp', exp);
addNodeElement('exp2', exp2);
addNodeElement('log', log);
addNodeElement('log2', log2);
addNodeElement('sqrt', sqrt);
addNodeElement('inverseSqrt', inverseSqrt);
addNodeElement('floor', floor);
addNodeElement('ceil', ceil);
addNodeElement('normalize', normalize);
addNodeElement('fract', fract);
addNodeElement('sin', sin);
addNodeElement('cos', cos);
addNodeElement('tan', tan);
addNodeElement('asin', asin);
addNodeElement('acos', acos);
addNodeElement('atan', atan);
addNodeElement('abs', abs);
addNodeElement('sign', sign);
addNodeElement('length', length);
addNodeElement('lengthSq', lengthSq);
addNodeElement('negate', negate);
addNodeElement('oneMinus', oneMinus);
addNodeElement('dpdx', dpdx);
addNodeElement('dpdy', dpdy);
addNodeElement('round', round);
addNodeElement('reciprocal', reciprocal);
addNodeElement('trunc', trunc);
addNodeElement('fwidth', fwidth);
addNodeElement('atan2', atan2);
addNodeElement('min', min);
addNodeElement('max', max);
addNodeElement('mod', mod);
addNodeElement('step', step);
addNodeElement('reflect', reflect);
addNodeElement('distance', distance);
addNodeElement('dot', dot);
addNodeElement('cross', cross);
addNodeElement('pow', pow);
addNodeElement('pow2', pow2);
addNodeElement('pow3', pow3);
addNodeElement('pow4', pow4);
addNodeElement('transformDirection', transformDirection);
addNodeElement('mix', mixElement);
addNodeElement('clamp', clamp);
addNodeElement('refract', refract);
addNodeElement('smoothstep', smoothstepElement);
addNodeElement('faceForward', faceForward);
addNodeElement('difference', difference);
addNodeElement('saturate', saturate);
addNodeElement('cbrt', cbrt);
