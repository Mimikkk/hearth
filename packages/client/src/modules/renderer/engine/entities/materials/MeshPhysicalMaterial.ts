import { Vec2 } from '../../math/Vec2.js';
import { MeshStandardMaterial, MeshStandardMaterialParameters } from './MeshStandardMaterial.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import * as MathUtils from '../../math/MathUtils.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface MeshPhysicalMaterialParameters extends MeshStandardMaterialParameters {
  clearcoat?: number;
  clearcoatMap?: Texture | null;
  clearcoatRoughness?: number;
  clearcoatRoughnessMap?: Texture | null;
  clearcoatNormalScale?: Vec2;
  clearcoatNormalMap?: Texture | null;

  reflectivity?: number;
  ior?: number;

  sheen?: number;
  sheenColor?: ColorRepresentation;
  sheenColorMap?: Texture | null;
  sheenRoughness?: number;
  sheenRoughnessMap?: Texture | null;

  transmission?: number;
  transmissionMap?: Texture | null;

  thickness?: number;
  thicknessMap?: Texture | null;

  attenuationDistance?: number;
  attenuationColor?: ColorRepresentation;

  specularIntensity?: number;
  specularColor?: ColorRepresentation;
  specularIntensityMap?: Texture | null;
  specularColorMap?: Texture | null;

  iridescenceMap?: Texture | null;
  iridescenceIOR?: number;
  iridescence?: number;
  iridescenceThicknessRange?: [number, number];
  iridescenceThicknessMap?: Texture | null;

  anisotropy?: number;
  anisotropyRotation?: number;
  anisotropyMap?: Texture | null;
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  defines: Record<string, any>;
  declare isMeshPhysicalMaterial: true;

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

  constructor(parameters?: MeshPhysicalMaterialParameters) {
    super(parameters);

    this.isMeshPhysicalMaterial = true;

    this.defines = {
      STANDARD: '',
      PHYSICAL: '',
    };

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

    this.sheenColor = Color.new(0x000000);
    this.sheenColorMap = null;
    this.sheenRoughness = 1.0;
    this.sheenRoughnessMap = null;

    this.transmissionMap = null;

    this.thickness = 0;
    this.thicknessMap = null;
    this.attenuationDistance = Infinity;
    this.attenuationColor = Color.new(1, 1, 1);

    this.specularIntensity = 1.0;
    this.specularIntensityMap = null;
    this.specularColor = Color.new(1, 1, 1);
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

  setValues(values?: MeshPhysicalMaterialParameters): void {
    super.setValues(values);
  }
}
