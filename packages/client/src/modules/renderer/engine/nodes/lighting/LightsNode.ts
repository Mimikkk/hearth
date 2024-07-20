import Node from '../core/Node.ts';
import AnalyticLightNode from './AnalyticLightNode.js';
import { nodeObject, nodeProxy, vec3 } from '../shadernode/ShaderNodes.js';
import { LightNodeMap } from '@modules/renderer/engine/nodes/lighting/LightsNodeMap.js';

const sortLights = lights => {
  return lights.sort((a, b) => a.id - b.id);
};

class LightsNode extends Node {
  constructor(lightNodes = []) {
    super('vec3');

    this.totalDiffuseNode = vec3().temp('totalDiffuse');
    this.totalSpecularNode = vec3().temp('totalSpecular');
    this.outgoingLightNode = vec3().temp('outgoingLight');

    this.lightNodes = lightNodes;

    this._hash = null;
  }

  get hasLight() {
    return this.lightNodes.length > 0;
  }

  getHash(builder) {
    if (this._hash === null) {
      const hash = [];
      for (const lightNode of this.lightNodes) {
        hash.push(lightNode.getHash(builder));
      }
      this._hash = 'lights-' + hash.join(',');
    }
    return this._hash;
  }

  setup(builder) {
    const context = builder.context;
    const lightingModel = context.lightingModel;

    let outgoingLightNode = this.outgoingLightNode;

    if (lightingModel) {
      const { lightNodes, totalDiffuseNode, totalSpecularNode } = this;

      context.outgoingLight = outgoingLightNode;

      const stack = builder.addStack();

      //

      lightingModel.start(context, stack, builder);

      // lights

      for (const lightNode of lightNodes) {
        lightNode.build(builder);
      }

      //

      lightingModel.indirectDiffuse(context, stack, builder);
      lightingModel.indirectSpecular(context, stack, builder);
      lightingModel.ambientOcclusion(context, stack, builder);

      //

      const { backdrop, backdropAlpha } = context;
      const { directDiffuse, directSpecular, indirectDiffuse, indirectSpecular } = context.reflectedLight;

      let totalDiffuse = directDiffuse.add(indirectDiffuse);

      if (backdrop !== null) {
        totalDiffuse = vec3(backdropAlpha !== null ? backdropAlpha.mix(totalDiffuse, backdrop) : backdrop);
      }

      totalDiffuseNode.assign(totalDiffuse);
      totalSpecularNode.assign(directSpecular.add(indirectSpecular));

      outgoingLightNode.assign(totalDiffuseNode.add(totalSpecularNode));

      //

      lightingModel.finish(context, stack, builder);

      //

      outgoingLightNode = outgoingLightNode.bypass(builder.removeStack());
    }

    return outgoingLightNode;
  }

  _getLightNodeById(id) {
    for (const lightNode of this.lightNodes) {
      if (lightNode.isAnalyticLightNode && lightNode.light.id === id) {
        return lightNode;
      }
    }

    return null;
  }

  fromLights(lights = []) {
    const lightNodes = [];

    lights = sortLights(lights);

    for (const light of lights) {
      let lightNode = this._getLightNodeById(light.id);

      if (lightNode === null) {
        const lightClass = light.constructor;
        const lightNodeClass = LightNodeMap.has(lightClass) ? LightNodeMap.get(lightClass) : AnalyticLightNode;

        lightNode = nodeObject(new lightNodeClass(light));
      }

      lightNodes.push(lightNode);
    }

    this.lightNodes = lightNodes;
    this._hash = null;

    return this;
  }
}

export default LightsNode;

export const lights = lights => nodeObject(new LightsNode().fromLights(lights));
export const lightsNode = nodeProxy(LightsNode);
