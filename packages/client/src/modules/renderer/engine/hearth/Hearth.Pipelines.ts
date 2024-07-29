import DataMap from './memo/DataMap.js';
import RenderPipeline from './core/RenderPipeline.js';
import ComputePipeline from './core/ComputePipeline.js';
import ProgrammableStage from './core/ProgrammableStage.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';
import Pipeline from '@modules/renderer/engine/hearth/core/Pipeline.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import {
  Blending,
  BlendingEquation,
  BlendingFactor,
  Depth,
  Side,
  StencilFunction,
  StencilOperation,
} from '@modules/renderer/engine/constants.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import {
  GPUBlendFactorType,
  GPUBlendOperationType,
  GPUColorWriteFlagsType,
  GPUCompareFunctionType,
  GPUCullModeType,
  GPUFrontFaceType,
  GPUIndexFormatType,
  GPUStencilOperationType,
} from '@modules/renderer/engine/hearth/constants.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Line } from '@modules/renderer/engine/entities/Line.js';
import { LineSegments } from '@modules/renderer/engine/entities/LineSegments.js';

export class HearthPipelines extends DataMap<any, any> {
  caches: Map<any, any>;
  programs: Record<ShaderStage, Map<string, ProgrammableStage>>;

  constructor(public hearth: Hearth) {
    super();

    this.caches = new Map();
    this.programs = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
    };
  }

  getForCompute(computeNode: ComputeNode, bindings: Binding[]): ComputePipeline {
    const data = this.get(computeNode);

    if (this._needsComputeUpdate(computeNode)) {
      const previousPipeline = data.pipeline;

      if (previousPipeline) {
        previousPipeline.usedTimes--;
        previousPipeline.computeProgram.usedTimes--;
      }

      const nodeBuilderState = this.hearth.nodes.getForCompute(computeNode);

      let stageCompute = this.programs.compute.get(nodeBuilderState.computeShader!);

      if (stageCompute === undefined) {
        if (previousPipeline && previousPipeline.computeProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.computeProgram);

        stageCompute = new ProgrammableStage(
          nodeBuilderState.computeShader!,
          ShaderStage.Compute,
          nodeBuilderState.nodeAttributes,
        );
        this.programs.compute.set(nodeBuilderState.computeShader!, stageCompute);

        this.hearth.backend.createProgram(stageCompute);
      }

      const cacheKey = this._getComputeCacheKey(computeNode, stageCompute);

      let pipeline = this.caches.get(cacheKey);

      if (pipeline === undefined) {
        if (previousPipeline && previousPipeline.usedTimes === 0) this._releasePipeline(previousPipeline);

        pipeline = this._getComputePipeline(computeNode, stageCompute, cacheKey, bindings);
      }

      pipeline.usedTimes++;
      stageCompute.usedTimes++;

      data.version = computeNode.version;
      data.pipeline = pipeline;
    }

    return data.pipeline;
  }

  getForRender(renderObject: RenderObject) {
    const data = this.get(renderObject);

    if (this._needsRenderUpdate(renderObject)) {
      const previousPipeline = data.pipeline;

      if (previousPipeline) {
        previousPipeline.usedTimes--;
        previousPipeline.vertexProgram.usedTimes--;
        previousPipeline.fragmentProgram.usedTimes--;
      }

      const nodeBuilderState = renderObject.getNodeBuilderState();

      let stageVertex = this.programs.vertex.get(nodeBuilderState.vertexShader);

      if (stageVertex === undefined) {
        if (previousPipeline && previousPipeline.vertexProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.vertexProgram);

        stageVertex = new ProgrammableStage(nodeBuilderState.vertexShader, ShaderStage.Vertex);
        this.programs.vertex.set(nodeBuilderState.vertexShader, stageVertex);

        this.hearth.backend.createProgram(stageVertex);
      }

      let stageFragment = this.programs.fragment.get(nodeBuilderState.fragmentShader);

      if (stageFragment === undefined) {
        if (previousPipeline && previousPipeline.fragmentProgram.usedTimes === 0)
          this._releaseProgram(previousPipeline.fragmentProgram);

        stageFragment = new ProgrammableStage(nodeBuilderState.fragmentShader, ShaderStage.Fragment);
        this.programs.fragment.set(nodeBuilderState.fragmentShader, stageFragment);

        this.hearth.backend.createProgram(stageFragment);
      }

      const cacheKey = this._getRenderCacheKey(renderObject, stageVertex, stageFragment);

      let pipeline = this.caches.get(cacheKey);

      if (pipeline === undefined) {
        if (previousPipeline && previousPipeline.usedTimes === 0) this._releasePipeline(previousPipeline);

        pipeline = this._getRenderPipeline(renderObject, stageVertex, stageFragment, cacheKey);
      } else {
        renderObject.pipeline = pipeline;
      }

      pipeline.usedTimes++;
      stageVertex.usedTimes++;
      stageFragment.usedTimes++;

      data.pipeline = pipeline;
    }

    return data.pipeline;
  }

  delete(object: RenderObject) {
    const pipeline = this.get(object).pipeline;

    if (pipeline) {
      pipeline.usedTimes--;

      if (pipeline.usedTimes === 0) this._releasePipeline(pipeline);

      if (pipeline.isComputePipeline) {
        pipeline.computeProgram.usedTimes--;

        if (pipeline.computeProgram.usedTimes === 0) this._releaseProgram(pipeline.computeProgram);
      } else {
        pipeline.fragmentProgram.usedTimes--;
        pipeline.vertexProgram.usedTimes--;

        if (pipeline.vertexProgram.usedTimes === 0) this._releaseProgram(pipeline.vertexProgram);
        if (pipeline.fragmentProgram.usedTimes === 0) this._releaseProgram(pipeline.fragmentProgram);
      }
    }

    return super.delete(object);
  }

  dispose() {
    super.dispose();

    this.caches = new Map();
    this.programs = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
    };
  }

  updateForRender(renderObject: RenderObject) {
    this.getForRender(renderObject);
  }

  _getComputePipeline(
    computeNode: ComputeNode,
    stageCompute: ProgrammableStage,
    cacheKey: string,
    bindings: Binding[],
  ): ComputePipeline {
    cacheKey = cacheKey || this._getComputeCacheKey(computeNode, stageCompute);

    let pipeline = this.caches.get(cacheKey);

    if (pipeline === undefined) {
      pipeline = new ComputePipeline(cacheKey, stageCompute);

      this.caches.set(cacheKey, pipeline);

      this.hearth.backend.createComputePipeline(pipeline, bindings);
    }

    return pipeline;
  }

  _getRenderPipeline(
    renderObject: RenderObject,
    stageVertex: ProgrammableStage,
    stageFragment: ProgrammableStage,
    cacheKey: string,
  ): RenderPipeline {
    cacheKey = cacheKey || this._getRenderCacheKey(renderObject, stageVertex, stageFragment);

    let pipeline = this.caches.get(cacheKey);

    if (pipeline === undefined) {
      pipeline = new RenderPipeline(cacheKey, stageVertex, stageFragment);

      this.caches.set(cacheKey, pipeline);

      renderObject.pipeline = pipeline;

      this.hearth.backend.createRenderPipeline(renderObject);
    }

    return pipeline;
  }

  _getComputeCacheKey(computeNode: ComputeNode, stageCompute: ProgrammableStage): string {
    return computeNode.id + ',' + stageCompute.id;
  }

  _getRenderCacheKey(
    renderObject: RenderObject,
    stageVertex: ProgrammableStage,
    stageFragment: ProgrammableStage,
  ): string {
    return stageVertex.id + ',' + stageFragment.id + ',' + this.hearth.backend.getRenderCacheKey(renderObject);
  }

  _releasePipeline(pipeline: Pipeline) {
    this.caches.delete(pipeline.cacheKey);
  }

  _releaseProgram(program: ProgrammableStage) {
    this.programs[program.stage].delete(program.code);
  }

  _needsComputeUpdate(computeNode: ComputeNode): boolean {
    const data = this.get(computeNode);

    return data.pipeline === undefined || data.version !== computeNode.version;
  }

  _needsRenderUpdate(renderObject: RenderObject): boolean {
    const data = this.get(renderObject);

    return data.pipeline === undefined || this.hearth.backend.needsRenderUpdate(renderObject);
  }

  createRenderPipeline(renderObject: RenderObject) {
    const { object, material, geometry, pipeline } = renderObject;
    const { vertexProgram, fragmentProgram } = pipeline;

    const backend = this.hearth.backend;
    const device = backend.device;
    const utils = this.hearth.utilities;

    const pipelineData = backend.memo.get(pipeline);
    const bindingsData = backend.memo.get(renderObject.getBindings());

    const vertexBuffers = backend.hearth.attributes.layouts(renderObject);

    let blending;

    if (material.transparent === true && material.blending !== Blending.None) {
      blending = this._getBlending(material);
    }

    let stencilFront = {};

    if (material.stencilWrite === true) {
      stencilFront = {
        compare: this._getStencilCompare(material),
        failOp: this._getStencilOperation(material.stencilFail as StencilOperation),
        depthFailOp: this._getStencilOperation(material.stencilZFail as StencilOperation),
        passOp: this._getStencilOperation(material.stencilZPass as StencilOperation),
      };
    }

    const colorWriteMask = this._getColorWriteMask(material);

    const targets = [];

    if (renderObject.context.textures !== null) {
      const textures = renderObject.context.textures;

      for (let i = 0; i < textures.length; i++) {
        const colorFormat = utils.getTextureFormatGPU(textures[i]);

        targets.push({
          format: colorFormat,
          blend: blending,
          writeMask: colorWriteMask,
        });
      }
    } else {
      const colorFormat = utils.getCurrentColorFormat(renderObject.context);

      targets.push({
        format: colorFormat,
        blend: blending,
        writeMask: colorWriteMask,
      });
    }

    const vertexModule = backend.memo.get(vertexProgram).module;
    const fragmentModule = backend.memo.get(fragmentProgram).module;

    const primitiveState = this._getPrimitiveState(object, geometry, material);
    const depthCompare = this._getDepthCompare(material);
    const depthStencilFormat = utils.getCurrentDepthStencilFormat(renderObject.context);
    let sampleCount = utils.getSampleCount(renderObject.context);

    if (sampleCount > 1) {
      sampleCount = Math.pow(2, Math.floor(Math.log2(sampleCount)));

      if (sampleCount === 2) {
        sampleCount = 4;
      }
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      vertex: Object.assign({}, vertexModule, { buffers: vertexBuffers }),
      fragment: Object.assign({}, fragmentModule, { targets }),
      primitive: primitiveState,
      depthStencil: {
        format: depthStencilFormat,
        depthWriteEnabled: material.depthWrite,
        depthCompare: depthCompare,
        stencilFront: stencilFront,

        stencilBack: {},
        stencilReadMask: material.stencilFuncMask,
        stencilWriteMask: material.stencilWriteMask,
      },
      multisample: {
        count: sampleCount,
        alphaToCoverageEnabled: material.alphaToCoverage,
      },
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindingsData.layout],
      }),
    };

    pipelineData.pipeline = device.createRenderPipeline(pipelineDescriptor);
  }

  createComputePipeline(pipeline: ComputePipeline, bindings: Binding[]) {
    const backend = this.hearth.backend;
    const device = backend.device;

    const computeProgram = backend.memo.get(pipeline.computeProgram).module;

    const pipelineGPU = backend.memo.get(pipeline);
    const bindingsData = backend.memo.get(bindings);

    pipelineGPU.pipeline = device.createComputePipeline({
      compute: computeProgram,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindingsData.layout],
      }),
    });
  }

  _getBlending(material: Material) {
    let color, alpha;

    const blending = material.blending;

    if (blending === Blending.Custom) {
      const blendSrcAlpha = (material.blendSrcAlpha ?? GPUBlendFactorType.One) as number;
      const blendDstAlpha = (material.blendDstAlpha ?? GPUBlendFactorType.Zero) as number;
      const blendEquationAlpha = (material.blendEquationAlpha ?? GPUBlendOperationType.Add) as number;

      color = {
        srcFactor: this._getBlendFactor(material.blendSrc),
        dstFactor: this._getBlendFactor(material.blendDst),
        operation: this._getBlendOperation(material.blendEquation),
      };

      alpha = {
        srcFactor: this._getBlendFactor(blendSrcAlpha),
        dstFactor: this._getBlendFactor(blendDstAlpha),
        operation: this._getBlendOperation(blendEquationAlpha),
      };
    } else {
      const premultipliedAlpha = material.premultipliedAlpha;

      const setBlend = (
        srcRGB: GPUBlendFactor,
        dstRGB: GPUBlendFactor,
        srcAlpha: GPUBlendFactor,
        dstAlpha: GPUBlendFactor,
      ) => {
        color = {
          srcFactor: srcRGB,
          dstFactor: dstRGB,
          operation: GPUBlendOperationType.Add,
        };

        alpha = {
          srcFactor: srcAlpha,
          dstFactor: dstAlpha,
          operation: GPUBlendOperationType.Add,
        };
      };

      if (premultipliedAlpha) {
        switch (blending) {
          case Blending.Normal:
            setBlend(
              GPUBlendFactorType.SrcAlpha,
              GPUBlendFactorType.OneMinusSrcAlpha,
              GPUBlendFactorType.One,
              GPUBlendFactorType.OneMinusSrcAlpha,
            );
            break;

          case Blending.Additive:
            setBlend(
              GPUBlendFactorType.SrcAlpha,
              GPUBlendFactorType.One,
              GPUBlendFactorType.One,
              GPUBlendFactorType.One,
            );
            break;

          case Blending.Subtractive:
            setBlend(
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.OneMinusSrc,
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.One,
            );
            break;

          case Blending.Multiply:
            setBlend(
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.Src,
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.SrcAlpha,
            );
            break;
        }
      } else {
        switch (blending) {
          case Blending.Normal:
            setBlend(
              GPUBlendFactorType.SrcAlpha,
              GPUBlendFactorType.OneMinusSrcAlpha,
              GPUBlendFactorType.One,
              GPUBlendFactorType.OneMinusSrcAlpha,
            );
            break;

          case Blending.Additive:
            setBlend(
              GPUBlendFactorType.SrcAlpha,
              GPUBlendFactorType.One,
              GPUBlendFactorType.SrcAlpha,
              GPUBlendFactorType.One,
            );
            break;

          case Blending.Subtractive:
            setBlend(
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.OneMinusSrc,
              GPUBlendFactorType.Zero,
              GPUBlendFactorType.One,
            );
            break;

          case Blending.Multiply:
            setBlend(GPUBlendFactorType.Zero, GPUBlendFactorType.Src, GPUBlendFactorType.Zero, GPUBlendFactorType.Src);
            break;
        }
      }
    }

    if (color !== undefined && alpha !== undefined) {
      return { color, alpha };
    } else {
      console.error('Hearth: Invalid blending: ', blending);
    }
  }

  _getBlendFactor(blend: number) {
    let blendFactor;

    switch (blend) {
      case BlendingFactor.Zero:
        blendFactor = GPUBlendFactorType.Zero;
        break;

      case BlendingFactor.One:
        blendFactor = GPUBlendFactorType.One;
        break;

      case BlendingFactor.SrcColor:
        blendFactor = GPUBlendFactorType.Src;
        break;

      case BlendingFactor.OneMinusSrcColor:
        blendFactor = GPUBlendFactorType.OneMinusSrc;
        break;

      case BlendingFactor.SrcAlpha:
        blendFactor = GPUBlendFactorType.SrcAlpha;
        break;

      case BlendingFactor.OneMinusSrcAlpha:
        blendFactor = GPUBlendFactorType.OneMinusSrcAlpha;
        break;

      case BlendingFactor.DstColor:
        blendFactor = GPUBlendFactorType.Dst;
        break;

      case BlendingFactor.OneMinusDstColor:
        blendFactor = GPUBlendFactorType.OneMinusDstColor;
        break;

      case BlendingFactor.DstAlpha:
        blendFactor = GPUBlendFactorType.DstAlpha;
        break;

      case BlendingFactor.OneMinusDstAlpha:
        blendFactor = GPUBlendFactorType.OneMinusDstAlpha;
        break;

      case BlendingFactor.SrcAlphaSaturate:
        blendFactor = GPUBlendFactorType.SrcAlphaSaturated;
        break;

      //@ts-expect-error
      case BlendingFactor.BlendColor:
        blendFactor = GPUBlendFactorType.Constant;
        break;

      //@ts-expect-error
      case BlendingFactor.OneMinusBlendColor:
        blendFactor = GPUBlendFactorType.OneMinusConstant;
        break;

      default:
        console.error('Hearth: Blend factor not supported.', blend);
    }

    return blendFactor;
  }

  _getStencilCompare(material: Material) {
    let stencilCompare;

    const stencilFunc = material.stencilFunc;

    switch (stencilFunc) {
      case StencilFunction.Never:
        stencilCompare = GPUCompareFunctionType.Never;
        break;

      case StencilFunction.Always:
        stencilCompare = GPUCompareFunctionType.Always;
        break;

      case StencilFunction.Less:
        stencilCompare = GPUCompareFunctionType.Less;
        break;

      case StencilFunction.LessEqual:
        stencilCompare = GPUCompareFunctionType.LessEqual;
        break;

      case StencilFunction.Equal:
        stencilCompare = GPUCompareFunctionType.Equal;
        break;

      case StencilFunction.GreaterEqual:
        stencilCompare = GPUCompareFunctionType.GreaterEqual;
        break;

      case StencilFunction.Greater:
        stencilCompare = GPUCompareFunctionType.Greater;
        break;

      case StencilFunction.NotEqual:
        stencilCompare = GPUCompareFunctionType.NotEqual;
        break;

      default:
        console.error('Hearth: Invalid stencil function.', stencilFunc);
    }

    return stencilCompare;
  }

  _getStencilOperation(op: StencilOperation) {
    let stencilOperation;

    switch (op) {
      case StencilOperation.Keep:
        stencilOperation = GPUStencilOperationType.Keep;
        break;

      case StencilOperation.Zero:
        stencilOperation = GPUStencilOperationType.Zero;
        break;

      case StencilOperation.Replace:
        stencilOperation = GPUStencilOperationType.Replace;
        break;

      case StencilOperation.Invert:
        stencilOperation = GPUStencilOperationType.Invert;
        break;

      case StencilOperation.Increment:
        stencilOperation = GPUStencilOperationType.IncrementClamp;
        break;

      case StencilOperation.Decrement:
        stencilOperation = GPUStencilOperationType.DecrementClamp;
        break;

      case StencilOperation.IncrementWrap:
        stencilOperation = GPUStencilOperationType.IncrementWrap;
        break;

      case StencilOperation.DecrementWrap:
        stencilOperation = GPUStencilOperationType.DecrementWrap;
        break;

      default:
        console.error('Hearth: Invalid stencil operation.', stencilOperation);
    }

    return stencilOperation;
  }

  _getBlendOperation(blendEquation: BlendingEquation): GPUBlendOperation {
    let blendOperation: GPUBlendOperation = GPUBlendOperationType.Add;

    switch (blendEquation) {
      case BlendingEquation.Add:
        blendOperation = GPUBlendOperationType.Add;
        break;

      case BlendingEquation.Subtract:
        blendOperation = GPUBlendOperationType.Subtract;
        break;

      case BlendingEquation.ReverseSubtract:
        blendOperation = GPUBlendOperationType.ReverseSubtract;
        break;

      case BlendingEquation.Min:
        blendOperation = GPUBlendOperationType.Min;
        break;

      case BlendingEquation.Max:
        blendOperation = GPUBlendOperationType.Max;
        break;

      default:
        console.error('PipelineUtils: Blend equation not supported.', blendEquation);
    }

    return blendOperation;
  }

  _getPrimitiveState(object: Entity, geometry: Geometry, material: Material): GPUPrimitiveState {
    const descriptor: GPUPrimitiveState = {};
    const utils = this.hearth.utilities;

    descriptor.topology = utils.getPrimitiveTopology(object, material);

    if (hasIndex(geometry) && isLine(object) && isLineSegments(object) !== true) {
      descriptor.stripIndexFormat =
        geometry.index.array instanceof Uint16Array ? GPUIndexFormatType.Uint16 : GPUIndexFormatType.Uint32;
    }

    switch (material.side) {
      case Side.Front:
        descriptor.frontFace = GPUFrontFaceType.CCW;
        descriptor.cullMode = GPUCullModeType.Back;
        break;

      case Side.Back:
        descriptor.frontFace = GPUFrontFaceType.CCW;
        descriptor.cullMode = GPUCullModeType.Front;
        break;

      case Side.Double:
        descriptor.frontFace = GPUFrontFaceType.CCW;
        descriptor.cullMode = GPUCullModeType.None;
        break;

      default:
        console.error('PipelineUtils: Unknown material.side value.', material.side);
        break;
    }

    return descriptor;
  }

  _getColorWriteMask(material: Material) {
    return material.colorWrite === true ? GPUColorWriteFlagsType.All : GPUColorWriteFlagsType.None;
  }

  _getDepthCompare(material: Material) {
    let depthCompare;

    if (material.depthTest === false) {
      depthCompare = GPUCompareFunctionType.Always;
    } else {
      const depthFunc = material.depthFunc;

      switch (depthFunc) {
        case Depth.Never:
          depthCompare = GPUCompareFunctionType.Never;
          break;

        case Depth.Always:
          depthCompare = GPUCompareFunctionType.Always;
          break;

        case Depth.Less:
          depthCompare = GPUCompareFunctionType.Less;
          break;

        case Depth.LessEqual:
          depthCompare = GPUCompareFunctionType.LessEqual;
          break;

        case Depth.Equal:
          depthCompare = GPUCompareFunctionType.Equal;
          break;

        case Depth.GreaterEqual:
          depthCompare = GPUCompareFunctionType.GreaterEqual;
          break;

        case Depth.Greater:
          depthCompare = GPUCompareFunctionType.Greater;
          break;

        case Depth.NotEqual:
          depthCompare = GPUCompareFunctionType.NotEqual;
          break;

        default:
          console.error('PipelineUtils: Invalid depth function.', depthFunc);
      }
    }

    return depthCompare;
  }
}

const hasIndex = (geometry: any): geometry is { index: { array: TypedArray } } => geometry.index !== null;
const isLine = (object: any): object is Line => object.isLine;
const isLineSegments = (object: any): object is LineSegments => object.isLineSegments;
