import { Material, MaterialParameters } from './Material.js';
import { DepthPackingStrategy } from '../constants.js';
import { Texture } from '../textures/Texture.js';

export interface MeshDepthMaterialParameters extends MaterialParameters {
  map?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  depthPacking?: DepthPackingStrategy | undefined;
  displacementMap?: Texture | null | undefined;
  displacementScale?: number | undefined;
  displacementBias?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;
}

export class MeshDepthMaterial extends Material {
  depthPacking: DepthPackingStrategy;
  map: Texture | null;
  alphaMap: Texture | null;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  wireframe: boolean;
  wireframeLinewidth: number;

  constructor(parameters: MeshDepthMaterialParameters) {
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

  setValues(values: MeshDepthMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.depthPacking = source.depthPacking;

    this.map = source.map;

    this.alphaMap = source.alphaMap;

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;

    return this;
  }
}
