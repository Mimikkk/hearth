import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import UniformNode from '../core/UniformNode.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { Entity, Vec3 } from '@modules/renderer/engine/engine.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

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

export default EntityNode;

enum NodeVariant {
  NormalMatrix = 'normalMatrix',
  ViewPosition = 'viewPosition',
  WorldMatrix = 'worldMatrix',
  ViewMatrix = 'viewMatrix',
  Position = 'position',
  Scale = 'scale',
  Direction = 'direction',
}

export const objectDirection = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.Direction;
  },
);
export const objectViewMatrix = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.ViewMatrix;
  },
);
export const objectNormalMatrix = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.NormalMatrix;
  },
);
export const objectWorldMatrix = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.WorldMatrix;
  },
);
export const objectPosition = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.Position;
  },
);
export const objectScale = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.Scale;
  },
);
export const objectViewPosition = proxyNode(
  class extends EntityNode {
    scope = NodeVariant.ViewPosition;
  },
);
