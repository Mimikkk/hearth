import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { NodeUpdateStage } from '@modules/renderer/engine/nodes/core/constants.js';
import { uniform, UniformNode } from '@modules/renderer/engine/nodes/core/UniformNode.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { asCommand } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';

export class OcclusionNode extends Node {
  uniformNode: UniformNode<Color>;

  constructor(
    public testObject: Entity,
    public normalColor: ConstNode<Color>,
    public occludedColor: ConstNode<Color>,
  ) {
    super(TypeName.vec3);

    this.stage = NodeUpdateStage.Object;

    this.uniformNode = uniform(new Color());

    this.testObject = testObject;
    this.normalColor = normalColor;
    this.occludedColor = occludedColor;
  }

  update(frame: NodeFrame) {
    const isOccluded = frame.hearth.isOccluded(this.testObject);

    this.uniformNode.value.from(isOccluded ? this.occludedColor.value : this.normalColor.value);
  }

  setup() {
    return this.uniformNode;
  }
}

export const occlude = asCommand(OcclusionNode);
