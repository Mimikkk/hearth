import { TempNode } from '../core/TempNode.js';
import { div, mul, sub } from './OperatorNode.js';
import { addNodeCommand, asNode, f32, proxyNode, vec3, vec4 } from '../shadernode/ShaderNodes.js';
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
        return TypeName.withComponent(this.value.getNodeType(builder), TypeName.bool);
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

    const aLen = TypeName.isMat(aType) ? 0 : TypeName.size(aType);
    const bLen = TypeName.isMat(bType) ? 0 : TypeName.size(bType);

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

        if (TypeName.isMat(tA.getNodeType(builder))) {
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
            paramA = a.build(builder, TypeName.size(a.getNodeType(builder)) === 1 ? TypeName.f32 : inputType)!;
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
    const bType = bNode.getNodeType(builder);
    const cType = cNode.getNodeType(builder);

    const aLen = TypeName.isMat(aType) ? 0 : TypeName.size(aType);
    const bLen = TypeName.isMat(bType) ? 0 : TypeName.size(bType);
    const cLen = TypeName.isMat(cType) ? 0 : TypeName.size(cType);

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
        paramA = a.build(builder, inputType);
        paramB = b.build(builder, inputType);
        paramC = c.build(builder, TypeName.f32);
        break;
      case TernaryVariant.Mix:
        paramA = a.build(builder, inputType);
        paramB = b.build(builder, inputType);
        paramC = c.build(builder, TypeName.size(c.getNodeType(builder)) === 1 ? TypeName.f32 : inputType)!;
        break;
      default:
        paramA = a.build(builder, inputType);
        paramB = b.build(builder, inputType);
        paramC = c.build(builder, inputType);
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

export const all = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.All;
  },
);
export const any = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Any;
  },
);
export const equals = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Equals;
  },
);
export const radians = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Radians;
  },
);
export const degrees = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Degrees;
  },
);
export const exp = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Exp;
  },
);
export const exp2 = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Exp2;
  },
);
export const log = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Log;
  },
);
export const log2 = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Log2;
  },
);
export const sqrt = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Sqrt;
  },
);
export const inverseSqrt = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.InverseSqrt;
  },
);
export const floor = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Floor;
  },
);
export const ceil = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Ceil;
  },
);
export const normalize = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Normalize;
  },
);
export const fract = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Fract;
  },
);
export const sin = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Sin;
  },
);
export const cos = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Cos;
  },
);
export const tan = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Tan;
  },
);
export const asin = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Asin;
  },
);
export const acos = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Acos;
  },
);
export const atan = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Atan;
  },
);
export const abs = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Abs;
  },
);
export const sign = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Sign;
  },
);
export const length = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Length;
  },
);
export const negate = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Negate;
  },
);
export const oneMinus = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.OneMinus;
  },
);
export const dpdx = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Dpdx;
  },
);
export const dpdy = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Dpdy;
  },
);
export const round = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Round;
  },
);
export const reciprocal = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Reciprocal;
  },
);
export const trunc = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Trunc;
  },
);
export const fwidth = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Fwidth;
  },
);
export const bitcast = proxyNode(
  class extends UnaryNode {
    method = UnaryVariant.Bitcast;
  },
);

export const atan2 = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Atan2;
  },
);
export const min = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Min;
  },
);
export const max = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Max;
  },
);
export const mod = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Mod;
  },
);
export const step = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Step;
  },
);
export const reflect = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Reflect;
  },
);
export const distance = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Distance;
  },
);
export const difference = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Difference;
  },
);
export const dot = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Dot;
  },
);
export const cross = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Cross;
  },
);
export const pow = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Pow;
  },
);
export const pow2 = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode, f32(2));
    }
  },
);
export const pow3 = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode, f32(3));
    }
  },
);

export const pow4 = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode, f32(4));
    }
  },
);
export const transformDirection = proxyNode(
  class extends BinaryNode {
    method = BinaryVariant.TransformDirection;
  },
);

export const cbrt = (a: Node) => mul(sign(a), pow(abs(a), 1.0 / 3.0));
export const lengthSq = (a: Node) => dot(a, a);

export class MixNode extends TernaryNode {
  method = TernaryVariant.Mix;
}

export const mix = proxyNode(MixNode);
export const clamp = (value: number, low: number = 0, high: number = 1): Node => {
  const math = new TernaryNode(asNode(value), asNode(low), asNode(high));
  math.method = TernaryVariant.Clamp;
  return asNode(math);
};
export const saturate = (value: number) => clamp(value);

export const refract = proxyNode(
  class extends TernaryNode {
    method = TernaryVariant.Refract;
  },
);
export const smoothstep = proxyNode(
  class extends TernaryNode {
    method = TernaryVariant.Smoothstep;
  },
);
export const faceForward = proxyNode(
  class extends TernaryNode {
    method = TernaryVariant.FaceForward;
  },
);

export const mixElement = (t: Node, e1: Node, e2: Node): Node => mix(e1, e2, t);
export const smoothstepElement = (x: Node, low: Node, high: Node): Node => smoothstep(low, high, x);

addNodeCommand('all', all);
addNodeCommand('any', any);
addNodeCommand('equals', equals);
addNodeCommand('radians', radians);
addNodeCommand('degrees', degrees);
addNodeCommand('exp', exp);
addNodeCommand('exp2', exp2);
addNodeCommand('log', log);
addNodeCommand('log2', log2);
addNodeCommand('sqrt', sqrt);
addNodeCommand('inverseSqrt', inverseSqrt);
addNodeCommand('floor', floor);
addNodeCommand('ceil', ceil);
addNodeCommand('normalize', normalize);
addNodeCommand('fract', fract);
addNodeCommand('sin', sin);
addNodeCommand('cos', cos);
addNodeCommand('tan', tan);
addNodeCommand('asin', asin);
addNodeCommand('acos', acos);
addNodeCommand('atan', atan);
addNodeCommand('abs', abs);
addNodeCommand('sign', sign);
addNodeCommand('length', length);
addNodeCommand('lengthSq', lengthSq);
addNodeCommand('negate', negate);
addNodeCommand('oneMinus', oneMinus);
addNodeCommand('dpdx', dpdx);
addNodeCommand('dpdy', dpdy);
addNodeCommand('round', round);
addNodeCommand('reciprocal', reciprocal);
addNodeCommand('trunc', trunc);
addNodeCommand('fwidth', fwidth);
addNodeCommand('atan2', atan2);
addNodeCommand('min', min);
addNodeCommand('max', max);
addNodeCommand('mod', mod);
addNodeCommand('step', step);
addNodeCommand('reflect', reflect);
addNodeCommand('distance', distance);
addNodeCommand('dot', dot);
addNodeCommand('cross', cross);
addNodeCommand('pow', pow);
addNodeCommand('pow2', pow2);
addNodeCommand('pow3', pow3);
addNodeCommand('pow4', pow4);
addNodeCommand('transformDirection', transformDirection);
addNodeCommand('mix', mixElement);
addNodeCommand('clamp', clamp);
addNodeCommand('refract', refract);
addNodeCommand('smoothstep', smoothstepElement);
addNodeCommand('faceForward', faceForward);
addNodeCommand('difference', difference);
addNodeCommand('saturate', saturate);
addNodeCommand('cbrt', cbrt);
