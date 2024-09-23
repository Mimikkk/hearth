import { TempNode } from '../core/TempNode.js';
import { uv } from '../accessors/UVNode.js';
import { normalView } from '../accessors/NormalNode.js';
import { positionView } from '../accessors/PositionNode.js';
import { faceDirection } from './FrontFacingNode.js';
import { f32, asCommand, vec2 } from '../shadernode/ShaderNode.primitves.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import { hsl } from '../../nodes/shadernode/hsl.js';

const dHdxy_fwd = hsl(({ textureNode, bumpScale }) => {
  let texNode = textureNode;

  if (texNode.isTextureNode !== true) {
    texNode.traverse(node => {
      if (node.isTextureNode === true) texNode = node;
    });
  }

  if (texNode.isTextureNode !== true) {
    throw new Error('HSL: dHdxy_fwd() requires a TextureNode.');
  }

  const Hll = f32(textureNode);
  const uvNode = texNode.uvNode || uv();

  const sampleTexture = uv => textureNode.cache().context({ getUV: () => uv, forceUVContext: true });

  return vec2(
    f32(sampleTexture(uvNode.add(uvNode.dpdx()))).sub(Hll),
    f32(sampleTexture(uvNode.add(uvNode.dpdy().negate()))).sub(Hll),
  ).mul(bumpScale);
});

const perturbNormalArb = hsl(inputs => {
  const { surf_pos, surf_norm, dHdxy } = inputs;

  const vSigmaX = surf_pos.dpdx().normalize();
  const vSigmaY = surf_pos.dpdy().negate().normalize();
  const vN = surf_norm;

  const R1 = vSigmaY.cross(vN);
  const R2 = vN.cross(vSigmaX);

  const fDet = vSigmaX.dot(R1).mul(faceDirection);

  const vGrad = fDet.sign().mul(dHdxy.x.mul(R1).add(dHdxy.y.mul(R2)));

  return fDet.abs().mul(surf_norm).sub(vGrad).normalize();
});

export class BumpMapNode extends TempNode {
  constructor(textureNode, scaleNode = null) {
    super('vec3');

    this.textureNode = textureNode;
    this.scaleNode = scaleNode;
  }

  setup() {
    const bumpScale = this.scaleNode !== null ? this.scaleNode : 1;
    const dHdxy = dHdxy_fwd({ textureNode: this.textureNode, bumpScale });

    return perturbNormalArb({
      surf_pos: positionView,
      surf_norm: normalView,
      dHdxy,
    });
  }
}

export const bumpMap = asCommand(BumpMapNode);

implCommand('bumpMap', BumpMapNode);
