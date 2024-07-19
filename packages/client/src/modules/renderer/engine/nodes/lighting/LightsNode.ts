import Node from '../core/Node.js';
import AnalyticLightNode from './AnalyticLightNode.js';
import { nodeObject, nodeProxy, vec3 } from '../shadernode/ShaderNode.js';
import { LightNodeMap } from '@modules/renderer/engine/nodes/lighting/LightsNodeMap.js';
import { Light } from '@modules/renderer/engine/lights/Light.js';
import { LightNode, NodeBuilder } from '@modules/renderer/engine/nodes/Nodes.js';
import VarNode from '@modules/renderer/engine/nodes/core/VarNode.js';
import BypassNode from '@modules/renderer/engine/nodes/core/BypassNode.js';

const byId = (a: Light, b: Light) => a.id - b.id;

export class LightsNode extends Node {
  isLightsNode = true;
  totalDiffuseNode: VarNode;
  totalSpecularNode: VarNode;
  outgoingLightNode: VarNode;
  _hash: string | null;

  constructor(public nodes: LightNode[] = []) {
    super('vec3');

    this.totalDiffuseNode = vec3().temp('totalDiffuse');
    this.totalSpecularNode = vec3().temp('totalSpecular');
    this.outgoingLightNode = vec3().temp('outgoingLight');
    this._hash = null;
  }

  static is(node: any): node is LightsNode {
    return node?.isLightsNode === true;
  }

  static new(nodes: LightNode[] = []): LightsNode {
    return new LightsNode(nodes);
  }

  get hasLight() {
    return this.nodes.length > 0;
  }

  getHash(builder: NodeBuilder): string {
    if (this._hash === null) {
      const hash = [];
      for (const lightNode of this.nodes) {
        hash.push(lightNode.getHash(builder));
      }
      this._hash = 'lights-' + hash.join(',');
    }
    return this._hash;
  }

  setup(builder: NodeBuilder): BypassNode {
    const context = builder.context;
    const lightingModel = context.lightingModel;

    let outgoingLightNode = this.outgoingLightNode;

    if (lightingModel) {
      const { nodes, totalDiffuseNode, totalSpecularNode } = this;

      context.outgoingLight = outgoingLightNode;

      const stack = builder.addStack();
      lightingModel.start(context, stack, builder);

      for (const node of nodes) node.build(builder);

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

  findAnalyticById(id: number): AnalyticLightNode | null {
    for (const node of this.nodes) {
      if (AnalyticLightNode.is(node) && node.light.id === id) return node;
    }
    return null;
  }

  static fromLights(lights: Light[], into: LightsNode = LightsNode.new()): LightsNode {
    return into.fromLights(lights);
  }

  fromLights(lights: Light[]) {
    const { nodes } = this;
    nodes.length = 0;

    for (const light of lights.sort(byId)) {
      let node = this.findAnalyticById(light.id);

      if (node === null) {
        const NodeCtor = LightNodeMap.get(light.constructor) ?? AnalyticLightNode;

        node = nodeObject(new NodeCtor(light));
      }

      nodes.push(node);
    }

    this._hash = null;
    return this;
  }
}

LightsNode.prototype.isLightsNode = true;

export default LightsNode;

export const lights = (lights: Light[]) => nodeObject(LightsNode.fromLights(lights));
export const lightsNode = nodeProxy(LightsNode);
