import { OrbitControls } from './OrbitControls.js';
import { Camera } from '../cameras/Camera.js';
import { Mouse, Touch } from '../constants.js';

export class MapControls extends OrbitControls {
  screenSpacePanning: boolean;
  mouseButtons: { LEFT: Mouse; MIDDLE: Mouse; RIGHT: Mouse };
  touches: { ONE: Touch; TWO: Touch };

  constructor(object: Camera, domElement: HTMLElement) {
    super(object, domElement);

    // pan orthogonal to world-space direction camera.up
    this.screenSpacePanning = false;
    this.mouseButtons = { LEFT: Mouse.Pan, MIDDLE: Mouse.Dolly, RIGHT: Mouse.Rotate };
    this.touches = { ONE: Touch.Pan, TWO: Touch.DollyRotate };
  }
}
