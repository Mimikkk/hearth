import {
  GPUBlendFactor,
  GPUBlendOperation,
  GPUColorWriteFlags,
  GPUCompareFunction,
  GPUCullMode,
  GPUFrontFace,
  GPUIndexFormat,
  GPUStencilOperation,
} from './WebGPUConstants.js';

import {
  Blending,
  BlendingEquation,
  BlendingFactor,
  Depth,
  Side,
  StencilFunction,
  StencilOperation,
} from '../../../Three.js';

class WebGPUPipelineUtils {
  constructor(backend) {
    this.backend = backend;
  }

  createRenderPipeline(renderObject, promises) {
    const { object, material, geometry, pipeline } = renderObject;
    const { vertexProgram, fragmentProgram } = pipeline;

    const backend = this.backend;
    const device = backend.device;
    const utils = backend.utils;

    const pipelineData = backend.get(pipeline);
    const bindingsData = backend.get(renderObject.getBindings());

    // vertex buffers

    const vertexBuffers = backend.attributeUtils.createShaderVertexBuffers(renderObject);

    // blending

    let blending;

    if (material.transparent === true && material.blending !== Blending.None) {
      blending = this._getBlending(material);
    }

    // stencil

    let stencilFront = {};

    if (material.stencilWrite === true) {
      stencilFront = {
        compare: this._getStencilCompare(material),
        failOp: this._getStencilOperation(material.stencilFail),
        depthFailOp: this._getStencilOperation(material.stencilZFail),
        passOp: this._getStencilOperation(material.stencilZPass),
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

    const vertexModule = backend.get(vertexProgram).module;
    const fragmentModule = backend.get(fragmentProgram).module;

    const primitiveState = this._getPrimitiveState(object, geometry, material);
    const depthCompare = this._getDepthCompare(material);
    const depthStencilFormat = utils.getCurrentDepthStencilFormat(renderObject.context);
    let sampleCount = utils.getSampleCount(renderObject.context);

    if (sampleCount > 1) {
      // WebGPU only supports power-of-two sample counts and 2 is not a valid value
      sampleCount = Math.pow(2, Math.floor(Math.log2(sampleCount)));

      if (sampleCount === 2) {
        sampleCount = 4;
      }
    }

    const pipelineDescriptor = {
      vertex: Object.assign({}, vertexModule, { buffers: vertexBuffers }),
      fragment: Object.assign({}, fragmentModule, { targets }),
      primitive: primitiveState,
      depthStencil: {
        format: depthStencilFormat,
        depthWriteEnabled: material.depthWrite,
        depthCompare: depthCompare,
        stencilFront: stencilFront,
        stencilBack: {}, // three.js does not provide an API to configure the back function (gl.stencilFuncSeparate() was never used)
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

    if (promises === null) {
      pipelineData.pipeline = device.createRenderPipeline(pipelineDescriptor);
    } else {
      const p = new Promise((resolve /*, reject*/) => {
        device.createRenderPipelineAsync(pipelineDescriptor).then(pipeline => {
          pipelineData.pipeline = pipeline;
          resolve();
        });
      });

      promises.push(p);
    }
  }

  createComputePipeline(pipeline, bindings) {
    const backend = this.backend;
    const device = backend.device;

    const computeProgram = backend.get(pipeline.computeProgram).module;

    const pipelineGPU = backend.get(pipeline);
    const bindingsData = backend.get(bindings);

    pipelineGPU.pipeline = device.createComputePipeline({
      compute: computeProgram,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindingsData.layout],
      }),
    });
  }

  _getBlending(material) {
    let color, alpha;

    const blending = material.blending;

    if (blending === Blending.Custom) {
      const blendSrcAlpha = material.blendSrcAlpha !== null ? material.blendSrcAlpha : GPUBlendFactor.One;
      const blendDstAlpha = material.blendDstAlpha !== null ? material.blendDstAlpha : GPUBlendFactor.Zero;
      const blendEquationAlpha =
        material.blendEquationAlpha !== null ? material.blendEquationAlpha : GPUBlendFactor.Add;

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

      const setBlend = (srcRGB, dstRGB, srcAlpha, dstAlpha) => {
        color = {
          srcFactor: srcRGB,
          dstFactor: dstRGB,
          operation: GPUBlendOperation.Add,
        };

        alpha = {
          srcFactor: srcAlpha,
          dstFactor: dstAlpha,
          operation: GPUBlendOperation.Add,
        };
      };

      if (premultipliedAlpha) {
        switch (blending) {
          case Blending.Normal:
            setBlend(
              GPUBlendFactor.SrcAlpha,
              GPUBlendFactor.OneMinusSrcAlpha,
              GPUBlendFactor.One,
              GPUBlendFactor.OneMinusSrcAlpha,
            );
            break;

          case Blending.Additive:
            setBlend(GPUBlendFactor.SrcAlpha, GPUBlendFactor.One, GPUBlendFactor.One, GPUBlendFactor.One);
            break;

          case Blending.Subtractive:
            setBlend(GPUBlendFactor.Zero, GPUBlendFactor.OneMinusSrc, GPUBlendFactor.Zero, GPUBlendFactor.One);
            break;

          case Blending.Multiply:
            setBlend(GPUBlendFactor.Zero, GPUBlendFactor.Src, GPUBlendFactor.Zero, GPUBlendFactor.SrcAlpha);
            break;
        }
      } else {
        switch (blending) {
          case Blending.Normal:
            setBlend(
              GPUBlendFactor.SrcAlpha,
              GPUBlendFactor.OneMinusSrcAlpha,
              GPUBlendFactor.One,
              GPUBlendFactor.OneMinusSrcAlpha,
            );
            break;

          case Blending.Additive:
            setBlend(GPUBlendFactor.SrcAlpha, GPUBlendFactor.One, GPUBlendFactor.SrcAlpha, GPUBlendFactor.One);
            break;

          case Blending.Subtractive:
            setBlend(GPUBlendFactor.Zero, GPUBlendFactor.OneMinusSrc, GPUBlendFactor.Zero, GPUBlendFactor.One);
            break;

          case Blending.Multiply:
            setBlend(GPUBlendFactor.Zero, GPUBlendFactor.Src, GPUBlendFactor.Zero, GPUBlendFactor.Src);
            break;
        }
      }
    }

    if (color !== undefined && alpha !== undefined) {
      return { color, alpha };
    } else {
      console.error('THREE.WebGPURenderer: Invalid blending: ', blending);
    }
  }

  _getBlendFactor(blend) {
    let blendFactor;

    switch (blend) {
      case BlendingFactor.Zero:
        blendFactor = GPUBlendFactor.Zero;
        break;

      case BlendingFactor.One:
        blendFactor = GPUBlendFactor.One;
        break;

      case BlendingFactor.SrcColor:
        blendFactor = GPUBlendFactor.Src;
        break;

      case BlendingFactor.OneMinusSrcColor:
        blendFactor = GPUBlendFactor.OneMinusSrc;
        break;

      case BlendingFactor.SrcAlpha:
        blendFactor = GPUBlendFactor.SrcAlpha;
        break;

      case BlendingFactor.OneMinusSrcAlpha:
        blendFactor = GPUBlendFactor.OneMinusSrcAlpha;
        break;

      case BlendingFactor.DstColor:
        blendFactor = GPUBlendFactor.Dst;
        break;

      case BlendingFactor.OneMinusDstColor:
        blendFactor = GPUBlendFactor.OneMinusDstColor;
        break;

      case BlendingFactor.DstAlpha:
        blendFactor = GPUBlendFactor.DstAlpha;
        break;

      case BlendingFactor.OneMinusDstAlpha:
        blendFactor = GPUBlendFactor.OneMinusDstAlpha;
        break;

      case BlendingFactor.SrcAlphaSaturate:
        blendFactor = GPUBlendFactor.SrcAlphaSaturated;
        break;

      case BlendingFactor.BlendColor:
        blendFactor = GPUBlendFactor.Constant;
        break;

      case BlendingFactor.OneMinusBlendColor:
        blendFactor = GPUBlendFactor.OneMinusConstant;
        break;

      default:
        console.error('THREE.WebGPURenderer: Blend factor not supported.', blend);
    }

    return blendFactor;
  }

  _getStencilCompare(material) {
    let stencilCompare;

    const stencilFunc = material.stencilFunc;

    switch (stencilFunc) {
      case StencilFunction.Never:
        stencilCompare = GPUCompareFunction.Never;
        break;

      case StencilFunction.Always:
        stencilCompare = GPUCompareFunction.Always;
        break;

      case StencilFunction.Less:
        stencilCompare = GPUCompareFunction.Less;
        break;

      case StencilFunction.LessEqual:
        stencilCompare = GPUCompareFunction.LessEqual;
        break;

      case StencilFunction.Equal:
        stencilCompare = GPUCompareFunction.Equal;
        break;

      case StencilFunction.GreaterEqual:
        stencilCompare = GPUCompareFunction.GreaterEqual;
        break;

      case StencilFunction.Greater:
        stencilCompare = GPUCompareFunction.Greater;
        break;

      case StencilFunction.NotEqual:
        stencilCompare = GPUCompareFunction.NotEqual;
        break;

      default:
        console.error('THREE.WebGPURenderer: Invalid stencil function.', stencilFunc);
    }

    return stencilCompare;
  }

  _getStencilOperation(op) {
    let stencilOperation;

    switch (op) {
      case StencilOperation.Keep:
        stencilOperation = GPUStencilOperation.Keep;
        break;

      case StencilOperation.Zero:
        stencilOperation = GPUStencilOperation.Zero;
        break;

      case StencilOperation.Replace:
        stencilOperation = GPUStencilOperation.Replace;
        break;

      case StencilOperation.Invert:
        stencilOperation = GPUStencilOperation.Invert;
        break;

      case StencilOperation.Increment:
        stencilOperation = GPUStencilOperation.IncrementClamp;
        break;

      case StencilOperation.Decrement:
        stencilOperation = GPUStencilOperation.DecrementClamp;
        break;

      case StencilOperation.IncrementWrap:
        stencilOperation = GPUStencilOperation.IncrementWrap;
        break;

      case StencilOperation.DecrementWrap:
        stencilOperation = GPUStencilOperation.DecrementWrap;
        break;

      default:
        console.error('THREE.WebGPURenderer: Invalid stencil operation.', stencilOperation);
    }

    return stencilOperation;
  }

  _getBlendOperation(blendEquation) {
    let blendOperation;

    switch (blendEquation) {
      case BlendingEquation.Add:
        blendOperation = GPUBlendOperation.Add;
        break;

      case BlendingEquation.Subtract:
        blendOperation = GPUBlendOperation.Subtract;
        break;

      case BlendingEquation.ReverseSubtract:
        blendOperation = GPUBlendOperation.ReverseSubtract;
        break;

      case BlendingEquation.Min:
        blendOperation = GPUBlendOperation.Min;
        break;

      case BlendingEquation.Max:
        blendOperation = GPUBlendOperation.Max;
        break;

      default:
        console.error('THREE.WebGPUPipelineUtils: Blend equation not supported.', blendEquation);
    }

    return blendOperation;
  }

  _getPrimitiveState(object, geometry, material) {
    const descriptor = {};
    const utils = this.backend.utils;

    descriptor.topology = utils.getPrimitiveTopology(object, material);

    if (geometry.index !== null && object.isLine === true && object.isLineSegments !== true) {
      descriptor.stripIndexFormat =
        geometry.index.array instanceof Uint16Array ? GPUIndexFormat.Uint16 : GPUIndexFormat.Uint32;
    }

    switch (material.side) {
      case Side.Front:
        descriptor.frontFace = GPUFrontFace.CCW;
        descriptor.cullMode = GPUCullMode.Back;
        break;

      case Side.Back:
        descriptor.frontFace = GPUFrontFace.CCW;
        descriptor.cullMode = GPUCullMode.Front;
        break;

      case Side.Double:
        descriptor.frontFace = GPUFrontFace.CCW;
        descriptor.cullMode = GPUCullMode.None;
        break;

      default:
        console.error('THREE.WebGPUPipelineUtils: Unknown material.side value.', material.side);
        break;
    }

    return descriptor;
  }

  _getColorWriteMask(material) {
    return material.colorWrite === true ? GPUColorWriteFlags.All : GPUColorWriteFlags.None;
  }

  _getDepthCompare(material) {
    let depthCompare;

    if (material.depthTest === false) {
      depthCompare = GPUCompareFunction.Always;
    } else {
      const depthFunc = material.depthFunc;

      switch (depthFunc) {
        case Depth.Never:
          depthCompare = GPUCompareFunction.Never;
          break;

        case Depth.Always:
          depthCompare = GPUCompareFunction.Always;
          break;

        case Depth.Less:
          depthCompare = GPUCompareFunction.Less;
          break;

        case Depth.LessEqual:
          depthCompare = GPUCompareFunction.LessEqual;
          break;

        case Depth.Equal:
          depthCompare = GPUCompareFunction.Equal;
          break;

        case Depth.GreaterEqual:
          depthCompare = GPUCompareFunction.GreaterEqual;
          break;

        case Depth.Greater:
          depthCompare = GPUCompareFunction.Greater;
          break;

        case Depth.NotEqual:
          depthCompare = GPUCompareFunction.NotEqual;
          break;

        default:
          console.error('THREE.WebGPUPipelineUtils: Invalid depth function.', depthFunc);
      }
    }

    return depthCompare;
  }
}

export default WebGPUPipelineUtils;
