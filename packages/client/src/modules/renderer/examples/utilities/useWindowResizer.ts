import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import type { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';

type ResizeFn = (hearth: Hearth, camera: ICamera) => void;
const updateSize: ResizeFn = (hearth, camera) => {
  if ('aspect' in camera) camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();
  hearth.setSize(window.innerWidth, window.innerHeight);
};
export const useWindowResizer = (hearth: Hearth, camera: ICamera, onResize: ResizeFn = updateSize) => {
  const handler = () => onResize(hearth, camera);

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
};
useWindowResizer.updateSize = updateSize;

export class WindowResizer {
  static updateSize: ResizeFn = updateSize;
  static useWindowResizer = useWindowResizer;
  #handler: () => void;

  constructor(hearth: Hearth, camera: ICamera, onResize: ResizeFn = updateSize) {
    this.#handler = () => onResize(hearth, camera);
    this.activate();
  }

  activate() {
    window.addEventListener('resize', this.#handler);
  }

  deactivate() {
    window.removeEventListener('resize', this.#handler);
  }

  static attach(hearth: Hearth, camera: ICamera, onResize: ResizeFn = updateSize) {
    return new WindowResizer(hearth, camera, onResize);
  }
}
