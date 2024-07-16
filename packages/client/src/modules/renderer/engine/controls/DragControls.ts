import { Plane, Plane_ } from '../math/Plane.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { Vec2 } from '../math/Vector2.js';
import { IVec3, Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Object3D } from '../core/Object3D.js';
import { EventDispatcher } from '../core/EventDispatcher.js';
import { Camera } from '../cameras/Camera.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _location = Vec2.new();
const _offset = new Vector3();
const _diff = Vec2.new();
const _previousPointer = Vec2.new();
const _intersection = new Vector3();
const _world = new Vector3();
const _inverseMatrix = new Matrix4();

const _up = new Vector3();
const _right = new Vector3();

export interface DragControlsEventMap {
  hoveron: { object: Object3D };
  hoveroff: { object: Object3D };
  dragstart: { object: Object3D };
  drag: { object: Object3D };
  dragend: { object: Object3D };
}

export class DragControls {
  configuration: Configuration;
  events = new EventDispatcher<DragControlsEventMap>();

  constructor(
    public draggable: Object3D[],
    camera: Camera,
    dom: HTMLElement,
    parameters?: Parameters,
  ) {
    dom.style.touchAction = 'none';

    let selected: Object3D | null = null;
    let hovered: Object3D | null = null;
    const intersections: Intersection[] = [];

    this.configuration = configure(parameters);

    const onPointerMove = (event: PointerEvent) => {
      if (!this.configuration.enabled) return;

      updateLocation(event, dom);

      _raycaster.setFromCamera(_location, camera);

      if (selected) {
        if (this.configuration.mode === 'translate') {
          if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
            selected.position.copy(_intersection.sub(_offset).applyMatrix4(_inverseMatrix));
          }
        } else if (this.configuration.mode === 'rotate') {
          const { x, y } = _diff.from(_location).sub(_previousPointer).scale(this.configuration.rotateSpeed);

          IVec3.normalize(_right);
          selected.rotateOnWorldAxis(_up, x);
          selected.rotateOnWorldAxis(_right, -y);
        }

        this.events.dispatch({ type: 'drag', object: selected }, event);

        Vec2.clone(_location, _previousPointer);
      } else {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
          intersections.length = 0;

          _raycaster.setFromCamera(_location, camera);
          _raycaster.intersects(draggable, this.configuration.recursive, intersections);

          console.log(_location, camera, intersections);

          if (intersections.length > 0) {
            const object = intersections[0].object;

            _plane.setFromNormalAndCoplanarPoint(
              camera.getWorldDirection(_plane.normal),
              _world.setFromMatrixPosition(object.matrixWorld),
            );

            if (hovered !== object && hovered !== null) {
              this.events.dispatch({ type: 'hoveroff', object: hovered }, event);

              dom.style.cursor = 'auto';
              hovered = null;
            }

            if (hovered !== object) {
              this.events.dispatch({ type: 'hoveron', object: object }, event);

              dom.style.cursor = 'pointer';
              hovered = object;
            }
          } else {
            if (hovered !== null) {
              this.events.dispatch({ type: 'hoveroff', object: hovered }, event);

              dom.style.cursor = 'auto';
              hovered = null;
            }
          }
        }
      }

      Vec2.clone(_location, _previousPointer);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!this.configuration.enabled) return;

      updateLocation(event, dom);

      intersections.length = 0;

      _raycaster.setFromCamera(_location, camera);
      _raycaster.intersects(draggable, this.configuration.recursive, intersections);

      if (intersections.length > 0) {
        if (this.configuration.transformGroup) {
          selected = findGroup(intersections[0].object);
        } else {
          selected = intersections[0].object;
        }

        Plane_.fillFromNormalAndCoplanar(
          _plane,
          camera.getWorldDirection(_plane.normal),
          _world.setFromMatrixPosition(selected!.matrixWorld),
        );

        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          if (this.configuration.mode === 'translate') {
            _inverseMatrix.copy(selected!.parent!.matrixWorld).invert();

            // Vec3.fillMat4Position(_world, selected!.matrixWorld);
            // Vec3.sub_(_intersection, _world, _offset);
            _offset.copy(_intersection).sub(_world.setFromMatrixPosition(selected!.matrixWorld));
          } else if (this.configuration.mode === 'rotate') {
            IVec3.set(_up, 0, 1, 0);
            IVec3.applyQuaternion(_up, camera.quaternion);
            IVec3.normalize(_up);

            IVec3.set(_right, 1, 0, 0);
            IVec3.applyQuaternion(_right, camera.quaternion);
            IVec3.normalize(_right);
          }
        }

        dom.style.cursor = 'move';

        this.events.dispatch({ type: 'dragstart', object: selected! }, event);
      }

      Vec2.clone(_location, _previousPointer);
    };
    const onPointerCancel = (event: PointerEvent) => {
      if (!this.configuration.enabled) return;

      if (selected) {
        this.events.dispatch({ type: 'dragend', object: selected }, event);

        selected = null;
      }

      dom.style.cursor = hovered ? 'pointer' : 'auto';
    };

    this.activate = () => {
      dom.addEventListener('pointermove', onPointerMove);
      dom.addEventListener('pointerdown', onPointerDown);
      dom.addEventListener('pointerup', onPointerCancel);
      dom.addEventListener('pointerleave', onPointerCancel);
    };
    this.deactivate = () => {
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerCancel);
      dom.removeEventListener('pointerleave', onPointerCancel);

      dom.style.cursor = '';
    };
    if (parameters?.immediate ?? true) this.activate();
  }

  activate: () => void;
  deactivate: () => void;

  dispose(): void {
    this.deactivate();
  }
}

interface Parameters {
  enabled?: boolean;
  recursive?: boolean;
  transformGroup?: boolean;
  mode?: string;
  rotateSpeed?: number;
  immediate?: boolean;
}

interface Configuration {
  enabled: boolean;
  recursive: boolean;
  transformGroup: boolean;
  mode: string;
  rotateSpeed: number;
}

const configure = (parameters?: Parameters): Configuration => {
  return {
    enabled: parameters?.enabled ?? true,
    recursive: parameters?.recursive ?? false,
    transformGroup: parameters?.transformGroup ?? false,
    mode: parameters?.mode ?? 'translate',
    rotateSpeed: parameters?.rotateSpeed ?? 1,
  };
};

function updateLocation({ clientX, clientY }: PointerEvent, dom: HTMLElement) {
  const { left, top, width, height } = dom.getBoundingClientRect();

  _location.set((clientX - left) / width, (clientY - top) / height);
}

function findGroup(object: Object3D, group: Group | null = null) {
  if (object instanceof Group) group = object;

  if (object.parent === null) return group;

  return findGroup(object.parent, group);
}
