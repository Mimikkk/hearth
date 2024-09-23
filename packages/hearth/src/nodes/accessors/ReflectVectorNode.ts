import { Node } from '../core/Node.js';
import { cameraViewMatrix } from './CameraNode.js';
import { transformedNormalView } from './NormalNode.js';
import { positionViewDirection } from './PositionNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

export class ReflectVectorNode extends Node {
  constructor() {
    super(TypeName.vec3);
  }

  getHash(): string {
    return 'reflectVector';
  }

  setup(): Node {
    return positionViewDirection.negate().reflect(transformedNormalView).transformDirection(cameraViewMatrix);
  }
}

export const reflectVector = new ReflectVectorNode();
