import { StereoCamera } from '../cameras/StereoCamera.js';
import { Vector2 } from '../math/Vector2.js';
import { Scene } from '../scenes/Scene.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { Renderer } from '@modules/renderer/engine/renderers/common/Renderer.js';

export class StereoEffect {
  setEyeSeparation: (eyeSep: number) => void;
  setSize: (width: number, height: number) => void;
  render: (scene: Scene, camera: PerspectiveCamera) => void;

  constructor(renderer: Renderer) {
    const _stereo = new StereoCamera();
    _stereo.aspect = 0.5;
    const size = new Vector2();

    this.setEyeSeparation = function (eyeSep) {
      _stereo.eyeSep = eyeSep;
    };

    this.setSize = function (width, height) {
      renderer.setSize(width, height);
    };

    this.render = function (scene, camera) {
      if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();

      if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();

      _stereo.update(camera);

      renderer.getSize(size);

      if (renderer.autoClear) renderer.clear();
      renderer.setScissorTest(true);

      renderer.setScissor(0, 0, size.width / 2, size.height);
      renderer.setViewport(0, 0, size.width / 2, size.height);
      renderer.render(scene, _stereo.cameraL);

      renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
      renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
      renderer.render(scene, _stereo.cameraR);

      renderer.setScissorTest(false);
    };
  }
}
