import ClippingContext from './ClippingContext.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import LightsNode from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import RenderContext from '@modules/renderer/engine/renderers/common/RenderContext.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { InterleavedBufferAttribute } from '@modules/renderer/engine/core/InterleavedBufferAttribute.js';

let id = 0;

const isCachablePropertyRe = /^(is[A-Z])|^(visible|version|uuid|name|opacity|userData)$/;

export default class RenderObject {
  id: number;
  context: RenderContext;
  geometry: any;
  version: number;
  attributes: Attribute[];
  pipeline: any;
  buffers: Attribute[];
  clippingContext: ClippingContext;
  clippingContextVersion: number;
  initialNodesCacheKey: string;
  initialCacheKey: string;
  _nodeBuilderState: any;
  _bindings: any;
  onDispose: any;
  isRenderObject: boolean;
  onMaterialDispose: any;

  constructor(
    public renderer: Renderer,
    public object: Object3D,
    public material: Material,
    public scene: Scene,
    public camera: Camera,
    public lightsNode: LightsNode,
    public renderContext: RenderContext,
  ) {
    this.id = id++;
    this.renderer = renderer;
    this.object = object;
    this.material = material;
    this.scene = scene;
    this.camera = camera;
    this.lightsNode = lightsNode;
    this.context = renderContext;

    this.geometry = object.geometry;
    this.version = material.version;

    this.attributes = null;
    this.buffers = null;
    this.pipeline = null;

    this.updateClipping(renderContext.clip);

    this.clippingContextVersion = this.clippingContext.version;

    this.initialNodesCacheKey = this.getNodesCacheKey();
    this.initialCacheKey = this.getCacheKey();

    this._nodeBuilderState = null;
    this._bindings = null;

    this.onDispose = null;

    this.isRenderObject = true;

    this.onMaterialDispose = () => {
      this.dispose();
    };

    this.material.eventDispatcher.add('dispose', this.onMaterialDispose);
  }

  updateClipping(parent: ClippingContext) {
    const material = this.material;

    let clippingContext = this.clippingContext;

    if (Array.isArray(material.clippingPlanes)) {
      if (clippingContext === parent || !clippingContext) {
        clippingContext = new ClippingContext();
        this.clippingContext = clippingContext;
      }

      clippingContext.update(parent, material);
    } else if (this.clippingContext !== parent) {
      this.clippingContext = parent;
    }
  }

  get clippingNeedsUpdate() {
    if (this.clippingContext.version === this.clippingContextVersion) return false;

    this.clippingContextVersion = this.clippingContext.version;

    return true;
  }

  getNodeBuilderState() {
    return this._nodeBuilderState || (this._nodeBuilderState = this.renderer.nodes.getForRender(this));
  }

  getBindings() {
    return this._bindings || (this._bindings = this.getNodeBuilderState().createBindings());
  }

  getIndex() {
    return this.renderer.geometries.getIndex(this);
  }

  getChainArray() {
    return [this.object, this.material, this.context, this.lightsNode];
  }

  getAttributes() {
    if (this.attributes) return this.attributes;

    const nodeAttributes = this.getNodeBuilderState().nodeAttributes;
    const geometry = this.geometry;

    const attributes: Attribute[] = [];
    const buffers: Attribute[] = [];

    for (const nodeAttribute of nodeAttributes) {
      const attribute =
        nodeAttribute.node && nodeAttribute.node.attribute
          ? nodeAttribute.node.attribute
          : geometry.getAttribute(nodeAttribute.name);

      if (!attribute) continue;

      attributes.push(attribute);
    }

    for (let attribute of attributes) {
      const buffer = InterleavedBufferAttribute.is(attribute) ? attribute.data : attribute;
      if (buffers.includes(buffer)) continue;
      buffers.push(buffer);
    }

    this.attributes = attributes;
    this.buffers = buffers;

    return attributes;
  }

  getVertexBuffers() {
    if (!this.buffers) this.getAttributes();
    return this.buffers;
  }

  getMaterialCacheKey() {
    const { object, material } = this;

    let cacheKey = '';

    for (const property in material) {
      if (isCachablePropertyRe.test(property)) continue;

      let value = material[property as keyof typeof material];

      if (value)
        switch (typeof value) {
          case 'number':
            value = value ? '1' : '0';
            break;
          case 'object': {
            value = '{}';
            break;
          }
        }

      cacheKey += property + ':' + value + ',';
    }

    cacheKey += this.clippingContextVersion + ',';

    if (object.skeleton) {
      cacheKey += object.skeleton.bones.length + ',';
    }

    if (object.morphTargetInfluences) {
      cacheKey += object.morphTargetInfluences.length + ',';
    }

    return cacheKey;
  }

  get needsUpdate() {
    return this.initialNodesCacheKey !== this.getNodesCacheKey() || this.clippingNeedsUpdate;
  }

  getNodesCacheKey(): string {
    // Environment Nodes Cache Key
    return this.renderer.nodes.getCacheKey(this.scene, this.lightsNode);
  }

  getCacheKey(): string {
    return this.getMaterialCacheKey() + ',' + this.getNodesCacheKey();
  }

  dispose() {
    this.material.eventDispatcher.remove('dispose', this.onMaterialDispose);

    this.onDispose();
  }
}
