import { Node } from '../../nodes/core/Node.js';
import { NodeUpdateStage } from '../../nodes/core/constants.js';
import { uniform, UniformNode } from '../../nodes/core/UniformNode.js';
import NodeFrame from '../../nodes/core/NodeFrame.js';
import { Color } from '../../math/Color.js';
import { Entity } from '../../core/Entity.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { asCommand } from '../../nodes/shadernode/ShaderNode.as.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';

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
