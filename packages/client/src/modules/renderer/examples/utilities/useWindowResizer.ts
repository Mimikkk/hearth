import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';

type ResizeFn = (renderer: Renderer, camera: Camera) => void;
const updateSize: ResizeFn = (renderer, camera) => {
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  renderer.updateSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (renderer: Renderer, camera: Camera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(renderer, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;
