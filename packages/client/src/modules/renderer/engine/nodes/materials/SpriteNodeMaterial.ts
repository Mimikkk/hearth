import { NodeMaterial } from './NodeMaterial.js';
import { uniform } from '../core/UniformNode.js';
import { cameraProjectionMatrix } from '../accessors/CameraNode.js';
import { materialRotation } from '../accessors/MaterialNode.js';
import { modelViewMatrix, modelWorldMatrix } from '../accessors/ModelNode.js';
import { positionLocal } from '../accessors/PositionNode.js';
import { f32, vec2, vec3, vec4 } from '../shadernode/ShaderNode.primitves.ts';
import {
  SpriteMaterial,
  SpriteMaterialParameters,
} from '@modules/renderer/engine/entities/materials/SpriteMaterial.js';
import { Node } from '../core/Node.js';

export class SpriteNodeMaterial extends NodeMaterial {
  rotationNode: Node | null;
  scaleNode: Node | null;

  constructor(parameters?: SpriteMaterialParameters) {
    super();

    this.lights = false;
    this.normals = false;

    this.positionNode = null;
    this.rotationNode = null;
    this.scaleNode = null;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupPosition({ object, context }) {
    const { positionNode, rotationNode, scaleNode } = this;

    const vertex = positionLocal;

    let mvPosition = modelViewMatrix.mul(vec3(positionNode || 0));

    let scale = vec2(modelWorldMatrix[0].xyz.length(), modelWorldMatrix[1].xyz.length());

    if (scaleNode !== null) {
      scale = scale.mul(scaleNode);
    }

    let alignedPosition = vertex.xy;

    if (object.center && object.center.isVec2 === true) {
      alignedPosition = alignedPosition.sub(uniform(object.center).sub(0.5));
    }

    alignedPosition = alignedPosition.mul(scale);

    const rotation = f32(rotationNode || materialRotation);

    const rotatedPosition = alignedPosition.rotate(rotation);

    mvPosition = vec4(mvPosition.xy.add(rotatedPosition), mvPosition.zw);

    const modelViewProjection = cameraProjectionMatrix.mul(mvPosition);

    context.vertex = vertex;

    return modelViewProjection;
  }
}

const _parameters = new SpriteMaterial();
