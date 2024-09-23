import { TempNode } from '../core/TempNode.js';
import { asCommand, f32, mat3, vec3 } from '../shadernode/ShaderNode.primitves.js';
import { rendererRef } from '../accessors/RendererReferenceNode.js';
import { clamp, log2, max, min, mix, pow } from '../math/MathNode.js';
import { div, mul, sub } from '../math/OperatorNode.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { ToneMapping } from '../../constants.js';
import { Color } from '../../math/Color.js';
import { hsl } from '../shadernode/hsl.js';
import { select } from '../../nodes/noise/noise.js';
import { NodeStack } from '../../nodes/shadernode/ShaderNode.stack.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

// exposure only
const LinearToneMappingNode = hsl(({ color, exposure }) => {
  return color.mul(exposure).clamp();
});

// source: https://www.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf
const ReinhardToneMappingNode = hsl(({ color, exposure }) => {
  color = color.mul(exposure);

  return color.div(color.add(1.0)).clamp();
});

// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
const OptimizedCineonToneMappingNode = hsl(({ color, exposure }) => {
  // optimized filmic operator by Jim Hejl and Richard Burgess-Dawson
  color = color.mul(exposure);
  color = color.sub(0.004).max(0.0);

  const a = color.mul(color.mul(6.2).add(0.5));
  const b = color.mul(color.mul(6.2).add(1.7)).add(0.06);

  return a.div(b).pow(2.2);
});

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
const RRTAndODTFit = hsl(({ color }) => {
  const a = color.mul(color.add(0.0245786)).sub(0.000090537);
  const b = color.mul(color.add(0.432951).mul(0.983729)).add(0.238081);

  return a.div(b);
});

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
const ACESFilmicToneMappingNode = hsl(({ color, exposure }) => {
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
  const ACESInputMat = mat3(0.59719, 0.35458, 0.04823, 0.076, 0.90834, 0.01566, 0.0284, 0.13383, 0.83777);

  // ODT_SAT => XYZ => D60_2_D65 => sRGB
  const ACESOutputMat = mat3(1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602);

  color = color.mul(exposure).div(0.6);

  color = ACESInputMat.mul(color);

  // Apply RRT and ODT
  color = RRTAndODTFit({ color });

  color = ACESOutputMat.mul(color);

  // Clamp to [0, 1]
  return color.clamp();
});

const LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
  vec3(1.6605, -0.1246, -0.0182),
  vec3(-0.5876, 1.1329, -0.1006),
  vec3(-0.0728, -0.0083, 1.1187),
);
const LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
  vec3(0.6274, 0.0691, 0.0164),
  vec3(0.3293, 0.9195, 0.088),
  vec3(0.0433, 0.0113, 0.8956),
);

const agxDefaultContrastApprox = hsl(([x_immutable]) => {
  const x = vec3(x_immutable).toVar();
  const x2 = vec3(x.mul(x)).toVar();
  const x4 = vec3(x2.mul(x2)).toVar();

  return f32(15.5)
    .mul(x4.mul(x2))
    .sub(mul(40.14, x4.mul(x)))
    .add(
      mul(31.96, x4)
        .sub(mul(6.868, x2.mul(x)))
        .add(mul(0.4298, x2).add(mul(0.1191, x).sub(0.00232))),
    );
});

const AGXToneMappingNode = hsl(({ color, exposure }) => {
  const colortone = vec3(color).toVar();
  const AgXInsetMatrix = mat3(
    vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
    vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
    vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859),
  );
  const AgXOutsetMatrix = mat3(
    vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
    vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
    vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405),
  );
  const AgxMinEv = f32(-12.47393);
  const AgxMaxEv = f32(4.026069);
  colortone.mulAssign(exposure);
  colortone.assign(LINEAR_SRGB_TO_LINEAR_REC2020.mul(colortone));
  colortone.assign(AgXInsetMatrix.mul(colortone));
  colortone.assign(max(colortone, 1e-10));
  colortone.assign(log2(colortone));
  colortone.assign(colortone.sub(AgxMinEv).div(AgxMaxEv.sub(AgxMinEv)));
  colortone.assign(clamp(colortone, 0.0, 1.0));
  colortone.assign(agxDefaultContrastApprox(colortone));
  colortone.assign(AgXOutsetMatrix.mul(colortone));
  colortone.assign(pow(max(vec3(0.0), colortone), vec3(2.2)));
  colortone.assign(LINEAR_REC2020_TO_LINEAR_SRGB.mul(colortone));
  colortone.assign(clamp(colortone, 0.0, 1.0));

  return colortone;
});

// https://modelviewer.dev/examples/tone-mapping

const NeutralToneMappingNode = hsl(({ color, exposure }) => {
  const StartCompression = f32(0.8 - 0.04);
  const Desaturation = f32(0.15);

  color = color.mul(exposure);

  const x = min(color.r, min(color.g, color.b));
  const offset = select(x.lessThan(0.08), x.sub(mul(6.25, x.mul(x))), 0.04);

  color.subAssign(offset);

  const peak = max(color.r, max(color.g, color.b));

  NodeStack.if(peak.lessThan(StartCompression), () => {
    return color;
  });

  const d = sub(1, StartCompression);
  const newPeak = sub(1, d.mul(d).div(peak.add(d.sub(StartCompression))));
  color.mulAssign(newPeak.div(peak));
  const g = sub(1, div(1, Desaturation.mul(peak.sub(newPeak)).add(1)));

  return mix(color, vec3(newPeak), g);
}).setLayout({
  name: 'NeutralToneMapping',
  type: TypeName.vec3,
  inputs: [
    { name: 'color', type: TypeName.vec3 },
    { name: 'exposure', type: TypeName.f32 },
  ],
});

const MappingByType = {
  [ToneMapping.None]: (props: { color: Node }) => props.color,
  [ToneMapping.Linear]: LinearToneMappingNode,
  [ToneMapping.Reinhard]: ReinhardToneMappingNode,
  [ToneMapping.Cineon]: OptimizedCineonToneMappingNode,
  [ToneMapping.ACESFilmic]: ACESFilmicToneMappingNode,
  [ToneMapping.AgX]: AGXToneMappingNode,
  [ToneMapping.Neutral]: NeutralToneMappingNode,
};

export class ToneMappingNode extends TempNode {
  constructor(
    public toneMapping: ToneMapping = ToneMapping.None,
    public exposureNode: ConstNode<number> = toneMappingExposure,
    public colorNode: ConstNode<Color> | null = null,
  ) {
    super(TypeName.vec3);
  }

  getCacheKey() {
    return `{ type:${this.toneMapping}, nodes:${super.getCacheKey()} }`;
  }

  setup(builder: NodeBuilder): Node {
    const colorNode = this.colorNode || builder.context.color;

    return MappingByType[this.toneMapping]({ exposure: this.exposureNode, color: colorNode.rgb });
  }
}

export const toneMapping = asCommand(ToneMappingNode);

export const toneMappingExposure = rendererRef('parameters.toneMappingExposure', TypeName.f32);

export class ToneMappingCommandNode extends ToneMappingNode {
  constructor(color: ConstNode<Color>, mapping: ToneMapping, exposure: ConstNode<number>) {
    super(mapping, exposure, color);
  }
}

implCommand('toneMapping', ToneMappingCommandNode);
