import { Plane, Plane_ } from '../math/Plane.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3, Vec3 } from '../math/Vec3.js';
import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
import { EventDispatcher } from '../core/EventDispatcher.js';
import { Camera } from '../cameras/Camera.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _location = Vec2.new();
const _offset = new Vec3();
const _diff = Vec2.new();
const _previousPointer = Vec2.new();
const _intersection = new Vec3();
const _world = new Vec3();
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

      _raycaster.fromCamera(_location, camera);

      if (selected) {
        if (this.configuration.mode === 'translate') {
          if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
            selected.position.from(_intersection.sub(_offset).applyMat4(_inverseMatrix));
          }
        } else if (this.configuration.mode === 'rotate') {
          const { x, y } = _diff.from(_location).sub(_previousPointer).scale(this.configuration.rotateSpeed);

          Vec3.normalize(_right);
          selected.rotateOnWorldAxis(_up, x);
          selected.rotateOnWorldAxis(_right, -y);
        }

        this.events.dispatch({ type: 'drag', object: selected }, event);

        Vec2.clone(_location, _previousPointer);
      } else {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
          intersections.length = 0;

          _raycaster.fromCamera(_location, camera);
          _raycaster.intersects(draggable, this.configuration.recursive, intersections);

          if (intersections.length > 0) {
            const object = intersections[0].object;

            _plane.fromNormalAndCoplanar(
              camera.getWorldDirection(_plane.normal),
              _world.fromMat4Position(object.matrixWorld),
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

      _raycaster.fromCamera(_location, camera);
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
          _world.fromMat4Position(selected!.matrixWorld),
        );

        if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
          if (this.configuration.mode === 'translate') {
            _inverseMatrix.from(selected!.parent!.matrixWorld).invert();

            _offset.from(_intersection).sub(_world.fromMat4Position(selected!.matrixWorld));
          } else if (this.configuration.mode === 'rotate') {
            _up.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
            _right.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
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
