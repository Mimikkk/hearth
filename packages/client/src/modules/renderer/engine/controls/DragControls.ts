import { Plane } from '../math/Plane.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
import { EventDispatcher } from '../core/EventDispatcher.js';
import { Camera } from '../cameras/Camera.js';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _pointer = new Vec2();
const _offset = new Vec3();
const _diff = new Vec2();
const _previousPointer = new Vec2();
const _intersection = new Vec3();
const _worldPosition = new Vec3();
const _inverseMatrix = new Mat4();

const _up = new Vec3();
const _right = new Vec3();

export interface DragControlsEventMap {
  hoveron: { object: Object3D };
  hoveroff: { object: Object3D };
  dragstart: { object: Object3D };
  drag: { object: Object3D };
  dragend: { object: Object3D };
}

class DragControls {
  eventDispatcher = new EventDispatcher<DragControlsEventMap>();

  object: Camera;

  // API

  enabled: boolean;
  recursive: boolean;
  transformGroup: boolean;
  mode: string;
  rotateSpeed: number;

  constructor(_objects: Object3D[], _camera: Camera, _domElement: HTMLElement) {
    // disable touch scroll
    _domElement.style.touchAction = 'none';

    let _selected: Object3D | null = null;
    let _hovered: Object3D | null = null;

    const _intersections: Intersection[] = [];

    this.mode = 'translate';

    this.rotateSpeed = 1;

    //

    const scope = this;

    function activate() {
      _domElement.addEventListener('pointermove', onPointerMove);
      _domElement.addEventListener('pointerdown', onPointerDown);
      _domElement.addEventListener('pointerup', onPointerCancel);
      _domElement.addEventListener('pointerleave', onPointerCancel);
    }

    function deactivate() {
      _domElement.removeEventListener('pointermove', onPointerMove);
      _domElement.removeEventListener('pointerdown', onPointerDown);
      _domElement.removeEventListener('pointerup', onPointerCancel);
      _domElement.removeEventListener('pointerleave', onPointerCancel);

      _domElement.style.cursor = '';
    }

    function dispose() {
      deactivate();
    }

    function getObjects() {
      return _objects;
    }

    function setObjects(objects: Object3D[]) {
      _objects = objects;
    }

    function getRaycaster() {
      return _raycaster;
    }

    function onPointerMove(event: PointerEvent) {
      if (scope.enabled === false) return;

      updatePointer(event);

      _raycaster.setFromCamera(_pointer, _camera);

      if (_selected) {
        if (scope.mode === 'translate') {
          if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
            _selected.position.copy(_intersection.sub(_offset).applyMat4(_inverseMatrix));
          }
        } else if (scope.mode === 'rotate') {
          _diff.subVectors(_pointer, _previousPointer).multiplyScalar(scope.rotateSpeed);
          _selected.rotateOnWorldAxis(_up, _diff.x);
          _selected.rotateOnWorldAxis(_right.normalize(), -_diff.y);
        }

        scope.eventDispatcher.dispatch({ type: 'drag', object: _selected }, this);

        _previousPointer.copy(_pointer);
      } else {
        // hover support

        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
          _intersections.length = 0;

          _raycaster.setFromCamera(_pointer, _camera);
          _raycaster.intersects(_objects, scope.recursive, _intersections);

          if (_intersections.length > 0) {
            const object = _intersections[0].object;

            _plane.setFromNormalAndCoplanarPoint(
              _camera.getWorldDirection(_plane.normal),
              _worldPosition.setFromMatrixPosition(object.matrixWorld),
            );

            if (_hovered !== object && _hovered !== null) {
              scope.eventDispatcher.dispatch({ type: 'hoveroff', object: _hovered }, this);

              _domElement.style.cursor = 'auto';
              _hovered = null;
            }

            if (_hovered !== object) {
              scope.eventDispatcher.dispatch({ type: 'hoveron', object: object }, this);

              _domElement.style.cursor = 'pointer';
              _hovered = object;
            }
          } else {
            if (_hovered !== null) {
              scope.eventDispatcher.dispatch({ type: 'hoveroff', object: _hovered }, this);

              _domElement.style.cursor = 'auto';
              _hovered = null;
            }
          }
        }
      }

      _previousPointer.copy(_pointer);
    }

    function onPointerDown(event: PointerEvent) {
      if (scope.enabled === false) return;

      updatePointer(event);

      _intersections.length = 0;

      _raycaster.setFromCamera(_pointer, _camera);
      _raycaster.intersects(_objects, scope.recursive, _intersections);

      if (_intersections.length > 0) {
        if (scope.transformGroup === true) {
          // look for the outermost group in the object's upper hierarchy

          _selected = findGroup(_intersections[0].object);
        } else {
          _selected = _intersections[0].object;
        }

        _plane.setFromNormalAndCoplanarPoint(
          _camera.getWorldDirection(_plane.normal),
          //@ts-expect-error
          _worldPosition.setFromMatrixPosition(_selected.matrixWorld),
        );

        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          if (scope.mode === 'translate') {
            //@ts-expect-error
            _inverseMatrix.copy(_selected.parent.matrixWorld).invert();
            //@ts-expect-error
            _offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
          } else if (scope.mode === 'rotate') {
            // the controls only support Y+ up
            _up.set(0, 1, 0).applyQuaternion(_camera.quaternion).normalize();
            _right.set(1, 0, 0).applyQuaternion(_camera.quaternion).normalize();
          }
        }

        _domElement.style.cursor = 'move';

        //@ts-expect-error
        scope.eventDispatcher.dispatch({ type: 'dragstart', object: _selected }, this);
      }

      _previousPointer.copy(_pointer);
    }

    function onPointerCancel() {
      if (scope.enabled === false) return;

      if (_selected) {
        scope.eventDispatcher.dispatch({ type: 'dragend', object: _selected }, this);

        _selected = null;
      }

      _domElement.style.cursor = _hovered ? 'pointer' : 'auto';
    }

    function updatePointer(event: PointerEvent) {
      const rect = _domElement.getBoundingClientRect();

      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function findGroup(obj: Object3D, group = null) {
      //@ts-expect-error
      if (obj.isGroup) group = obj;

      if (obj.parent === null) return group;

      return findGroup(obj.parent, group);
    }

    activate();

    // API

    this.enabled = true;
    this.recursive = true;
    this.transformGroup = false;

    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;
    this.getObjects = getObjects;
    this.getRaycaster = getRaycaster;
    this.setObjects = setObjects;
  }

  activate: () => void;
  deactivate: () => void;
  dispose: () => void;
  getObjects: () => Object3D[];
  getRaycaster: () => Raycaster;
  setObjects: (objects: Object3D[]) => void;
}

export { DragControls };
