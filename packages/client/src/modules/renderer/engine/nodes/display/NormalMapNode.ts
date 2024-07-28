import TempNode from '../core/TempNode.js';
import { add } from '../math/OperatorNode.js';

import { modelNormalMatrix } from '../accessors/ModelNode.js';
import { normalView } from '../accessors/NormalNode.js';
import { positionView } from '../accessors/PositionNode.js';
import { TBNViewMatrix } from '../accessors/AccessorsUtils.js';
import { uv } from '../accessors/UVNode.js';
import { faceDirection } from './FrontFacingNode.js';
import { addNodeCommand, proxyNode, tslFn, vec3 } from '../shadernode/ShaderNodes.js';

import { NormalMapType } from '@modules/renderer/engine/engine.js';

// Normal Mapping Without Precomputed Tangents
// http://www.thetenthplanet.de/archives/1180

const perturbNormal2Arb = tslFn(inputs => {
  const { eye_pos, surf_norm, mapN, uv } = inputs;

  const q0 = eye_pos.dpdx();
  const q1 = eye_pos.dpdy().negate();
  const st0 = uv.dpdx();
  const st1 = uv.dpdy().negate();

  const N = surf_norm; // normalized

  const q1perp = q1.cross(N);
  const q0perp = N.cross(q0);

  const T = q1perp.mul(st0.x).add(q0perp.mul(st1.x));
  const B = q1perp.mul(st0.y).add(q0perp.mul(st1.y));

  const det = T.dot(T).max(B.dot(B));
  const scale = faceDirection.mul(det.inverseSqrt());

  return add(T.mul(mapN.x, scale), B.mul(mapN.y, scale), N.mul(mapN.z)).normalize();
});

class NormalMapNode extends TempNode {
  static type = 'NormalMapNode';

  constructor(node, scaleNode = null) {
    super('vec3');

    this.node = node;
    this.scaleNode = scaleNode;

    this.normalMapType = NormalMapType.TangentSpace;
  }

  setup(builder) {
    const { normalMapType, scaleNode } = this;

    let normalMap = this.node.mul(2.0).sub(1.0);

    if (scaleNode !== null) {
      normalMap = vec3(normalMap.xy.mul(scaleNode), normalMap.z);
    }

    let outputNode = null;

    if (normalMapType === NormalMapType.ObjectSpace) {
      outputNode = modelNormalMatrix.mul(normalMap).normalize();
    } else if (normalMapType === NormalMapType.TangentSpace) {
      const tangent = builder.hasGeometryAttribute('tangent');

      if (tangent === true) {
        outputNode = TBNViewMatrix.mul(normalMap).normalize();
      } else {
        outputNode = perturbNormal2Arb({
          eye_pos: positionView,
          surf_norm: normalView,
          mapN: normalMap,
          uv: uv(),
        });
      }
    }

    return outputNode;
  }
}

export default NormalMapNode;

export const normalMap = proxyNode(NormalMapNode);

addNodeCommand('normalMap', normalMap);
