import { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/threejs/cameras/PerspectiveCamera.js';

export const createWindowResizer = (renderer: Renderer, camera: PerspectiveCamera) => {
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onWindowResize);
  return () => window.removeEventListener('resize', onWindowResize);
};
