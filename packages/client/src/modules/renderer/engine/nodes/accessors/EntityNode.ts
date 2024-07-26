import Node from '../core/Node.js';
import { NodeUpdateType } from '../core/constants.js';
import UniformNode from '../core/UniformNode.js';
import { nodeProxy } from '../shadernode/ShaderNodes.js';
import { Entity, Vec3 } from '@modules/renderer/engine/engine.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class EntityNode extends Node {
  static type = 'EntityNode';
  scope: NodeVariant;
  object3d: any;
  _uniformNode: UniformNode<any>;

  constructor(object3d: Entity) {
    super();

    this.object3d = object3d;
    this.updateType = NodeUpdateType.Object;
    this._uniformNode = new UniformNode(null);
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
    const object = this.object3d;
    const uniform = this._uniformNode;

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

  generate(builder: NodeBuilder): string | null {
    this._uniformNode.nodeType = this.getNodeType();
    return this._uniformNode.build(builder);
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

export const objectDirection = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.Direction;
  },
);
export const objectViewMatrix = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.ViewMatrix;
  },
);
export const objectNormalMatrix = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.NormalMatrix;
  },
);
export const objectWorldMatrix = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.WorldMatrix;
  },
);
export const objectPosition = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.Position;
  },
);
export const objectScale = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.Scale;
  },
);
export const objectViewPosition = nodeProxy(
  class extends EntityNode {
    scope = NodeVariant.ViewPosition;
  },
);
