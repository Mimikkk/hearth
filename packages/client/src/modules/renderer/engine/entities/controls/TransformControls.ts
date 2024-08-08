import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { OrthographicCamera } from '@modules/renderer/engine/entities/cameras/OrthographicCamera.js';
import { Euler } from '@modules/renderer/engine/math/Euler.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/entities/materials/MeshBasicMaterial.js';
import { LineBasicMaterial } from '@modules/renderer/engine/entities/materials/LineBasicMaterial.js';
import { CylinderGeometry } from '@modules/renderer/engine/entities/geometries/CylinderGeometry.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { TorusGeometry } from '@modules/renderer/engine/entities/geometries/TorusGeometry.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { OctahedronGeometry } from '@modules/renderer/engine/entities/geometries/OctahedronGeometry.js';
import { Line } from '@modules/renderer/engine/entities/Line.js';
import { SphereGeometry } from '@modules/renderer/engine/entities/geometries/SphereGeometry.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { PlaneGeometry } from '@modules/renderer/engine/entities/geometries/PlaneGeometry.js';
import { Side } from '@modules/renderer/engine/constants.js';

const _raycaster = Raycaster.new();

const _tempVector = Vec3.new();
const _tempVec2 = Vec3.new();
const _tempQuaternion = Quaternion.new();
const _unit = {
  X: Vec3.new(1, 0, 0),
  Y: Vec3.new(0, 1, 0),
  Z: Vec3.new(0, 0, 1),
};

const _changeEvent = { type: 'change' } as const;
const _mouseDownEvent = { type: 'mouseDown' as const, mode: null } as unknown as {
  type: 'mouseDown';
  mode: 'translate' | 'rotate' | 'scale';
};
const _mouseUpEvent = { type: 'mouseUp' as const, mode: null } as unknown as {
  type: 'mouseUp';
  mode: 'translate' | 'rotate' | 'scale';
};
const _objectChangeEvent = { type: 'objectChange' } as const;

export class TransformControls extends Entity {
  declare isTransformControls: true;
  _gizmo: TransformControlsGizmo;
  _plane: TransformControlsPlane;
  camera: PerspectiveCamera | OrthographicCamera;
  object: Entity | undefined;
  enabled: boolean;
  axis: 'X' | 'Y' | 'Z' | 'E' | 'XYZ' | 'XY' | 'YZ' | 'XZ' | 'XYZE' | null;
  mode: 'translate' | 'rotate' | 'scale';
  translationSnap: number | null;
  rotationSnap: number | null;
  scaleSnap: number | null;
  space: 'world' | 'local';
  size: number;
  dragging: boolean;
  showX: boolean;
  showY: boolean;
  showZ: boolean;

  constructor(
    object: PerspectiveCamera | OrthographicCamera,
    public domElement: HTMLElement,
  ) {
    super();

    this.isTransformControls = true;

    this.visible = false;
    this.domElement = domElement;
    this.domElement.style.touchAction = 'none';

    const _gizmo = new TransformControlsGizmo();
    this._gizmo = _gizmo;
    this.add(_gizmo);

    const _plane = new TransformControlsPlane();
    this._plane = _plane;
    this.add(_plane);

    const scope = this;

    function defineProperty(propName: string, defaultValue: any) {
      let propValue = defaultValue;

      Object.defineProperty(scope, propName, {
        get: function () {
          return propValue !== undefined ? propValue : defaultValue;
        },

        set: function (value) {
          if (propValue !== value) {
            propValue = value;
            _plane[propName] = value;
            _gizmo[propName] = value;

            scope.eventDispatcher.dispatch({ type: propName + '-changed', value: value }, this);
            scope.eventDispatcher.dispatch(_changeEvent, this);
          }
        },
      });

      //@ts-expect-error
      scope[propName] = defaultValue;
      //@ts-expect-error
      _plane[propName] = defaultValue;
      //@ts-expect-error
      _gizmo[propName] = defaultValue;
    }

    defineProperty('camera', object);
    defineProperty('object', undefined);
    defineProperty('enabled', true);
    defineProperty('axis', null);
    defineProperty('mode', 'translate');
    defineProperty('translationSnap', null);
    defineProperty('rotationSnap', null);
    defineProperty('scaleSnap', null);
    defineProperty('space', 'world');
    defineProperty('size', 1);
    defineProperty('dragging', false);
    defineProperty('showX', true);
    defineProperty('showY', true);
    defineProperty('showZ', true);

    const worldPosition = Vec3.new();
    const worldPositionStart = Vec3.new();
    const worldQuaternion = Quaternion.new();
    const worldQuaternionStart = Quaternion.new();
    const cameraPosition = Vec3.new();
    const cameraQuaternion = Quaternion.new();
    const pointStart = Vec3.new();
    const pointEnd = Vec3.new();
    const rotationAxis = Vec3.new();
    const rotationAngle = 0;
    const eye = Vec3.new();

    defineProperty('worldPosition', worldPosition);
    defineProperty('worldPositionStart', worldPositionStart);
    defineProperty('worldQuaternion', worldQuaternion);
    defineProperty('worldQuaternionStart', worldQuaternionStart);
    defineProperty('cameraPosition', cameraPosition);
    defineProperty('cameraQuaternion', cameraQuaternion);
    defineProperty('pointStart', pointStart);
    defineProperty('pointEnd', pointEnd);
    defineProperty('rotationAxis', rotationAxis);
    defineProperty('rotationAngle', rotationAngle);
    defineProperty('eye', eye);

    this._offset = Vec3.new();
    this._startNorm = Vec3.new();
    this._endNorm = Vec3.new();
    this._cameraScale = Vec3.new();

    this._parentPosition = Vec3.new();
    this._parentQuaternion = Quaternion.new();
    this._parentQuaternionInv = Quaternion.new();
    this._parentScale = Vec3.new();

    this._worldScaleStart = Vec3.new();
    this._worldQuaternionInv = Quaternion.new();
    this._worldScale = Vec3.new();

    this._positionStart = Vec3.new();
    this._quaternionStart = Quaternion.new();
    this._scaleStart = Vec3.new();

    this._getPointer = getPointer.bind(this);
    this._onPointerDown = onPointerDown.bind(this);
    this._onPointerHover = onPointerHover.bind(this);
    this._onPointerMove = onPointerMove.bind(this);
    this._onPointerUp = onPointerUp.bind(this);

    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.domElement.addEventListener('pointermove', this._onPointerHover);
    this.domElement.addEventListener('pointerup', this._onPointerUp);
  }

  _offset: Vec3;
  _startNorm: Vec3;
  _endNorm: Vec3;
  _cameraScale: Vec3;

  _parentPosition: Vec3;
  _parentQuaternion: Quaternion;
  _parentQuaternionInv: Quaternion;
  _parentScale: Vec3;

  _worldScaleStart: Vec3;
  _worldQuaternionInv: Quaternion;
  _worldScale: Vec3;

  _positionStart: Vec3;
  _quaternionStart: Quaternion;
  _scaleStart: Vec3;

  _getPointer: (event: PointerEvent) => { x: number; y: number; button: number };
  _onPointerDown: (event: PointerEvent) => void;
  _onPointerHover: (event: PointerEvent) => void;
  _onPointerMove: (event: PointerEvent) => void;
  _onPointerUp: (event: PointerEvent) => void;

  updateMatrixWorld() {
    if (this.object !== undefined) {
      this.object.updateMatrixWorld();

      if (this.object.parent === null) {
        console.error('TransformControls: The attached 3D object must be a part of the scene graph.');
      } else {
        this.object.parent.matrixWorld.decompose(this._parentPosition, this._parentQuaternion, this._parentScale);
      }

      this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this._worldScale);

      this._parentQuaternionInv.from(this._parentQuaternion).invert();
      this._worldQuaternionInv.from(this.worldQuaternion).invert();
    }

    this.camera.updateMatrixWorld();
    this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this._cameraScale);

    if (this.camera instanceof OrthographicCamera) {
      this.camera.getWorldDirection(this.eye).negate();
    } else {
      this.eye.from(this.cameraPosition).sub(this.worldPosition).normalize();
    }

    return super.updateMatrixWorld(!!this);
  }

  pointerHover(pointer: PointerEvent) {
    if (this.object === undefined || this.dragging === true) return;

    //@ts-expect-error
    if (pointer !== null) _raycaster.fromCamera(pointer, this.camera);

    const intersect = intersectObjectWithRay(this._gizmo.picker[this.mode], _raycaster, false);

    if (intersect) {
      this.axis = intersect.object.name as any;
    } else {
      this.axis = null;
    }
  }

  pointerDown(pointer: PointerEvent) {
    if (this.object === undefined || this.dragging === true || (pointer != null && pointer.button !== 0)) return;

    if (this.axis !== null) {
      //@ts-expect-error
      if (pointer !== null) _raycaster.fromCamera(pointer, this.camera);

      const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true);

      if (planeIntersect) {
        this.object.updateMatrixWorld();
        this.object.parent!.updateMatrixWorld();

        this._positionStart.from(this.object.position);
        this._quaternionStart.from(this.object.quaternion);
        this._scaleStart.from(this.object.scale);

        this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart);

        this.pointStart!.from(planeIntersect.point).sub(this.worldPositionStart);
      }

      this.dragging = true;
      _mouseDownEvent.mode = this.mode;
      this.eventDispatcher.dispatch(_mouseDownEvent, this);
    }
  }

  worldPosition: Vec3;
  worldPositionStart: Vec3;
  worldQuaternion: Quaternion;
  worldQuaternionStart: Quaternion;
  cameraPosition: Vec3;
  cameraQuaternion: Quaternion;

  pointerMove(pointer: PointerEvent) {
    const axis = this.axis;
    const mode = this.mode;
    const object = this.object;
    let space = this.space;

    if (mode === 'scale') {
      space = 'local';
    } else if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
      space = 'world';
    }

    if (object === undefined || axis === null || this.dragging === false || (pointer !== null && pointer.button !== -1))
      return;

    //@ts-expect-error
    if (pointer !== null) _raycaster.fromCamera(pointer, this.camera);

    const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true);

    if (!planeIntersect) return;

    this.pointEnd!.from(planeIntersect.point).sub(this.worldPositionStart!);

    if (mode === 'translate') {
      this._offset.from(this.pointEnd!).sub(this.pointStart!);

      if (space === 'local' && axis !== 'XYZ') {
        this._offset.applyQuaternion(this._worldQuaternionInv);
      }

      if (axis.indexOf('X') === -1) this._offset.x = 0;
      if (axis.indexOf('Y') === -1) this._offset.y = 0;
      if (axis.indexOf('Z') === -1) this._offset.z = 0;

      if (space === 'local' && axis !== 'XYZ') {
        this._offset.applyQuaternion(this._quaternionStart).div(this._parentScale);
      } else {
        this._offset.applyQuaternion(this._parentQuaternionInv).div(this._parentScale);
      }

      object.position.from(this._offset).add(this._positionStart);

      if (this.translationSnap) {
        if (space === 'local') {
          object.position.applyQuaternion(_tempQuaternion.from(this._quaternionStart).invert());

          if (axis.search('X') !== -1) {
            object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
          }

          if (axis.search('Y') !== -1) {
            object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
          }

          if (axis.search('Z') !== -1) {
            object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
          }

          object.position.applyQuaternion(this._quaternionStart);
        }

        if (space === 'world') {
          if (object.parent) {
            object.position.add(_tempVector.fromMat4Position(object.parent.matrixWorld));
          }

          if (axis.search('X') !== -1) {
            object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;
          }

          if (axis.search('Y') !== -1) {
            object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;
          }

          if (axis.search('Z') !== -1) {
            object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;
          }

          if (object.parent) {
            object.position.sub(_tempVector.fromMat4Position(object.parent.matrixWorld));
          }
        }
      }
    } else if (mode === 'scale') {
      if (axis.search('XYZ') !== -1) {
        let d = this.pointEnd!.length() / this.pointStart!.length();

        if (this.pointEnd!.dot(this.pointStart!) < 0) d *= -1;

        _tempVec2.set(d, d, d);
      } else {
        _tempVector.from(this.pointStart!);
        _tempVec2.from(this.pointEnd!);

        _tempVector.applyQuaternion(this._worldQuaternionInv);
        _tempVec2.applyQuaternion(this._worldQuaternionInv);

        _tempVec2.div(_tempVector);

        if (axis.search('X') === -1) {
          _tempVec2.x = 1;
        }

        if (axis.search('Y') === -1) {
          _tempVec2.y = 1;
        }

        if (axis.search('Z') === -1) {
          _tempVec2.z = 1;
        }
      }

      object.scale.from(this._scaleStart).mul(_tempVec2);

      if (this.scaleSnap) {
        if (axis.search('X') !== -1) {
          object.scale.x = Math.round(object.scale.x / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
        }

        if (axis.search('Y') !== -1) {
          object.scale.y = Math.round(object.scale.y / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
        }

        if (axis.search('Z') !== -1) {
          object.scale.z = Math.round(object.scale.z / this.scaleSnap) * this.scaleSnap || this.scaleSnap;
        }
      }
    } else if (mode === 'rotate') {
      this._offset.from(this.pointEnd!).sub(this.pointStart!);

      const ROTATION_SPEED = 20 / this.worldPosition.distanceTo(_tempVector.fromMat4Position(this.camera.matrixWorld));

      let _inPlaneRotation = false;

      if (axis === 'XYZE') {
        this.rotationAxis.from(this._offset).cross(this.eye).normalize();
        this.rotationAngle = this._offset.dot(_tempVector.from(this.rotationAxis).cross(this.eye)) * ROTATION_SPEED;
      } else if (axis === 'X' || axis === 'Y' || axis === 'Z') {
        this.rotationAxis.from(_unit[axis]);

        _tempVector.from(_unit[axis]);

        if (space === 'local') {
          _tempVector.applyQuaternion(this.worldQuaternion);
        }

        _tempVector.cross(this.eye);

        if (_tempVector.length() === 0) {
          _inPlaneRotation = true;
        } else {
          this.rotationAngle = this._offset.dot(_tempVector.normalize()) * ROTATION_SPEED;
        }
      }

      if (axis === 'E' || _inPlaneRotation) {
        this.rotationAxis.from(this.eye);
        this.rotationAngle = this.pointEnd!.angleTo(this.pointStart!);

        this._startNorm.from(this.pointStart!).normalize();
        this._endNorm.from(this.pointEnd!).normalize();

        this.rotationAngle *= this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : -1;
      }

      if (this.rotationSnap)
        this.rotationAngle = Math.round(this.rotationAngle / this.rotationSnap) * this.rotationSnap;

      if (space === 'local' && axis !== 'E' && axis !== 'XYZE') {
        object.quaternion.from(this._quaternionStart);
        object.quaternion.mul(_tempQuaternion.fromAxisAngle(this.rotationAxis, this.rotationAngle)).normalize();
      } else {
        this.rotationAxis.applyQuaternion(this._parentQuaternionInv);
        object.quaternion.from(_tempQuaternion.fromAxisAngle(this.rotationAxis, this.rotationAngle));
        object.quaternion.mul(this._quaternionStart).normalize();
      }
    }

    this.eventDispatcher.dispatch(_changeEvent, this);
    this.eventDispatcher.dispatch(_objectChangeEvent, this);
  }

  eye: Vec3;

  pointerUp(pointer: PointerEvent) {
    if (pointer !== null && pointer.button !== 0) return;

    if (this.dragging && this.axis !== null) {
      _mouseUpEvent.mode = this.mode;
      this.eventDispatcher.dispatch(_mouseUpEvent, this);
    }

    this.dragging = false;
    this.axis = null;
  }

  rotationAxis: Vec3;
  rotationAngle: number;

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.domElement.removeEventListener('pointermove', this._onPointerHover);
    this.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.domElement.removeEventListener('pointerup', this._onPointerUp);
  }

  attach(object: Entity) {
    this.object = object;
    this.visible = true;

    return this;
  }

  detach() {
    this.object = undefined;
    this.visible = false;
    this.axis = null;

    return this;
  }

  reset() {
    if (!this.enabled) return;

    if (this.dragging) {
      this.object!.position.from(this._positionStart);
      this.object!.quaternion.from(this._quaternionStart);
      this.object!.scale.from(this._scaleStart);

      this.eventDispatcher.dispatch(_changeEvent, this);
      this.eventDispatcher.dispatch(_objectChangeEvent, this);

      this.pointStart!.from(this.pointEnd!);
    }
  }

  pointStart: Vec3 | null;
  pointEnd: Vec3 | null;

  getRaycaster() {
    return _raycaster;
  }

  getMode() {
    return this.mode;
  }

  setMode(mode: 'translate' | 'rotate' | 'scale') {
    this.mode = mode;
  }

  setTranslationSnap(translationSnap: number) {
    this.translationSnap = translationSnap;
  }

  setRotationSnap(rotationSnap: number) {
    this.rotationSnap = rotationSnap;
  }

  setScaleSnap(scaleSnap: number) {
    this.scaleSnap = scaleSnap;
  }

  setSize(size: number) {
    this.size = size;
  }

  setSpace(space: 'world' | 'local') {
    this.space = space;
  }
}

function getPointer(event: PointerEvent) {
  if (this.domElement.ownerDocument.pointerLockElement) {
    return {
      x: 0,
      y: 0,
      button: event.button,
    };
  } else {
    const rect = this.domElement.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      button: event.button,
    };
  }
}

function onPointerHover(event: PointerEvent) {
  if (!this.enabled) return;

  switch (event.pointerType) {
    case 'mouse':
    case 'pen':
      this.pointerHover(this._getPointer(event));
      break;
  }
}

function onPointerDown(event: PointerEvent) {
  if (!this.enabled) return;

  if (!document.pointerLockElement) {
    this.domElement.setPointerCapture(event.pointerId);
  }

  this.domElement.addEventListener('pointermove', this._onPointerMove);

  this.pointerHover(this._getPointer(event));
  this.pointerDown(this._getPointer(event));
}

function onPointerMove(event: PointerEvent) {
  if (!this.enabled) return;

  this.pointerMove(this._getPointer(event));
}

function onPointerUp(event: PointerEvent) {
  if (!this.enabled) return;

  this.domElement.releasePointerCapture(event.pointerId);

  this.domElement.removeEventListener('pointermove', this._onPointerMove);

  this.pointerUp(this._getPointer(event));
}

function intersectObjectWithRay(object: Entity, raycaster: Raycaster, includeInvisible: boolean): Intersection | false {
  const allIntersections = raycaster.intersect(object, true);

  for (let i = 0; i < allIntersections.length; i++) {
    if (allIntersections[i].object.visible || includeInvisible) {
      return allIntersections[i];
    }
  }

  return false;
}

const _tempEuler = new Euler();
const _alignVector = Vec3.new(0, 1, 0);
const _zeroVector = Vec3.new(0, 0, 0);
const _lookAtMatrix = new Mat4();
const _tempQuaternion2 = Quaternion.new();
const _identityQuaternion = Quaternion.new();
const _dirVector = Vec3.new();
const _tempMatrix = new Mat4();

const _unitX = Vec3.new(1, 0, 0);
const _unitY = Vec3.new(0, 1, 0);
const _unitZ = Vec3.new(0, 0, 1);

const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _v3 = Vec3.new();

export class TransformControlsGizmo extends Entity {
  declare isTransformControlsGizmo: true;

  gizmo: {
    translate: Entity;
    rotate: Entity;
    scale: Entity;
  };
  helper: {
    translate: Entity;
    rotate: Entity;
    scale: Entity;
  };
  picker: {
    translate: Entity;
    rotate: Entity;
    scale: Entity;
  };

  constructor() {
    super();

    this.isTransformControlsGizmo = true;

    const gizmoMaterial = new MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      transparent: true,
    });

    const gizmoLineMaterial = new LineBasicMaterial({
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      transparent: true,
    });

    const matInvisible = gizmoMaterial.clone();
    matInvisible.opacity = 0.15;

    const matHelper = gizmoLineMaterial.clone();
    matHelper.opacity = 0.5;

    const matRed = gizmoMaterial.clone();
    matRed.color.setHex(0xff0000);

    const matGreen = gizmoMaterial.clone();
    matGreen.color.setHex(0x00ff00);

    const matBlue = gizmoMaterial.clone();
    matBlue.color.setHex(0x0000ff);

    const matRedTransparent = gizmoMaterial.clone();
    matRedTransparent.color.setHex(0xff0000);
    matRedTransparent.opacity = 0.5;

    const matGreenTransparent = gizmoMaterial.clone();
    matGreenTransparent.color.setHex(0x00ff00);
    matGreenTransparent.opacity = 0.5;

    const matBlueTransparent = gizmoMaterial.clone();
    matBlueTransparent.color.setHex(0x0000ff);
    matBlueTransparent.opacity = 0.5;

    const matWhiteTransparent = gizmoMaterial.clone();
    matWhiteTransparent.opacity = 0.25;

    const matYellowTransparent = gizmoMaterial.clone();
    matYellowTransparent.color.setHex(0xffff00);
    matYellowTransparent.opacity = 0.25;

    const matYellow = gizmoMaterial.clone();
    matYellow.color.setHex(0xffff00);

    const matGray = gizmoMaterial.clone();
    matGray.color.setHex(0x787878);

    const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12);
    arrowGeometry.translate(0, 0.05, 0);

    const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08);
    scaleHandleGeometry.translate(0, 0.04, 0);

    const lineGeometry = new Geometry();
    lineGeometry.setAttribute('position', new Attribute(new Float32Array([0, 0, 0, 1, 0, 0]), 3));

    const lineGeometry2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3);
    lineGeometry2.translate(0, 0.25, 0);

    function CircleGeometry(radius: number, arc: number) {
      const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2);
      geometry.rotateY(Math.PI / 2);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }

    function TranslateHelperGeometry() {
      const geometry = new Geometry();

      geometry.setAttribute('position', new Attribute(new Float32Array([0, 0, 0, 1, 1, 1]), 3));

      return geometry;
    }

    const gizmoTranslate = {
      X: [
        [new Mesh(arrowGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(arrowGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
        [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
      ],
      Y: [
        [new Mesh(arrowGeometry, matGreen), [0, 0.5, 0]],
        [new Mesh(arrowGeometry, matGreen), [0, -0.5, 0], [Math.PI, 0, 0]],
        [new Mesh(lineGeometry2, matGreen)],
      ],
      Z: [
        [new Mesh(arrowGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(arrowGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]],
        [new Mesh(lineGeometry2, matBlue), null, [Math.PI / 2, 0, 0]],
      ],
      XYZ: [[new Mesh(new OctahedronGeometry(0.1, 0), matWhiteTransparent.clone()), [0, 0, 0]]],
      XY: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent.clone()), [0.15, 0.15, 0]]],
      YZ: [
        [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
      ],
      XZ: [
        [
          new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent.clone()),
          [0.15, 0, 0.15],
          [-Math.PI / 2, 0, 0],
        ],
      ],
    };

    const pickerTranslate = {
      X: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]],
      ],
      Y: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]],
      ],
      Z: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]],
      ],
      XYZ: [[new Mesh(new OctahedronGeometry(0.2, 0), matInvisible)]],
      XY: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
    };

    const helperTranslate = {
      START: [[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']],
      END: [[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']],
      DELTA: [[new Line(TranslateHelperGeometry(), matHelper), null, null, null, 'helper']],
      X: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
      Y: [[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']],
      Z: [[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']],
    };

    const gizmoRotate = {
      XYZE: [[new Mesh(CircleGeometry(0.5, 1), matGray), null, [0, Math.PI / 2, 0]]],
      X: [[new Mesh(CircleGeometry(0.5, 0.5), matRed)]],
      Y: [[new Mesh(CircleGeometry(0.5, 0.5), matGreen), null, [0, 0, -Math.PI / 2]]],
      Z: [[new Mesh(CircleGeometry(0.5, 0.5), matBlue), null, [0, Math.PI / 2, 0]]],
      E: [[new Mesh(CircleGeometry(0.75, 1), matYellowTransparent), null, [0, Math.PI / 2, 0]]],
    };

    const helperRotate = {
      AXIS: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
    };

    const pickerRotate = {
      XYZE: [[new Mesh(new SphereGeometry(0.25, 10, 8), matInvisible)]],
      X: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]]],
      Y: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]],
      Z: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]],
      E: [[new Mesh(new TorusGeometry(0.75, 0.1, 2, 24), matInvisible)]],
    };

    const gizmoScale = {
      X: [
        [new Mesh(scaleHandleGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(scaleHandleGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
      ],
      Y: [
        [new Mesh(scaleHandleGeometry, matGreen), [0, 0.5, 0]],
        [new Mesh(lineGeometry2, matGreen)],
        [new Mesh(scaleHandleGeometry, matGreen), [0, -0.5, 0], [0, 0, Math.PI]],
      ],
      Z: [
        [new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
        [new Mesh(lineGeometry2, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
        [new Mesh(scaleHandleGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]],
      ],
      XY: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
      XYZ: [[new Mesh(new BoxGeometry(0.1, 0.1, 0.1), matWhiteTransparent.clone())]],
    };

    const pickerScale = {
      X: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]],
      ],
      Y: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]],
      ],
      Z: [
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
        [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]],
      ],
      XY: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]],
      YZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
      XZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
      XYZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 0]]],
    };

    const helperScale = {
      X: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
      Y: [[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']],
      Z: [[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']],
    };

    function setupGizmo(gizmoMap: any) {
      const gizmo = new Entity();

      for (const name in gizmoMap) {
        for (let i = gizmoMap[name].length; i--; ) {
          const object = gizmoMap[name][i][0].clone();
          const position = gizmoMap[name][i][1];
          const rotation = gizmoMap[name][i][2];
          const scale = gizmoMap[name][i][3];
          const tag = gizmoMap[name][i][4];

          object.name = name;
          object.tag = tag;

          if (position) {
            object.position.set(position[0], position[1], position[2]);
          }

          if (rotation) {
            object.setRotation(rotation[0], rotation[1], rotation[2]);
          }

          if (scale) {
            object.scale.set(scale[0], scale[1], scale[2]);
          }

          object.updateMatrix();

          const tempGeometry = object.geometry.clone();
          tempGeometry.applyMat4(object.matrix);
          object.geometry = tempGeometry;
          object.renderOrder = Infinity;

          object.position.set(0, 0, 0);
          object.setRotation(0, 0, 0);
          object.scale.set(1, 1, 1);

          gizmo.add(object);
        }
      }

      return gizmo;
    }

    this.gizmo = {} as any;
    this.picker = {} as any;
    this.helper = {} as any;

    this.add((this.gizmo['translate'] = setupGizmo(gizmoTranslate)));
    this.add((this.gizmo['rotate'] = setupGizmo(gizmoRotate)));
    this.add((this.gizmo['scale'] = setupGizmo(gizmoScale)));
    this.add((this.picker['translate'] = setupGizmo(pickerTranslate)));
    this.add((this.picker['rotate'] = setupGizmo(pickerRotate)));
    this.add((this.picker['scale'] = setupGizmo(pickerScale)));
    this.add((this.helper['translate'] = setupGizmo(helperTranslate)));
    this.add((this.helper['rotate'] = setupGizmo(helperRotate)));
    this.add((this.helper['scale'] = setupGizmo(helperScale)));

    this.picker['translate'].visible = false;
    this.picker['rotate'].visible = false;
    this.picker['scale'].visible = false;
  }

  mode: 'translate' | 'rotate' | 'scale' = 'translate';
  space: 'world' | 'local' = 'world';
  size: number = 1;
  axis: string | null = null;
  dragging: boolean = false;
  showX: boolean = true;
  showY: boolean = true;
  showZ: boolean = true;

  camera: Camera;
  cameraPosition: Vec3;
  worldPosition: Vec3;
  worldPositionStart: Vec3;
  worldQuaternion: Quaternion;
  eye: Vec3;

  updateMatrixWorld(force?: boolean): this {
    const space = this.mode === 'scale' ? 'local' : this.space;

    const quaternion = space === 'local' ? this.worldQuaternion : _identityQuaternion;

    this.gizmo['translate'].visible = this.mode === 'translate';
    this.gizmo['rotate'].visible = this.mode === 'rotate';
    this.gizmo['scale'].visible = this.mode === 'scale';

    this.helper['translate'].visible = this.mode === 'translate';
    this.helper['rotate'].visible = this.mode === 'rotate';
    this.helper['scale'].visible = this.mode === 'scale';

    let handles: any[] = [];
    handles = handles.concat(this.picker[this.mode].children);
    handles = handles.concat(this.gizmo[this.mode].children);
    handles = handles.concat(this.helper[this.mode].children);

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];

      handle.visible = true;
      handle.setRotation(0, 0, 0);
      handle.position.copy(this.worldPosition);

      let factor;

      if (this.camera instanceof OrthographicCamera) {
        factor = (this.camera.top - this.camera.bottom) / this.camera.zoom;
      } else if (this.camera instanceof PerspectiveCamera) {
        factor =
          this.worldPosition.distanceTo(this.cameraPosition) *
          Math.min((1.9 * Math.tan((Math.PI * this.camera.fov) / 360)) / this.camera.zoom, 7);
      } else {
        factor = 0;
      }

      handle.scale.set(1, 1, 1).scale((factor * this.size) / 4);

      if (handle.tag === 'helper') {
        handle.visible = false;

        if (handle.name === 'AXIS') {
          handle.visible = !!this.axis;

          if (this.axis === 'X') {
            _tempQuaternion.fromEuler(_tempEuler.set(0, 0, 0));
            handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

            if (Math.abs(_alignVector.from(_unitX).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
              handle.visible = false;
            }
          }

          if (this.axis === 'Y') {
            _tempQuaternion.fromEuler(_tempEuler.set(0, 0, Math.PI / 2));
            handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

            if (Math.abs(_alignVector.from(_unitY).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
              handle.visible = false;
            }
          }

          if (this.axis === 'Z') {
            _tempQuaternion.fromEuler(_tempEuler.set(0, Math.PI / 2, 0));
            handle.quaternion.copy(quaternion).multiply(_tempQuaternion);

            if (Math.abs(_alignVector.from(_unitZ).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
              handle.visible = false;
            }
          }

          if (this.axis === 'XYZE') {
            _tempQuaternion.fromEuler(_tempEuler.set(0, Math.PI / 2, 0));
            //@ts-expect-error
            _alignVector.from(this.rotationAxis);
            handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(_zeroVector, _alignVector, _unitY));
            handle.quaternion.multiply(_tempQuaternion);
            handle.visible = this.dragging;
          }

          if (this.axis === 'E') {
            handle.visible = false;
          }
        } else if (handle.name === 'START') {
          handle.position.copy(this.worldPositionStart);
          handle.visible = this.dragging;
        } else if (handle.name === 'END') {
          handle.position.copy(this.worldPosition);
          handle.visible = this.dragging;
        } else if (handle.name === 'DELTA') {
          handle.position.copy(this.worldPositionStart);
          //@ts-expect-error
          handle.quaternion.copy(this.worldQuaternionStart);
          _tempVector.set(1e-10, 1e-10, 1e-10).add(this.worldPositionStart).sub(this.worldPosition).scale(-1);
          //@ts-expect-error
          _tempVector.applyQuaternion(this.worldQuaternionStart.clone().invert());
          handle.scale.copy(_tempVector);
          handle.visible = this.dragging;
        } else {
          handle.quaternion.copy(quaternion);

          if (this.dragging) {
            handle.position.copy(this.worldPositionStart);
          } else {
            handle.position.copy(this.worldPosition);
          }

          if (this.axis) {
            handle.visible = this.axis.search(handle.name) !== -1;
          }
        }

        continue;
      }

      handle.quaternion.copy(quaternion);

      if (this.mode === 'translate' || this.mode === 'scale') {
        const AXIS_HIDE_THRESHOLD = 0.99;
        const PLANE_HIDE_THRESHOLD = 0.2;

        if (handle.name === 'X') {
          if (Math.abs(_alignVector.from(_unitX).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === 'Y') {
          if (Math.abs(_alignVector.from(_unitY).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === 'Z') {
          if (Math.abs(_alignVector.from(_unitZ).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === 'XY') {
          if (Math.abs(_alignVector.from(_unitZ).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === 'YZ') {
          if (Math.abs(_alignVector.from(_unitX).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }

        if (handle.name === 'XZ') {
          if (Math.abs(_alignVector.from(_unitY).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
            handle.scale.set(1e-10, 1e-10, 1e-10);
            handle.visible = false;
          }
        }
      } else if (this.mode === 'rotate') {
        _tempQuaternion2.from(quaternion);
        _alignVector.from(this.eye).applyQuaternion(_tempQuaternion.from(quaternion).invert());

        if (handle.name.search('E') !== -1) {
          handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(this.eye, _zeroVector, _unitY));
        }

        if (handle.name === 'X') {
          _tempQuaternion.fromAxisAngle(_unitX, Math.atan2(-_alignVector.y, _alignVector.z));
          _tempQuaternion.asMul(_tempQuaternion2, _tempQuaternion);
          handle.quaternion.copy(_tempQuaternion);
        }

        if (handle.name === 'Y') {
          _tempQuaternion.fromAxisAngle(_unitY, Math.atan2(_alignVector.x, _alignVector.z));
          _tempQuaternion.asMul(_tempQuaternion2, _tempQuaternion);
          handle.quaternion.copy(_tempQuaternion);
        }

        if (handle.name === 'Z') {
          _tempQuaternion.fromAxisAngle(_unitZ, Math.atan2(_alignVector.y, _alignVector.x));
          _tempQuaternion.asMul(_tempQuaternion2, _tempQuaternion);
          handle.quaternion.copy(_tempQuaternion);
        }
      }

      handle.visible = handle.visible && (handle.name.indexOf('X') === -1 || this.showX);
      handle.visible = handle.visible && (handle.name.indexOf('Y') === -1 || this.showY);
      handle.visible = handle.visible && (handle.name.indexOf('Z') === -1 || this.showZ);
      handle.visible = handle.visible && (handle.name.indexOf('E') === -1 || (this.showX && this.showY && this.showZ));

      handle.material._color = handle.material._color || handle.material.color.clone();
      handle.material._opacity = handle.material._opacity || handle.material.opacity;

      handle.material.color.copy(handle.material._color);
      handle.material.opacity = handle.material._opacity;

      if (this.enabled && this.axis) {
        if (handle.name === this.axis) {
          handle.material.color.setHex(0xffff00);
          handle.material.opacity = 1.0;
        } else if (
          this.axis.split('').some(function (a) {
            return handle.name === a;
          })
        ) {
          handle.material.color.setHex(0xffff00);
          handle.material.opacity = 1.0;
        }
      }
    }

    return super.updateMatrixWorld(force);
  }

  enabled: boolean;
}

TransformControlsGizmo.prototype.isTransformControlsGizmo = true;

export class TransformControlsPlane extends Mesh {
  declare isTransformControlsPlane: true;
  mode: 'translate' | 'scale' | 'rotate';
  axis: 'X' | 'Y' | 'Z' | 'XY' | 'YZ' | 'XZ' | 'XYZ' | 'E';
  space: 'local' | 'world';
  eye: Vec3;
  worldPosition: Vec3;
  worldQuaternion: Quaternion;
  cameraQuaternion: Quaternion;

  constructor() {
    super(
      new PlaneGeometry(100000, 100000, 2, 2),
      new MeshBasicMaterial({
        visible: false,
        wireframe: true,
        side: Side.Double,
        transparent: true,
        opacity: 0.1,
        toneMapped: false,
      }),
    );
  }

  updateMatrixWorld(force?: boolean): this {
    let space = this.space;

    this.position.from(this.worldPosition);

    if (this.mode === 'scale') space = 'local';

    _v1.from(_unitX).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);
    _v2.from(_unitY).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);
    _v3.from(_unitZ).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);

    _alignVector.from(_v2);

    switch (this.mode) {
      case 'translate':
      case 'scale':
        switch (this.axis) {
          case 'X':
            _alignVector.from(this.eye).cross(_v1);
            _dirVector.from(_v1).cross(_alignVector);
            break;
          case 'Y':
            _alignVector.from(this.eye).cross(_v2);
            _dirVector.from(_v2).cross(_alignVector);
            break;
          case 'Z':
            _alignVector.from(this.eye).cross(_v3);
            _dirVector.from(_v3).cross(_alignVector);
            break;
          case 'XY':
            _dirVector.from(_v3);
            break;
          case 'YZ':
            _dirVector.from(_v1);
            break;
          case 'XZ':
            _alignVector.from(_v3);
            _dirVector.from(_v2);
            break;
          case 'XYZ':
          case 'E':
            _dirVector.set(0, 0, 0);
            break;
        }

        break;
      case 'rotate':
      default:
        _dirVector.set(0, 0, 0);
    }

    if (_dirVector.length() === 0) {
      this.quaternion.from(this.cameraQuaternion);
    } else {
      _tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector);

      this.quaternion.fromRotation(_tempMatrix);
    }

    return super.updateMatrixWorld(force);
  }
}

TransformControlsPlane.prototype.isTransformControlsPlane = true;
