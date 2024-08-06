import { ContextNode } from '../core/ContextNode.js';
import { f32, asCommand, vec3 } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { LightNode } from '@modules/renderer/engine/nodes/lighting/LightNode.js';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class LightingContextNode extends ContextNode {
  constructor(
    node: LightNode,
    public lightingModel: LightModel | null = null,
    public backdropNode: ConstNode | null = null,
    public backdropAlphaNode: ConstNode | null = null,
  ) {
    super(node);

    this.context = this.getContext();
  }

  getContext() {
    const { backdropNode, backdropAlphaNode } = this;

    const directDiffuse = vec3().temp('directDiffuse');
    const directSpecular = vec3().temp('directSpecular');
    const indirectDiffuse = vec3().temp('indirectDiffuse');
    const indirectSpecular = vec3().temp('indirectSpecular');

    const reflectedLight = {
      directDiffuse,
      directSpecular,
      indirectDiffuse,
      indirectSpecular,
    };

    return {
      radiance: vec3().temp('radiance'),
      irradiance: vec3().temp('irradiance'),
      iblIrradiance: vec3().temp('iblIrradiance'),
      ambientOcclusion: f32(1).temp('ambientOcclusion'),
      reflectedLight,
      backdrop: backdropNode,
      backdropAlpha: backdropAlphaNode,
    };
  }

  setup(builder: NodeBuilder) {
    this.context.lightingModel = this.lightingModel || builder.context.lightingModel;

    return super.setup(builder);
  }
}

export const lightingContext = asCommand(LightingContextNode);

implCommand('lightingContext', LightingContextNode);
