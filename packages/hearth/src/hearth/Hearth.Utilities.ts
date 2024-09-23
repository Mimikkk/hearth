import { GPUPrimitiveTopologyType, GPUTextureFormatType } from './constants.js';
import { RenderContext } from './core/RenderContext.js';
import { Entity } from '../core/Entity.js';
import { Material } from '../entities/materials/Material.js';
import { Hearth } from './Hearth.js';

export class HearthUtilities {
  constructor(public hearth: Hearth) {}

  getCurrentDepthStencilFormat(context: RenderContext) {
    if (context.depthTexture) return this.hearth.memo.get(context.depthTexture).texture.format;
    if (context.useDepth && context.useStencil) return GPUTextureFormatType.Depth24PlusStencil8;
    if (context.useDepth) return GPUTextureFormatType.Depth24Plus;
    return undefined;
  }

  getCurrentColorFormat(context: RenderContext) {
    return context.textures
      ? this.hearth.memo.get(context.textures[0]).texture.format
      : GPUTextureFormatType.BGRA8Unorm;
  }

  getCurrentColorSpace(context: RenderContext) {
    return context.textures ? context.textures[0].colorSpace : this.hearth.parameters.outputColorSpace;
  }

  getPrimitiveTopology(entity: Entity, material: Material) {
    if (isPointsTopology(entity)) return GPUPrimitiveTopologyType.PointList;
    if (isLineSegmentsTopology(entity, material)) return GPUPrimitiveTopologyType.LineList;
    if (isLineTopology(entity)) return GPUPrimitiveTopologyType.LineStrip;
    if (isMeshTopology(entity)) return GPUPrimitiveTopologyType.TriangleList;
    throw new Error('No supported primitive topology');
  }

  getSampleCount(context: RenderContext): number {
    if (context.textures) return context.sampleCount;
    return this.hearth.parameters.sampleCount;
  }
}

const isPointsTopology = (object: any): boolean => object.isPoints;
const isLineSegmentsTopology = (object: any, material: any): boolean =>
  object.isLineSegments || (object.isMesh && material.wireframe);
const isLineTopology = (object: any): boolean => object.isLine;
const isMeshTopology = (object: any): boolean => object.isMesh;
