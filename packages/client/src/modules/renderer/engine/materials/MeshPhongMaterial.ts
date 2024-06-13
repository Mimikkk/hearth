import { NormalMapType, Operation } from '../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vector2 } from '../math/Vector2.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Euler } from '../math/Euler.js';
import { Texture } from '../textures/Texture.js';

export interface MeshPhongMaterialParameters extends MaterialParameters {
  /** geometry color in hexadecimal. Default is 0xffffff. */
  color?: ColorRepresentation | undefined;
  specular?: ColorRepresentation | undefined;
  shininess?: number | undefined;
  opacity?: number | undefined;
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
  specularMap?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  envMap?: Texture | null | undefined;
  combine?: Operation | undefined;
  reflectivity?: number | undefined;
  refractionRatio?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;
  wireframeLinecap?: string | undefined;
  wireframeLinejoin?: string | undefined;
  fog?: boolean | undefined;
  flatShading?: boolean | undefined;
}

export class MeshPhongMaterial extends Material {
  declare isMeshPhongMaterial: true;
  declare type: 'MeshPhongMaterial';

  color: Color;
  specular: Color;
  shininess: number;
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
  specularMap: Texture | null;
  alphaMap: Texture | null;
  envMap: Texture | null;
  envMapRotation: Euler;
  combine: Operation;
  reflectivity: number;
  refractionRatio: number;
  wireframe: boolean;
  wireframeLinewidth: number;
  wireframeLinecap: string;
  wireframeLinejoin: string;
  flatShading: boolean;
  fog: boolean;

  constructor(parameters: MeshPhongMaterialParameters) {
    super(parameters);

    this.color = new Color(0xffffff); // diffuse
    this.specular = new Color(0x111111);
    this.shininess = 30;

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

    this.specularMap = null;

    this.alphaMap = null;

    this.envMap = null;
    this.envMapRotation = new Euler();
    this.combine = Operation.Multiply;
    this.reflectivity = 1;
    this.refractionRatio = 0.98;

    this.wireframe = false;
    this.wireframeLinewidth = 1;
    this.wireframeLinecap = 'round';
    this.wireframeLinejoin = 'round';

    this.flatShading = false;

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values: MeshPhongMaterialParameters) {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.copy(source.color);
    this.specular.copy(source.specular);
    this.shininess = source.shininess;

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

    this.specularMap = source.specularMap;

    this.alphaMap = source.alphaMap;

    this.envMap = source.envMap;
    this.envMapRotation.copy(source.envMapRotation);
    this.combine = source.combine;
    this.reflectivity = source.reflectivity;
    this.refractionRatio = source.refractionRatio;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;

    this.flatShading = source.flatShading;

    this.fog = source.fog;

    return this;
  }
}

MeshPhongMaterial.prototype.isMeshPhongMaterial = true;
MeshPhongMaterial.prototype.type = 'MeshPhongMaterial';
