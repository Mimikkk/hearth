import { NormalMapType } from '../../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vec2 } from '../../math/Vec2.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface MeshMatcapMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  matcap?: Texture | null;
  map?: Texture | null;
  bumpMap?: Texture | null;
  bumpScale?: number;
  normalMap?: Texture | null;
  normalMapType?: NormalMapType;
  normalScale?: Vec2;
  displacementMap?: Texture | null;
  displacementScale?: number;
  displacementBias?: number;
  alphaMap?: Texture | null;
  fog?: boolean;
  flatShading?: boolean;
}

export class MeshMatcapMaterial extends Material {
  declare isMeshMatcapMaterial: true;
  defines: Record<string, any>;
  color: Color;
  matcap: Texture | null;
  map: Texture | null;
  bumpMap: Texture | null;
  bumpScale: number;
  normalMap: Texture | null;
  normalMapType: NormalMapType;
  normalScale: Vec2;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  alphaMap: Texture | null;
  flatShading: boolean;
  fog: boolean;

  constructor(parameters?: MeshMatcapMaterialParameters) {
    super(parameters);

    this.defines = { MATCAP: '' };

    this.color = Color.new(0xffffff);

    this.matcap = null;

    this.map = null;

    this.bumpMap = null;
    this.bumpScale = 1;

    this.normalMap = null;
    this.normalMapType = NormalMapType.TangentSpace;
    this.normalScale = Vec2.new(1, 1);

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.alphaMap = null;

    this.flatShading = false;

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values?: MeshMatcapMaterialParameters): void {
    super.setValues(values);
  }
}

MeshMatcapMaterial.prototype.isMeshMatcapMaterial = true;
