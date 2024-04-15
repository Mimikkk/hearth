import {
  ColorManagement,
  RawShaderMaterial,
  ToneMapping,
  TransferFunction,
  UniformsUtils,
} from '../../threejs/Three.js';
import { FullScreenQuad, Pass } from './Pass.js';
import { OutputShader } from '../shaders/OutputShader.js';

class OutputPass extends Pass {
  constructor() {
    super();

    //

    const shader = OutputShader;

    this.uniforms = UniformsUtils.clone(shader.uniforms);

    this.material = new RawShaderMaterial({
      name: shader.name,
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });

    this.fsQuad = new FullScreenQuad(this.material);

    // internal cache

    this._outputColorSpace = null;
    this._toneMapping = null;
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
    this.uniforms['tDiffuse'].value = readBuffer.texture;
    this.uniforms['toneMappingExposure'].value = renderer.toneMappingExposure;

    // rebuild defines if required

    if (this._outputColorSpace !== renderer.outputColorSpace || this._toneMapping !== renderer.toneMapping) {
      this._outputColorSpace = renderer.outputColorSpace;
      this._toneMapping = renderer.toneMapping;

      this.material.defines = {};

      if (ColorManagement.getTransfer(this._outputColorSpace) === TransferFunction.SRGB)
        this.material.defines.SRGB_TRANSFER = '';

      if (this._toneMapping === ToneMapping.Linear) this.material.defines.LINEAR_TONE_MAPPING = '';
      else if (this._toneMapping === ToneMapping.Reinhard) this.material.defines.REINHARD_TONE_MAPPING = '';
      else if (this._toneMapping === ToneMapping.Cineon) this.material.defines.CINEON_TONE_MAPPING = '';
      else if (this._toneMapping === ToneMapping.ACESFilmic) this.material.defines.ACES_FILMIC_TONE_MAPPING = '';
      else if (this._toneMapping === ToneMapping.AgX) this.material.defines.AGX_TONE_MAPPING = '';
      else if (this._toneMapping === ToneMapping.Neutral) this.material.defines.NEUTRAL_TONE_MAPPING = '';

      this.material.needsUpdate = true;
    }

    //

    if (this.renderToScreen === true) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this.fsQuad.render(renderer);
    }
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}

export { OutputPass };
