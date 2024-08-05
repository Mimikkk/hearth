import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { attribute } from '../core/AttributeNode.js';
import { reference, referenceBuffer } from './ReferenceNode.js';
import { add } from '../math/OperatorNode.js';
import { normalLocal } from './NormalNode.js';
import { positionLocal } from './PositionNode.js';
import { tangentLocal } from './TangentNode.js';
import { uniform } from '../core/UniformNode.js';
import { buffer } from './BufferNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { SkinnedMesh } from '@modules/renderer/engine/entities/SkinnedMesh.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { AttributeNode } from '@modules/renderer/engine/nodes/Nodes.js';

export class SkinningNode extends Node {
  skinIndexNode: AttributeNode;
  skinWeightNode: AttributeNode;
  bindMatrixNode: Node;
  bindMatrixInverseNode: Node;
  boneMatricesNode: Node;

  constructor(
    public skinnedMesh: SkinnedMesh,
    public useReference: boolean,
  ) {
    super(TypeName.void);

    this.stage = NodeUpdateStage.Object;
    this.skinIndexNode = attribute('skinIndex', 'uvec4');
    this.skinWeightNode = attribute('skinWeight', 'vec4');

    if (useReference) {
      this.bindMatrixNode = reference('bindMatrix', TypeName.mat4);
      this.bindMatrixInverseNode = reference('bindMatrixInverse', TypeName.mat4);
      this.boneMatricesNode = referenceBuffer(
        'skeleton.boneMatrices',
        TypeName.mat4,
        skinnedMesh.skeleton.bones.length,
      );
    } else {
      this.bindMatrixNode = uniform(skinnedMesh.bindMatrix, TypeName.mat4);
      this.bindMatrixInverseNode = uniform(skinnedMesh.bindMatrixInverse, TypeName.mat4);
      this.boneMatricesNode = buffer(
        skinnedMesh.skeleton.boneMatrices,
        TypeName.mat4,
        skinnedMesh.skeleton.bones.length,
      );
    }
  }

  setup(builder: NodeBuilder): void {
    const { skinIndexNode, skinWeightNode, bindMatrixNode, bindMatrixInverseNode, boneMatricesNode } = this;

    const boneMatX = boneMatricesNode.element(skinIndexNode.x);
    const boneMatY = boneMatricesNode.element(skinIndexNode.y);
    const boneMatZ = boneMatricesNode.element(skinIndexNode.z);
    const boneMatW = boneMatricesNode.element(skinIndexNode.w);
    const skinVertex = bindMatrixNode.mul(positionLocal);

    const skinned = add(
      boneMatX.mul(skinWeightNode.x).mul(skinVertex),
      boneMatY.mul(skinWeightNode.y).mul(skinVertex),
      boneMatZ.mul(skinWeightNode.z).mul(skinVertex),
      boneMatW.mul(skinWeightNode.w).mul(skinVertex),
    );

    const skinPosition = bindMatrixInverseNode.mul(skinned).xyz;
    let skinMatrix = add(
      skinWeightNode.x.mul(boneMatX),
      skinWeightNode.y.mul(boneMatY),
      skinWeightNode.z.mul(boneMatZ),
      skinWeightNode.w.mul(boneMatW),
    );

    skinMatrix = bindMatrixInverseNode.mul(skinMatrix).mul(bindMatrixNode);

    const skinNormal = skinMatrix.transformDirection(normalLocal).xyz;

    positionLocal.assign(skinPosition);
    normalLocal.assign(skinNormal);

    if (builder.hasGeometryAttribute('tangent')) tangentLocal.assign(skinNormal);
  }

  generate(builder: NodeBuilder, output: TypeName): string | null {
    if (output !== TypeName.void) return positionLocal.build(builder, output);
    return null;
  }

  update(frame: NodeFrame): void {
    const object = this.useReference ? frame.object : this.skinnedMesh;

    object.skeleton!.update();
  }
}

export const skinning = (skinnedMesh: SkinnedMesh) => asNode(new SkinningNode(skinnedMesh, false));
export const skinningReference = (skinnedMesh: SkinnedMesh) => asNode(new SkinningNode(skinnedMesh, true));
