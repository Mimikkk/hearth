import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { temp } from '../core/VarNode.js';
import { varying } from '../core/VaryingNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { modelViewMatrix } from './ModelNode.js';
import { vec4 } from '../shadernode/ShaderNode.primitves.ts';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class TangentNode extends Node {
  constructor(public scope: Variant) {
    super();
  }

  getHash(): string {
    return `tangent-${this.scope}`;
  }

  getNodeType(): TypeName {
    if (this.scope === Variant.Geometry) {
      return TypeName.vec4;
    }
    return TypeName.vec3;
  }

  #output(builder: NodeBuilder) {
    switch (this.scope) {
      case Variant.Geometry:
        const output = attribute('tangent', TypeName.vec4);

        if (!builder.geometry.hasAttribute('tangent')) {
          builder.geometry.computeTangents();
        }

        return output;

      case Variant.Local:
        return varying(tangentGeometry.xyz);
      case Variant.View:
        return normalize(varying(modelViewMatrix.mul(vec4(tangentLocal, 0)).xyz));
      case Variant.World:
        return normalize(varying(tangentView.transformDirection(cameraViewMatrix)));
      default:
        throw new Error(`Unknown tangent scope: ${this.scope}`);
    }
  }

  generate(builder: NodeBuilder): string {
    return this.#output(builder).build(builder, this.getNodeType(builder));
  }
}

enum Variant {
  Geometry = 'geometry',
  Local = 'local',
  View = 'view',
  World = 'world',
}

export const tangentGeometry = new TangentNode(Variant.Geometry);
export const tangentLocal = new TangentNode(Variant.Local);
export const tangentView = new TangentNode(Variant.View);
export const tangentWorld = new TangentNode(Variant.World);
export const transformedTangentView = temp(tangentView, 'TransformedTangentView');
export const transformedTangentWorld = normalize(transformedTangentView.transformDirection(cameraViewMatrix));
