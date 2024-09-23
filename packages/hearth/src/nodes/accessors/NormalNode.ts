import { Node } from '../core/Node.js';
import { attribute } from '../core/AttributeNode.js';
import { varying } from '../core/VaryingNode.js';
import { property } from '../core/PropertyNode.js';
import { normalize } from '../math/MathNode.js';
import { cameraViewMatrix } from './CameraNode.js';
import { modelNormalMatrix } from './ModelNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';

export class NormalNode extends Node {
  constructor(public scope: Variant) {
    super(TypeName.vec3);
  }

  isGlobal(): boolean {
    return true;
  }

  getHash(): string {
    return `normal-${this.scope}`;
  }

  #output() {
    switch (this.scope) {
      case Variant.Geometry:
        return attribute('normal', TypeName.vec3);
      case Variant.Local:
        return varying(normalGeometry);
      case Variant.View:
        return normalize(varying(modelNormalMatrix.mul(normalLocal)));
      case Variant.World:
        return normalize(varying(normalView.transformDirection(cameraViewMatrix)));
      default:
        throw new Error(`Unknown normal scope: ${this.scope}`);
    }
  }

  generate(builder: NodeBuilder): string {
    return this.#output().build(builder, this.getNodeType(builder));
  }
}

enum Variant {
  Geometry = 'geometry',
  Local = 'local',
  View = 'view',
  World = 'world',
}

export const normalGeometry = new NormalNode(Variant.Geometry);
export const normalLocal = new NormalNode(Variant.Local).temp('Normal');
export const normalView = new NormalNode(Variant.View);
export const normalWorld = new NormalNode(Variant.World);
export const transformedNormalView = property(TypeName.vec3, 'TransformedNormalView');
export const transformedNormalWorld = transformedNormalView.transformDirection(cameraViewMatrix).normalize();
export const transformedClearcoatNormalView = property(TypeName.vec3, 'TransformedClearcoatNormalView');
