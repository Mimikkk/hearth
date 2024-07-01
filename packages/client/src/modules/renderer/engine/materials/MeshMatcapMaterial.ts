import { NormalMapType } from '../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vector2 } from '../math/Vector2.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Texture } from '../textures/Texture.js';

export interface MeshMatcapMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  matcap?: Texture | null | undefined;
  map?: Texture | null | undefined;
  bumpMap?: Texture | null | undefined;
  bumpScale?: number | undefined;
  normalMap?: Texture | null | undefined;
  normalMapType?: NormalMapType | undefined;
  normalScale?: Vector2 | undefined;
  displacementMap?: Texture | null | undefined;
  displacementScale?: number | undefined;
  displacementBias?: number | undefined;
  alphaMap?: Texture | null | undefined;
  fog?: boolean | undefined;
  flatShading?: boolean | undefined;
}

export class MeshMatcapMaterial extends Material {
  declare isMeshMatcapMaterial: true;
  declare type: 'MeshMatcapMaterial';
  defines: Record<string, any>;
  color: Color;
  matcap: Texture | null;
  map: Texture | null;
  bumpMap: Texture | null;
  bumpScale: number;
  normalMap: Texture | null;
  normalMapType: NormalMapType;
  normalScale: Vector2;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  alphaMap: Texture | null;
  flatShading: boolean;
  fog: boolean;

  constructor(parameters: MeshMatcapMaterialParameters) {
    super(parameters);

    this.defines = { MATCAP: '' };

    this.type = 'MeshMatcapMaterial';

    this.color = new Color(0xffffff); // diffuse

    this.matcap = null;

    this.map = null;

    this.bumpMap = null;
    this.bumpScale = 1;

    this.normalMap = null;
    this.normalMapType = NormalMapType.TangentSpace;
    this.normalScale = new Vector2(1, 1);

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.alphaMap = null;

    this.flatShading = false;

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values: MeshMatcapMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.defines = { MATCAP: '' };

    this.color.copy(source.color);

    this.matcap = source.matcap;

    this.map = source.map;

    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;

    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.copy(source.normalScale);

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    this.alphaMap = source.alphaMap;

    this.flatShading = source.flatShading;

    this.fog = source.fog;

    return this;
  }
}

MeshMatcapMaterial.prototype.isMeshMatcapMaterial = true;
MeshMatcapMaterial.prototype.type = 'MeshMatcapMaterial';
