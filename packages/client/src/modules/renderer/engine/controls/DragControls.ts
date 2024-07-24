import { Plane } from '../math/Plane.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Entity } from '../core/Entity.js';
import { Camera } from '../cameras/Camera.js';

const _plane = new Plane();
const _raycaster = Raycaster.new();

const _pointer = Vec2.new();
const _offset = Vec3.new();
const _diff = Vec2.new();
const _previousPointer = Vec2.new();
const _intersection = Vec3.new();
const _worldPosition = Vec3.new();
const _inverseMatrix = new Mat4();

const _up = Vec3.new();
const _right = Vec3.new();

export class DragControls {
  onHoverStart: (object: Entity) => void;
  onHoverEnd: (object: Entity) => void;
  onDragStart: (object: Entity) => void;
  onDrag: (object: Entity) => void;
  onDragEnd: (object: Entity) => void;

  object: Camera;
  enabled: boolean;
  recursive: boolean;
  transformGroup: boolean;
  mode: string;
  rotateSpeed: number;

  constructor(objects: Entity[], camera: Camera, dom: HTMLElement) {
    dom.style.touchAction = 'none';

    let _selected: Entity | null = null;
    let _hovered: Entity | null = null;

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

    function setObjects(objects: Entity[]) {
      objects = objects;
    }

    function getRaycaster() {
      return _raycaster;
    }

    function onPointerMove(event: PointerEvent) {
      if (scope.enabled === false) return;

      updatePointer(event);

      _raycaster.fromCamera(_pointer, camera);

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

          _raycaster.fromCamera(_pointer, camera);
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

      _raycaster.fromCamera(_pointer, camera);
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

    function findGroup(obj: Entity, group = null) {
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
  getObjects: () => Entity[];
  getRaycaster: () => Raycaster;
  setObjects: (objects: Entity[]) => void;
}
