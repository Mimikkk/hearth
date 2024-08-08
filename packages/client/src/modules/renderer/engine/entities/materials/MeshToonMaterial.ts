import { NormalMapType } from '../../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vec2 } from '../../math/Vec2.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface MeshToonMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  opacity?: number;
  gradientMap?: Texture | null;
  map?: Texture | null;
  lightMap?: Texture | null;
  lightMapIntensity?: number;
  aoMap?: Texture | null;
  aoMapIntensity?: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  emissiveMap?: Texture | null;
  bumpMap?: Texture | null;
  bumpScale?: number;
  normalMap?: Texture | null;
  normalMapType?: NormalMapType;
  normalScale?: Vec2;
  displacementMap?: Texture | null;
  displacementScale?: number;
  displacementBias?: number;
  alphaMap?: Texture | null;
  wireframe?: boolean;
  wireframeLinewidth?: number;
  wireframeLinecap?: string;
  wireframeLinejoin?: string;
  fog?: boolean;
}

export class MeshToonMaterial extends Material {
  declare isMeshToonMaterial: true;

  color: Color;
  gradientMap: Texture | null;
  map: Texture | null;
  lightMap: Texture | null;
  lightMapIntensity: number;
  aoMap: Texture | null;
  aoMapIntensity: number;
  emissive: Color;
  emissiveIntensity: number;
  emissiveMap: Texture | null;
  bumpMap: Texture | null;
  bumpScale: number;
  normalMap: Texture | null;
  normalMapType: NormalMapType;
  normalScale: Vec2;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  alphaMap: Texture | null;
  wireframe: boolean;
  wireframeLinewidth: number;
  wireframeLinecap: string;
  wireframeLinejoin: string;
  fog: boolean;
  defines: Record<string, any>;

  constructor(parameters?: MeshToonMaterialParameters) {
    super(parameters);
    this.defines = { TOON: '' };

    this.color = Color.new(0xffffff);

    this.map = null;
    this.gradientMap = null;

    this.lightMap = null;
    this.lightMapIntensity = 1.0;

    this.aoMap = null;
    this.aoMapIntensity = 1.0;

    this.emissive = Color.new(0x000000);
    this.emissiveIntensity = 1.0;
    this.emissiveMap = null;

    this.bumpMap = null;
    this.bumpScale = 1;

    this.normalMap = null;
    this.normalMapType = NormalMapType.TangentSpace;
    this.normalScale = Vec2.new(1, 1);

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.alphaMap = null;

    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.wireframeLinecap = 'round';
    this.wireframeLinejoin = 'round';

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(parameters?: MeshToonMaterialParameters): void {
    super.setValues(parameters);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.from(source.color);

    this.map = source.map;
    this.gradientMap = source.gradientMap;

    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;

    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;

    this.emissive.from(source.emissive);
    this.emissiveMap = source.emissiveMap;
    this.emissiveIntensity = source.emissiveIntensity;

    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;

    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.from(source.normalScale);

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    this.alphaMap = source.alphaMap;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;

    this.fog = source.fog;

    return this;
  }
}

MeshToonMaterial.prototype.isMeshToonMaterial = true;
