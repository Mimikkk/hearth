import { Node } from '../core/Node.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { cameraFar, cameraNear } from '../accessors/CameraNode.js';
import { positionView } from '../accessors/PositionNode.js';
import { viewportDepthTexture } from './ViewportDepthTextureNode.js';
import { NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import type { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';

export class ViewportBaseDepthNode extends Node {
  constructor(public value: Node | null = null) {
    super(TypeName.f32);
  }

  generate(builder: NodeBuilder): string {
    return builder.useFragDepth();
  }

  setup({ camera }: NodeBuilder) {
    const value = this.value;

    if (value) return base().assign(value);
    return null;
  }
}

export class ViewportDepthNode extends Node {
  constructor() {
    super(TypeName.f32);
  }

  setup({ camera }: NodeBuilder) {
    if (PerspectiveCamera.is(camera)) {
      return viewZToPerspectiveDepth(positionView.z, cameraNear, cameraFar);
    }
    return viewZToOrthographicDepth(positionView.z, cameraNear, cameraFar);
  }
}

export class ViewportLinearDepthNode extends Node {
  constructor(public value: Node | null = null) {
    super(TypeName.f32);
  }

  setup({ camera }: NodeBuilder) {
    const value = this.value;

    if (!value) {
      return viewZToOrthographicDepth(positionView.z, cameraNear, cameraFar);
    }

    if (PerspectiveCamera.is(camera)) {
      const viewZ = perspectiveDepthToViewZ(value, cameraNear, cameraFar);

      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }

    return value;
  }
}

export const viewZToOrthographicDepth = (viewZ: NodeVal<number>, near: NodeVal<number>, far: NodeVal<number>) =>
  viewZ.add(near).div(near.sub(far));
export const orthographicDepthToViewZ = (depth: NodeVal<number>, near: NodeVal<number>, far: NodeVal<number>) =>
  near.sub(far).mul(depth).sub(near);
export const viewZToPerspectiveDepth = (viewZ: NodeVal<number>, near: NodeVal<number>, far: NodeVal<number>) =>
  near.add(viewZ).mul(far).div(far.sub(near).mul(viewZ));
export const perspectiveDepthToViewZ = (depth: NodeVal<number>, near: NodeVal<number>, far: NodeVal<number>) =>
  near.mul(far).div(far.sub(near).mul(depth).sub(far));

const base = asCommand(ViewportBaseDepthNode);
export const depth = new ViewportDepthNode();
depth.assign = base;

export const linearDepth = asCommand(ViewportLinearDepthNode);
export const viewportLinearDepth = linearDepth(viewportDepthTexture());
