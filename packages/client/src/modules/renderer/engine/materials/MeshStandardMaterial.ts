import { NormalMapType } from '../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vector2 } from '../math/Vector2.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Euler } from '../math/Euler.js';
import { Texture } from '@modules/renderer/engine/textures/Texture.js';

export interface MeshStandardMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  roughness?: number | undefined;
  metalness?: number | undefined;
  map?: Texture | null | undefined;
  lightMap?: Texture | null | undefined;
  lightMapIntensity?: number | undefined;
  aoMap?: Texture | null | undefined;
  aoMapIntensity?: number | undefined;
  emissive?: ColorRepresentation | undefined;
  emissiveIntensity?: number | undefined;
  emissiveMap?: Texture | null | undefined;
  bumpMap?: Texture | null | undefined;
  bumpScale?: number | undefined;
  normalMap?: Texture | null | undefined;
  normalMapType?: NormalMapType | undefined;
  normalScale?: Vector2 | undefined;
  displacementMap?: Texture | null | undefined;
  displacementScale?: number | undefined;
  displacementBias?: number | undefined;
  roughnessMap?: Texture | null | undefined;
  metalnessMap?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  envMap?: Texture | null | undefined;
  envMapIntensity?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;
  fog?: boolean | undefined;
  flatShading?: boolean | undefined;
}

export class MeshStandardMaterial extends Material {
  declare isMeshStandardMaterial: true;
  declare type: string | 'MeshStandardMaterial';

  color: Color;
  roughness: number;
  metalness: number;
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
  normalScale: Vector2;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  roughnessMap: Texture | null;
  metalnessMap: Texture | null;
  alphaMap: Texture | null;
  envMap: Texture | null;
  envMapRotation: Euler;
  envMapIntensity: number;
  wireframe: boolean;
  wireframeLinewidth: number;
  wireframeLinecap: string;
  wireframeLinejoin: string;
  flatShading: boolean;
  fog: boolean;
  defines: Record<string, any>;

  constructor(parameters: MeshStandardMaterialParameters) {
    super(parameters);

    this.isMeshStandardMaterial = true;

    this.defines = { STANDARD: '' };

    this.type = 'MeshStandardMaterial';

    this.color = new Color(0xffffff); // diffuse
    this.roughness = 1.0;
    this.metalness = 0.0;

    this.map = null;

    this.lightMap = null;
    this.lightMapIntensity = 1.0;

    this.aoMap = null;
    this.aoMapIntensity = 1.0;

    this.emissive = new Color(0x000000);
    this.emissiveIntensity = 1.0;
    this.emissiveMap = null;

    this.bumpMap = null;
    this.bumpScale = 1;

    this.normalMap = null;
    this.normalMapType = NormalMapType.TangentSpace;
    this.normalScale = new Vector2(1, 1);

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.roughnessMap = null;

    this.metalnessMap = null;

    this.alphaMap = null;

    this.envMap = null;
    this.envMapRotation = new Euler();
    this.envMapIntensity = 1.0;

    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.wireframeLinecap = 'round';
    this.wireframeLinejoin = 'round';

    this.flatShading = false;

    this.fog = true;

    this.setValues(parameters);
  }

  setValues(values: MeshStandardMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.defines = { STANDARD: '' };

    this.color.copy(source.color);
    this.roughness = source.roughness;
    this.metalness = source.metalness;

    this.map = source.map;

    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;

    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;

    this.emissive.copy(source.emissive);
    this.emissiveMap = source.emissiveMap;
    this.emissiveIntensity = source.emissiveIntensity;

    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;

    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.copy(source.normalScale);

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    this.roughnessMap = source.roughnessMap;

    this.metalnessMap = source.metalnessMap;

    this.alphaMap = source.alphaMap;

    this.envMap = source.envMap;
    this.envMapRotation.copy(source.envMapRotation);
    this.envMapIntensity = source.envMapIntensity;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;

    this.flatShading = source.flatShading;

    this.fog = source.fog;

    return this;
  }
}
MeshStandardMaterial.prototype.isMeshStandardMaterial = true;
MeshStandardMaterial.prototype.type = 'MeshStandardMaterial';
