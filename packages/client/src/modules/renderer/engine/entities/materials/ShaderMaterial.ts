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

  copy(source: this): this {
    super.copy(source);

    this.uniforms = cloneUniforms(source.uniforms);
    this.defines = Object.assign({}, source.defines);
    this.wireframe = source.wireframe;
    this.fog = source.fog;
    this.lights = source.lights;
    this.clipping = source.clipping;

    return this;
  }
}

function cloneUniforms(src: object) {
  const dst = {};

  for (const u in src) {
    dst[u] = {};

    for (const p in src[u]) {
      const property = src[u][p];

      if (
        property &&
        (property.isColor ||
          property.isMat3 ||
          property.isMat4 ||
          property.isVec2 ||
          property.isVec3 ||
          property.isVec4 ||
          property.isTexture ||
          property.isQuaternion)
      ) {
        if (property.isRenderTargetTexture) {
          console.warn(
            'UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().',
          );
          dst[u][p] = null;
        } else {
          dst[u][p] = property.clone();
        }
      } else if (Array.isArray(property)) {
        dst[u][p] = property.slice();
      } else {
        dst[u][p] = property;
      }
    }
  }

  return dst;
}
