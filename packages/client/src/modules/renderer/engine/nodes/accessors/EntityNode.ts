import Node from '../core/Node.js';
import { NodeUpdateType } from '../core/constants.js';
import UniformNode from '../core/UniformNode.js';
import { nodeProxy } from '../shadernode/ShaderNodes.js';

import { Entity, Vec3 } from '@modules/renderer/engine/engine.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class EntityNode extends Node {
  static type = 'EntityNode';
  scope: NodeVariant;
  object3d: any;
  _uniformNode: UniformNode<any>;

  constructor(scope: NodeVariant, object3d: Entity) {
    super();

    this.scope = scope;
    this.object3d = object3d;
    this.updateType = NodeUpdateType.Object;
    this._uniformNode = new UniformNode(null);
  }

  getNodeType(): TypeName {
    switch (this.scope) {
      case EntityNode.WORLD_MATRIX:
      case EntityNode.VIEW_MATRIX:
        return TypeName.mat4;
      case EntityNode.NORMAL_MATRIX:
        return TypeName.mat3;
      default:
        return TypeName.vec3;
    }
  }

  update(frame: NodeFrame): void {
    const object = this.object3d;
    const uniform = this._uniformNode;

    switch (this.scope) {
      case EntityNode.VIEW_MATRIX:
        uniform.value = object.modelViewMatrix;
        break;
      case EntityNode.NORMAL_MATRIX:
        uniform.value = object.normalMatrix;
        break;
      case EntityNode.WORLD_MATRIX:
        uniform.value = object.matrixWorld;
        break;
      case EntityNode.POSITION:
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Position(object.matrixWorld);
        break;
      case EntityNode.SCALE:
        uniform.value = uniform.value || Vec3.new();
        uniform.value.fromMat4Scale(object.matrixWorld);
        break;
      case EntityNode.DIRECTION:
        uniform.value = uniform.value || Vec3.new();
        object.getWorldDirection(uniform.value);
        break;
      case EntityNode.VIEW_POSITION:
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

enum NodeVariant {
  NormalMatrix = 'normalMatrix',
  ViewPosition = 'viewPosition',
  WorldMatrix = 'worldMatrix',
  ViewMatrix = 'viewMatrix',
  Position = 'position',
  Scale = 'scale',
}

EntityNode.VIEW_MATRIX = 'viewMatrix';
EntityNode.NORMAL_MATRIX = 'normalMatrix';
EntityNode.WORLD_MATRIX = 'worldMatrix';
EntityNode.POSITION = 'position';
EntityNode.SCALE = 'scale';
EntityNode.VIEW_POSITION = 'viewPosition';
EntityNode.DIRECTION = 'direction';

export default EntityNode;

export const objectDirection = nodeProxy(EntityNode, EntityNode.DIRECTION);
export const objectViewMatrix = nodeProxy(EntityNode, EntityNode.VIEW_MATRIX);
export const objectNormalMatrix = nodeProxy(EntityNode, EntityNode.NORMAL_MATRIX);
export const objectWorldMatrix = nodeProxy(EntityNode, EntityNode.WORLD_MATRIX);
export const objectPosition = nodeProxy(EntityNode, EntityNode.POSITION);
export const objectScale = nodeProxy(EntityNode, EntityNode.SCALE);
export const objectViewPosition = nodeProxy(EntityNode, EntityNode.VIEW_POSITION);
