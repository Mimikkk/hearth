import { Node } from '../core/Node.js';
import { cameraViewMatrix } from './CameraNode.js';
import { transformedNormalView } from './NormalNode.js';
import { positionViewDirection } from './PositionNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

export class ReflectVectorNode extends Node {
  constructor() {
    super('vec3');
  }

  getHash() {
    return 'reflectVector';
  }

  setup() {
    const reflectView = positionViewDirection.negate().reflect(transformedNormalView);

    return reflectView.transformDirection(cameraViewMatrix);
  }
}

export const reflectVector = new ReflectVectorNode();
