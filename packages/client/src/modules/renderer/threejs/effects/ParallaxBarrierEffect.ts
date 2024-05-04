import { OrthographicCamera } from '../cameras/OrthographicCamera.js';
import { Scene } from '../scenes/Scene.js';
import { StereoCamera } from '../cameras/StereoCamera.js';
import { Filter, TextureFormat } from '../constants.js';
import { ShaderMaterial } from '../materials/ShaderMaterial.js';
import { Mesh } from '../objects/Mesh.js';
import { PlaneGeometry } from '../geometries/PlaneGeometry.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';
import { RenderTarget } from '../core/RenderTarget.js';

export class ParallaxBarrierEffect {
  constructor(renderer: Renderer) {
    const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const _scene = new Scene();

    const _stereo = new StereoCamera();

    const _params = { minFilter: Filter.Linear, magFilter: Filter.Nearest, format: TextureFormat.RGBA };

    const _renderTargetL = new RenderTarget(512, 512, _params);
    const _renderTargetR = new RenderTarget(512, 512, _params);

    const _material = new ShaderMaterial({
      uniforms: {
        mapLeft: { value: _renderTargetL.texture },
        mapRight: { value: _renderTargetR.texture },
      },

      vertexShader: [
        'varying vec2 vUv;',

        'void main() {',

        '	vUv = vec2( uv.x, uv.y );',
        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}',
      ].join('\n'),

      fragmentShader: [
        'uniform sampler2D mapLeft;',
        'uniform sampler2D mapRight;',
        'varying vec2 vUv;',

        'void main() {',

        '	vec2 uv = vUv;',

        '	if ( ( mod( gl_FragCoord.y, 2.0 ) ) > 1.00 ) {',

        '		gl_FragColor = texture2D( mapLeft, uv );',

        '	} else {',

        '		gl_FragColor = texture2D( mapRight, uv );',

        '	}',

        '	#include <tonemapping_fragment>',
        '	#include <colorspace_fragment>',

        '}',
      ].join('\n'),
    });

    // @ts-expect-error
    const mesh = new Mesh(new PlaneGeometry(2, 2), _material);
    _scene.add(mesh);

    this.setSize = function (width, height) {
      renderer.setSize(width, height);

      const pixelRatio = renderer.getPixelRatio();

      _renderTargetL.setSize(width * pixelRatio, height * pixelRatio);
      _renderTargetR.setSize(width * pixelRatio, height * pixelRatio);
    };

    this.render = function (scene, camera) {
      if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();

      if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();

      _stereo.update(camera);

      renderer.setRenderTarget(_renderTargetL);
      renderer.clear();
      renderer.render(scene, _stereo.cameraL);

      renderer.setRenderTarget(_renderTargetR);
      renderer.clear();
      renderer.render(scene, _stereo.cameraR);

      renderer.setRenderTarget(null);
      renderer.render(_scene, _camera);
    };
  }

  setSize: (width: number, height: number) => void;
  render: (scene: Scene, camera: PerspectiveCamera) => void;
}
