import { NormalMapType } from '../../constants.js';
import { Material, MaterialParameters } from './Material.js';
import { Vec2 } from '../../math/Vec2.js';
import { Texture } from '@modules/renderer/engine/objects/textures/Texture.js';

export interface MeshNormalMaterialParameters extends MaterialParameters {
  bumpMap?: Texture | null | undefined;
  bumpScale?: number | undefined;
  normalMap?: Texture | null | undefined;
  normalMapType?: NormalMapType | undefined;
  normalScale?: Vec2 | undefined;
  displacementMap?: Texture | null | undefined;
  displacementScale?: number | undefined;
  displacementBias?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;

  flatShading?: boolean | undefined;
}

export class MeshNormalMaterial extends Material {
  declare isMeshNormalMaterial: true;
  declare type: 'MeshNormalMaterial';

  bumpMap: Texture | null;
  bumpScale: number;
  normalMap: Texture | null;
  normalMapType: NormalMapType;
  normalScale: Vec2;
  displacementMap: Texture | null;
  displacementScale: number;
  displacementBias: number;
  wireframe: boolean;
  wireframeLinewidth: number;
  flatShading: boolean;

  constructor(parameters: MeshNormalMaterialParameters) {
    super(parameters);

    this.bumpMap = null;
    this.bumpScale = 1;

    this.normalMap = null;
    this.normalMapType = NormalMapType.TangentSpace;
    this.normalScale = Vec2.new(1, 1);

    this.displacementMap = null;
    this.displacementScale = 1;
    this.displacementBias = 0;

    this.wireframe = false;
    this.wireframeLinewidth = 1;

    this.flatShading = false;
    this.setValues(parameters);
  }

  setValues(values: MeshNormalMaterialParameters): void {
    super.setValues(values);
  }

  copy(source: this): this {
    super.copy(source);

    this.bumpMap = source.bumpMap;
    this.bumpScale = source.bumpScale;

    this.normalMap = source.normalMap;
    this.normalMapType = source.normalMapType;
    this.normalScale.from(source.normalScale);

    this.displacementMap = source.displacementMap;
    this.displacementScale = source.displacementScale;
    this.displacementBias = source.displacementBias;

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;

    this.flatShading = source.flatShading;

    return this;
  }
}

MeshNormalMaterial.prototype.isMeshNormalMaterial = true;
MeshNormalMaterial.prototype.type = 'MeshNormalMaterial';
