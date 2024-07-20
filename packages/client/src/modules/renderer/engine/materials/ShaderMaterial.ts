import { Material, MaterialParameters } from './Material.js';
import { UniformsGroup } from '../core/UniformsGroup.js';

export interface IUniform<TValue = any> {
  value: TValue;
}

export interface ShaderMaterialParameters extends MaterialParameters {
  uniforms?: { [uniform: string]: IUniform } | undefined;
  uniformsGroups?: UniformsGroup<any>[] | undefined;
  vertexShader?: string | undefined;
  fragmentShader?: string | undefined;
  linewidth?: number | undefined;
  wireframe?: boolean | undefined;
  wireframeLinewidth?: number | undefined;
  lights?: boolean | undefined;
  clipping?: boolean | undefined;
  fog?: boolean | undefined;
  extensions?:
    | {
        derivatives?: boolean | undefined;
        fragDepth?: boolean | undefined;
        drawBuffers?: boolean | undefined;
        shaderTextureLOD?: boolean | undefined;
      }
    | undefined;
}

export class ShaderMaterial extends Material {
  defines: Record<string, any>;
  uniforms: Record<string, IUniform>;
  wireframe: boolean;
  fog: boolean;
  lights: boolean;
  clipping: boolean;

  constructor(parameters?: ShaderMaterialParameters) {
    super(parameters);

    this.defines = {};
    this.uniforms = {};
    this.wireframe = false;
    this.fog = false;
    this.lights = false;
    this.clipping = false;
    this.forceSinglePass = true;

    this.setValues(parameters);
  }

  setValues(parameters?: ShaderMaterialParameters): void {
    super.setValues(parameters);
  }

  copy(source: this): this {
    super.copy(source);

    return this;
  }
}
