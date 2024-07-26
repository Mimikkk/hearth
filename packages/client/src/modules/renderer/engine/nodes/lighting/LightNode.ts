import { Node } from '../core/Node.js';
import { nodeProxy } from '../shadernode/ShaderNodes.js';
import { objectPosition } from '../accessors/EntityNode.js';
import { cameraViewMatrix } from '../accessors/CameraNode.js';
import type { Light } from '@modules/renderer/engine/objects/lights/Light.js';

export class LightNode extends Node {
  static type = 'LightNode';

  constructor(public light: Light) {
    super();
  }

  setup(): Node {
    const { light } = this;
    return cameraViewMatrix.transformDirection(objectPosition(light).sub(objectPosition(light.target)));
  }
}

export default LightNode;

export const lightTargetDirection = nodeProxy(LightNode);
