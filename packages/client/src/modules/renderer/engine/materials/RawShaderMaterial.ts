import { ShaderMaterial } from './ShaderMaterial.js';

export class RawShaderMaterial extends ShaderMaterial {
  declare isRawShaderMaterial: true;
  declare type: string | 'RawShaderMaterial';
}

RawShaderMaterial.prototype.isRawShaderMaterial = true;
RawShaderMaterial.prototype.type = 'RawShaderMaterial';
