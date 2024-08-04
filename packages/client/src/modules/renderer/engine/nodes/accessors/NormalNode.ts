import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { property } from '../core/PropertyNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { modelNormalMatrix } from './ModelNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';

export class NormalNode extends Node {
  constructor(scope = NormalNode.LOCAL) {
    super('vec3');

    this.scope = scope;
  }

  isGlobal() {
    return true;
  }

  getHash() {
    return `normal-${this.scope}`;
  }

  generate(builder) {
    const scope = this.scope;

    let outputNode = null;

    if (scope === NormalNode.GEOMETRY) {
      outputNode = attribute('normal', 'vec3');
    } else if (scope === NormalNode.LOCAL) {
      outputNode = varying(normalGeometry);
    } else if (scope === NormalNode.VIEW) {
      const vertexNode = modelNormalMatrix.mul(normalLocal);
      outputNode = normalize(varying(vertexNode));
    } else if (scope === NormalNode.WORLD) {
      const vertexNode = normalView.transformDirection(cameraViewMatrix);
      outputNode = normalize(varying(vertexNode));
    }

    return outputNode.build(builder, this.getNodeType(builder));
  }
}

NormalNode.GEOMETRY = 'geometry';
NormalNode.LOCAL = 'local';
NormalNode.VIEW = 'view';
NormalNode.WORLD = 'world';

export const normalGeometry = fixedNode(NormalNode, NormalNode.GEOMETRY);
export const normalLocal = fixedNode(NormalNode, NormalNode.LOCAL).temp('Normal');
export const normalView = fixedNode(NormalNode, NormalNode.VIEW);
export const normalWorld = fixedNode(NormalNode, NormalNode.WORLD);
export const transformedNormalView = property('vec3', 'TransformedNormalView');
export const transformedNormalWorld = transformedNormalView.transformDirection(cameraViewMatrix).normalize();
export const transformedClearcoatNormalView = property('vec3', 'TransformedClearcoatNormalView');
