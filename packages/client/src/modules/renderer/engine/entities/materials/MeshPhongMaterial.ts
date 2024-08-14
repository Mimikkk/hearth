import { NormalMapType, Operation } from '../../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vec2 } from '../../math/Vec2.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Euler } from '../../math/Euler.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';

export interface MeshPhongMaterialParameters extends MaterialParameters {
  color?: ColorRepresentation;
  specular?: ColorRepresentation;
  shininess?: number;
  opacity?: number;
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
  specularMap?: Texture | null;
  alphaMap?: Texture | null;
  envMap?: Texture | null;
  combine?: Operation;
  reflectivity?: number;
  refractionRatio?: number;
  wireframe?: boolean;
  wireframeLinewidth?: number;
  wireframeLinecap?: string;
  wireframeLinejoin?: string;
  fog?: boolean;
  flatShading?: boolean;
}

export class MeshPhongMaterial extends Material {
  declare isMeshPhongMaterial: true;

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
  normalScale: Vec2;
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

  constructor(parameters?: MeshPhongMaterialParameters) {
    super(parameters);

    this.color = Color.new(0xffffff);
    this.specular = Color.new(0x111111);
    this.shininess = 30;

    this.map = null;

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

  setValues(values?: MeshPhongMaterialParameters) {
    super.setValues(values);
  }
}

MeshPhongMaterial.prototype.isMeshPhongMaterial = true;
