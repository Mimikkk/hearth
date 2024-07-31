import { Node } from '../core/Node.js';
import AnalyticLightNode from './AnalyticLightNode.js';
import { asNode, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';
import { LightNodeMap } from '@modules/renderer/engine/nodes/lighting/LightsNodeMap.js';
import { Light } from '@modules/renderer/engine/entities/lights/Light.js';
import LightNode from '@modules/renderer/engine/nodes/lighting/LightNode.js';
import OperatorNode from '@modules/renderer/engine/nodes/math/OperatorNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import BypassNode from '@modules/renderer/engine/nodes/core/BypassNode.js';

export class LightsNode extends Node {
  totalDiffuseNode: OperatorNode;
  totalSpecularNode: OperatorNode;
  outgoingLightNode: OperatorNode;
  lightNodes: LightNode[];

  constructor(lightNodes: LightNode[] = []) {
    super(TypeName.vec3);

    this.totalDiffuseNode = vec3().temp('totalDiffuse');
    this.totalSpecularNode = vec3().temp('totalSpecular');
    this.outgoingLightNode = vec3().temp('outgoingLight');

    this.lightNodes = lightNodes;
  }

  static new() {
    return new LightsNode();
  }

  get hasLight(): boolean {
    return this.lightNodes.length > 0;
  }

  getHash(builder: NodeBuilder): string {
    let hash = 'lights-';
    for (const node of this.lightNodes) hash += node.getHash(builder) + ',';
    return hash;
  }

  setup(builder: NodeBuilder): BypassNode {
    const context = builder.context;
    const lightingModel = context.lightingModel;

    let outgoingLightNode = this.outgoingLightNode;

    if (lightingModel) {
      const { lightNodes, totalDiffuseNode, totalSpecularNode } = this;

      context.outgoingLight = outgoingLightNode;

      const stack = builder.addStack();

      lightingModel.start(context, stack, builder);

      for (const lightNode of lightNodes) {
        lightNode.build(builder);
      }

      lightingModel.indirectDiffuse(context, stack, builder);
      lightingModel.indirectSpecular(context, stack, builder);
      lightingModel.ambientOcclusion(context, stack, builder);

      const { backdrop, backdropAlpha } = context;
      const { directDiffuse, directSpecular, indirectDiffuse, indirectSpecular } = context.reflectedLight;

      let totalDiffuse = directDiffuse.add(indirectDiffuse);
      if (backdrop) totalDiffuse = vec3(backdropAlpha ? backdropAlpha.mix(totalDiffuse, backdrop) : backdrop);

      totalDiffuseNode.assign(totalDiffuse);
      totalSpecularNode.assign(directSpecular.add(indirectSpecular));
      outgoingLightNode.assign(totalDiffuseNode.add(totalSpecularNode));
      lightingModel.finish(context, stack, builder);

      outgoingLightNode = outgoingLightNode.bypass(builder.removeStack());
    }

    return outgoingLightNode;
  }

  byId(id: string | number): LightNode | null {
    for (const lightNode of this.lightNodes) {
      if (AnalyticLightNode.is(lightNode) && lightNode.light.id === id) {
        return lightNode;
      }
    }

    return null;
  }

  static fromLights(lights: Light[], into: LightsNode = LightsNode.new()): LightsNode {
    return into.fromLights(lights);
  }

  fromLights(lights: Light[]): this {
    this.lightNodes.length = 0;

    for (const light of lights.sort(byId)) {
      let node = this.byId(light.id);

      if (node === null) {
        const Light = LightNodeMap.get(light.constructor) ?? AnalyticLightNode;
        node = asNode(new Light(light));
      }

      this.lightNodes.push(node!);
    }

    return this;
  }
}

export default LightsNode;

const byId = (a: Light, b: Light) => a.id - b.id;
export const lights = (lights: Light[] = []) => asNode(LightsNode.fromLights(lights));
export const lightsNode = proxyNode(LightsNode);
