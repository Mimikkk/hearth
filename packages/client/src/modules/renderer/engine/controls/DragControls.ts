import { Plane } from '../math/Plane.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
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

export class DragControls {
  onHoverStart: (object: Object3D) => void;
  onHoverEnd: (object: Object3D) => void;
  onDragStart: (object: Object3D) => void;
  onDrag: (object: Object3D) => void;
  onDragEnd: (object: Object3D) => void;

  object: Camera;
  enabled: boolean;
  recursive: boolean;
  transformGroup: boolean;
  mode: string;
  rotateSpeed: number;

  constructor(objects: Object3D[], camera: Camera, dom: HTMLElement) {
    dom.style.touchAction = 'none';

    let _selected: Object3D | null = null;
    let _hovered: Object3D | null = null;

    const _intersections: Intersection[] = [];

    this.mode = 'translate';

    this.rotateSpeed = 1;

    //

    const scope = this;

    function activate() {
      dom.addEventListener('pointermove', onPointerMove);
      dom.addEventListener('pointerdown', onPointerDown);
      dom.addEventListener('pointerup', onPointerCancel);
      dom.addEventListener('pointerleave', onPointerCancel);
    }

    function deactivate() {
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerCancel);
      dom.removeEventListener('pointerleave', onPointerCancel);

      dom.style.cursor = '';
    }

    function dispose() {
      deactivate();
    }

    function getObjects() {
      return objects;
    }

    function setObjects(objects: Object3D[]) {
      objects = objects;
    }

    function getRaycaster() {
      return _raycaster;
    }

    function onPointerMove(event: PointerEvent) {
      if (scope.enabled === false) return;

      updatePointer(event);

      _raycaster.setFromCamera(_pointer, camera);

      if (_selected) {
        if (scope.mode === 'translate') {
          if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
            _selected.position.from(_intersection.sub(_offset).applyMat4(_inverseMatrix));
          }
        } else if (scope.mode === 'rotate') {
          _diff.asSub(_pointer, _previousPointer).scale(scope.rotateSpeed);
          _selected.rotateOnWorldAxis(_up, _diff.x);
          _selected.rotateOnWorldAxis(_right.normalize(), -_diff.y);
        }

        scope.onDrag?.(_selected);

        _previousPointer.from(_pointer);
      } else {
        // hover support

        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
          _intersections.length = 0;

          _raycaster.setFromCamera(_pointer, camera);
          _raycaster.intersects(objects, scope.recursive, _intersections);

          if (_intersections.length > 0) {
            const object = _intersections[0].object;

            _plane.fromNormalAndCoplanar(
              camera.getWorldDirection(_plane.normal),
              _worldPosition.fromMat4Position(object.matrixWorld),
            );

            if (_hovered !== object && _hovered !== null) {
              scope.onHoverEnd?.(_hovered);

              dom.style.cursor = 'auto';
              _hovered = null;
            }

            if (_hovered !== object) {
              scope.onHoverStart?.(object);

              dom.style.cursor = 'pointer';
              _hovered = object;
            }
          } else {
            if (_hovered !== null) {
              scope.onHoverEnd?.(_hovered);

              dom.style.cursor = 'auto';
              _hovered = null;
            }
          }
        }
      }

      _previousPointer.from(_pointer);
    }

    function onPointerDown(event: PointerEvent) {
      if (scope.enabled === false) return;

      updatePointer(event);

      _intersections.length = 0;

      _raycaster.setFromCamera(_pointer, camera);
      _raycaster.intersects(objects, scope.recursive, _intersections);

      if (_intersections.length > 0) {
        if (scope.transformGroup === true) {
          // look for the outermost group in the object's upper hierarchy

          _selected = findGroup(_intersections[0].object);
        } else {
          _selected = _intersections[0].object;
        }

        _plane.fromNormalAndCoplanar(
          camera.getWorldDirection(_plane.normal),
          //@ts-expect-error
          _worldPosition.fromMat4Position(_selected.matrixWorld),
        );

        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          if (scope.mode === 'translate') {
            //@ts-expect-error
            _inverseMatrix.from(_selected.parent.matrixWorld).invert();
            //@ts-expect-error
            _offset.from(_intersection).sub(_worldPosition.fromMat4Position(_selected.matrixWorld));
          } else if (scope.mode === 'rotate') {
            // the controls only support Y+ up
            _up.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
            _right.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
          }
        }

        dom.style.cursor = 'move';

        scope.onDragStart?.(_selected!);
      }

      _previousPointer.from(_pointer);
    }

    function onPointerCancel() {
      if (scope.enabled === false) return;

      if (_selected) {
        scope.onDragEnd?.(_selected);

        _selected = null;
      }

      dom.style.cursor = _hovered ? 'pointer' : 'auto';
    }

    function updatePointer(event: PointerEvent) {
      const rect = dom.getBoundingClientRect();

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
