import { Material, MaterialParameters } from './Material.js';

export interface IUniform<TValue = any> {
  value: TValue;
}

export interface ShaderMaterialParameters extends MaterialParameters {
  uniforms?: { [uniform: string]: IUniform };
  vertexShader?: string;
  fragmentShader?: string;
  linewidth?: number;
  wireframe?: boolean;
  wireframeLinewidth?: number;
  lights?: boolean;
  clipping?: boolean;
  fog?: boolean;
  extensions?: {
    derivatives?: boolean;
    fragDepth?: boolean;
    drawBuffers?: boolean;
    shaderTextureLOD?: boolean;
  };
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

    this.setValues(parameters);
  }

  setValues(parameters?: ShaderMaterialParameters): void {
    super.setValues(parameters);
  }
}
