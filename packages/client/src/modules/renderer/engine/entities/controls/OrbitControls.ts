import { Ray } from '@modules/renderer/engine/math/Ray.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { DegreeToRadian } from '@modules/renderer/engine/math/MathUtils.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Mouse } from '@modules/renderer/engine/constants.js';
import { OrthographicCamera } from '@modules/renderer/engine/entities/cameras/OrthographicCamera.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

const _ray = new Ray();
const _plane = new Plane();
const TILT_LIMIT = Math.cos(70 * DegreeToRadian);

export class OrbitControls {
  onChange?: () => void;
  onStart?: () => void;
  onEnd?: () => void;

  enabled: boolean;
  target: Vec3;
  cursor: Vec3;
  minDistance: number;
  maxDistance: number;
  minZoom: number;
  maxZoom: number;
  minTargetRadius: number;
  maxTargetRadius: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
  enableDamping: boolean;
  dampingFactor: number;
  enableZoom: boolean;
  zoomSpeed: number;
  enableRotate: boolean;
  rotateSpeed: number;
  enablePan: boolean;
  panSpeed: number;
  screenSpacePanning: boolean;
  keyPanSpeed: number;
  zoomToCursor: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
  mouseButtons: { LEFT: Mouse; MIDDLE: Mouse; RIGHT: Mouse };
  target0: Vec3;
  position0: Vec3;
  zoom0: number;
  _domElementKeyEvents: HTMLElement | null;

  getPolarAngle: () => number;
  getAzimuthalAngle: () => number;
  getDistance: () => number;
  listenToKeyEvents: (domElement: HTMLElement) => void;
  stopListenToKeyEvents: () => void;
  saveState: () => void;
  reset: () => void;
  update: (deltaTime?: number) => boolean;
  dispose: () => void;

  constructor(
    public object: OrthographicCamera | PerspectiveCamera,
    public domElement: HTMLElement,
  ) {
    this.domElement.style.touchAction = 'none';

    this.enabled = true;

    this.target = Vec3.new();

    this.cursor = Vec3.new();

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.minZoom = 0;
    this.maxZoom = Infinity;

    this.minTargetRadius = 0;
    this.maxTargetRadius = Infinity;

    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;

    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;

    this.enableDamping = false;
    this.dampingFactor = 0.05;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7.0;
    this.zoomToCursor = false;

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;

    this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

    this.mouseButtons = { LEFT: Mouse.Rotate, MIDDLE: Mouse.Dolly, RIGHT: Mouse.Pan };

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    this._domElementKeyEvents = null;

    this.getPolarAngle = function () {
      return spherical.phi;
    };

    this.getAzimuthalAngle = function () {
      return spherical.theta;
    };

    this.getDistance = function () {
      return this.object.position.distanceTo(this.target);
    };

    this.listenToKeyEvents = function (domElement) {
      domElement.addEventListener('keydown', onKeyDown);
      this._domElementKeyEvents = domElement;
    };

    this.stopListenToKeyEvents = function () {
      this._domElementKeyEvents.removeEventListener('keydown', onKeyDown);
      this._domElementKeyEvents = null;
    };

    this.saveState = function () {
      scope.target0.from(scope.target);
      scope.position0.from(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };

    this.reset = function () {
      scope.target.from(scope.target0);
      scope.object.position.from(scope.position0);
      scope.object.zoom = scope.zoom0;

      scope.object.updateProjectionMatrix();
      scope.onChange?.();

      scope.update();

      state = STATE.NONE;
    };

    this.update = (function () {
      const offset = Vec3.new();

      const quat = Quaternion.fromUnit(object.up, Vec3.new(0, 1, 0));
      const quatInverse = quat.clone().invert();

      const lastPosition = Vec3.new();
      const lastQuaternion = Quaternion.new();
      const lastTargetPosition = Vec3.new();

      const twoPI = 2 * Math.PI;

      return function update(deltaTime = null!) {
        const position = scope.object.position;

        offset.from(position).sub(scope.target);

        offset.applyQuaternion(quat);

        spherical.fromCoord(offset);

        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle(deltaTime));
        }

        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor;
          spherical.phi += sphericalDelta.phi * scope.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }

        let min = scope.minAzimuthAngle;
        let max = scope.maxAzimuthAngle;

        if (isFinite(min) && isFinite(max)) {
          if (min < -Math.PI) min += twoPI;
          else if (min > Math.PI) min -= twoPI;

          if (max < -Math.PI) max += twoPI;
          else if (max > Math.PI) max -= twoPI;

          if (min <= max) {
            spherical.theta = Math.max(min, Math.min(max, spherical.theta));
          } else {
            spherical.theta =
              spherical.theta > (min + max) / 2 ? Math.max(min, spherical.theta) : Math.min(max, spherical.theta);
          }
        }

        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

        spherical.asClamp();

        if (scope.enableDamping === true) {
          scope.target.addScaled(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }

        scope.target.sub(scope.cursor);
        scope.target.clampLength(scope.minTargetRadius, scope.maxTargetRadius);
        scope.target.add(scope.cursor);

        let zoomChanged = false;

        if ((scope.zoomToCursor && performCursorZoom) || scope.object instanceof OrthographicCamera) {
          spherical.radius = clampDistance(spherical.radius);
        } else {
          const prevRadius = spherical.radius;
          spherical.radius = clampDistance(spherical.radius * scale);
          zoomChanged = prevRadius != spherical.radius;
        }

        offset.fromSpherical(spherical);

        offset.applyQuaternion(quatInverse);

        position.from(scope.target).add(offset);

        scope.object.lookAt(scope.target);

        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;

          panOffset.scale(1 - scope.dampingFactor);
        } else {
          sphericalDelta.set(0, 0, 0);

          panOffset.set(0, 0, 0);
        }

        if (scope.zoomToCursor && performCursorZoom) {
          let newRadius = null;
          if (scope.object instanceof PerspectiveCamera) {
            const prevRadius = offset.length();
            newRadius = clampDistance(prevRadius * scale);

            const radiusDelta = prevRadius - newRadius;
            scope.object.position.addScaled(dollyDirection, radiusDelta);
            scope.object.updateMatrixWorld();

            zoomChanged = !!radiusDelta;
          } else if (scope.object instanceof OrthographicCamera) {
            const mouseBefore = Vec3.new(mouse.x, mouse.y, 0);
            mouseBefore.unproject(scope.object);

            const prevZoom = scope.object.zoom;
            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / scale));
            scope.object.updateProjectionMatrix();

            zoomChanged = prevZoom !== scope.object.zoom;

            const mouseAfter = Vec3.new(mouse.x, mouse.y, 0);
            mouseAfter.unproject(scope.object);

            scope.object.position.sub(mouseAfter).add(mouseBefore);
            scope.object.updateMatrixWorld();

            newRadius = offset.length();
          }

          if (newRadius !== null) {
            if (this.screenSpacePanning) {
              scope.target
                .set(0, 0, -1)
                .transformDirection(scope.object.matrix)
                .scale(newRadius)
                .add(scope.object.position);
            } else {
              _ray.origin.from(scope.object.position);
              _ray.direction.set(0, 0, -1).transformDirection(scope.object.matrix);

              if (Math.abs(scope.object.up.dot(_ray.direction)) < TILT_LIMIT) {
                object.lookAt(scope.target);
              } else {
                _plane.fromNormalAndCoplanar(scope.object.up, scope.target);
                _ray.intersectPlane(_plane, scope.target);
              }
            }
          }
        } else if (scope.object instanceof OrthographicCamera) {
          const prevZoom = scope.object.zoom;
          scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / scale));

          if (prevZoom !== scope.object.zoom) {
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
          }
        }

        scale = 1;
        performCursorZoom = false;

        if (
          zoomChanged ||
          lastPosition.distanceSqTo(scope.object.position) > EPS ||
          8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS ||
          lastTargetPosition.distanceSqTo(scope.target) > EPS
        ) {
          scope.onChange?.();

          lastPosition.from(scope.object.position);
          lastQuaternion.from(scope.object.quaternion);
          lastTargetPosition.from(scope.target);

          return true;
        }

        return false;
      };
    })();

    this.dispose = function () {
      scope.domElement.removeEventListener('contextmenu', onContextMenu);

      scope.domElement.removeEventListener('pointerdown', onPointerDown);
      scope.domElement.removeEventListener('pointercancel', onPointerUp);
      scope.domElement.removeEventListener('wheel', onMouseWheel);

      scope.domElement.removeEventListener('pointermove', onPointerMove);
      scope.domElement.removeEventListener('pointerup', onPointerUp);

      const document = scope.domElement.getRootNode();

      document.removeEventListener('keydown', interceptControlDown, { capture: true });

      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown);
        scope._domElementKeyEvents = null;
      }
    };

    const scope = this;

    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
    };

    let state = STATE.NONE;

    const EPS = 0.000001;

    const spherical = new Spherical();
    const sphericalDelta = new Spherical();

    let scale = 1;
    const panOffset = Vec3.new();

    const rotateStart = Vec2.new();
    const rotateEnd = Vec2.new();
    const rotateDelta = Vec2.new();

    const panStart = Vec2.new();
    const panEnd = Vec2.new();
    const panDelta = Vec2.new();

    const dollyStart = Vec2.new();
    const dollyEnd = Vec2.new();
    const dollyDelta = Vec2.new();

    const dollyDirection = Vec3.new();
    const mouse = Vec2.new();
    let performCursorZoom = false;

    const pointers: number[] = [];
    const pointerPositions: Record<number, Vec2> = {};

    let controlActive = false;

    function getAutoRotationAngle(deltaTime: number | null) {
      if (deltaTime !== null) {
        return ((2 * Math.PI) / 60) * scope.autoRotateSpeed * deltaTime;
      } else {
        return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed;
      }
    }

    function getZoomScale(delta: number) {
      const normalizedDelta = Math.abs(delta * 0.01);
      return Math.pow(0.95, scope.zoomSpeed * normalizedDelta);
    }

    function rotateLeft(angle: number) {
      sphericalDelta.theta -= angle;
    }

    function rotateUp(angle: number) {
      sphericalDelta.phi -= angle;
    }

    const panLeft = (function () {
      const v = Vec3.new();

      return function panLeft(distance: number, objectMatrix: Mat4) {
        v.fromMat4Column(objectMatrix, 0);
        v.scale(-distance);

        panOffset.add(v);
      };
    })();

    const panUp = (function () {
      const v = Vec3.new();

      return function panUp(distance: number, objectMatrix: Mat4) {
        if (scope.screenSpacePanning === true) {
          v.fromMat4Column(objectMatrix, 1);
        } else {
          v.fromMat4Column(objectMatrix, 0);
          v.asCross(scope.object.up, v);
        }

        v.scale(distance);

        panOffset.add(v);
      };
    })();

    const pan = (function () {
      const offset = Vec3.new();

      return function pan(deltaX: number, deltaY: number) {
        const element = scope.domElement;

        if (scope.object instanceof PerspectiveCamera) {
          const position = scope.object.position;
          offset.from(position).sub(scope.target);
          let targetDistance = offset.length();

          targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0);

          panLeft((2 * deltaX * targetDistance) / element.clientHeight, scope.object.matrix);
          panUp((2 * deltaY * targetDistance) / element.clientHeight, scope.object.matrix);
        } else if (scope.object.isOrthographicCamera) {
          panLeft(
            (deltaX * (scope.object.right - scope.object.left)) / scope.object.zoom / element.clientWidth,
            scope.object.matrix,
          );
          panUp(
            (deltaY * (scope.object.top - scope.object.bottom)) / scope.object.zoom / element.clientHeight,
            scope.object.matrix,
          );
        } else {
          console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
          scope.enablePan = false;
        }
      };
    })();

    function dollyOut(dollyScale: number) {
      scale /= dollyScale;
    }

    function dollyIn(dollyScale: number) {
      scale *= dollyScale;
    }

    function updateZoomParameters(x: number, y: number) {
      if (!scope.zoomToCursor) {
        return;
      }

      performCursorZoom = true;

      const rect = scope.domElement.getBoundingClientRect();
      const dx = x - rect.left;
      const dy = y - rect.top;
      const w = rect.width;
      const h = rect.height;

      mouse.x = (dx / w) * 2 - 1;
      mouse.y = -(dy / h) * 2 + 1;

      dollyDirection.set(mouse.x, mouse.y, 1).unproject(scope.object).sub(scope.object.position).normalize();
    }

    function clampDistance(dist: number) {
      return Math.max(scope.minDistance, Math.min(scope.maxDistance, dist));
    }

    function handleMouseDownRotate(event: MouseEvent) {
      rotateStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownDolly(event: MouseEvent) {
      updateZoomParameters(event.clientX, event.clientX);
      dollyStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownPan(event: MouseEvent) {
      panStart.set(event.clientX, event.clientY);
    }

    function handleMouseMoveRotate(event: MouseEvent) {
      rotateEnd.set(event.clientX, event.clientY);

      rotateDelta.asSub(rotateEnd, rotateStart).scale(scope.rotateSpeed);

      const element = scope.domElement;

      rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight);

      rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);

      rotateStart.from(rotateEnd);

      scope.update();
    }

    function handleMouseMoveDolly(event: MouseEvent) {
      dollyEnd.set(event.clientX, event.clientY);

      dollyDelta.asSub(dollyEnd, dollyStart);

      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale(dollyDelta.y));
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale(dollyDelta.y));
      }

      dollyStart.from(dollyEnd);

      scope.update();
    }

    function handleMouseMovePan(event: MouseEvent) {
      panEnd.set(event.clientX, event.clientY);

      panDelta.asSub(panEnd, panStart).scale(scope.panSpeed);

      pan(panDelta.x, panDelta.y);

      panStart.from(panEnd);

      scope.update();
    }

    function handleMouseWheel(event: WheelEvent) {
      updateZoomParameters(event.clientX, event.clientY);

      if (event.deltaY < 0) {
        dollyIn(getZoomScale(event.deltaY));
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale(event.deltaY));
      }

      scope.update();
    }

    function handleKeyDown(event: KeyboardEvent) {
      let needsUpdate = false;

      switch (event.code) {
        case scope.keys.UP:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp((2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight);
          } else {
            pan(0, scope.keyPanSpeed);
          }

          needsUpdate = true;
          break;

        case scope.keys.BOTTOM:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp((-2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight);
          } else {
            pan(0, -scope.keyPanSpeed);
          }

          needsUpdate = true;
          break;

        case scope.keys.LEFT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft((2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight);
          } else {
            pan(scope.keyPanSpeed, 0);
          }

          needsUpdate = true;
          break;

        case scope.keys.RIGHT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft((-2 * Math.PI * scope.rotateSpeed) / scope.domElement.clientHeight);
          } else {
            pan(-scope.keyPanSpeed, 0);
          }

          needsUpdate = true;
          break;
      }

      if (needsUpdate) {
        event.preventDefault();

        scope.update();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (scope.enabled === false) return;

      if (pointers.length === 0) {
        scope.domElement.setPointerCapture(event.pointerId);

        scope.domElement.addEventListener('pointermove', onPointerMove);
        scope.domElement.addEventListener('pointerup', onPointerUp);
      }

      if (isTrackingPointer(event)) return;

      addPointer(event);

      onMouseDown(event);
    }

    function onPointerMove(event: PointerEvent) {
      if (scope.enabled === false) return;

      onMouseMove(event);
    }

    function onPointerUp(event: PointerEvent) {
      removePointer(event);

      switch (pointers.length) {
        case 0:
          scope.domElement.releasePointerCapture(event.pointerId);

          scope.domElement.removeEventListener('pointermove', onPointerMove);
          scope.domElement.removeEventListener('pointerup', onPointerUp);

          scope.onEnd?.();

          state = STATE.NONE;

          break;

        case 1:
          const pointerId = pointers[0];
          const position = pointerPositions[pointerId];

          break;
      }
    }

    function onMouseDown(event: MouseEvent) {
      let mouseAction;

      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT;
          break;

        case 1:
          mouseAction = scope.mouseButtons.MIDDLE;
          break;

        case 2:
          mouseAction = scope.mouseButtons.RIGHT;
          break;

        default:
          mouseAction = -1;
      }

      switch (mouseAction) {
        case Mouse.Dolly:
          if (scope.enableZoom === false) return;

          handleMouseDownDolly(event);

          state = STATE.DOLLY;

          break;

        case Mouse.Rotate:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enablePan === false) return;

            handleMouseDownPan(event);

            state = STATE.PAN;
          } else {
            if (scope.enableRotate === false) return;

            handleMouseDownRotate(event);

            state = STATE.ROTATE;
          }

          break;

        case Mouse.Pan:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enableRotate === false) return;

            handleMouseDownRotate(event);

            state = STATE.ROTATE;
          } else {
            if (scope.enablePan === false) return;

            handleMouseDownPan(event);

            state = STATE.PAN;
          }

          break;

        default:
          state = STATE.NONE;
      }

      if (state !== STATE.NONE) {
        scope.onStart?.();
      }
    }

    function onMouseMove(event: MouseEvent) {
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false) return;

          handleMouseMoveRotate(event);

          break;

        case STATE.DOLLY:
          if (scope.enableZoom === false) return;

          handleMouseMoveDolly(event);

          break;

        case STATE.PAN:
          if (scope.enablePan === false) return;

          handleMouseMovePan(event);

          break;
      }
    }

    function onMouseWheel(event: WheelEvent) {
      if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE) return;

      event.preventDefault();

      scope.onEnd?.();

      handleMouseWheel(customWheelEvent(event));

      scope?.onStart?.();
    }

    function customWheelEvent(event: WheelEvent): WheelEvent {
      const mode = event.deltaMode;

      const newEvent = {
        clientX: event.clientX,
        clientY: event.clientY,
        deltaY: event.deltaY,
      };

      switch (mode) {
        case 1:
          newEvent.deltaY *= 16;
          break;

        case 2:
          newEvent.deltaY *= 100;
          break;
      }

      if (event.ctrlKey && !controlActive) {
        newEvent.deltaY *= 10;
      }

      //@ts-expect-error
      return newEvent;
    }

    function interceptControlDown(event: KeyboardEvent) {
      if (event.key === 'Control') {
        controlActive = true;

        const document = scope.domElement.getRootNode();

        document.addEventListener('keyup', interceptControlUp, { passive: true, capture: true });
      }
    }

    function interceptControlUp(event: KeyboardEvent) {
      if (event.key === 'Control') {
        controlActive = false;

        const document = scope.domElement.getRootNode();

        //@ts-expect-error
        document.removeEventListener('keyup', interceptControlUp, { passive: true, capture: true });
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (scope.enabled === false || scope.enablePan === false) return;

      handleKeyDown(event);
    }

    function onContextMenu(event: Event) {
      if (scope.enabled === false) return;

      event.preventDefault();
    }

    function addPointer(event: PointerEvent) {
      pointers.push(event.pointerId);
    }

    function removePointer(event: PointerEvent) {
      delete pointerPositions[event.pointerId];

      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i] == event.pointerId) {
          pointers.splice(i, 1);
          return;
        }
      }
    }

    function isTrackingPointer(event: PointerEvent) {
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i] == event.pointerId) return true;
      }

      return false;
    }

    function trackPointer(event: PointerEvent) {
      let position = pointerPositions[event.pointerId];

      if (position === undefined) {
        position = Vec2.new();
        pointerPositions[event.pointerId] = position;
      }

      position.set(event.pageX, event.pageY);
    }

    function getSecondPointerPosition(event: PointerEvent) {
      const pointerId = event.pointerId === pointers[0] ? pointers[1] : pointers[0];

      return pointerPositions[pointerId];
    }

    scope.domElement.addEventListener('contextmenu', onContextMenu);

    scope.domElement.addEventListener('pointerdown', onPointerDown);
    scope.domElement.addEventListener('pointercancel', onPointerUp);
    scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

    const document = scope.domElement.getRootNode();

    document.addEventListener('keydown', interceptControlDown, { passive: true, capture: true });

    this.update();
  }
}
