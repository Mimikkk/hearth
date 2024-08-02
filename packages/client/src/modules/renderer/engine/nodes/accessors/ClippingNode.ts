import { Node } from '../core/Node.js';
import { asNode, tsl } from '../shadernode/ShaderNodes.js';
import { positionView } from './PositionNode.js';
import { diffuseColor, property } from '../core/PropertyNode.js';
import { loop } from '../utils/LoopNode.js';
import { smoothstep } from '../math/MathNode.js';
import { uniforms } from './UniformsNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';

export class ClippingNode extends Node {
  constructor(public scope: NodeVariant) {
    super();
  }

  setup(builder: NodeBuilder) {
    super.setup(builder);

    const clippingContext = builder.clippingContext!;
    const { localClipIntersection, localClippingCount, globalClippingCount } = clippingContext;

    const numClippingPlanes = globalClippingCount + localClippingCount;
    const numUnionClippingPlanes = localClipIntersection ? numClippingPlanes - localClippingCount : numClippingPlanes;

    if (this.scope === NodeVariant.Alpha) {
      return this.#setupAlpha(clippingContext.planes, numClippingPlanes, numUnionClippingPlanes);
    } else {
      return this.#setupDistance(clippingContext.planes, numClippingPlanes, numUnionClippingPlanes);
    }
  }

  #setupAlpha(planes: Vec4[], numClippingPlanes: number, numUnionClippingPlanes: number): Node {
    return tsl(() => {
      const clippingPlanes = uniforms(planes);
      const distanceToPlane = property('f32', 'distanceToPlane');
      const distanceGradient = property('f32', 'distanceToGradient');
      const clipOpacity = property('f32', 'clipOpacity');
      clipOpacity.assign(1);

      let plane;
      loop(numUnionClippingPlanes, ({ i }) => {
        plane = clippingPlanes.element(i);

        distanceToPlane.assign(positionView.dot(plane.xyz).negate().add(plane.w));
        distanceGradient.assign(distanceToPlane.fwidth().div(2.0));

        clipOpacity.mulAssign(smoothstep(distanceGradient.negate(), distanceGradient, distanceToPlane));

        clipOpacity.equal(0.0).discard();
      });

      if (numUnionClippingPlanes < numClippingPlanes) {
        const unionClipOpacity = property('f32', 'unionclipOpacity');

        unionClipOpacity.assign(1);

        loop({ start: numUnionClippingPlanes, end: numClippingPlanes }, ({ i }) => {
          plane = clippingPlanes.element(i);

          distanceToPlane.assign(positionView.dot(plane.xyz).negate().add(plane.w));
          distanceGradient.assign(distanceToPlane.fwidth().div(2.0));

          unionClipOpacity.mulAssign(
            smoothstep(distanceGradient.negate(), distanceGradient, distanceToPlane).oneMinus(),
          );
        });

        clipOpacity.mulAssign(unionClipOpacity.oneMinus());
      }

      diffuseColor.a.mulAssign(clipOpacity);
      diffuseColor.a.equal(0.0).discard();
    })();
  }

  #setupDistance(planes: Vec4[], numClippingPlanes: number, numUnionClippingPlanes: number): Node {
    return tsl(() => {
      const clippingPlanes = uniforms(planes);

      let plane;

      loop(numUnionClippingPlanes, ({ i }) => {
        plane = clippingPlanes.element(i);
        positionView.dot(plane.xyz).greaterThan(plane.w).discard();
      });
      if (numUnionClippingPlanes < numClippingPlanes) {
        const clipped = property('bool', 'clipped');

        clipped.assign(true);

        loop({ start: numUnionClippingPlanes, end: numClippingPlanes }, ({ i }) => {
          plane = clippingPlanes.element(i);
          clipped.assign(positionView.dot(plane.xyz).greaterThan(plane.w).and(clipped));
        });

        clipped.discard();
      }
    })();
  }
}

enum NodeVariant {
  Distance = 'distance',
  Alpha = 'alpha',
}

export const clipping = () => asNode(new ClippingNode(NodeVariant.Distance));
export const clippingAlpha = () => asNode(new ClippingNode(NodeVariant.Alpha));
