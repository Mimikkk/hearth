import { Material, MaterialParameters } from './Material.js';
import { DepthPackingStrategy } from '../../constants.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface MeshDepthMaterialParameters extends MaterialParameters {
  map?: Texture | null;
  alphaMap?: Texture | null;
  depthPacking?: DepthPackingStrategy;
  displacementMap?: Texture | null;
  displacementScale?: number;
  displacementBias?: number;
  wireframe?: boolean;
  wireframeLinewidth?: number;
}

export class MeshDepthMaterial extends Material {
  declare isMeshDepthMaterial: true;

  depthPacking: DepthPackingStrategy;
  map: Texture | null;
  alphaMap: Texture | null;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  wireframe: boolean;
  wireframeLinewidth: number;

  constructor(parameters?: MeshDepthMaterialParameters) {
    super(parameters);

    this.depthPacking = DepthPackingStrategy.Basic;

    this.map = null;

    this.alphaMap = null;

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.setValues(parameters);
  }

  setValues(values?: MeshDepthMaterialParameters): void {
    super.setValues(values);
  }
}

MeshDepthMaterial.prototype.isMeshDepthMaterial = true;
