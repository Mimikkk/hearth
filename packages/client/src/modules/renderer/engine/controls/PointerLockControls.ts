import { Camera, EventDispatcher, Vector3 } from '../engine.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';

const _euler = Euler.create(0, 0, 0, 'YXZ');
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

export class PointerLockControls {
  eventDispatcher = new EventDispatcher();
  isLocked: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  pointerSpeed: number;
  _onMouseMove: (event: MouseEvent) => void;
  _onPointerlockChange: () => void;
  _onPointerlockError: () => void;

  constructor(
    public camera: Camera,
    public domElement: HTMLElement,
  ) {
    this.isLocked = false;

    // Set to constrain the pitch of the camera
    // Range is 0 to Math.PI radians
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.pointerSpeed = 1.0;

    this._onMouseMove = onMouseMove.bind(this);
    this._onPointerlockChange = onPointerlockChange.bind(this);
    this._onPointerlockError = onPointerlockError.bind(this);

    this.connect();
  }

  connect(): void {
    this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);
    this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerlockChange);
    this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerlockError);
  }

  disconnect(): void {
    this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerlockChange);
    this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerlockError);
  }

  dispose(): void {
    this.disconnect();
  }

  getObject(): Camera {
    // retaining this method for backward compatibility

    return this.camera;
  }

  getDirection(v: Vector3): Vector3 {
    return v.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
  }

  moveForward(distance: number): void {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    const camera = this.camera;

    _vector.setFromMatrixColumn(camera.matrix, 0);

    _vector.crossVectors(camera.up, _vector);

    camera.position.addScaledVector(_vector, distance);
  }

  moveRight(distance: number): void {
    const camera = this.camera;

    _vector.setFromMatrixColumn(camera.matrix, 0);

    camera.position.addScaledVector(_vector, distance);
  }

  lock(): void {
    this.domElement.requestPointerLock();
  }

  unlock(): void {
    this.domElement.ownerDocument.exitPointerLock();
  }
}

// event listeners

function onMouseMove(event: MouseEvent) {
  if (this.isLocked === false) return;

  const movementX = event.movementX;
  const movementY = event.movementY;

  const camera = this.camera;
  Euler.fillQuaternion(_euler, camera.quaternion);

  _euler.y -= movementX * 0.002 * this.pointerSpeed;
  _euler.x -= movementY * 0.002 * this.pointerSpeed;

  _euler.x = Math.max(_PI_2 - this.maxPolarAngle, Math.min(_PI_2 - this.minPolarAngle, _euler.x));

  camera.quaternion.setFromEuler(_euler);

  this.eventDispatcher.dispatch(_changeEvent, this);
}

function onPointerlockChange() {
  if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
    this.eventDispatcher.dispatch(_lockEvent, this);

    this.isLocked = true;
  } else {
    this.eventDispatcher.dispatch(_unlockEvent, this);

    this.isLocked = false;
  }
}

function onPointerlockError() {
  console.error('engine.PointerLockControls: Unable to use Pointer Lock API');
}
