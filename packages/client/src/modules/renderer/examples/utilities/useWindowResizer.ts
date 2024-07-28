import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';

type ResizeFn = (hearth: Hearth, camera: PerspectiveCamera) => void;
const updateSize: ResizeFn = (hearth, camera) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  hearth.setSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (hearth: Hearth, camera: PerspectiveCamera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(hearth, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;
