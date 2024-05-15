import { GPUPrimitiveTopologyType, GPUTextureFormatType } from './WebGPUConstants.ts';
import RenderContext from '@modules/renderer/threejs/renderers/common/RenderContext.js';
import { Object3D } from '@modules/renderer/threejs/core/Object3D.js';
import { Material } from '@modules/renderer/threejs/materials/Material.js';
import { Texture } from '@modules/renderer/threejs/textures/Texture.js';
import type { WebGPUBackend } from '@modules/renderer/threejs/renderers/webgpu/WebGPUBackend.js';

class WebGPUUtils {
  constructor(public backend: WebGPUBackend) {}

  getCurrentDepthStencilFormat(renderContext: RenderContext) {
    if (renderContext.depthTexture !== null) return this.getTextureFormatGPU(renderContext.depthTexture);
    if (renderContext.depth && renderContext.stencil) return GPUTextureFormatType.Depth24PlusStencil8;
    if (renderContext.depth) return GPUTextureFormatType.Depth24Plus;
    return undefined;
  }

  getTextureFormatGPU(texture: Texture) {
    return this.backend.get(texture).texture.format;
  }

  getCurrentColorFormat(renderContext: RenderContext) {
    return renderContext.textures !== null
      ? this.getTextureFormatGPU(renderContext.textures[0])
      : GPUTextureFormatType.BGRA8Unorm;
  }

  getCurrentColorSpace(renderContext: RenderContext) {
    return renderContext.textures !== null
      ? renderContext.textures[0].colorSpace
      : this.backend.renderer.outputColorSpace;
  }

  getPrimitiveTopology(object: Object3D, material: Material) {
    if (isPointsTopology(object)) return GPUPrimitiveTopologyType.PointList;
    if (isLineSegmentsTopology(object, material)) return GPUPrimitiveTopologyType.LineList;
    if (isLineTopology(object)) return GPUPrimitiveTopologyType.LineStrip;
    if (isMeshTopology(object)) return GPUPrimitiveTopologyType.TriangleList;
    return undefined;
  }

  getSampleCount(renderContext: RenderContext): number {
    if (renderContext.textures !== null) return renderContext.sampleCount;
    return this.backend.parameters.sampleCount as number;
  }
}

const isPointsTopology = (object: any): boolean => object.isPoints;
const isLineSegmentsTopology = (object: any, material: any): boolean =>
  object.isLineSegments || (object.isMesh && material.wireframe === true);
const isLineTopology = (object: any): boolean => object.isLine;
const isMeshTopology = (object: any): boolean => object.isMesh;

export default WebGPUUtils;
