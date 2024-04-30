import { Material, MaterialParameters } from './Material.js';
import { cloneUniforms, cloneUniformsGroups } from '../renderers/shaders/UniformsUtils.js';

import default_vertex from '../renderers/shaders/ShaderChunk/default_vertex.glsl.js';
import default_fragment from '../renderers/shaders/ShaderChunk/default_fragment.glsl.js';
import { IUniform } from '../shaders/BokehShader2.js';
import { UniformsGroup } from '../core/UniformsGroup.js';
import { GLSLVersion } from '../constants.js';

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
  glslVersion?: GLSLVersion | undefined;
}

export class ShaderMaterial extends Material {
  declare isShaderMaterial: true;
  declare type: string | 'ShaderMaterial';
  defines: Record<string, any>;
  uniforms: Record<string, IUniform>;
  uniformsGroups: UniformsGroup<any>[];
  vertexShader: string;
  fragmentShader: string;
  linewidth: number;
  wireframe: boolean;
  wireframeLinewidth: number;
  fog: boolean;
  lights: boolean;
  clipping: boolean;
  forceSinglePass: boolean;
  extensions: {
    clipCullDistance: boolean;
    multiDraw: boolean;
  };
  defaultAttributeValues: {
    color: [number, number, number];
    uv: [number, number];
    uv1: [number, number];
  };
  index0AttributeName: string | undefined;
  uniformsNeedUpdate: boolean;
  glslVersion: GLSLVersion | null;

  constructor(parameters: ShaderMaterialParameters) {
    super(parameters);

    this.defines = {};
    this.uniforms = {};
    this.uniformsGroups = [];

    this.vertexShader = default_vertex;
    this.fragmentShader = default_fragment;

    this.linewidth = 1;

    this.wireframe = false;
    this.wireframeLinewidth = 1;

    // set to use scene fog
    this.fog = false;
    // set to use scene lights
    this.lights = false;
    // set to use user-defined clipping planes
    this.clipping = false;

    this.forceSinglePass = true;

    this.extensions = {
      clipCullDistance: false, // set to use vertex shader clipping
      multiDraw: false, // set to use vertex shader multi_draw / enable gl_DrawID
    };

    // When rendered geometry doesn't include these attributes but the material does,
    // use these default values in WebGL. This avoids errors when buffer data is missing.
    this.defaultAttributeValues = {
      color: [1, 1, 1],
      uv: [0, 0],
      uv1: [0, 0],
    };

    this.index0AttributeName = undefined;
    this.uniformsNeedUpdate = false;

    this.glslVersion = null;

    this.setValues(parameters);
  }

  setValues(parameters: ShaderMaterialParameters): void {
    super.setValues(parameters);
  }

  copy(source: this): this {
    super.copy(source);

    this.fragmentShader = source.fragmentShader;
    this.vertexShader = source.vertexShader;

    this.uniforms = cloneUniforms(source.uniforms) as Record<string, IUniform>;
    this.uniformsGroups = cloneUniformsGroups(source.uniformsGroups);

    this.defines = Object.assign({}, source.defines);

    this.wireframe = source.wireframe;
    this.wireframeLinewidth = source.wireframeLinewidth;

    this.fog = source.fog;
    this.lights = source.lights;
    this.clipping = source.clipping;

    this.extensions = Object.assign({}, source.extensions);

    this.glslVersion = source.glslVersion;

    return this;
  }
}

ShaderMaterial.prototype.isShaderMaterial = true;
ShaderMaterial.prototype.type = 'ShaderMaterial';
