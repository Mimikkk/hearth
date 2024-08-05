import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { temp } from '../core/VarNode.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { modelViewMatrix } from './ModelNode.js';
import { fixedNode, vec4 } from '../shadernode/ShaderNodes.js';

export class TangentNode extends Node {
  constructor(scope = TangentNode.LOCAL) {
    super();

    this.scope = scope;
  }

  getHash() {
    return `tangent-${this.scope}`;
  }

  getNodeType() {
    const scope = this.scope;

    if (scope === TangentNode.GEOMETRY) {
      return 'vec4';
    }

    return 'vec3';
  }

  generate(builder) {
    const scope = this.scope;

    let outputNode = null;

    if (scope === TangentNode.GEOMETRY) {
      outputNode = attribute('tangent', 'vec4');

      if (builder.geometry.hasAttribute('tangent') === false) {
        builder.geometry.computeTangents();
      }
    } else if (scope === TangentNode.LOCAL) {
      outputNode = varying(tangentGeometry.xyz);
    } else if (scope === TangentNode.VIEW) {
      const vertexNode = modelViewMatrix.mul(vec4(tangentLocal, 0)).xyz;
      outputNode = normalize(varying(vertexNode));
    } else if (scope === TangentNode.WORLD) {
      const vertexNode = tangentView.transformDirection(cameraViewMatrix);
      outputNode = normalize(varying(vertexNode));
    }

    return outputNode.build(builder, this.getNodeType(builder));
  }
}

TangentNode.GEOMETRY = 'geometry';
TangentNode.LOCAL = 'local';
TangentNode.VIEW = 'view';
TangentNode.WORLD = 'world';

export const tangentGeometry = fixedNode(TangentNode, TangentNode.GEOMETRY);
export const tangentLocal = fixedNode(TangentNode, TangentNode.LOCAL);
export const tangentView = fixedNode(TangentNode, TangentNode.VIEW);
export const tangentWorld = fixedNode(TangentNode, TangentNode.WORLD);
export const transformedTangentView = temp(tangentView, 'TransformedTangentView');
export const transformedTangentWorld = normalize(transformedTangentView.transformDirection(cameraViewMatrix));
