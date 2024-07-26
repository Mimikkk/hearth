import TempNode from '../core/TempNode.js';
import { div, mul, sub } from './OperatorNode.js';
import { addNodeElement, f32, nodeObject, nodeProxy, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';

class MathNode extends TempNode {
  static type = 'MathNode';
  declare method: UnaryVariant | BinaryVariant | TernaryVariant;

  constructor(
    public aNode: Node,
    public bNode: Node | null = null,
    public cNode: Node | null = null,
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
    const method = this.method;

    if (method === MathNode.LENGTH || method === MathNode.DISTANCE || method === MathNode.DOT) {
      return 'f32';
    } else if (method === MathNode.CROSS) {
      return 'vec3';
    } else if (method === MathNode.ALL) {
      return 'bool';
    } else if (method === MathNode.EQUALS) {
      return builder.changeComponentType(this.aNode.getNodeType(builder), 'bool');
    } else if (method === MathNode.MOD) {
      return this.aNode.getNodeType(builder);
    } else {
      return this.getInputType(builder);
    }
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    const method = this.method;

    const type = this.getNodeType(builder);
    const inputType = this.getInputType(builder);

    const a = this.aNode;
    const b = this.bNode;
    const c = this.cNode;

    const isWebGL = builder.renderer.isWebGLRenderer === true;

    if (method === MathNode.TRANSFORM_DIRECTION) {
      // dir can be either a direction vector or a normal vector
      // upper-left 3x3 of matrix is assumed to be orthogonal

      let tA = a;
      let tB = b;

      if (builder.isMatrix(tA.getNodeType(builder))) {
        tB = vec4(vec3(tB), 0.0);
      } else {
        tA = vec4(vec3(tA), 0.0);
      }

      const mulNode = mul(tA, tB).xyz;

      return normalize(mulNode).build(builder, output);
    } else if (method === MathNode.NEGATE) {
      return builder.format('( - ' + a.build(builder, inputType) + ' )', type, output);
    } else if (method === MathNode.ONE_MINUS) {
      return sub(1.0, a).build(builder, output);
    } else if (method === MathNode.RECIPROCAL) {
      return div(1.0, a).build(builder, output);
    } else if (method === MathNode.DIFFERENCE) {
      return abs(sub(a, b)).build(builder, output);
    } else {
      const params = [];

      if (method === MathNode.CROSS || method === MathNode.MOD) {
        params.push(a.build(builder, type), b.build(builder, type));
      } else if (method === MathNode.STEP) {
        params.push(
          a.build(builder, builder.getTypeLength(a.getNodeType(builder)) === 1 ? 'f32' : inputType),
          b.build(builder, inputType),
        );
      } else if ((isWebGL && (method === MathNode.MIN || method === MathNode.MAX)) || method === MathNode.MOD) {
        params.push(
          a.build(builder, inputType),
          b.build(builder, builder.getTypeLength(b.getNodeType(builder)) === 1 ? 'f32' : inputType),
        );
      } else if (method === MathNode.REFRACT) {
        params.push(a.build(builder, inputType), b.build(builder, inputType), c.build(builder, 'f32'));
      } else if (method === MathNode.MIX) {
        params.push(
          a.build(builder, inputType),
          b.build(builder, inputType),
          c.build(builder, builder.getTypeLength(c.getNodeType(builder)) === 1 ? 'f32' : inputType),
        );
      } else {
        params.push(a.build(builder, inputType));
        if (b !== null) params.push(b.build(builder, inputType));
        if (c !== null) params.push(c.build(builder, inputType));
      }

      return builder.format(`${builder.codeMethod(method, type)}( ${params.join(', ')} )`, type, output);
    }
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

// 1 input

MathNode.ALL = 'all';
MathNode.ANY = 'any';
MathNode.EQUALS = 'equals';

MathNode.RADIANS = 'radians';
MathNode.DEGREES = 'degrees';
MathNode.EXP = 'exp';
MathNode.EXP2 = 'exp2';
MathNode.LOG = 'log';
MathNode.LOG2 = 'log2';
MathNode.SQRT = 'sqrt';
MathNode.INVERSE_SQRT = 'inverseSqrt';
MathNode.FLOOR = 'floor';
MathNode.CEIL = 'ceil';
MathNode.NORMALIZE = 'normalize';
MathNode.FRACT = 'fract';
MathNode.SIN = 'sin';
MathNode.COS = 'cos';
MathNode.TAN = 'tan';
MathNode.ASIN = 'asin';
MathNode.ACOS = 'acos';
MathNode.ATAN = 'atan';
MathNode.ABS = 'abs';
MathNode.SIGN = 'sign';
MathNode.LENGTH = 'length';
MathNode.NEGATE = 'negate';
MathNode.ONE_MINUS = 'oneMinus';
MathNode.dpdx = 'dpdx';
MathNode.dpdy = 'dpdy';
MathNode.ROUND = 'round';
MathNode.RECIPROCAL = 'reciprocal';
MathNode.TRUNC = 'trunc';
MathNode.FWIDTH = 'fwidth';
MathNode.BITCAST = 'bitcast';

// 2 inputs

MathNode.ATAN2 = 'atan2';
MathNode.MIN = 'min';
MathNode.MAX = 'max';
MathNode.MOD = 'mod';
MathNode.STEP = 'step';
MathNode.REFLECT = 'reflect';
MathNode.DISTANCE = 'distance';
MathNode.DIFFERENCE = 'difference';
MathNode.DOT = 'dot';
MathNode.CROSS = 'cross';
MathNode.POW = 'pow';
MathNode.TRANSFORM_DIRECTION = 'transformDirection';

// 3 inputs

MathNode.MIX = 'mix';
MathNode.CLAMP = 'clamp';
MathNode.REFRACT = 'refract';
MathNode.SMOOTHSTEP = 'smoothstep';
MathNode.FACEFORWARD = 'faceforward';

export default MathNode;

export const EPSILON = f32(1e-6);
export const INFINITY = f32(1e6);
export const PI = f32(Math.PI);
export const PI2 = f32(Math.PI * 2);

export const all = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.All;
  },
);
export const any = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Any;
  },
);
export const equals = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Equals;
  },
);
export const radians = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Radians;
  },
);
export const degrees = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Degrees;
  },
);
export const exp = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Exp;
  },
);
export const exp2 = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Exp2;
  },
);
export const log = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Log;
  },
);
export const log2 = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Log2;
  },
);
export const sqrt = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Sqrt;
  },
);
export const inverseSqrt = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.InverseSqrt;
  },
);
export const floor = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Floor;
  },
);
export const ceil = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Ceil;
  },
);
export const normalize = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Normalize;
  },
);
export const fract = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Fract;
  },
);
export const sin = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Sin;
  },
);
export const cos = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Cos;
  },
);
export const tan = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Tan;
  },
);
export const asin = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Asin;
  },
);
export const acos = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Acos;
  },
);
export const atan = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Atan;
  },
);
export const abs = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Abs;
  },
);
export const sign = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Sign;
  },
);
export const length = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Length;
  },
);
export const negate = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Negate;
  },
);
export const oneMinus = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.OneMinus;
  },
);
export const dpdx = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Dpdx;
  },
);
export const dpdy = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Dpdy;
  },
);
export const round = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Round;
  },
);
export const reciprocal = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Reciprocal;
  },
);
export const trunc = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Trunc;
  },
);
export const fwidth = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Fwidth;
  },
);
export const bitcast = nodeProxy(
  class extends MathNode {
    method = UnaryVariant.Bitcast;
  },
);

export const atan2 = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Atan2;
  },
);
export const min = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Min;
  },
);
export const max = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Max;
  },
);
export const mod = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Mod;
  },
);
export const step = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Step;
  },
);
export const reflect = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Reflect;
  },
);
export const distance = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Distance;
  },
);
export const difference = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Difference;
  },
);
export const dot = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Dot;
  },
);
export const cross = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Cross;
  },
);
export const pow = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Pow;
  },
);
export const pow2 = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(2);
    }
  },
);
export const pow3 = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(3);
    }
  },
);
export const pow4 = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.Pow;

    constructor(aNode: Node) {
      super(aNode);
      this.bNode = f32(4);
    }
  },
);
export const transformDirection = nodeProxy(
  class extends MathNode {
    method = BinaryVariant.TransformDirection;
  },
);

export const cbrt = a => mul(sign(a), pow(abs(a), 1.0 / 3.0));
export const lengthSq = a => dot(a, a);
export const mix = nodeProxy(
  class extends MathNode {
    method = TernaryVariant.Mix;
  },
);
export const clamp = (value, low = 0, high = 1) => {
  const math = new MathNode(nodeObject(value), nodeObject(low), nodeObject(high));
  math.method = TernaryVariant.Clamp;
  return nodeObject(math);
};

export const saturate = value => clamp(value);
export const refract = nodeProxy(
  class extends MathNode {
    method = TernaryVariant.Refract;
  },
);
export const smoothstep = nodeProxy(
  class extends MathNode {
    method = TernaryVariant.Smoothstep;
  },
);
export const faceForward = nodeProxy(
  class extends MathNode {
    method = TernaryVariant.FaceForward;
  },
);

export const mixElement = (t, e1, e2) => mix(e1, e2, t);
export const smoothstepElement = (x, low, high) => smoothstep(low, high, x);

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
