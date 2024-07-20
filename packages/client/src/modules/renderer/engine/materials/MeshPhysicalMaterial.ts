import { Vec2 } from '../math/Vector2.js';
import { MeshStandardMaterial, MeshStandardMaterialParameters } from './MeshStandardMaterial.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import * as MathUtils from '../math/MathUtils.js';
import { Texture } from '../textures/Texture.js';

export interface MeshPhysicalMaterialParameters extends MeshStandardMaterialParameters {
  clearcoat?: number | undefined;
  clearcoatMap?: Texture | null | undefined;
  clearcoatRoughness?: number | undefined;
  clearcoatRoughnessMap?: Texture | null | undefined;
  clearcoatNormalScale?: Vec2 | undefined;
  clearcoatNormalMap?: Texture | null | undefined;

  reflectivity?: number | undefined;
  ior?: number | undefined;

  sheen?: number | undefined;
  sheenColor?: ColorRepresentation | undefined;
  sheenColorMap?: Texture | null | undefined;
  sheenRoughness?: number | undefined;
  sheenRoughnessMap?: Texture | null | undefined;

  transmission?: number | undefined;
  transmissionMap?: Texture | null | undefined;

  thickness?: number | undefined;
  thicknessMap?: Texture | null | undefined;

  attenuationDistance?: number | undefined;
  attenuationColor?: ColorRepresentation | undefined;

  specularIntensity?: number | undefined;
  specularColor?: ColorRepresentation | undefined;
  specularIntensityMap?: Texture | null | undefined;
  specularColorMap?: Texture | null | undefined;

  iridescenceMap?: Texture | null | undefined;
  iridescenceIOR?: number | undefined;
  iridescence?: number | undefined;
  iridescenceThicknessRange?: [number, number] | undefined;
  iridescenceThicknessMap?: Texture | null | undefined;

  anisotropy?: number | undefined;
  anisotropyRotation?: number | undefined;
  anisotropyMap?: Texture | null | undefined;
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  defines: Record<string, any>;
  declare isMeshPhysicalMaterial: true;
  declare type: 'MeshPhysicalMaterial';

  anisotropyRotation: number;
  anisotropyMap: Texture | null;
  clearcoatMap: Texture | null;
  clearcoatRoughness: number;
  clearcoatRoughnessMap: Texture | null;
  clearcoatNormalScale: Vec2;
  clearcoatNormalMap: Texture | null;
  ior: number;
  iridescenceMap: Texture | null;
  iridescenceIOR: number;
  iridescenceThicknessRange: [number, number];
  iridescenceThicknessMap: Texture | null;
  sheenColor: Color;
  sheenColorMap: Texture | null;
  sheenRoughness: number;
  sheenRoughnessMap: Texture | null;
  transmissionMap: Texture | null;
  thickness: number;
  thicknessMap: Texture | null;
  attenuationDistance: number;
  attenuationColor: Color;
  specularIntensity: number;
  specularIntensityMap: Texture | null;
  specularColor: Color;
  specularColorMap: Texture | null;
  _anisotropy: number;
  _clearcoat: number;
  _iridescence: number;
  _sheen: number;
  _transmission: number;

  set reflectivity(arg: number) {
    this.ior = (1 + 0.4 * arg) / (1 - 0.4 * arg);
  }

  get reflectivity(): number {
    return MathUtils.clamp((2.5 * (this.ior - 1)) / (this.ior + 1), 0, 1);
  }

  constructor(parameters: MeshPhysicalMaterialParameters) {
    super(parameters);

    this.isMeshPhysicalMaterial = true;

    this.defines = {
      STANDARD: '',
      PHYSICAL: '',
    };

    this.type = 'MeshPhysicalMaterial';

    this.anisotropyRotation = 0;
    this.anisotropyMap = null;

    this.clearcoatMap = null;
    this.clearcoatRoughness = 0.0;
    this.clearcoatRoughnessMap = null;
    this.clearcoatNormalScale = Vec2.new(1, 1);
    this.clearcoatNormalMap = null;

    this.ior = 1.5;

    this.iridescenceMap = null;
    this.iridescenceIOR = 1.3;
    this.iridescenceThicknessRange = [100, 400];
    this.iridescenceThicknessMap = null;

    this.sheenColor = new Color(0x000000);
    this.sheenColorMap = null;
    this.sheenRoughness = 1.0;
    this.sheenRoughnessMap = null;

    this.transmissionMap = null;

    this.thickness = 0;
    this.thicknessMap = null;
    this.attenuationDistance = Infinity;
    this.attenuationColor = new Color(1, 1, 1);

    this.specularIntensity = 1.0;
    this.specularIntensityMap = null;
    this.specularColor = new Color(1, 1, 1);
    this.specularColorMap = null;

    this._anisotropy = 0;
    this._clearcoat = 0;
    this._iridescence = 0;
    this._sheen = 0.0;
    this._transmission = 0;
    this.setValues(parameters);
  }

  get anisotropy() {
    return this._anisotropy;
  }

  set anisotropy(value) {
    if (this._anisotropy > 0 !== value > 0) {
      this.version++;
    }

    this._anisotropy = value;
  }

  get clearcoat() {
    return this._clearcoat;
  }

  set clearcoat(value) {
    if (this._clearcoat > 0 !== value > 0) {
      this.version++;
    }

    this._clearcoat = value;
  }

  get iridescence() {
    return this._iridescence;
  }

  set iridescence(value) {
    if (this._iridescence > 0 !== value > 0) {
      this.version++;
    }

    this._iridescence = value;
  }

  get sheen() {
    return this._sheen;
  }

  set sheen(value) {
    if (this._sheen > 0 !== value > 0) {
      this.version++;
    }

    this._sheen = value;
  }

  get transmission() {
    return this._transmission;
  }

  set transmission(value) {
    if (this._transmission > 0 !== value > 0) {
      this.version++;
    }

    this._transmission = value;
  }

  setValues(values: MeshPhysicalMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.defines = {
      STANDARD: '',
      PHYSICAL: '',
    };

    this.anisotropy = source.anisotropy;
    this.anisotropyRotation = source.anisotropyRotation;
    this.anisotropyMap = source.anisotropyMap;

    this.clearcoat = source.clearcoat;
    this.clearcoatMap = source.clearcoatMap;
    this.clearcoatRoughness = source.clearcoatRoughness;
    this.clearcoatRoughnessMap = source.clearcoatRoughnessMap;
    this.clearcoatNormalMap = source.clearcoatNormalMap;
    this.clearcoatNormalScale.from(source.clearcoatNormalScale);

    this.ior = source.ior;

    this.iridescence = source.iridescence;
    this.iridescenceMap = source.iridescenceMap;
    this.iridescenceIOR = source.iridescenceIOR;
    this.iridescenceThicknessRange = [...source.iridescenceThicknessRange];
    this.iridescenceThicknessMap = source.iridescenceThicknessMap;

    this.sheen = source.sheen;
    this.sheenColor.copy(source.sheenColor);
    this.sheenColorMap = source.sheenColorMap;
    this.sheenRoughness = source.sheenRoughness;
    this.sheenRoughnessMap = source.sheenRoughnessMap;

    this.transmission = source.transmission;
    this.transmissionMap = source.transmissionMap;

    this.thickness = source.thickness;
    this.thicknessMap = source.thicknessMap;
    this.attenuationDistance = source.attenuationDistance;
    this.attenuationColor.copy(source.attenuationColor);

    this.specularIntensity = source.specularIntensity;
    this.specularIntensityMap = source.specularIntensityMap;
    this.specularColor.copy(source.specularColor);
    this.specularColorMap = source.specularColorMap;

    return this;
  }
}
