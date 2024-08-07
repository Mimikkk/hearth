import { Node } from '../core/Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { objectPosition } from '../accessors/EntityNode.js';
import { cameraViewMatrix } from '../accessors/CameraNode.js';
import type { Light } from '@modules/renderer/engine/entities/lights/Light.js';

export class LightNode extends Node {
  constructor(public light: Light) {
    super();
  }

  setup(): Node {
    const { light } = this;
    return cameraViewMatrix.transformDirection(objectPosition(light).sub(objectPosition(light.target)));
  }
}

export const lightTargetDirection = asCommand(LightNode);
