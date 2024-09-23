import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { UniformNode } from '../core/UniformNode.js';
import { asCommand } from '../shadernode/ShaderNode.as.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { NodeFrame } from '../../nodes/core/NodeFrame.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { Entity } from '../../core/Entity.js';
import { Vec3 } from '../../math/Vec3.js';

export class EntityNode extends Node {
  scope: NodeVariant;
  entity: Entity;
  uniform: UniformNode;

  constructor(public entity: Entity) {
    super();

    this.stage = NodeUpdateStage.Object;
    this.uniform = new UniformNode(null);
  }

  getNodeType(): TypeName {
    switch (this.scope) {
      case NodeVariant.WorldMatrix:
      case NodeVariant.ViewMatrix:
        return TypeName.mat4;
      case NodeVariant.NormalMatrix:
        return TypeName.mat3;
      default:
        return TypeName.vec3;
    }
  }

  update(frame: NodeFrame): void {
    const object = this.entity;
    const uniform = this.uniform;

    switch (this.scope) {
      case NodeVariant.ViewMatrix:
        uniform.value = object.modelViewMatrix;
        break;
      case NodeVariant.NormalMatrix:
        uniform.value = object.normalMatrix;
        break;
      case NodeVariant.WorldMatrix:
        uniform.value = object.matrixWorld;
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
        const camera = frame.camera;
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Position(object.matrixWorld);
        uniform.value.applyMat4(camera.matrixWorldInverse);
        break;
    }
  }

  generate(builder: NodeBuilder): string {
    this.uniform.nodeType = this.getNodeType();

    return this.uniform.build(builder);
  }
}

enum NodeVariant {
  NormalMatrix = 'normalMatrix',
  ViewPosition = 'viewPosition',
  WorldMatrix = 'worldMatrix',
  ViewMatrix = 'viewMatrix',
  Position = 'position',
  Scale = 'scale',
  Direction = 'direction',
}

export const objectDirection = asCommand(
  class extends EntityNode {
    scope = NodeVariant.Direction;
  },
);
export const objectViewMatrix = asCommand(
  class extends EntityNode {
    scope = NodeVariant.ViewMatrix;
  },
);
export const objectNormalMatrix = asCommand(
  class extends EntityNode {
    scope = NodeVariant.NormalMatrix;
  },
);
export const objectWorldMatrix = asCommand(
  class extends EntityNode {
    scope = NodeVariant.WorldMatrix;
  },
);
export const objectPosition = asCommand(
  class extends EntityNode {
    scope = NodeVariant.Position;
  },
);
export const objectScale = asCommand(
  class extends EntityNode {
    scope = NodeVariant.Scale;
  },
);
export const objectViewPosition = asCommand(
  class extends EntityNode {
    scope = NodeVariant.ViewPosition;
  },
);
