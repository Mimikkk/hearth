import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';

type ResizeFn = (renderer: Hearth, camera: PerspectiveCamera) => void;
const updateSize: ResizeFn = (renderer, camera) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (renderer: Hearth, camera: PerspectiveCamera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(renderer, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;
