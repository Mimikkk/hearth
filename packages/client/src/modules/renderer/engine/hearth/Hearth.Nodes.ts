import DataMap from './memo/DataMap.js';
import ChainMap from './memo/ChainMap.js';
import NodeBuilderState from '../nodes/builder/NodeBuilderState.js';
import {
  Camera,
  Color,
  CubeTexture,
  Entity,
  Fog,
  FogExp2,
  Mapping,
  Material,
  Scene,
  Texture,
  ToneMapping,
} from '@modules/renderer/engine/engine.js';
import {
  ComputeNode,
  cubeTexture,
  densityFog,
  frameGroup,
  NodeFrame,
  normalWorld,
  objectGroup,
  pmremTexture,
  rangeFog,
  reference,
  renderGroup,
  texture,
  toneMapping,
  viewportBottomLeft,
} from '../nodes/Nodes.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { NodeUniformsGroup } from '@modules/renderer/engine/nodes/builder/NodeStorageBuffer.js';

export class HearthNodes extends DataMap<any, any> {
  nodeFrame: NodeFrame;
  nodeBuilderCache: Map<string, NodeBuilderState>;
  callHashCache: ChainMap<any, any>;
  groupsData: ChainMap<any, any>;

  constructor(public hearth: Hearth) {
    super();

    this.nodeFrame = new NodeFrame();
    this.nodeBuilderCache = new Map();
    this.callHashCache = new ChainMap();
    this.groupsData = new ChainMap();
  }

  updateGroup(nodeUniformsGroup: NodeUniformsGroup): boolean {
    const groupNode = nodeUniformsGroup.groupNode;
    const name = groupNode.name;

    if (name === objectGroup.name) return true;

    if (name === renderGroup.name) {
      const uniformsGroupData = this.get(nodeUniformsGroup);
      const renderId = this.nodeFrame.renderId;

      if (uniformsGroupData.renderId !== renderId) {
        uniformsGroupData.renderId = renderId;

        return true;
      }

      return false;
    }

    if (name === frameGroup.name) {
      const uniformsGroupData = this.get(nodeUniformsGroup);
      const frameId = this.nodeFrame.frameId;

      if (uniformsGroupData.frameId !== frameId) {
        uniformsGroupData.frameId = frameId;

        return true;
      }

      return false;
    }

    const groupChain = [groupNode, nodeUniformsGroup];

    let groupData = this.groupsData.get(groupChain);
    if (groupData === undefined) this.groupsData.set(groupChain, (groupData = {}));

    if (groupData.version !== groupNode.version) {
      groupData.version = groupNode.version;

      return true;
    }

    return false;
  }

  getForRenderCacheKey(renderObject: RenderObject): string {
    return renderObject.initialCacheKey;
  }

  getForRender(renderObject: RenderObject): NodeBuilderState {
    const renderObjectData = this.get(renderObject);

    let nodeBuilderState = renderObjectData.nodeBuilderState;

    if (nodeBuilderState === undefined) {
      const { nodeBuilderCache } = this;

      const cacheKey = this.getForRenderCacheKey(renderObject);

      nodeBuilderState = nodeBuilderCache.get(cacheKey);

      if (nodeBuilderState === undefined) {
        const nodeBuilder = this.hearth.backend.createNodeBuilder(renderObject.object, this.hearth, renderObject.scene);
        nodeBuilder.material = renderObject.material;
        nodeBuilder.context.material = renderObject.material;
        nodeBuilder.lightsNode = renderObject.lightsNode;
        nodeBuilder.environmentNode = this.getEnvironmentNode(renderObject.scene);
        nodeBuilder.fogNode = this.getFogNode(renderObject.scene);
        nodeBuilder.toneMappingNode = this.getToneMappingNode();
        nodeBuilder.clippingContext = renderObject.clippingContext;
        nodeBuilder.build();

        nodeBuilderState = this._createNodeBuilderState(nodeBuilder);

        nodeBuilderCache.set(cacheKey, nodeBuilderState);
      }

      nodeBuilderState.usedTimes++;

      renderObjectData.nodeBuilderState = nodeBuilderState;
    }

    return nodeBuilderState;
  }

  delete(object: RenderObject): any {
    if (object.isRenderObject) {
      const nodeBuilderState = this.get(object).nodeBuilderState;
      nodeBuilderState.usedTimes--;

      if (nodeBuilderState.usedTimes === 0) {
        this.nodeBuilderCache.delete(this.getForRenderCacheKey(object));
      }
    }

    return super.delete(object);
  }

  getForCompute(computeNode: ComputeNode): NodeBuilderState {
    const computeData = this.get(computeNode);

    let nodeBuilderState = computeData.nodeBuilderState;

    if (nodeBuilderState === undefined) {
      const nodeBuilder = this.hearth.backend.createNodeBuilder(computeNode, this.hearth);
      nodeBuilder.build();

      nodeBuilderState = this._createNodeBuilderState(nodeBuilder);

      computeData.nodeBuilderState = nodeBuilderState;
    }

    return nodeBuilderState;
  }

  _createNodeBuilderState(nodeBuilder: NodeBuilder) {
    return new NodeBuilderState(
      nodeBuilder.vertexShader,
      nodeBuilder.fragmentShader,
      nodeBuilder.computeShader,
      nodeBuilder.getAttributesArray(),
      nodeBuilder.useBindings(),
      nodeBuilder.updateNodes,
      nodeBuilder.updateBeforeNodes,
    );
  }

  getEnvironmentNode(scene: Scene) {
    return scene.environmentNode || this.get(scene).environmentNode || null;
  }

  getBackgroundNode(scene: Scene) {
    return scene.backgroundNode || this.get(scene).backgroundNode || null;
  }

  getFogNode(scene: Scene) {
    return scene.fogNode || this.get(scene).fogNode || null;
  }

  getToneMappingNode() {
    if (this.isToneMappingState === false) return null;

    return this.hearth.parameters.toneMappingNode || this.get(this.hearth).toneMappingNode || null;
  }

  getCacheKey(scene: Scene, lightsNode) {
    const chain = [scene, lightsNode];
    const callId = this.hearth.info.passes;

    let cacheKeyData = this.callHashCache.get(chain);

    if (cacheKeyData === undefined || cacheKeyData.callId !== callId) {
      const environmentNode = this.getEnvironmentNode(scene);
      const fogNode = this.getFogNode(scene);
      const toneMappingNode = this.getToneMappingNode();

      const cacheKey = [];

      if (lightsNode) cacheKey.push(lightsNode.getCacheKey());
      if (environmentNode) cacheKey.push(environmentNode.getCacheKey());
      if (fogNode) cacheKey.push(fogNode.getCacheKey());
      if (toneMappingNode) cacheKey.push(toneMappingNode.getCacheKey());

      cacheKeyData = {
        callId,
        cacheKey: cacheKey.join(','),
      };

      this.callHashCache.set(chain, cacheKeyData);
    }

    return cacheKeyData.cacheKey;
  }

  updateScene(scene: Scene) {
    this.updateEnvironment(scene);
    this.updateFog(scene);
    this.updateBackground(scene);
    this.updateToneMapping();
  }

  get isToneMappingState() {
    const hearth = this.hearth;
    const renderTarget = hearth.target;

    return !(renderTarget && renderTarget.isCubeRenderTarget);
  }

  updateToneMapping() {
    const hearth = this.hearth;
    const rendererData = this.get(hearth);
    const rendererToneMapping = hearth.parameters.toneMapping;

    if (this.isToneMappingState && rendererToneMapping !== ToneMapping.None) {
      if (rendererData.toneMapping !== rendererToneMapping) {
        const rendererToneMappingNode = rendererData.rendererToneMappingNode || toneMapping(rendererToneMapping);
        rendererToneMappingNode.toneMapping = rendererToneMapping;

        rendererData.rendererToneMappingNode = rendererToneMappingNode;
        rendererData.toneMappingNode = rendererToneMappingNode;
        rendererData.toneMapping = rendererToneMapping;
      }
    } else {
      delete rendererData.toneMappingNode;
      delete rendererData.toneMapping;
    }
  }

  updateBackground(scene: Scene) {
    const sceneData = this.get(scene);
    const background = scene.background;

    if (background) {
      if (sceneData.background !== background) {
        let backgroundNode = null;

        if (isCubeTexture(background)) {
          backgroundNode = pmremTexture(background, normalWorld);
        } else if (isTexture(background)) {
          backgroundNode = texture(background, viewportBottomLeft).setUpdateMatrix(true);
        } else if (isColor(background) !== true) {
          console.error('WebGPUNodes: Unsupported background configuration.', background);
        }

        sceneData.backgroundNode = backgroundNode;
        sceneData.background = background;
      }
    } else if (sceneData.backgroundNode) {
      delete sceneData.backgroundNode;
      delete sceneData.background;
    }
  }

  updateFog(scene: Scene) {
    const sceneData = this.get(scene);
    const fog = scene.fog;

    if (fog) {
      if (sceneData.fog !== fog) {
        let fogNode = null;

        if (fog instanceof FogExp2) {
          fogNode = densityFog(reference('color', 'color', fog), reference('density', 'f32', fog));
        } else if (fog instanceof Fog) {
          fogNode = rangeFog(
            reference('color', 'color', fog),
            reference('near', 'f32', fog),
            reference('far', 'f32', fog),
          );
        } else {
          console.error('WebGPUNodes: Unsupported fog configuration.', fog);
        }

        sceneData.fogNode = fogNode;
        sceneData.fog = fog;
      }
    } else {
      delete sceneData.fogNode;
      delete sceneData.fog;
    }
  }

  updateEnvironment(scene: Scene) {
    const sceneData = this.get(scene);
    const environment = scene.environment;

    if (environment) {
      if (sceneData.environment !== environment) {
        let environmentNode = null;

        if (environment.isCubeTexture === true) {
          environmentNode = cubeTexture(environment);
        } else if (environment.isTexture === true) {
          environmentNode = texture(environment);
        } else {
          console.error('Nodes: Unsupported environment configuration.', environment);
        }

        sceneData.environmentNode = environmentNode;
        sceneData.environment = environment;
      }
    } else if (sceneData.environmentNode) {
      delete sceneData.environmentNode;
      delete sceneData.environment;
    }
  }

  getNodeFrame(
    hearth: Hearth,
    scene: Scene | null = null,
    object: Entity | null = null,
    camera: Camera | null = null,
    material: Material | null = null,
  ) {
    const nodeFrame = this.nodeFrame;
    nodeFrame.hearth = hearth;
    nodeFrame.scene = scene;
    nodeFrame.object = object;
    nodeFrame.camera = camera;
    nodeFrame.material = material;

    return nodeFrame;
  }

  getNodeFrameForRender(renderObject: RenderObject) {
    return this.getNodeFrame(
      renderObject.hearth,
      renderObject.scene,
      renderObject.object,
      renderObject.camera,
      renderObject.material,
    );
  }

  updateBefore(renderObject: RenderObject) {
    const nodeFrame = this.getNodeFrameForRender(renderObject);
    const nodeBuilder = renderObject.getNodeBuilderState();

    for (const node of nodeBuilder.updateBeforeNodes) {
      nodeFrame.updateBeforeNode(node);
    }
  }

  updateForCompute(computeNode: ComputeNode) {
    const nodeFrame = this.getNodeFrame(this.hearth);
    const nodeBuilder = this.getForCompute(computeNode);

    for (const node of nodeBuilder.updateNodes) {
      nodeFrame.updateNode(node);
    }
  }

  updateForRender(renderObject: RenderObject) {
    const nodeFrame = this.getNodeFrameForRender(renderObject);
    const nodeBuilder = renderObject.getNodeBuilderState();

    for (const node of nodeBuilder.updateNodes) {
      nodeFrame.updateNode(node);
    }
  }

  dispose() {
    super.dispose();

    this.nodeFrame = new NodeFrame();
    this.nodeBuilderCache = new Map();
  }
}

const isCubeTexture = (item: any): item is Texture => {
  return (
    item.isCubeTexture ||
    item.mapping === Mapping.EquirectangularReflection ||
    item.mapping === Mapping.EquirectangularRefraction
  );
};
const isTexture = (item: any): item is CubeTexture => item.isTexture;
const isColor = (item: any): item is Color => item.isColor;
