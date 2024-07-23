import { GPUPrimitiveTopologyType, GPUTextureFormatType } from './constants.js';
import RenderContext from '@modules/renderer/engine/renderers/common/RenderContext.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';
import type { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';

export class BackendUtilities {
  constructor(public backend: Backend) {}

  getCurrentDepthStencilFormat(renderContext: RenderContext) {
    if (renderContext.depthTexture) return this.getTextureFormatGPU(renderContext.depthTexture);
    if (renderContext.useDepth && renderContext.useStencil) return GPUTextureFormatType.Depth24PlusStencil8;
    if (renderContext.useDepth) return GPUTextureFormatType.Depth24Plus;
    return undefined;
  }

  getTextureFormatGPU(texture: Texture) {
    return this.backend.memo.get(texture).texture.format;
  }

  getCurrentColorFormat(renderContext: RenderContext) {
    return renderContext.textures
      ? this.getTextureFormatGPU(renderContext.textures[0])
      : GPUTextureFormatType.BGRA8Unorm;
  }

  getCurrentColorSpace(renderContext: RenderContext) {
    return renderContext.textures
      ? renderContext.textures[0].colorSpace
      : this.backend.renderer.parameters.outputColorSpace;
  }

  getPrimitiveTopology(object: Object3D, material: Material) {
    if (isPointsTopology(object)) return GPUPrimitiveTopologyType.PointList;
    if (isLineSegmentsTopology(object, material)) return GPUPrimitiveTopologyType.LineList;
    if (isLineTopology(object)) return GPUPrimitiveTopologyType.LineStrip;
    if (isMeshTopology(object)) return GPUPrimitiveTopologyType.TriangleList;
    return undefined;
  }

  getSampleCount(context: RenderContext): number {
    if (context.textures) return context.sampleCount;
    return this.backend.renderer.parameters.sampleCount;
  }
}

const isPointsTopology = (object: any): boolean => object.isPoints;
const isLineSegmentsTopology = (object: any, material: any): boolean =>
  object.isLineSegments || (object.isMesh && material.wireframe);
const isLineTopology = (object: any): boolean => object.isLine;
const isMeshTopology = (object: any): boolean => object.isMesh;
