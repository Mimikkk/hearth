import { Material, MaterialParameters } from './Material.js';
import { Operation } from '../../constants.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Euler } from '../../math/Euler.js';
import { Texture } from '../textures/Texture.js';

export interface MeshBasicMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  opacity?: number;
  map?: Texture | null;
  lightMap?: Texture | null;
  lightMapIntensity?: number;
  aoMap?: Texture | null;
  aoMapIntensity?: number;
  specularMap?: Texture | null;
  alphaMap?: Texture | null;
  fog?: boolean;
  envMap?: Texture | null;
  combine?: Operation;
  reflectivity?: number;
  refractionRatio?: number;
  wireframe?: boolean;
  wireframeLinewidth?: number;
  wireframeLinecap?: string;
  wireframeLinejoin?: string;
}

export class MeshBasicMaterial extends Material {
  declare isMeshBasicMaterial: true;

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

  constructor(parameters?: MeshBasicMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff);

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

  setValues(values?: MeshBasicMaterialParameters) {
    super.setValues(values);
  }
}

MeshBasicMaterial.prototype.isMeshBasicMaterial = true;
