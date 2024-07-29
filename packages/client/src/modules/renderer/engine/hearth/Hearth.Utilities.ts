import { GPUPrimitiveTopologyType, GPUTextureFormatType } from './constants.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import type { Backend } from '@modules/renderer/engine/hearth/Backend.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export class HearthUtilities {
  constructor(public hearth: Hearth) {}

  getCurrentDepthStencilFormat(renderContext: RenderContext) {
    if (renderContext.depthTexture) return this.getTextureFormatGPU(renderContext.depthTexture);
    if (renderContext.useDepth && renderContext.useStencil) return GPUTextureFormatType.Depth24PlusStencil8;
    if (renderContext.useDepth) return GPUTextureFormatType.Depth24Plus;
    return undefined;
  }

  getTextureFormatGPU(texture: Texture) {
    return this.hearth.memo.get(texture).texture.format;
  }

  getCurrentColorFormat(renderContext: RenderContext) {
    return renderContext.textures
      ? this.getTextureFormatGPU(renderContext.textures[0])
      : GPUTextureFormatType.BGRA8Unorm;
  }

  getCurrentColorSpace(renderContext: RenderContext) {
    return renderContext.textures
      ? renderContext.textures[0].colorSpace
      : this.hearth.backend.hearth.parameters.outputColorSpace;
  }

  getPrimitiveTopology(object: Entity, material: Material) {
    if (isPointsTopology(object)) return GPUPrimitiveTopologyType.PointList;
    if (isLineSegmentsTopology(object, material)) return GPUPrimitiveTopologyType.LineList;
    if (isLineTopology(object)) return GPUPrimitiveTopologyType.LineStrip;
    if (isMeshTopology(object)) return GPUPrimitiveTopologyType.TriangleList;
    return undefined;
  }

  getSampleCount(context: RenderContext): number {
    if (context.textures) return context.sampleCount;
    return this.hearth.backend.hearth.parameters.sampleCount;
  }
}

const isPointsTopology = (object: any): boolean => object.isPoints;
const isLineSegmentsTopology = (object: any, material: any): boolean =>
  object.isLineSegments || (object.isMesh && material.wireframe);
const isLineTopology = (object: any): boolean => object.isLine;
const isMeshTopology = (object: any): boolean => object.isMesh;
