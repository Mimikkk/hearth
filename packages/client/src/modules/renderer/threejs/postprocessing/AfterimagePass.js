import {
  Filter,
  MeshBasicMaterial,
  RenderTarget,
  ShaderMaterial,
  TextureDataType,
  UniformsUtils,
} from '../../threejs/Three.js';
import { FullScreenQuad, Pass } from './Pass.js';
import { AfterimageShader } from '../shaders/AfterimageShader.js';

class AfterimagePass extends Pass {
  constructor(damp = 0.96) {
    super();

    this.shader = AfterimageShader;

    this.uniforms = UniformsUtils.clone(this.shader.uniforms);

    this.uniforms['damp'].value = damp;

    this.textureComp = new RenderTarget(window.innerWidth, window.innerHeight, {
      magFilter: Filter.Nearest,
      type: TextureDataType.HalfFloat,
    });

    this.textureOld = new RenderTarget(window.innerWidth, window.innerHeight, {
      magFilter: Filter.Nearest,
      type: TextureDataType.HalfFloat,
    });

    this.compFsMaterial = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.fragmentShader,
    });

    this.compFsQuad = new FullScreenQuad(this.compFsMaterial);

    this.copyFsMaterial = new MeshBasicMaterial();
    this.copyFsQuad = new FullScreenQuad(this.copyFsMaterial);
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive*/) {
    this.uniforms['tOld'].value = this.textureOld.texture;
    this.uniforms['tNew'].value = readBuffer.texture;

    renderer.setRenderTarget(this.textureComp);
    this.compFsQuad.render(renderer);

    this.copyFsQuad.material.map = this.textureComp.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.copyFsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);

      if (this.clear) renderer.clear();

      this.copyFsQuad.render(renderer);
    }

    // Swap buffers.
    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
    // Now textureOld contains the latest image, ready for the next frame.
  }

  setSize(width, height) {
    this.textureComp.setSize(width, height);
    this.textureOld.setSize(width, height);
  }

  dispose() {
    this.textureComp.dispose();
    this.textureOld.dispose();

    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();

    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();
  }
}

export { AfterimagePass };
