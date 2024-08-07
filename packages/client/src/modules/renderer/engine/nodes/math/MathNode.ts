import { TempNode } from '../core/TempNode.js';
import { div, mul, MulNode, sub } from './OperatorNode.js';
import { asCommand, asNode, f32, vec3, vec4 } from '../shadernode/ShaderNode.primitves.ts';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '../core/Node.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { ConstNode, NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';

export class UnaryNode extends TempNode {
  declare method: UnaryVariant | BinaryVariant | TernaryVariant;

  constructor(public value: ConstNode<number>) {
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

  generate(builder: NodeBuilder, output: TypeName): string {
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
    public aNode: ConstNode<number>,
    public bNode: ConstNode<number>,
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

  generate(builder: NodeBuilder, output: TypeName): string {
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
    public aNode: ConstNode<number>,
    public bNode: ConstNode<number>,
    public cNode: ConstNode<number>,
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

  generate(builder: NodeBuilder, output: TypeName): string {
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

  constructor(aNode: ConstNode<number>) {
    super(aNode, f32(2));
  }
}

export class Pow3Node extends BinaryNode {
  method = BinaryVariant.Pow;

  constructor(aNode: ConstNode<number>) {
    super(aNode, f32(3));
  }
}

export class Pow4Node extends BinaryNode {
  method = BinaryVariant.Pow;

  constructor(aNode: ConstNode<number>) {
    super(aNode, f32(4));
  }
}

export class LengthSqNode extends DotNode {
  constructor(a: ConstNode<number>) {
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
  constructor(t: ConstNode<number>, e1: ConstNode<number>, e2: ConstNode<number>) {
    super(e1, e2, t);
  }
}

export class SmoothstepElementNode extends SmoothstepNode {
  constructor(x: ConstNode<number>, low: ConstNode<number>, high: ConstNode<number>) {
    super(low, high, x);
  }
}

export class ClampNode extends TernaryNode {
  method = TernaryVariant.Clamp;

  constructor(value: ConstNode<number>, min: ConstNode<number> = asNode(0), max: ConstNode<number> = asNode(1)) {
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
    super(new SignNode(a), pow(abs(a), 1.0 / 3.0));
  }
}

export const all = asCommand(AllNode);
export const any = asCommand(AnyNode);
export const equals = asCommand(EqualsNode);
export const radians = asCommand(RadiansNode);
export const degrees = asCommand(DegreesNode);
export const exp = asCommand(ExpNode);
export const exp2 = asCommand(Exp2Node);
export const log = asCommand(LogNode);
export const log2 = asCommand(Log2Node);
export const sqrt = asCommand(SqrtNode);
export const inverseSqrt = asCommand(InverseSqrtNode);
export const floor = asCommand(FloorNode);
export const ceil = asCommand(CeilNode);
export const normalize = asCommand(NormalizeNode);
export const fract = asCommand(FractNode);
export const sin = asCommand(SinNode);
export const cos = asCommand(CosNode);
export const tan = asCommand(TanNode);
export const asin = asCommand(AsinNode);
export const acos = asCommand(AcosNode);
export const atan = asCommand(AtanNode);
export const abs = asCommand(AbsNode);
export const sign = asCommand(SignNode);
export const length = asCommand(LengthNode);
export const negate = asCommand(NegateNode);
export const oneMinus = asCommand(OneMinusNode);
export const dpdx = asCommand(DpdxNode);
export const dpdy = asCommand(DpdyNode);
export const round = asCommand(RoundNode);
export const reciprocal = asCommand(ReciprocalNode);
export const trunc = asCommand(TruncNode);
export const fwidth = asCommand(FwidthNode);
export const bitcast = asCommand(BitcastNode);

export const atan2 = asCommand(Atan2Node);
export const min = asCommand(MinNode);
export const max = asCommand(MaxNode);
export const mod = asCommand(ModNode);
export const step = asCommand(StepNode);
export const reflect = asCommand(ReflectNode);
export const distance = asCommand(DistanceNode);
export const difference = asCommand(DifferenceNode);
export const dot = asCommand(DotNode);
export const cross = asCommand(CrossNode);
export const pow = asCommand(PowNode);
export const transformDirection = asCommand(TransformDirectionNode);

export const pow2 = asCommand(Pow2Node);
export const pow3 = asCommand(Pow3Node);
export const pow4 = asCommand(Pow4Node);

export const lengthSq = asCommand(LengthSqNode);

export const mix = asCommand(MixNode);

export const refract = asCommand(RefractNode);
export const smoothstep = asCommand(SmoothstepNode);
export const faceForward = asCommand(FaceForwardNode);
export const mixElement = asCommand(MixElementNode);
export const smoothstepElement = asCommand(SmoothstepElementNode);

export const clamp = asCommand(ClampNode);
export const saturate = asCommand(SaturateNode);
export const cbrt = asCommand(CbrtNode);

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
