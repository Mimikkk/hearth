import { Node } from '../core/Node.js';
import { timerLocal } from './TimerNode.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class OscNode extends Node {
  method: NodeVariant;

  constructor(public timeNode: Node = timerLocal()) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.timeNode.getNodeType(builder);
  }

  setup(): Node {
    const time = this.timeNode;

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

export class SineNode extends OscNode {
  method = NodeVariant.Sine;
}

export class SquareNode extends OscNode {
  method = NodeVariant.Square;
}

export class TriangleNode extends OscNode {
  method = NodeVariant.Triangle;
}

export class SawtoothNode extends OscNode {
  method = NodeVariant.Sawtooth;
}

export const oscSine = asCommand(SineNode);
export const oscSquare = asCommand(SquareNode);
export const oscTriangle = asCommand(TriangleNode);
export const oscSawtooth = asCommand(SawtoothNode);
