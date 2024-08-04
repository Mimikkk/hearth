import { NodeUpdateStage } from '../core/constants.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { UniformNode } from '@modules/renderer/engine/nodes/core/UniformNode.js';
import type { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';

export class CameraNode extends Node {
  scope: NodeVariant;
  uniform: UniformNode;

  constructor(public camera: ICamera) {
    super();

    this.uniform = new UniformNode(null);
    this.stage = NodeUpdateStage.Render;
  }

  getNodeType(): TypeName {
    switch (this.scope) {
      case NodeVariant.ProjectionMatrixInverse:
      case NodeVariant.ProjectionMatrix:
      case NodeVariant.WorldMatrix:
      case NodeVariant.ViewMatrix:
        return TypeName.mat4;
      case NodeVariant.NormalMatrix:
        return TypeName.mat3;
      case NodeVariant.Far:
      case NodeVariant.Near:
      case NodeVariant.LogDepth:
        return TypeName.f32;
      default:
        return TypeName.vec3;
    }
  }

  update(frame: NodeFrame): void {
    const camera = frame.camera as ICamera;
    const uniform = this.uniform;

    this.camera = camera;
    const object = this.camera;
    switch (this.scope) {
      case NodeVariant.ViewMatrix:
        uniform.value = camera.matrixWorldInverse;
        break;
      case NodeVariant.ProjectionMatrix:
        uniform.value = camera.projectionMatrix;
        break;
      case NodeVariant.ProjectionMatrixInverse:
        uniform.value = camera.projectionMatrixInverse;
        break;
      case NodeVariant.Near:
        uniform.value = camera.near;
        break;
      case NodeVariant.Far:
        uniform.value = camera.far;
        break;
      case NodeVariant.LogDepth:
        uniform.value = 2.0 / (Math.log(camera.far + 1.0) / Math.LN2);
        break;
      case NodeVariant.WorldMatrix:
        uniform.value = object.matrixWorld;
        break;
      case NodeVariant.NormalMatrix:
        uniform.value = object.normalMatrix;
        break;
      case NodeVariant.Position:
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Position(object.matrixWorld);
        break;
      case NodeVariant.Scale:
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Scale(object.matrixWorld);
        break;
      case NodeVariant.Direction:
        uniform.value = uniform.value || Vec3.new();
        object.getWorldDirection(uniform.value);
        break;
      case NodeVariant.ViewPosition:
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Position(object.matrixWorld);
        uniform.value.applyMat4(camera.matrixWorldInverse);
        break;
    }
  }

  generate(builder: NodeBuilder): string | null {
    this.uniform.nodeType = this.getNodeType();
    return this.uniform.build(builder);
  }
}

enum NodeVariant {
  ProjectionMatrixInverse = 'projectionMatrixInverse',
  ProjectionMatrix = 'projectionMatrix',
  NormalMatrix = 'normalMatrix',
  WorldMatrix = 'worldMatrix',
  ViewPosition = 'viewPosition',
  ViewMatrix = 'viewMatrix',
  Direction = 'direction',
  Position = 'position',
  LogDepth = 'logDepth',
  Scale = 'scale',
  Near = 'near',
  Far = 'far',
}

export const cameraProjectionMatrix = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.ProjectionMatrix;
  },
);
export const cameraProjectionMatrixInverse = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.ProjectionMatrixInverse;
  },
);
export const cameraNear = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.Near;
  },
);
export const cameraFar = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.Far;
  },
);
export const cameraLogDepth = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.LogDepth;
  },
);
export const cameraViewMatrix = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.ViewMatrix;
  },
);
export const cameraNormalMatrix = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.NormalMatrix;
  },
);
export const cameraWorldMatrix = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.WorldMatrix;
  },
);
export const cameraPosition = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.Position;
  },
);
export const cameraDirection = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.Direction;
  },
);
export const cameraViewPosition = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.ViewPosition;
  },
);
export const cameraScale = fixedNode(
  class extends CameraNode {
    scope = NodeVariant.Scale;
  },
);
