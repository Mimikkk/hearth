import { uniform, UniformNode } from '../core/UniformNode.js';
import { uv, UVNode } from './UVNode.js';
import { textureSize, TextureSizeNode } from './TextureSizeNode.js';
import { colorSpaceToLinear } from '../display/ColorSpaceNode.js';
import { expression } from '../code/ExpressionNode.js';
import { maxMipLevel } from '../utils/MaxMipLevelNode.js';
import { asCommand, asNode, vec3 } from '../shadernode/ShaderNode.primitves.ts';
import { NodeUpdateStage } from '../core/constants.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { ConstNode, NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';

export class TextureNode extends UniformNode<Texture> {
  declare isTextureNode: true;
  compareNode: Node;
  depthNode: Node;
  sampler: boolean;
  updateMatrix: boolean;

  constructor(
    value: Texture,
    public uvNode: Node = null!,
    public levelNode: ConstNode<number> = null!,
  ) {
    super(value, TypeName.texture);

    this.isTextureNode = true;
    this.compareNode = null!;
    this.depthNode = null!;

    this.sampler = true;
    this.updateMatrix = false;
    this.stage = NodeUpdateStage.None;

    this.setUpdateMatrix(!uvNode);
  }

  getUniformHash(): string {
    return this.value.uuid;
  }

  getNodeType(): TypeName {
    if (DepthTexture.is(this.value)) return TypeName.f32;
    return TypeName.vec4;
  }

  getInputType(): TypeName {
    return TypeName.texture;
  }

  getDefaultUV(): UVNode {
    return uv(this.value.channel);
  }

  updateReference(): Texture {
    return this.value;
  }

  getTransformedUV(uvNode: UVNode): Node {
    const texture = this.value;

    return uniform(texture.matrix).mul(vec3(uvNode, 1)).xy;
  }

  setUpdateMatrix(value: boolean): this {
    this.updateMatrix = value;
    this.stage = value ? NodeUpdateStage.Frame : NodeUpdateStage.None;

    return this;
  }

  setupUV(builder: NodeBuilder, uvNode: UVNode): UVNode {
    return uvNode;
  }

  setup(builder: NodeBuilder) {
    const properties = builder.getNodeProperties(this);

    let uvNode = this.uvNode;

    if ((uvNode === null || builder.context.forceUVContext === true) && builder.context.getUV) {
      uvNode = builder.context.getUV(this);
    }

    if (!uvNode) uvNode = this.getDefaultUV();

    if (this.updateMatrix === true) {
      uvNode = this.getTransformedUV(uvNode);
    }

    uvNode = this.setupUV(builder, uvNode);

    let levelNode = this.levelNode;

    if (levelNode === null && builder.context.getTextureLevel) {
      levelNode = builder.context.getTextureLevel(this);
    }

    properties.uvNode = uvNode;
    properties.levelNode = levelNode;
    properties.compareNode = this.compareNode;
    properties.depthNode = this.depthNode;
  }

  generateUV(builder: NodeBuilder, uvNode: UVNode): string {
    return uvNode.build(builder, this.sampler ? TypeName.vec2 : TypeName.ivec2);
  }

  generateSnippet(
    builder: NodeBuilder,
    textureProperty: string,
    uvSnippet: string,
    levelSnippet: string,
    depthSnippet: string,
    compareSnippet: string,
  ): string {
    const texture = this.value;

    let snippet;

    if (levelSnippet) {
      snippet = builder.codeTextureLevel(texture, textureProperty, uvSnippet, levelSnippet, depthSnippet);
    } else if (compareSnippet) {
      snippet = builder.codeTextureCompare(texture, textureProperty, uvSnippet, compareSnippet, depthSnippet);
    } else if (!this.sampler) {
      snippet = builder.codeTextureLoad(texture, textureProperty, uvSnippet, depthSnippet);
    } else {
      snippet = builder.codeTexture(texture, textureProperty, uvSnippet, depthSnippet);
    }

    return snippet;
  }

  generate(builder: NodeBuilder, output?: TypeName): string {
    const properties = builder.getNodeProperties(this);

    const texture = this.value;

    const textureProperty = super.generate(builder, TypeName.property);

    if (output === TypeName.sampler) {
      return textureProperty + '_sampler';
    } else if (builder.isReference(output)) {
      return textureProperty;
    } else {
      const nodeData = builder.getDataFromNode(this);

      let propertyName = nodeData.propertyName;

      if (propertyName === undefined) {
        const { uvNode, levelNode, compareNode, depthNode } = properties;

        const uvSnippet = this.generateUV(builder, uvNode);
        const levelSnippet = levelNode ? levelNode.build(builder, TypeName.f32) : null;
        const depthSnippet = depthNode ? depthNode.build(builder, TypeName.i32) : null;
        const compareSnippet = compareNode ? compareNode.build(builder, TypeName.f32) : null;

        const nodeVar = builder.getVarFromNode(this);

        propertyName = builder.getPropertyName(nodeVar);

        const snippet = this.generateSnippet(
          builder,
          textureProperty,
          uvSnippet,
          levelSnippet,
          depthSnippet,
          compareSnippet,
        );

        builder.addLineFlowCode(`${propertyName} = ${snippet}`);

        if (builder.context.tempWrite !== false) {
          nodeData.snippet = snippet;
          nodeData.propertyName = propertyName;
        }
      }

      let snippet = propertyName;
      const nodeType = this.getNodeType(builder);

      if (builder.needsColorSpaceToLinear(texture)) {
        snippet = colorSpaceToLinear(expression(snippet, nodeType), texture.colorSpace)
          .setup(builder)
          .build(builder, nodeType);
      }

      return builder.format(snippet, nodeType, output);
    }
  }

  setSampler(value) {
    this.sampler = value;

    return this;
  }

  getSampler() {
    return this.sampler;
  }

  uv(uvNode: UVNode): TextureNode {
    const textureNode = this.clone();
    textureNode.uvNode = uvNode;

    return textureNode;
  }

  blur(levelNode: NodeVal<number>): TextureNode {
    const textureNode = this.clone();
    textureNode.levelNode = asNode(levelNode).mul(maxMipLevel(textureNode));

    return textureNode;
  }

  level(levelNode: NodeVal<number>): TextureNode {
    const textureNode = this.clone();
    textureNode.levelNode = asNode(levelNode);

    return textureNode;
  }

  size(levelNode: NodeVal<number>): TextureSizeNode {
    return textureSize(this, levelNode);
  }

  compare(compareNode: NodeVal<number>): TextureNode {
    const textureNode = this.clone();
    textureNode.compareNode = asNode(compareNode);

    return textureNode;
  }

  depth(depthNode: NodeVal<number>): TextureNode {
    const textureNode = this.clone();
    textureNode.depthNode = asNode(depthNode);

    return textureNode;
  }

  update() {
    const texture = this.value;

    if (texture.useLocalAutoUpdate === true) {
      texture.updateMatrix();
    }
  }

  clone() {
    const newNode = new this.constructor(this.value, this.uvNode, this.levelNode);
    newNode.sampler = this.sampler;

    return newNode;
  }
}

export const texture = asCommand(TextureNode);
export const textureLoad = (...params) => texture(...params).setSampler(false);

export const sampler = aTexture => (aTexture.isNode === true ? aTexture : texture(aTexture)).convert('sampler');

implCommand('texture', TextureNode);
