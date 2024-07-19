import DataMap from '../DataMap.js';
import ChainMap from '../ChainMap.js';
import NodeBuilderState from './NodeBuilderState.js';
import {
  Camera,
  CubeTexture,
  Fog,
  FogExp2,
  Mapping,
  Material,
  Object3D,
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
} from '../../../nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import NodeUniformsGroup from '@modules/renderer/engine/renderers/common/nodes/NodeUniformsGroup.js';
import RenderObject from '@modules/renderer/engine/renderers/common/RenderObject.js';
import NodeBuilder from '@modules/renderer/engine/nodes/core/NodeBuilder.js';
import { types } from 'sass';
import Color = types.Color;

export class Nodes extends DataMap<any, any> {
  frame: NodeFrame;
  nodeBuilderCache: Map<string, NodeBuilderState>;
  callHashCache: ChainMap<any, any>;
  groupsData: ChainMap<any, any>;

  constructor(public renderer: Renderer) {
    super();

    this.frame = new NodeFrame();
    this.nodeBuilderCache = new Map();
    this.callHashCache = new ChainMap();
    this.groupsData = new ChainMap();
  }

  updateGroup(nodeUniformsGroup: NodeUniformsGroup): boolean {
    const groupNode = nodeUniformsGroup.groupNode;
    const name = groupNode.name;

    // objectGroup is every updated

    if (name === objectGroup.name) return true;

    // renderGroup is updated once per render/compute call

    if (name === renderGroup.name) {
      const uniformsGroupData = this.get(nodeUniformsGroup);
      const renderId = this.frame.renderId;

      if (uniformsGroupData.renderId !== renderId) {
        uniformsGroupData.renderId = renderId;

        return true;
      }

      return false;
    }

    // frameGroup is updated once per frame

    if (name === frameGroup.name) {
      const uniformsGroupData = this.get(nodeUniformsGroup);
      const frameId = this.frame.frameId;

      if (uniformsGroupData.frameId !== frameId) {
        uniformsGroupData.frameId = frameId;

        return true;
      }

      return false;
    }

    // other groups are updated just when groupNode.needsUpdate is true

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
        const nodeBuilder = this.renderer.backend.createNodeBuilder(
          renderObject.object,
          this.renderer,
          renderObject.scene,
        );
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
      const nodeBuilder = this.renderer.backend.createNodeBuilder(computeNode, this.renderer);
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
      nodeBuilder.getBindings(),
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

    return this.renderer.parameters.toneMappingNode || this.get(this.renderer).toneMappingNode || null;
  }

  getCacheKey(scene: Scene, lightsNode) {
    const chain = [scene, lightsNode];
    const callId = this.renderer.info.passes;

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
    const renderer = this.renderer;
    const renderTarget = renderer.target;

    return renderTarget && renderTarget.isCubeRenderTarget ? false : true;
  }

  updateToneMapping() {
    const renderer = this.renderer;
    const rendererData = this.get(renderer);
    const rendererToneMapping = renderer.parameters.toneMapping;

    if (this.isToneMappingState && rendererToneMapping !== ToneMapping.None) {
      if (rendererData.toneMapping !== rendererToneMapping) {
        const rendererToneMappingNode = rendererData.rendererToneMappingNode || toneMapping(rendererToneMapping);
        rendererToneMappingNode.toneMapping = rendererToneMapping;

        rendererData.rendererToneMappingNode = rendererToneMappingNode;
        rendererData.toneMappingNode = rendererToneMappingNode;
        rendererData.toneMapping = rendererToneMapping;
      }
    } else {
      // Don't delete rendererData.rendererToneMappingNode
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
          fogNode = densityFog(reference('color', 'color', fog), reference('density', 'float', fog));
        } else if (fog instanceof Fog) {
          fogNode = rangeFog(
            reference('color', 'color', fog),
            reference('near', 'float', fog),
            reference('far', 'float', fog),
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

        if (CubeTexture.is(environment) === true) {
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
    renderer: Renderer,
    scene: Scene | null = null,
    object: Object3D | null = null,
    camera: Camera | null = null,
    material: Material | null = null,
  ) {
    const nodeFrame = this.frame;
    nodeFrame.renderer = renderer;
    nodeFrame.scene = scene;
    nodeFrame.object = object;
    nodeFrame.camera = camera;
    nodeFrame.material = material;

    return nodeFrame;
  }

  getNodeFrameForRender(renderObject: RenderObject) {
    return this.getNodeFrame(
      renderObject.renderer,
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
    const nodeFrame = this.getNodeFrame(this.renderer);
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

    this.frame = new NodeFrame();
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

export default Nodes;
