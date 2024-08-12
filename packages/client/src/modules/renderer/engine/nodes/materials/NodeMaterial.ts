import { cacheKey } from '../core/NodeUtils.js';
import { attribute } from '../core/AttributeNode.js';
import { diffuseColor, output } from '../core/PropertyNode.js';
import {
  materialAlphaTest,
  materialColor,
  materialEmissive,
  materialNormal,
  materialOpacity,
} from '../accessors/MaterialNode.js';
import { modelViewProjection } from '../accessors/ModelViewProjectionNode.js';
import { transformedNormalView } from '../accessors/NormalNode.js';
import { instance } from '../accessors/InstanceNode.js';
import { positionLocal, positionView } from '../accessors/PositionNode.js';
import { skinningReference } from '../accessors/SkinningNode.js';
import { morphRef } from '../accessors/MorphNode.js';
import { texture } from '../accessors/TextureNode.js';
import { cubeTexture } from '../accessors/CubeTextureNode.js';
import { LightsNode, lightsNode } from '../lighting/LightsNode.js';
import { mix } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { f32, vec3, vec4 } from '../shadernode/ShaderNode.primitves.ts';
import { AONode } from '../lighting/AONode.js';
import { lightingContext } from '../lighting/LightingContextNode.js';
import { EnvironmentNode } from '../lighting/EnvironmentNode.js';
import { depth, depthPixel } from '../display/ViewportDepthNode.js';
import { cameraLogDepth } from '../accessors/CameraNode.js';
import { clipping, clippingAlpha } from '../accessors/ClippingNode.js';
import { faceDirection } from '../display/FrontFacingNode.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { ShaderMaterial } from '@modules/renderer/engine/entities/materials/ShaderMaterial.js';
import { ColorSpace } from '@modules/renderer/engine/constants.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';

export class NodeMaterial extends ShaderMaterial {
  declare isNodeMaterial: true;
  static Mapping = new Map<typeof Material, typeof NodeMaterial>();

  colorNode: Node | null;
  normalNode: Node | null;
  opacityNode: Node | null;
  backdropNode: Node | null;
  backdropAlphaNode: Node | null;
  alphaTestNode: Node | null;
  positionNode: Node | null;
  depthNode: Node | null;
  shadowNode: Node | null;
  outputNode: Node | null;
  fragmentNode: Node | null;
  vertexNode: Node | null;
  lightsNode: Node | null;
  envNode: Node | null;
  emissiveNode: Node | null;

  fog: boolean;
  lights: boolean;
  normals: boolean;
  colorSpaced: boolean;
  flatShading: boolean;
  envMap: Texture | CubeTexture | null;

  constructor() {
    super();

    this.fog = true;
    this.lights = true;
    this.normals = true;
    this.flatShading = false;

    this.colorSpaced = true;

    this.lightsNode = null;
    this.envNode = null;

    this.colorNode = null;
    this.normalNode = null;
    this.opacityNode = null;
    this.backdropNode = null;
    this.backdropAlphaNode = null;
    this.alphaTestNode = null;

    this.positionNode = null;

    this.depthNode = null;
    this.shadowNode = null;

    this.outputNode = null;

    this.fragmentNode = null;
    this.vertexNode = null;
    this.envMap = null;
  }

  static is(item?: any): item is NodeMaterial {
    return item?.isNodeMaterial === true;
  }

  customProgramCacheKey() {
    return cacheKey(this);
  }

  build(builder: NodeBuilder): Node | void {
    this.setup(builder);
  }

  setup(builder: NodeBuilder): Node | void {
    builder.addStack();

    builder.stack.outputNode = this.vertexNode || this.setupPosition(builder);

    builder.addFlow(ShaderStage.Vertex, builder.removeStack());

    builder.addStack();

    let resultNode;

    const clippingNode = this.setupClipping(builder);

    if (this.fragmentNode === null) {
      if (this.depthWrite === true) this.setupDepth(builder);

      if (this.normals === true) this.setupNormal(builder);

      this.setupDiffuseColor(builder);
      this.setupVariants(builder);

      const outgoingLightNode = this.setupLighting(builder);

      if (clippingNode !== null) builder.stack.add(clippingNode);

      const basicOutput = vec4(outgoingLightNode, diffuseColor.a).max(0);

      resultNode = this.setupOutput(builder, basicOutput);

      output.assign(resultNode);

      if (this.outputNode !== null) resultNode = this.outputNode;
    } else {
      resultNode = this.setupOutput(builder, this.fragmentNode);
    }

    builder.stack.outputNode = resultNode;

    builder.addFlow(ShaderStage.Fragment, builder.removeStack());
  }

  setupClipping(builder: NodeBuilder): Node | void {
    if (builder.clippingContext === null) return null;
    const { globalClippingCount, localClippingCount } = builder.clippingContext;

    let result = null;

    if (globalClippingCount || localClippingCount) {
      if (this.alphaToCoverage) {
        result = clippingAlpha();
      } else {
        builder.stack.add(clipping());
      }
    }

    return result;
  }

  setupDepth(builder: NodeBuilder): Node | void {
    const { hearth } = builder;

    let depthNode = this.depthNode;

    if (depthNode === null && hearth.parameters.logarithmicDepthBuffer) {
      const fragDepth = modelViewProjection().w.add(1);

      depthNode = fragDepth.log2().mul(cameraLogDepth).mul(0.5);
    }

    if (depthNode) depth.assign(depthNode).append();
  }

  setupPosition(builder: NodeBuilder): Node | void {
    const { object } = builder;
    const geometry = object.geometry;

    builder.addStack();

    if (geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color) {
      morphRef(object).append();
    }

    if (object.isSkinnedMesh === true) {
      skinningReference(object).append();
    }

    if (object.instanceMatrix && object.instanceMatrix.instanced && builder.isAvailable('instance') === true) {
      instance(object).append();
    }

    if (this.positionNode !== null) {
      positionLocal.assign(this.positionNode);
    }

    const mvp = modelViewProjection();

    builder.context.vertex = builder.removeStack();
    builder.context.mvp = mvp;

    return mvp;
  }

  setupDiffuseColor({ geometry }: NodeBuilder): Node | void {
    let colorNode = this.colorNode ? vec4(this.colorNode) : materialColor;

    if (this.vertexColors === true && geometry.hasAttribute('color')) {
      colorNode = vec4(colorNode.xyz.mul(attribute('color', 'vec3')), colorNode.a);
    }

    diffuseColor.assign(colorNode);

    const opacityNode = this.opacityNode ? f32(this.opacityNode) : materialOpacity;
    diffuseColor.a.assign(diffuseColor.a.mul(opacityNode));

    if (this.alphaTestNode !== null || this.alphaTest > 0) {
      const alphaTestNode = this.alphaTestNode !== null ? f32(this.alphaTestNode) : materialAlphaTest;

      diffuseColor.a.lessThanEqual(alphaTestNode).discard();
    }
  }

  setupVariants(builder: NodeBuilder): Node | void {}

  setupNormal(builder: NodeBuilder): Node | void {
    if (this.flatShading) {
      const normalNode = positionView.dpdx().cross(positionView.dpdy().negate()).normalize();

      transformedNormalView.assign(normalNode.mul(faceDirection));
    } else {
      const normalNode = this.normalNode ? vec3(this.normalNode) : materialNormal;

      transformedNormalView.assign(normalNode.mul(faceDirection));
    }
  }

  getEnvNode(builder: NodeBuilder): EnvironmentNode | void {
    let node: Node | null = null;

    if (this.envNode) {
      node = this.envNode;
    } else if (this.envMap) {
      node = CubeTexture.is(this.envMap) ? cubeTexture(this.envMap) : texture(this.envMap);
    } else if (builder.environmentNode) {
      node = builder.environmentNode;
    }

    return node;
  }

  setupLights(builder: NodeBuilder): LightsNode | null {
    const envNode = this.getEnvNode(builder);

    const materialLightsNode = [];

    if (envNode) {
      materialLightsNode.push(new EnvironmentNode(envNode));
    }

    if (builder.material.aoMap) {
      materialLightsNode.push(new AONode(texture(builder.material.aoMap)));
    }

    let lightsN = this.lightsNode || builder.lightsNode;

    if (materialLightsNode.length > 0) {
      lightsN = lightsNode([...lightsN.lightNodes, ...materialLightsNode]);
    }

    return lightsN;
  }

  setupLightingModel(builder: NodeBuilder): LightModel {
    throw new Error('NodeMaterial: LightModel not defined.');
  }

  setupLighting(builder: NodeBuilder): Node | void {
    const { material } = builder;
    const { backdropNode, backdropAlphaNode, emissiveNode } = this;

    const lights = this.lights === true || this.lightsNode !== null;

    const lightsNode = lights ? this.setupLights(builder) : null;

    let outgoingLightNode: Node = diffuseColor.rgb;

    if (lightsNode && lightsNode.hasLight) {
      const lightingModel = this.setupLightingModel(builder);

      outgoingLightNode = lightingContext(lightsNode, lightingModel, backdropNode, backdropAlphaNode);
    } else if (backdropNode !== null) {
      outgoingLightNode = vec3(
        backdropAlphaNode !== null ? mix(outgoingLightNode, backdropNode, backdropAlphaNode) : backdropNode,
      );
    }

    if ((emissiveNode && emissiveNode.isNode === true) || (material.emissive && material.emissive.isColor === true)) {
      outgoingLightNode = outgoingLightNode.add(vec3(emissiveNode ? emissiveNode : materialEmissive));
    }

    return outgoingLightNode;
  }

  setupOutput(builder: NodeBuilder, outputNode: Node): Node {
    const hearth = builder.hearth;

    if (this.fog === true) {
      const fogNode = builder.fogNode;

      if (fogNode) outputNode = vec4(fogNode.mix(outputNode.rgb, fogNode.colorNode), outputNode.a);
    }

    const toneMappingNode = builder.toneMappingNode;

    if (this.toneMapped === true && toneMappingNode) {
      outputNode = vec4(toneMappingNode.context({ color: outputNode.rgb }), outputNode.a);
    }

    if (this.colorSpaced === true) {
      const outputColorSpace = hearth.currentColorSpace;

      if (outputColorSpace !== ColorSpace.LinearSRGB && outputColorSpace !== null) {
        outputNode = outputNode.linearToColorSpace(outputColorSpace);
      }
    }

    return outputNode;
  }

  setDefaultValues(material: object) {
    for (const property in material) {
      const value = material[property];

      if (this[property] === undefined) {
        this[property] = value;

        if (value && value.clone) this[property] = value.clone();
      }
    }

    Object.assign(this.defines, material.defines);

    const descriptors = Object.getOwnPropertyDescriptors(material.constructor.prototype);

    for (const key in descriptors) {
      if (
        Object.getOwnPropertyDescriptor(this.constructor.prototype, key) === undefined &&
        descriptors[key].get !== undefined
      ) {
        Object.defineProperty(this.constructor.prototype, key, descriptors[key]);
      }
    }
  }

  static fromMaterial(material: Material | NodeMaterial): NodeMaterial {
    if (NodeMaterial.is(material)) return material;

    const MaterialClass = NodeMaterial.Mapping.get(material.constructor);
    if (MaterialClass === undefined) {
      throw new Error(`NodeMaterial: Material "${material.type}" is not compatible.`);
    }

    const nodeMaterial = new MaterialClass();
    for (const key in material) nodeMaterial[key] = material[key];

    return nodeMaterial;
  }
}

NodeMaterial.prototype.isNodeMaterial = true;
