import { OrbitControls } from './OrbitControls.js';
import { Mouse, Touch } from '../constants.js';
import { OrthographicCamera } from '@modules/renderer/engine/cameras/OrthographicCamera.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';

export class MapControls extends OrbitControls {
  screenSpacePanning: boolean;
  mouseButtons: { LEFT: Mouse; MIDDLE: Mouse; RIGHT: Mouse };
  touches: { ONE: Touch; TWO: Touch };

  constructor(object: OrthographicCamera | PerspectiveCamera, domElement: HTMLElement) {
    super(object, domElement);

    this.screenSpacePanning = false;
    this.mouseButtons = { LEFT: Mouse.Pan, MIDDLE: Mouse.Dolly, RIGHT: Mouse.Rotate };
    this.touches = { ONE: Touch.Pan, TWO: Touch.DollyRotate };
  }
}
