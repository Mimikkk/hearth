import LightingNode from './LightingNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { uniform } from '../core/UniformNode.js';
import { vec3, vec4 } from '../shadernode/ShaderNode.js';
import { reference } from '../accessors/ReferenceNode.js';
import { texture } from '../accessors/TextureNode.js';
import { positionWorld } from '../accessors/PositionNode.js';
import { normalWorld } from '../accessors/NormalNode.js';
import {
  BufferGeometry,
  Camera,
  Color,
  DepthComparison,
  DepthTexture,
  Filter,
  Group,
  Light,
  Material,
  Object3D,
  RenderTarget,
  Scene,
} from '@modules/renderer/engine/engine.js';
import LightsNode from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import { ShadowNodeMaterial } from '@modules/renderer/engine/nodes/materials/ShadowNodeMaterial.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import NodeBuilder from '@modules/renderer/engine/nodes/core/NodeBuilder.js';

let overrideMaterial: ShadowNodeMaterial | null = null;

class AnalyticLightNode extends LightingNode {
  isAnalyticLightNode: boolean = true;
  static type = 'AnalyticLightNode';
  rtt: RenderTarget | null;
  shadowNode: any;
  color: Color;
  _defaultColorNode: any;
  colorNode: ColorNode;

  constructor(public light: Light) {
    super();
    this.updateType = NodeUpdateType.Frame;

    this.rtt = null;
    this.shadowNode = null;
    this.color = Color.new();
    this._defaultColorNode = uniform(this.color);

    this.colorNode = this._defaultColorNode;

    this.isAnalyticLightNode = true;
  }

  static is(item: any): item is AnalyticLightNode {
    return item?.isAnalyticLightNode;
  }

  getCacheKey() {
    return super.getCacheKey() + '-' + (this.light.id + '-' + (this.light.castShadow ? '1' : '0'));
  }

  getHash() {
    return this.light.uuid;
  }

  setupShadow(builder: NodeBuilder) {
    let shadowNode = this.shadowNode;

    if (shadowNode === null) {
      if (overrideMaterial === null) {
        overrideMaterial = builder.createNodeMaterial();
        overrideMaterial.fragmentNode = vec4(0, 0, 0, 1);
        // Use to avoid other overrideMaterial override material.fragmentNode unintentionally when using material.shadowNode
        overrideMaterial.isShadowNodeMaterial = true;
      }

      const shadow = this.light.shadow;
      const rtt = builder.createRenderTarget(shadow.mapSize.x, shadow.mapSize.y);

      const depthTexture = new DepthTexture();
      depthTexture.minFilter = Filter.Nearest;
      depthTexture.magFilter = Filter.Nearest;
      depthTexture.image.width = shadow.mapSize.x;
      depthTexture.image.height = shadow.mapSize.y;
      depthTexture.compareFunction = DepthComparison.Less;

      rtt.depthTexture = depthTexture;

      shadow.camera.updateProjectionMatrix();

      //

      const bias = reference('bias', 'float', shadow);
      const normalBias = reference('normalBias', 'float', shadow);

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
      //const textureCompare = ( depthTexture, shadowCoord, compare ) => compare.step( texture( depthTexture, shadowCoord ) );

      // BasicShadowMap

      shadowNode = textureCompare(depthTexture, shadowCoord.xy, shadowCoord.z);
      const shadowColor = texture(rtt.texture, shadowCoord);

      this.rtt = rtt;
      this.colorNode = this.colorNode.mul(frustumTest.mix(1, shadowNode.mix(shadowColor.a.mix(1, shadowColor), 1)));
      this.shadowNode = shadowNode;

      //

      this.updateBeforeType = NodeUpdateType.Render;
    }
  }

  setup(builder: NodeBuilder) {
    if (this.light.castShadow) this.setupShadow(builder);
    else if (this.shadowNode !== null) this.disposeShadow();
  }

  updateShadow(frame: NodeFrame) {
    const { rtt, light } = this;
    const { renderer, scene } = frame;

    const currentOverrideMaterial = scene.overrideMaterial;

    scene.overrideMaterial = overrideMaterial;

    rtt.setSize(light.shadow.mapSize.x, light.shadow.mapSize.y);

    light.shadow.updateMatrices(light);

    const currentRenderTarget = renderer.target;
    const currentRenderObjectFunction = renderer._renderObjectFunction;

    renderer._renderObjectFunction = (
      object: Object3D,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      material: Material,
      group: Group,
      lightsNode: LightsNode,
    ) => {
      if (!object.castShadow) return;
      renderer.renderObject(object, scene, camera, geometry, material, group, lightsNode);
    };
    renderer.setRenderTarget(rtt);
    renderer.render(scene, light.shadow.camera);

    renderer.target = currentRenderTarget;
    renderer._renderObjectFunction = currentRenderObjectFunction;

    scene.overrideMaterial = currentOverrideMaterial;
  }

  disposeShadow() {
    this.rtt.dispose();

    this.shadowNode = null;
    this.rtt = null;

    this.colorNode = this._defaultColorNode;
  }

  updateBefore(frame: NodeFrame) {
    const { light } = this;

    if (light.castShadow) this.updateShadow(frame);
  }

  update(frame: NodeFrame) {
    const { light } = this;

    this.color.copy(light.color).multiplyScalar(light.intensity);
  }
}

AnalyticLightNode.prototype.isAnalyticLightNode = true;

export default AnalyticLightNode;
