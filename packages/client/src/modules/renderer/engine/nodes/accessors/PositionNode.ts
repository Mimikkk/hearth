import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { modelViewMatrix, modelWorldMatrix } from './ModelNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

class PositionNode extends Node {
  static type = 'PositionNode';

  constructor(scope = PositionNode.LOCAL) {
    super('vec3');

    this.scope = scope;
  }

  isGlobal() {
    return true;
  }

  getHash() {
    return `position-${this.scope}`;
  }

  generate(builder) {
    const scope = this.scope;

    let outputNode = null;

    if (scope === PositionNode.GEOMETRY) {
      outputNode = attribute('position', 'vec3');
    } else if (scope === PositionNode.LOCAL) {
      outputNode = varying(positionGeometry);
    } else if (scope === PositionNode.WORLD) {
      const vertexPositionNode = modelWorldMatrix.mul(positionLocal);
      outputNode = varying(vertexPositionNode);
    } else if (scope === PositionNode.VIEW) {
      const vertexPositionNode = modelViewMatrix.mul(positionLocal);
      outputNode = varying(vertexPositionNode);
    } else if (scope === PositionNode.VIEW_DIRECTION) {
      const vertexPositionNode = positionView.negate();
      outputNode = normalize(varying(vertexPositionNode));
    } else if (scope === PositionNode.WORLD_DIRECTION) {
      const vertexPositionNode = positionLocal.transformDirection(modelWorldMatrix);
      outputNode = normalize(varying(vertexPositionNode));
    }

    return outputNode.build(builder, this.getNodeType(builder));
  }
}

PositionNode.GEOMETRY = 'geometry';
PositionNode.LOCAL = 'local';
PositionNode.WORLD = 'world';
PositionNode.WORLD_DIRECTION = 'worldDirection';
PositionNode.VIEW = 'view';
PositionNode.VIEW_DIRECTION = 'viewDirection';

export default PositionNode;

export const positionGeometry = fixedNode(PositionNode, PositionNode.GEOMETRY);
export const positionLocal = fixedNode(PositionNode, PositionNode.LOCAL).temp('Position');
export const positionWorld = fixedNode(PositionNode, PositionNode.WORLD);
export const positionWorldDirection = fixedNode(PositionNode, PositionNode.WORLD_DIRECTION);
export const positionView = fixedNode(PositionNode, PositionNode.VIEW);
export const positionViewDirection = fixedNode(PositionNode, PositionNode.VIEW_DIRECTION);
