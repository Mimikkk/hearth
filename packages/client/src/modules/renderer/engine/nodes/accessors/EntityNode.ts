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
  scope: string;
  object3d: any;
  _uniformNode: UniformNode<any>;

  constructor(scope, object3d: Entity) {
    super();

    this.scope = scope;
    this.object3d = object3d;

    this.updateType = NodeUpdateType.OBJECT;

    this._uniformNode = new UniformNode(null);
  }

  getNodeType(): TypeName {
    const scope = this.scope;

    if (scope === EntityNode.WORLD_MATRIX || scope === EntityNode.VIEW_MATRIX) {
      return TypeName.mat4;
    }
    if (scope === EntityNode.NORMAL_MATRIX) {
      return TypeName.mat3;
    }
    return TypeName.vec3;
  }

  update(frame: NodeFrame): void {
    const object = this.object3d;
    const uniformNode = this._uniformNode;
    const scope = this.scope;

    if (scope === EntityNode.VIEW_MATRIX) {
      uniformNode.value = object.modelViewMatrix;
    } else if (scope === EntityNode.NORMAL_MATRIX) {
      uniformNode.value = object.normalMatrix;
    } else if (scope === EntityNode.WORLD_MATRIX) {
      uniformNode.value = object.matrixWorld;
    } else if (scope === EntityNode.POSITION) {
      uniformNode.value = uniformNode.value || Vec3.new();

      uniformNode.value.fromMat4Position(object.matrixWorld);
    } else if (scope === EntityNode.SCALE) {
      uniformNode.value = uniformNode.value || Vec3.new();

      uniformNode.value.fromMat4Scale(object.matrixWorld);
    } else if (scope === EntityNode.DIRECTION) {
      uniformNode.value = uniformNode.value || Vec3.new();

      object.getWorldDirection(uniformNode.value);
    } else if (scope === EntityNode.VIEW_POSITION) {
      const camera = frame.camera;

      uniformNode.value = uniformNode.value || Vec3.new();
      uniformNode.value.fromMat4Position(object.matrixWorld);
      uniformNode.value.applyMat4(camera.matrixWorldInverse);
    }
  }

  generate(builder: NodeBuilder): string | null {
    const scope = this.scope;

    if (scope === EntityNode.WORLD_MATRIX || scope === EntityNode.VIEW_MATRIX) {
      this._uniformNode.nodeType = 'mat4';
    } else if (scope === EntityNode.NORMAL_MATRIX) {
      this._uniformNode.nodeType = 'mat3';
    } else if (
      scope === EntityNode.POSITION ||
      scope === EntityNode.VIEW_POSITION ||
      scope === EntityNode.DIRECTION ||
      scope === EntityNode.SCALE
    ) {
      this._uniformNode.nodeType = 'vec3';
    }

    return this._uniformNode.build(builder);
  }
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
