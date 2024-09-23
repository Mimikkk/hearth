import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { modelViewMatrix, modelWorldMatrix } from './ModelNode.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

export class PositionNode extends Node {
  constructor(public scope: NodeVariant) {
    super(TypeName.vec3);
  }

  isGlobal(): boolean {
    return true;
  }

  getHash(): string {
    return `position-${this.scope}`;
  }

  #output(): Node {
    switch (this.scope) {
      case NodeVariant.Geometry:
        return attribute('position', TypeName.vec3);
      case NodeVariant.Local:
        return varying(positionGeometry);
      case NodeVariant.World:
        return varying(modelWorldMatrix.mul(positionLocal));
      case NodeVariant.View:
        return varying(modelViewMatrix.mul(positionLocal));
      case NodeVariant.ViewDirection:
        return normalize(varying(positionView.negate()));
      case NodeVariant.WorldDirection:
        return normalize(varying(positionLocal.transformDirection(modelWorldMatrix)));
      default:
        throw new Error(`Unknown position scope: ${this.scope}`);
    }
  }

  generate(builder: NodeBuilder): string {
    return this.#output().build(builder, this.getNodeType(builder));
  }
}

enum NodeVariant {
  Geometry = 'geometry',
  Local = 'local',
  World = 'world',
  WorldDirection = 'worldDirection',
  View = 'view',
  ViewDirection = 'viewDirection',
}

export const positionGeometry = new PositionNode(NodeVariant.Geometry);
export const positionLocal = new PositionNode(NodeVariant.Local).temp('Position');
export const positionWorld = new PositionNode(NodeVariant.World);
export const positionWorldDirection = new PositionNode(NodeVariant.WorldDirection);
export const positionView = new PositionNode(NodeVariant.View);
export const positionViewDirection = new PositionNode(NodeVariant.ViewDirection);
