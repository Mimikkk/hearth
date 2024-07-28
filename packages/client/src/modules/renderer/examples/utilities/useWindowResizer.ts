import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';

type ResizeFn = (renderer: Forge, camera: PerspectiveCamera) => void;
const updateSize: ResizeFn = (renderer, camera) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (renderer: Forge, camera: PerspectiveCamera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(renderer, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;
