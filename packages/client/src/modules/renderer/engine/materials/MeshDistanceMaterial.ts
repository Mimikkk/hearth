import { Material, MaterialParameters } from './Material.js';
import { Texture } from '../textures/Texture.js';
import { Vec3 } from '../math/Vec3.js';

export interface MeshDistanceMaterialParameters extends MaterialParameters {
  map?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  displacementMap?: Texture | null | undefined;
  displacementScale?: number | undefined;
  displacementBias?: number | undefined;
  farDistance?: number | undefined;
  nearDistance?: number | undefined;
  referencePosition?: Vec3 | undefined;
}

export class MeshDistanceMaterial extends Material {
  declare isMeshDistanceMaterial: true;
  declare type: 'MeshDistanceMaterial';

  map: Texture | null;
  alphaMap: Texture | null;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;

  constructor(parameters: MeshDistanceMaterialParameters) {
    super(parameters);

    this.map = null;
    this.alphaMap = null;
    this.displacementMap = null;

    this.displacementScale = 1;
    this.displacementBias = 0;
    this.setValues(parameters);
  }

  setValues(values: MeshDistanceMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.map = source.map;

    this.alphaMap = source.alphaMap;

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    return this;
  }
}

MeshDistanceMaterial.prototype.isMeshDistanceMaterial = true;
MeshDistanceMaterial.prototype.type = 'MeshDistanceMaterial';
