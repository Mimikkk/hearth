import { TempNode } from '../core/TempNode.js';
import { div, mul, MulNode, sub } from './OperatorNode.js';
import { addNodeCommand, asNode, f32, proxyNode, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { asConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';

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

enum TernaryVariant {
  Mix = 'mix',
  Clamp = 'clamp',
  Refract = 'refract',
  Smoothstep = 'smoothstep',
  FaceForward = 'faceforward',
}

export const EPSILON = f32(1e-6);
export const PI = f32(Math.PI);

export class AllNode extends UnaryNode {
  method = UnaryVariant.All;
}

export class AnyNode extends UnaryNode {
  method = UnaryVariant.Any;
}

export class EqualsNode extends UnaryNode {
  method = UnaryVariant.Equals;
}

export class RadiansNode extends UnaryNode {
  method = UnaryVariant.Radians;
}

export class DegreesNode extends UnaryNode {
  method = UnaryVariant.Degrees;
}

export class ExpNode extends UnaryNode {
  method = UnaryVariant.Exp;
}

export class Exp2Node extends UnaryNode {
  method = UnaryVariant.Exp2;
}

export class LogNode extends UnaryNode {
  method = UnaryVariant.Log;
}

export class Log2Node extends UnaryNode {
  method = UnaryVariant.Log2;
}

export class SqrtNode extends UnaryNode {
  method = UnaryVariant.Sqrt;
}

export class InverseSqrtNode extends UnaryNode {
  method = UnaryVariant.InverseSqrt;
}

export class FloorNode extends UnaryNode {
  method = UnaryVariant.Floor;
}

export class CeilNode extends UnaryNode {
  method = UnaryVariant.Ceil;
}

export class NormalizeNode extends UnaryNode {
  method = UnaryVariant.Normalize;
}

export class FractNode extends UnaryNode {
  method = UnaryVariant.Fract;
}

export class SinNode extends UnaryNode {
  method = UnaryVariant.Sin;
}

export class CosNode extends UnaryNode {
  method = UnaryVariant.Cos;
}

export class TanNode extends UnaryNode {
  method = UnaryVariant.Tan;
}

export class AsinNode extends UnaryNode {
  method = UnaryVariant.Asin;
}

export class AcosNode extends UnaryNode {
  method = UnaryVariant.Acos;
}

export class AtanNode extends UnaryNode {
  method = UnaryVariant.Atan;
}

export class AbsNode extends UnaryNode {
  method = UnaryVariant.Abs;
}

export class SignNode extends UnaryNode {
  method = UnaryVariant.Sign;
}

export class LengthNode extends UnaryNode {
  method = UnaryVariant.Length;
}

export class NegateNode extends UnaryNode {
  method = UnaryVariant.Negate;
}

export class OneMinusNode extends UnaryNode {
  method = UnaryVariant.OneMinus;
}

export class DpdxNode extends UnaryNode {
  method = UnaryVariant.Dpdx;
}

export class DpdyNode extends UnaryNode {
  method = UnaryVariant.Dpdy;
}

export class RoundNode extends UnaryNode {
  method = UnaryVariant.Round;
}

export class ReciprocalNode extends UnaryNode {
  method = UnaryVariant.Reciprocal;
}

export class TruncNode extends UnaryNode {
  method = UnaryVariant.Trunc;
}

export class FwidthNode extends UnaryNode {
  method = UnaryVariant.Fwidth;
}

export class BitcastNode extends UnaryNode {
  method = UnaryVariant.Bitcast;
}

export class Atan2Node extends BinaryNode {
  method = BinaryVariant.Atan2;
}

export class MinNode extends BinaryNode {
  method = BinaryVariant.Min;
}

export class MaxNode extends BinaryNode {
  method = BinaryVariant.Max;
}

export class ModNode extends BinaryNode {
  method = BinaryVariant.Mod;
}

export class StepNode extends BinaryNode {
  method = BinaryVariant.Step;
}

export class ReflectNode extends BinaryNode {
  method = BinaryVariant.Reflect;
}

export class DistanceNode extends BinaryNode {
  method = BinaryVariant.Distance;
}

export class DifferenceNode extends BinaryNode {
  method = BinaryVariant.Difference;
}

export class DotNode extends BinaryNode {
  method = BinaryVariant.Dot;
}

export class CrossNode extends BinaryNode {
  method = BinaryVariant.Cross;
}

export class PowNode extends BinaryNode {
  method = BinaryVariant.Pow;
}

export class TransformDirectionNode extends BinaryNode {
  method = BinaryVariant.TransformDirection;
}

export class Pow2Node extends BinaryNode {
  method = BinaryVariant.Pow;

  constructor(aNode: Node) {
    super(aNode, f32(2));
  }
}

export class Pow3Node extends BinaryNode {
  method = BinaryVariant.Pow;

  constructor(aNode: Node) {
    super(aNode, f32(3));
  }
}

export class Pow4Node extends BinaryNode {
  method = BinaryVariant.Pow;

  constructor(aNode: Node) {
    super(aNode, f32(4));
  }
}

export class LengthSqNode extends DotNode {
  constructor(a: Node) {
    super(a, a);
  }
}

export class MixNode extends TernaryNode {
  method = TernaryVariant.Mix;
}

export class RefractNode extends TernaryNode {
  method = TernaryVariant.Refract;
}

export class SmoothstepNode extends TernaryNode {
  method = TernaryVariant.Smoothstep;
}

export class FaceForwardNode extends TernaryNode {
  method = TernaryVariant.FaceForward;
}

export class MixElementNode extends MixNode {
  constructor(t: Node, e1: Node, e2: Node) {
    super(e1, e2, t);
  }
}

export class SmoothstepElementNode extends SmoothstepNode {
  constructor(x: Node, low: Node, high: Node) {
    super(low, high, x);
  }
}

export class ClampNode extends TernaryNode {
  method = TernaryVariant.Clamp;

  constructor(
    value: ConstNode<number>,
    min: ConstNode<number> = asNode(asConstNode(0)),
    max: ConstNode<number> = asNode(asConstNode(1)),
  ) {
    super(asNode(value), asNode(min), asNode(max));
  }
}

export class SaturateNode extends ClampNode {
  constructor(value: ConstNode<number>) {
    super(value);
  }
}

export class CbrtNode extends MulNode {
  constructor(a: ConstNode<number>) {
    super(asNode(new SignNode(a)), pow(abs(a), 1.0 / 3.0));
  }
}

export const all = proxyNode(AllNode);
export const any = proxyNode(AnyNode);
export const equals = proxyNode(EqualsNode);
export const radians = proxyNode(RadiansNode);
export const degrees = proxyNode(DegreesNode);
export const exp = proxyNode(ExpNode);
export const exp2 = proxyNode(Exp2Node);
export const log = proxyNode(LogNode);
export const log2 = proxyNode(Log2Node);
export const sqrt = proxyNode(SqrtNode);
export const inverseSqrt = proxyNode(InverseSqrtNode);
export const floor = proxyNode(FloorNode);
export const ceil = proxyNode(CeilNode);
export const normalize = proxyNode(NormalizeNode);
export const fract = proxyNode(FractNode);
export const sin = proxyNode(SinNode);
export const cos = proxyNode(CosNode);
export const tan = proxyNode(TanNode);
export const asin = proxyNode(AsinNode);
export const acos = proxyNode(AcosNode);
export const atan = proxyNode(AtanNode);
export const abs = proxyNode(AbsNode);
export const sign = proxyNode(SignNode);
export const length = proxyNode(LengthNode);
export const negate = proxyNode(NegateNode);
export const oneMinus = proxyNode(OneMinusNode);
export const dpdx = proxyNode(DpdxNode);
export const dpdy = proxyNode(DpdyNode);
export const round = proxyNode(RoundNode);
export const reciprocal = proxyNode(ReciprocalNode);
export const trunc = proxyNode(TruncNode);
export const fwidth = proxyNode(FwidthNode);
export const bitcast = proxyNode(BitcastNode);

export const atan2 = proxyNode(Atan2Node);
export const min = proxyNode(MinNode);
export const max = proxyNode(MaxNode);
export const mod = proxyNode(ModNode);
export const step = proxyNode(StepNode);
export const reflect = proxyNode(ReflectNode);
export const distance = proxyNode(DistanceNode);
export const difference = proxyNode(DifferenceNode);
export const dot = proxyNode(DotNode);
export const cross = proxyNode(CrossNode);
export const pow = proxyNode(PowNode);
export const transformDirection = proxyNode(TransformDirectionNode);

export const pow2 = proxyNode(Pow2Node);
export const pow3 = proxyNode(Pow3Node);
export const pow4 = proxyNode(Pow4Node);

export const lengthSq = proxyNode(LengthSqNode);

export const mix = proxyNode(MixNode);

export const refract = proxyNode(RefractNode);
export const smoothstep = proxyNode(SmoothstepNode);
export const faceForward = proxyNode(FaceForwardNode);
export const mixElement = proxyNode(MixElementNode);
export const smoothstepElement = proxyNode(SmoothstepElementNode);

export const clamp = proxyNode(ClampNode);
export const saturate = proxyNode(SaturateNode);
export const cbrt = proxyNode(CbrtNode);

implCommand('all', AllNode);
implCommand('any', AnyNode);
implCommand('equals', EqualsNode);
implCommand('radians', RadiansNode);
implCommand('degrees', DegreesNode);
implCommand('exp', ExpNode);
implCommand('exp2', Exp2Node);
implCommand('log', LogNode);
implCommand('log2', Log2Node);
implCommand('sqrt', SqrtNode);
implCommand('inverseSqrt', InverseSqrtNode);
implCommand('floor', FloorNode);
implCommand('ceil', CeilNode);
implCommand('normalize', NormalizeNode);
implCommand('fract', FractNode);
implCommand('sin', SinNode);
implCommand('cos', CosNode);
implCommand('tan', TanNode);
implCommand('asin', AsinNode);
implCommand('acos', AcosNode);
implCommand('atan', AtanNode);
implCommand('abs', AbsNode);
implCommand('sign', SignNode);
implCommand('length', LengthNode);
implCommand('lengthSq', LengthSqNode);
implCommand('negate', NegateNode);
implCommand('oneMinus', OneMinusNode);
implCommand('dpdx', DpdxNode);
implCommand('dpdy', DpdyNode);
implCommand('round', RoundNode);
implCommand('reciprocal', ReciprocalNode);
implCommand('trunc', TruncNode);
implCommand('fwidth', FwidthNode);
implCommand('atan2', Atan2Node);
implCommand('min', MinNode);
implCommand('max', MaxNode);
implCommand('mod', ModNode);
implCommand('step', StepNode);
implCommand('reflect', ReflectNode);
implCommand('distance', DistanceNode);
implCommand('dot', DotNode);
implCommand('cross', CrossNode);
implCommand('pow', PowNode);
implCommand('pow2', Pow2Node);
implCommand('pow3', Pow3Node);
implCommand('pow4', Pow4Node);
implCommand('transformDirection', TransformDirectionNode);
implCommand('mix', MixElementNode);
implCommand('refract', RefractNode);
implCommand('smoothstep', SmoothstepElementNode);
implCommand('faceForward', FaceForwardNode);
implCommand('difference', DifferenceNode);
implCommand('clamp', ClampNode);
implCommand('saturate', SaturateNode);
implCommand('cbrt', CbrtNode);
