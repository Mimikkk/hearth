import { Plane } from '../../math/Plane.js';
import { Intersection, Raycaster } from '../../core/Raycaster.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec3 } from '../../math/Vec3.js';
import { Mat4 } from '../../math/Mat4.js';
import { Entity } from '../../core/Entity.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Group } from '@modules/renderer/engine/entities/Group.js';

export type AxisMode = 'world' | 'view' | 'local';
export type TransformMode = 'translate' | 'rotate';

interface Parameters {
  onHoverStart?: (object: Entity) => void;
  onHoverEnd?: (object: Entity) => void;
  onDragStart?: (object: Entity) => void;
  onDrag?: (object: Entity) => void;
  onDragEnd?: (object: Entity) => void;
  onClick?: (object: Entity) => void;
  useAxisX?: boolean;
  useAxisY?: boolean;
  useAxisZ?: boolean;
  useAxisMode?: AxisMode;
  mode?: TransformMode;
  enabled?: boolean;
  recursive?: boolean;
  transformGroup?: boolean;
  rotateSpeed?: number;
}

export class DragControls {
  onHoverStart?: (object: Entity) => void;
  onHoverEnd?: (object: Entity) => void;
  onDragStart?: (object: Entity) => void;
  onDrag?: (object: Entity) => void;
  onDragEnd?: (object: Entity) => void;
  onClick?: (object: Entity) => void;
  useAxisX: boolean;
  useAxisY: boolean;
  useAxisZ: boolean;
  useAxisMode: AxisMode;
  mode: TransformMode;
  enabled: boolean;
  recursive: boolean;
  transformGroup: boolean;
  rotateSpeed: number;

  #selected: Entity | null = null;
  #hovered: Entity | null = null;
  #intersections: Intersection[] = [];
  #raycaster: Raycaster = Raycaster.new();
  #pointer: Vec2 = Vec2.new();
  #previousPointer: Vec2 = Vec2.new();
  #plane: Plane = new Plane();
  #offset: Vec3 = Vec3.new();
  #intersection: Vec3 = Vec3.new();
  #worldPosition: Vec3 = Vec3.new();
  #inverseMatrix: Mat4 = new Mat4();
  #up: Vec3 = Vec3.new();
  #right: Vec3 = Vec3.new();
  #localDelta: Vec3 = Vec3.new();
  #cameraRight: Vec3 = Vec3.new();
  #cameraUp: Vec3 = Vec3.new();
  #cameraForward: Vec3 = Vec3.new();
  #deltaPosition: Vec3 = Vec3.new();
  #previousPosition: Vec3 = Vec3.new();
  #diff: Vec2 = Vec2.new();

  constructor(
    public objects: Entity[],
    public camera: ICamera,
    public dom: HTMLElement,
    parameters?: Parameters,
  ) {
    this.dom.style.touchAction = 'none';

    this.onHoverStart = parameters?.onHoverStart;
    this.onHoverEnd = parameters?.onHoverEnd;
    this.onDragStart = parameters?.onDragStart;
    this.onDrag = parameters?.onDrag;
    this.onDragEnd = parameters?.onDragEnd;
    this.onClick = parameters?.onClick;
    this.useAxisX = parameters?.useAxisX ?? true;
    this.useAxisY = parameters?.useAxisY ?? true;
    this.useAxisZ = parameters?.useAxisZ ?? true;
    this.useAxisMode = parameters?.useAxisMode ?? 'world';
    this.mode = parameters?.mode ?? 'translate';
    this.enabled = parameters?.enabled ?? true;
    this.recursive = parameters?.recursive ?? false;
    this.transformGroup = parameters?.transformGroup ?? false;
    this.rotateSpeed = parameters?.rotateSpeed ?? 1;

    this.activate();
  }

  activate(): void {
    this.dom.addEventListener('pointermove', this.#onPointerMove);
    this.dom.addEventListener('pointerdown', this.#onPointerDown);
    this.dom.addEventListener('pointerup', this.#onPointerCancel);
    this.dom.addEventListener('pointerleave', this.#onPointerCancel);
  }

  deactivate(): void {
    this.dom.removeEventListener('pointermove', this.#onPointerMove);
    this.dom.removeEventListener('pointerdown', this.#onPointerDown);
    this.dom.removeEventListener('pointerup', this.#onPointerCancel);
    this.dom.removeEventListener('pointerleave', this.#onPointerCancel);
    this.dom.style.cursor = '';
  }

  dispose(): void {
    this.deactivate();
  }

  #onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;

    this.#updatePointer(event);

    this.#raycaster.fromCamera(this.#pointer, this.camera);

    if (this.#selected) {
      if (this.mode === 'translate') {
        this.#handleTranslation();
      } else if (this.mode === 'rotate') {
        this.#handleRotation();
      }

      this.onDrag?.(this.#selected);
      this.#previousPointer.from(this.#pointer);
    } else {
      this.#handleHover(event);
    }

    this.#previousPointer.from(this.#pointer);
  };

  #onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;

    this.#updatePointer(event);

    this.#intersections.length = 0;

    this.#raycaster.fromCamera(this.#pointer, this.camera);
    this.#raycaster.intersects(this.objects, this.recursive, this.#intersections);

    if (this.#intersections.length > 0) {
      this.#selected = this.transformGroup
        ? this.#findGroup(this.#intersections[0].object)
        : this.#intersections[0].object;
      this.onClick?.(this.#selected!);

      this.#plane.fromNormalAndCoplanar(
        this.camera.getWorldDirection(this.#plane.normal),
        this.#worldPosition.fromMat4Position(this.#selected.matrixWorld),
      );

      if (this.#raycaster.ray.intersectPlane(this.#plane, this.#intersection)) {
        this.#handleDragStart();
      }

      this.dom.style.cursor = 'move';
      this.#previousPosition.from(this.#intersection);
      this.onDragStart?.(this.#selected!);
    }

    this.#previousPointer.from(this.#pointer);
  };

  #onPointerCancel = (): void => {
    if (!this.enabled) return;

    if (this.#selected) {
      this.onDragEnd?.(this.#selected);
      this.#selected = null;
    }

    this.dom.style.cursor = this.#hovered ? 'pointer' : 'auto';
  };

  #updatePointer(event: PointerEvent): void {
    const rect = this.dom.getBoundingClientRect();
    this.#pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.#pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  #findGroup(obj: Entity, group: Group | null = null): Group | null {
    if (Group.is(obj)) group = obj;
    if (!obj.parent) return group;
    return this.#findGroup(obj.parent, group);
  }

  #handleTranslation(): void {
    if (!this.#raycaster.ray.intersectPlane(this.#plane, this.#intersection)) return;
    switch (this.useAxisMode) {
      case 'world':
        return this.#handleWorldTranslation();
      case 'view':
        return this.#handleViewTranslation();
      case 'local':
        return this.#handleLocalTranslation();
    }
  }

  #handleWorldTranslation(): void {
    this.#localDelta.from(this.#intersection).sub(this.#previousPosition);

    if (!this.useAxisX) this.#localDelta.x = 0;
    if (!this.useAxisY) this.#localDelta.y = 0;
    if (!this.useAxisZ) this.#localDelta.z = 0;

    this.#selected!.position.add(this.#localDelta);
    this.#previousPosition.from(this.#intersection);
  }

  #handleViewTranslation(): void {
    this.#deltaPosition.from(this.#intersection).sub(this.#previousPosition);

    this.#cameraRight.fromMat4Column(this.camera.matrix, 0).normalize();
    this.#cameraUp.fromMat4Column(this.camera.matrix, 1).normalize();
    this.#cameraForward.fromMat4Column(this.camera.matrix, 2).normalize();

    const deltaX = this.#deltaPosition.dot(this.#cameraRight);
    const deltaY = this.#deltaPosition.dot(this.#cameraUp);
    const deltaZ = -this.#deltaPosition.dot(this.#cameraForward);

    if (this.useAxisX) this.#selected!.position.addScaled(this.#cameraRight, deltaX);
    if (this.useAxisY) this.#selected!.position.addScaled(this.#cameraUp, deltaY);
    if (this.useAxisZ) this.#selected!.position.addScaled(this.#cameraForward, deltaZ);

    this.#previousPosition.from(this.#intersection);
  }

  #handleLocalTranslation(): void {
    this.#deltaPosition.from(this.#intersection).sub(this.#previousPosition);

    const localRight = Vec3.new(1, 0, 0).applyQuaternion(this.#selected!.quaternion);
    const localUp = Vec3.new(0, 1, 0).applyQuaternion(this.#selected!.quaternion);
    const localForward = Vec3.new(0, 0, 1).applyQuaternion(this.#selected!.quaternion);

    const deltaX = this.#deltaPosition.dot(localRight);
    const deltaY = this.#deltaPosition.dot(localUp);
    const deltaZ = this.#deltaPosition.dot(localForward);

    if (this.useAxisX) this.#selected!.position.addScaled(localRight, deltaX);
    if (this.useAxisY) this.#selected!.position.addScaled(localUp, deltaY);
    if (this.useAxisZ) this.#selected!.position.addScaled(localForward, deltaZ);

    this.#previousPosition.from(this.#intersection);
  }

  #handleRotation(): void {
    this.#diff.asSub(this.#pointer, this.#previousPointer).scale(this.rotateSpeed);

    switch (this.useAxisMode) {
      case 'world':
        this.#handleWorldRotation();
        break;
      case 'view':
        this.#handleViewRotation();
        break;
      case 'local':
        this.#handleLocalRotation();
        break;
    }
  }

  #handleWorldRotation(): void {
    if (this.useAxisY) {
      const worldUp = Vec3.new(0, 1, 0);
      this.#selected!.rotateOnWorldAxis(worldUp, this.#diff.x);
    }
    if (this.useAxisX) {
      const worldRight = Vec3.new(1, 0, 0);
      this.#selected!.rotateOnWorldAxis(worldRight, -this.#diff.y);
    }
    if (this.useAxisZ) {
      const worldForward = Vec3.new(0, 0, 1);
      this.#selected!.rotateOnWorldAxis(worldForward, this.#diff.x + this.#diff.y);
    }
  }

  #handleViewRotation(): void {
    this.#cameraUp.fromMat4Column(this.camera.matrix, 1).normalize();
    this.#cameraRight.fromMat4Column(this.camera.matrix, 0).normalize();
    this.#cameraForward.fromMat4Column(this.camera.matrix, 2).normalize();

    if (this.useAxisY) {
      this.#selected!.rotateOnWorldAxis(this.#cameraUp, this.#diff.x);
    }
    if (this.useAxisX) {
      this.#selected!.rotateOnWorldAxis(this.#cameraRight, -this.#diff.y);
    }
    if (this.useAxisZ) {
      this.#selected!.rotateOnWorldAxis(this.#cameraForward, this.#diff.x + this.#diff.y);
    }
  }

  #handleLocalRotation(): void {
    if (this.useAxisY) {
      this.#selected!.rotateOnAxis(Vec3.new(0, 1, 0), this.#diff.x);
    }
    if (this.useAxisX) {
      this.#selected!.rotateOnAxis(Vec3.new(1, 0, 0), -this.#diff.y);
    }
    if (this.useAxisZ) {
      this.#selected!.rotateOnAxis(Vec3.new(0, 0, 1), this.#diff.x + this.#diff.y);
    }
  }

  #handleHover(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      this.#intersections.length = 0;

      this.#raycaster.fromCamera(this.#pointer, this.camera);
      this.#raycaster.intersects(this.objects, this.recursive, this.#intersections);

      if (this.#intersections.length > 0) {
        const object = this.#intersections[0].object;

        this.#plane.fromNormalAndCoplanar(
          this.camera.getWorldDirection(this.#plane.normal),
          this.#worldPosition.fromMat4Position(object.matrixWorld),
        );

        if (this.#hovered !== object && this.#hovered !== null) {
          this.onHoverEnd?.(this.#hovered);
          this.dom.style.cursor = 'auto';
          this.#hovered = null;
        }

        if (this.#hovered !== object) {
          this.onHoverStart?.(object);
          this.dom.style.cursor = 'pointer';
          this.#hovered = object;
        }
      } else {
        if (this.#hovered !== null) {
          this.onHoverEnd?.(this.#hovered);
          this.dom.style.cursor = 'auto';
          this.#hovered = null;
        }
      }
    }
  }

  #handleDragStart(): void {
    if (this.mode === 'translate') {
      this.#inverseMatrix.from(this.#selected!.parent!.matrixWorld).invert();
      this.#offset.from(this.#intersection).sub(this.#worldPosition.fromMat4Position(this.#selected!.matrixWorld));
    } else if (this.mode === 'rotate') {
      this.#up.set(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();
      this.#right.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    }
  }

  static attach(hearth: Hearth, camera: ICamera, objects: Entity[], parameters?: Parameters): DragControls {
    return new this(objects, camera, hearth.parameters.canvas, parameters);
  }
}
