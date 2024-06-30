import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';

type ResizeFn = (renderer: Renderer, camera: PerspectiveCamera) => void;
const updateSize: ResizeFn = (renderer, camera) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (renderer: Renderer, camera: PerspectiveCamera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(renderer, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;
