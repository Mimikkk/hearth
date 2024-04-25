import { PerspectiveCamera } from './PerspectiveCamera.js';

export class ArrayCamera extends PerspectiveCamera {
  declare isArrayCamera: true;
  constructor(public cameras: PerspectiveCamera[]) {
    super();
  }
}
ArrayCamera.prototype.isArrayCamera = true;
