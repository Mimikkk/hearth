import { Node } from '../core/Node.js';
import { timerLocal } from './TimerNode.js';
import { asNode, proxyNode } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class OscNode extends Node {
  static type = 'OscNode';
  method: NodeVariant;

  constructor(public timeNode: Node = timerLocal()) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.timeNode.getNodeType(builder);
  }

  setup(): Node {
    const time = asNode(this.timeNode);

    switch (this.method) {
      case NodeVariant.Sine:
        return time
          .add(0.75)
          .mul(Math.PI * 2)
          .sin()
          .mul(0.5)
          .add(0.5);
      case NodeVariant.Square:
        return time.fract().round();
      case NodeVariant.Triangle:
        return time.add(0.5).fract().mul(2).sub(1).abs();
      case NodeVariant.Sawtooth:
        return time.fract();
    }
  }
}

enum NodeVariant {
  Sine = 'sine',
  Square = 'square',
  Triangle = 'triangle',
  Sawtooth = 'sawtooth',
}

export default OscNode;

export const oscSine = proxyNode(
  class extends OscNode {
    method = NodeVariant.Sine;
  },
);
export const oscSquare = proxyNode(
  class extends OscNode {
    method = NodeVariant.Square;
  },
);
export const oscTriangle = proxyNode(
  class extends OscNode {
    method = NodeVariant.Triangle;
  },
);
export const oscSawtooth = proxyNode(
  class extends OscNode {
    method = NodeVariant.Sawtooth;
  },
);
