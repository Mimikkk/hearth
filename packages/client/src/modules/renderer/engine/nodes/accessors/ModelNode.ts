import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { UniformNode } from '@modules/renderer/engine/nodes/core/UniformNode.js';
import { NodeUpdateStage } from '@modules/renderer/engine/nodes/core/constants.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class ModelNode extends Node {
  entity: Entity;
  uniform: UniformNode;

  constructor(public scope: NodeVariant) {
    super();

    this.entity = null!;
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

  update({ object, camera }: NodeFrame): void {
    this.entity = object;
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
  NormalMatrix = 'normalMatrix',
  ViewPosition = 'viewPosition',
  WorldMatrix = 'worldMatrix',
  ViewMatrix = 'viewMatrix',
  Position = 'position',
  Scale = 'scale',
  Direction = 'direction',
}

export const modelDirection = new ModelNode(NodeVariant.Direction);
export const modelViewMatrix = new ModelNode(NodeVariant.ViewMatrix).label('modelViewMatrix').temp('ModelViewMatrix');
export const modelNormalMatrix = new ModelNode(NodeVariant.NormalMatrix);
export const modelWorldMatrix = new ModelNode(NodeVariant.WorldMatrix);
export const modelPosition = new ModelNode(NodeVariant.Position);
export const modelScale = new ModelNode(NodeVariant.Scale);
export const modelViewPosition = new ModelNode(NodeVariant.ViewPosition);
