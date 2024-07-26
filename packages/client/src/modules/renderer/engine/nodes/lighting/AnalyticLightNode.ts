import LightingNode from './LightingNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { reference } from '../accessors/ReferenceNode.js';
import { texture } from '../accessors/TextureNode.js';
import { positionWorld } from '../accessors/PositionNode.js';
import { normalWorld } from '../accessors/NormalNode.js';
import { Color, DepthComparison, DepthTexture, Filter, Light, RenderTarget } from '@modules/renderer/engine/engine.js';
import UniformNode from 'three/examples/jsm/nodes/core/UniformNode.js';
import TextureNode from 'three/examples/jsm/nodes/accessors/TextureNode.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

let overrideMaterial: any = null;

export class AnalyticLightNode extends LightingNode {
  declare isAnalyticLightNode: true;
  static type = 'AnalyticLightNode';

  rtt: RenderTarget;
  shadowNode: TextureNode;
  color: Color;
  colorNode: UniformNode<Color>;
  _colorNode: UniformNode<Color>;

  constructor(public light: Light) {
    super();
    this.updateType = NodeUpdateType.FRAME;
    this.light = light;

    this.rtt = null!;
    this.shadowNode = null!;
    this.color = Color.new();

    this._colorNode = uniform(this.color);
    this.colorNode = this._colorNode;
  }

  static is(item: any): item is AnalyticLightNode {
    return item?.isAnalyticLightNode === true;
  }

  getCacheKey(): string {
    return super.getCacheKey() + '-' + (this.light.id + '-' + (this.light.castShadow ? '1' : '0'));
  }

  getHash(): string {
    return this.light.uuid;
  }

  setupShadow(builder: NodeBuilder): void {
    let shadowNode = this.shadowNode;

    if (shadowNode === null) {
      if (overrideMaterial === null) {
        overrideMaterial = builder.createNodeMaterial();
        overrideMaterial.fragmentNode = vec4(0, 0, 0, 1);
        overrideMaterial.isShadowNodeMaterial = true; // Use to avoid other overrideMaterial override material.fragmentNode unintentionally when using material.shadowNode
      }

      const shadow = this.light.shadow;
      const rtt = builder.createRenderTarget(shadow.mapSize.width, shadow.mapSize.height);

      const depthTexture = new DepthTexture();
      depthTexture.minFilter = Filter.Nearest;
      depthTexture.magFilter = Filter.Nearest;
      depthTexture.image.width = shadow.mapSize.width;
      depthTexture.image.height = shadow.mapSize.height;
      depthTexture.compareFunction = DepthComparison.Less;

      rtt.depthTexture = depthTexture;

      shadow.camera.updateProjectionMatrix();

      //

      const bias = reference('bias', TypeName.f32, shadow);
      const normalBias = reference('normalBias', TypeName.f32, shadow);

      let shadowCoord = uniform(shadow.matrix).mul(positionWorld.add(normalWorld.mul(normalBias)));
      shadowCoord = shadowCoord.xyz.div(shadowCoord.w);

      const frustumTest = shadowCoord.x
        .greaterThanEqual(0)
        .and(shadowCoord.x.lessThanEqual(1))
        .and(shadowCoord.y.greaterThanEqual(0))
        .and(shadowCoord.y.lessThanEqual(1))
        .and(shadowCoord.z.lessThanEqual(1));

      let coordZ = shadowCoord.z.add(bias).mul(2).sub(1);
      shadowCoord = vec3(shadowCoord.x, shadowCoord.y.oneMinus(), coordZ);

      const textureCompare = (depthTexture, shadowCoord, compare) =>
        texture(depthTexture, shadowCoord).compare(compare);

      shadowNode = textureCompare(depthTexture, shadowCoord.xy, shadowCoord.z);

      const shadowColor = texture(rtt.texture, shadowCoord);

      this.rtt = rtt;
      this.colorNode = this.colorNode.mul(frustumTest.mix(1, shadowNode.mix(shadowColor.a.mix(1, shadowColor), 1)));
      this.shadowNode = shadowNode;

      this.updateBeforeType = NodeUpdateType.RENDER;
    }
  }

  setup(builder: NodeBuilder) {
    if (this.light.castShadow) this.setupShadow(builder);
    else if (this.shadowNode !== null) this.disposeShadow();
  }

  updateShadow(frame: NodeFrame): void {
    const { rtt, light } = this;
    const { renderer, scene } = frame;

    const currentOverrideMaterial = scene.overrideMaterial;

    scene.overrideMaterial = overrideMaterial;

    rtt.setSize(light.shadow.mapSize.width, light.shadow.mapSize.height);

    light.shadow.updateMatrices(light);

    const currentRenderTarget = renderer.target;
    const currentRenderObjectFunction = renderer._renderObjectFn;

    renderer._renderObjectFn = (object, ...params) => {
      if (object.castShadow === true) {
        renderer.renderObject(object, ...params);
      }
    };

    renderer.updateRenderTarget(rtt);

    renderer.render(scene, light.shadow.camera);

    renderer.updateRenderTarget(currentRenderTarget);

    renderer._renderObjectFn = currentRenderObjectFunction;

    scene.overrideMaterial = currentOverrideMaterial;
  }

  disposeShadow(): void {
    this.shadowNode = null;
    this.rtt = null;
    this.colorNode = this._colorNode;
  }

  updateBefore(frame: NodeFrame): void {
    if (this.light.castShadow) this.updateShadow(frame);
  }

  update(frame: NodeFrame): void {
    const { light } = this;

    this.color.from(light.color).scale(light.intensity);
  }
}

AnalyticLightNode.prototype.isAnalyticLightNode = true;

export default AnalyticLightNode;
