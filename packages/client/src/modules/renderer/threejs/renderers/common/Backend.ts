import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';

let vector2 = null;
let vector4 = null;
let color4 = null;

import Color4 from './Color4.js';
import { Vector2, Vector4, Revision, Texture, BufferAttribute, InstancedMesh } from '../../../threejs/Three.js';
import RenderContext from './RenderContext.js';
import RenderObject from './RenderObject.js';
import { Program } from '@modules/renderer/threejs/transpiler/AST.js';
import Pipeline from '@modules/renderer/threejs/renderers/common/Pipeline.js';
import ComputeNode from '@modules/renderer/threejs/nodes/gpgpu/ComputeNode.js';
import { TypedArray } from '@modules/renderer/threejs/math/MathUtils.js';
import Info from 'three/examples/jsm/renderers/common/Info.js';
import ComputePipeline from '@modules/renderer/threejs/renderers/common/ComputePipeline.js';
import RenderPipeline from '@modules/renderer/threejs/renderers/common/RenderPipeline.js';

export interface BackendParameters {
  canvas?: HTMLCanvasElement;
}

class Backend {
  parameters: BackendParameters;
  data: WeakMap<any, any>;
  renderer: Renderer;
  domElement: HTMLCanvasElement;

  constructor(parameters: BackendParameters) {
    this.parameters = parameters;
    this.data = new WeakMap();
    this.renderer = null!;
    this.domElement = null!;
  }

  async init(renderer: Renderer) {
    this.renderer = renderer;
  }

  // render context

  begin(renderContext: RenderContext) {}

  finish(renderContext: RenderContext) {}

  // render object

  draw(renderObject: RenderObject, info: Info) {}

  // program

  createProgram(program: Program) {}

  destroyProgram(program: Program) {}

  // bindings

  createBindings(renderObject: RenderObject) {}

  updateBindings(renderObject: RenderObject) {}

  // pipeline

  createRenderPipeline(renderObject: RenderObject): RenderPipeline {
    throw new Error('Not implemented');
  }

  createComputePipeline(computeNode: ComputeNode, pipeline: Pipeline): ComputePipeline {
    throw new Error('Not implemented');
  }

  destroyPipeline(pipeline: Pipeline) {}

  // cache key

  needsRenderUpdate(renderObject: RenderObject) {} // return Boolean ( fast test )

  getRenderCacheKey(renderObject: RenderObject) {} // return String

  // node builder

  createNodeBuilder(renderObject: RenderObject) {} // return NodeBuilder (ADD IT)

  // textures

  createSampler(texture: Texture) {}

  createDefaultTexture(texture: Texture) {}

  createTexture(texture: Texture) {}

  copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {}

  // attributes

  createAttribute<T extends TypedArray>(attribute: BufferAttribute<T>) {}

  createIndexAttribute<T extends TypedArray>(attribute: BufferAttribute<T>) {}

  createStorageAttribute<T extends TypedArray>(attribute: BufferAttribute<T>) {}

  updateAttribute<T extends TypedArray>(attribute: BufferAttribute<T>) {}

  destroyAttribute<T extends TypedArray>(attribute: BufferAttribute<T>) {}

  // canvas

  getContext(): RenderContext {
    throw new Error('Not implemented');
  }

  updateSize() {}

  // utils

  async resolveTimestampAsync(renderContext: RenderContext, type: 'render' | 'compute') {
    throw new Error('Not implemented');
  }

  async hasFeatureAsync(name: string): Promise<boolean> {
    throw new Error('Not implemented');
  } // return Boolean

  hasFeature(name: string): boolean {
    throw new Error('Not implemented');
  } // return Boolean

  getInstanceCount(renderObject: RenderObject) {
    const { object, geometry } = renderObject;

    return geometry.isInstancedBufferGeometry ? geometry.instanceCount : object.isInstancedMesh ? object.count : 1;
  }

  getDrawingBufferSize() {
    vector2 = new Vector2();

    return this.renderer.getDrawingBufferSize(vector2);
  }

  getScissor() {
    vector4 = new Vector4();

    return this.renderer.getScissor(vector4);
  }

  setScissorTest(boolean: boolean) {}

  getClearColor() {
    const renderer = this.renderer;

    color4 = new Color4(0, 0, 0, 1);

    renderer.getClearColor(color4);

    color4.getRGB(color4, this.renderer.currentColorSpace);

    return color4;
  }

  getDomElement() {
    let domElement = this.domElement;

    if (domElement === null) {
      domElement = this.parameters.canvas ?? document.createElement('canvas');

      // OffscreenCanvas does not have setAttribute, see #22811
      if ('setAttribute' in domElement) domElement.setAttribute('data-engine', `three.js r${Revision} webgpu`);

      this.domElement = domElement;
    }

    return domElement;
  }

  // resource properties

  set(object: any, value: any) {
    this.data.set(object, value);
  }

  get(object: any) {
    let map = this.data.get(object);

    if (map === undefined) {
      map = {};
      this.data.set(object, map);
    }

    return map;
  }

  has(object: any) {
    return this.data.has(object);
  }

  delete(object: any) {
    this.data.delete(object);
  }
}

export default Backend;
