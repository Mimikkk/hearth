import { UniformNode, uniform } from '../core/UniformNode.js';
import { uv } from './UVNode.js';
import { textureSize } from './TextureSizeNode.js';
import { colorSpaceToLinear } from '../display/ColorSpaceNode.js';
import { expression } from '../code/ExpressionNode.js';
import { maxMipLevel } from '../utils/MaxMipLevelNode.js';
import { addNodeCommand, asNode, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';
import { NodeUpdateStage } from '../core/constants.js';

export class TextureNode extends UniformNode {
  constructor(value, uvNode = null, levelNode = null) {
    super(value);

    this.isTextureNode = true;

    this.uvNode = uvNode;
    this.levelNode = levelNode;
    this.compareNode = null;
    this.depthNode = null;

    this.sampler = true;
    this.updateMatrix = false;
    this.stage = NodeUpdateStage.None;

    this.setUpdateMatrix(uvNode === null);
  }

  getUniformHash() {
    return this.value.uuid;
  }

  getNodeType() {
    if (this.value.isDepthTexture === true) return 'f32';

    return 'vec4';
  }

  getInputType() {
    return 'texture';
  }

  getDefaultUV() {
    return uv(this.value.channel);
  }

  updateReference() {
    return this.value;
  }

  getTransformedUV(uvNode) {
    const texture = this.value;

    return uniform(texture.matrix).mul(vec3(uvNode, 1)).xy;
  }

  setUpdateMatrix(value) {
    this.updateMatrix = value;
    this.stage = value ? NodeUpdateStage.Frame : NodeUpdateStage.None;

    return this;
  }

  setupUV(builder, uvNode) {
    return uvNode;
  }

  setup(builder) {
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

  generateUV(builder, uvNode) {
    return uvNode.build(builder, this.sampler === true ? 'vec2' : 'ivec2');
  }

  generateSnippet(builder, textureProperty, uvSnippet, levelSnippet, depthSnippet, compareSnippet) {
    const texture = this.value;

    let snippet;

    if (levelSnippet) {
      snippet = builder.codeTextureLevel(texture, textureProperty, uvSnippet, levelSnippet, depthSnippet);
    } else if (compareSnippet) {
      snippet = builder.codeTextureCompare(texture, textureProperty, uvSnippet, compareSnippet, depthSnippet);
    } else if (this.sampler === false) {
      snippet = builder.codeTextureLoad(texture, textureProperty, uvSnippet, depthSnippet);
    } else {
      snippet = builder.codeTexture(texture, textureProperty, uvSnippet, depthSnippet);
    }

    return snippet;
  }

  generate(builder, output) {
    const properties = builder.getNodeProperties(this);

    const texture = this.value;

    if (!texture || texture.isTexture !== true) {
      throw new Error('TextureNode: Need a engine.js texture.');
    }

    const textureProperty = super.generate(builder, 'property');

    if (output === 'sampler') {
      return textureProperty + '_sampler';
    } else if (builder.isReference(output)) {
      return textureProperty;
    } else {
      const nodeData = builder.getDataFromNode(this);

      let propertyName = nodeData.propertyName;

      if (propertyName === undefined) {
        const { uvNode, levelNode, compareNode, depthNode } = properties;

        const uvSnippet = this.generateUV(builder, uvNode);
        const levelSnippet = levelNode ? levelNode.build(builder, 'f32') : null;
        const depthSnippet = depthNode ? depthNode.build(builder, 'i32') : null;
        const compareSnippet = compareNode ? compareNode.build(builder, 'f32') : null;

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

  uv(uvNode) {
    const textureNode = this.clone();
    textureNode.uvNode = uvNode;

    return asNode(textureNode);
  }

  blur(levelNode) {
    const textureNode = this.clone();
    textureNode.levelNode = levelNode.mul(maxMipLevel(textureNode));

    return asNode(textureNode);
  }

  level(levelNode) {
    const textureNode = this.clone();
    textureNode.levelNode = levelNode;

    return textureNode;
  }

  size(levelNode) {
    return textureSize(this, levelNode);
  }

  compare(compareNode) {
    const textureNode = this.clone();
    textureNode.compareNode = asNode(compareNode);

    return asNode(textureNode);
  }

  depth(depthNode) {
    const textureNode = this.clone();
    textureNode.depthNode = asNode(depthNode);

    return asNode(textureNode);
  }

  update() {
    const texture = this.value;

    if (texture.matrixAutoUpdate === true) {
      texture.updateMatrix();
    }
  }

  clone() {
    const newNode = new this.constructor(this.value, this.uvNode, this.levelNode);
    newNode.sampler = this.sampler;

    return newNode;
  }
}

export default TextureNode;

export const texture = proxyNode(TextureNode);
export const textureLoad = (...params) => texture(...params).setSampler(false);

//export const textureLevel = ( value, uv, level ) => texture( value, uv ).level( level );

export const sampler = aTexture => (aTexture.isNode === true ? aTexture : texture(aTexture)).convert('sampler');

addNodeCommand('texture', texture);
