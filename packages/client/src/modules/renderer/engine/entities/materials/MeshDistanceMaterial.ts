import { Material, MaterialParameters } from './Material.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { Vec3 } from '../../math/Vec3.js';

export interface MeshDistanceMaterialParameters extends MaterialParameters {
  map?: Texture | null;
  alphaMap?: Texture | null;
  displacementMap?: Texture | null;
  displacementScale?: number;
  displacementBias?: number;
  farDistance?: number;
  nearDistance?: number;
  referencePosition?: Vec3;
}

export class MeshDistanceMaterial extends Material {
  declare isMeshDistanceMaterial: true;

  map: Texture | null;
  alphaMap: Texture | null;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;

  constructor(parameters?: MeshDistanceMaterialParameters) {
    super(parameters);

    this.map = null;
    this.alphaMap = null;
    this.displacementMap = null;

    this.displacementScale = 1;
    this.displacementBias = 0;
    this.setValues(parameters);
  }

  setValues(values?: MeshDistanceMaterialParameters): void {
    super.setValues(values);
  }
}

MeshDistanceMaterial.prototype.isMeshDistanceMaterial = true;
