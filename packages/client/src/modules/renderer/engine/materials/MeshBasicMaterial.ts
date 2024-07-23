import { Material, MaterialParameters } from './Material.js';
import { Operation } from '../constants.js';
import { Color, ColorRepresentation } from '../math/Color.js';
import { Euler } from '../math/Euler.js';
import { Texture } from '../textures/Texture.js';

export interface MeshBasicMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation | undefined;
  opacity?: number | undefined;
  map?: Texture | null | undefined;
  lightMap?: Texture | null;
  lightMapIntensity?: number | undefined;
  aoMap?: Texture | null | undefined;
  aoMapIntensity?: number | undefined;
  specularMap?: Texture | null | undefined;
  alphaMap?: Texture | null | undefined;
  fog?: boolean | undefined;
  envMap?: Texture | null | undefined;
  combine?: Operation | undefined;
  reflectivity?: number | undefined;
  refractionRatio?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;
  wireframeLinecap?: string | undefined;
  wireframeLinejoin?: string | undefined;
}

export class MeshBasicMaterial extends Material {
  declare isMeshBasicMaterial: true;
  declare type: 'MeshBasicMaterial';

  color: Color;
  map: Texture | null;
  lightMap: Texture | null;
  lightMapIntensity: number;
  aoMap: Texture | null;
  aoMapIntensity: number;
  specularMap: Texture | null;
  alphaMap: Texture | null;
  envMap: Texture | null;
  envMapRotation: Euler;
  combine: Operation;
  reflectivity: number;
  refractionRatio: number;
  wireframe: boolean;
  wireframeLinewidth: number;
  wireframeLinecap: 'round' | 'butt' | 'square';
  wireframeLinejoin: 'round' | 'bevel' | 'miter';
  fog: boolean;

  constructor(parameters: MeshBasicMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff); // emissive

    this.map = null;

    this.lightMap = null;
    this.lightMapIntensity = 1.0;

    this.aoMap = null;
    this.aoMapIntensity = 1.0;

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

    this.fog = true;
    this.setValues(parameters);
  }

  setValues(values: MeshBasicMaterialParameters) {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.color.from(source.color);

    this.map = source.map;

    this.lightMap = source.lightMap;
    this.lightMapIntensity = source.lightMapIntensity;

    this.aoMap = source.aoMap;
    this.aoMapIntensity = source.aoMapIntensity;

    this.specularMap = source.specularMap;

    this.alphaMap = source.alphaMap;

    this.envMap = source.envMap;
    this.envMapRotation.from(source.envMapRotation);
    this.combine = source.combine;
    this.reflectivity = source.reflectivity;
    this.refractionRatio = source.refractionRatio;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;

    this.fog = source.fog;

    return this;
  }
}

MeshBasicMaterial.prototype.isMeshBasicMaterial = true;
MeshBasicMaterial.prototype.type = 'MeshBasicMaterial';
