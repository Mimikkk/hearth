import { EventDispatcher, Mat4, Mouse, OrthographicCamera, PerspectiveCamera, Ray, Vec3 } from '../engine.js';
import { DegreeToRadian } from '../math/MathUtils.js';
import { Quaternion } from '@modules/renderer/engine/math/Quaternion.js';
import { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

const _changeEvent = { type: 'change' } as const;
const _startEvent = { type: 'start' } as const;
const _endEvent = { type: 'end' } as const;
const _ray = new Ray();
const _plane = Plane.new();
const TILT_LIMIT = Math.cos(70 * DegreeToRadian);

export interface OrbitControlsEventMap {
  change: {};
  start: {};
  end: {};
}

export class OrbitControls {
  eventDispatcher = new EventDispatcher<OrbitControlsEventMap>();
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
    public object: PerspectiveCamera | OrthographicCamera,
    public domElement: HTMLElement,
  ) {
    this.domElement.style.touchAction = 'none'; // disable touch scroll

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vec3();

    // Sets the 3D cursor (similar to Blender), from which the maxTargetRadius takes effect
    this.cursor = new Vec3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0;
    this.maxZoom = Infinity;

    // Limit camera target within a spherical area around the cursor
    this.minTargetRadius = 0;
    this.maxTargetRadius = Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
    this.minAzimuthAngle = -Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.05;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    // Set to false to disable panning
    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
    this.keyPanSpeed = 7.0; // pixels moved per arrow key push
    this.zoomToCursor = false;

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

    // The four arrow keys
    this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

    // Mouse buttons
    this.mouseButtons = { LEFT: Mouse.Rotate, MIDDLE: Mouse.Dolly, RIGHT: Mouse.Pan };

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    // the target DOM element for key events
    this._domElementKeyEvents = null;

    //
    // public methods
    //

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
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };

    this.reset = function () {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;

      scope.object.updateProjectionMatrix();
      scope.eventDispatcher.dispatch(_changeEvent, this);

      scope.update();

      state = STATE.NONE;
    };

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = (function () {
      const offset = new Vec3();

      // so camera.up is the orbit axis
      const quat = Quaternion.fromUnit(object.up, new Vec3(0, 1, 0));
      const quatInverse = quat.clone().invert();

      const lastPosition = new Vec3();
      const lastQuaternion = Quaternion.identity();
      const lastTargetPosition = new Vec3();

      const twoPI = 2 * Math.PI;

      return function update(deltaTime = null!) {
        const position = scope.object.position;

        offset.from(position).sub(scope.target).applyQuaternion(quat);

        // angle from z-axis around y-axis
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

        // restrict theta to be between desired limits

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

        // restrict phi to be between desired limits
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
        spherical.clamp();

        // move target to panned location

        if (scope.enableDamping === true) {
          scope.target.addScaled(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }

        // Limit the target distance from the cursor to create a sphere around the center of interest
        scope.target.sub(scope.cursor);
        scope.target.clampLength(scope.minTargetRadius, scope.maxTargetRadius);
        scope.target.add(scope.cursor);

        let zoomChanged = false;
        // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
        // we adjust zoom later in these cases
        if ((scope.zoomToCursor && performCursorZoom) || scope.object instanceof OrthographicCamera) {
          spherical.radius = clampDistance(spherical.radius);
        } else {
          const prevRadius = spherical.radius;
          spherical.radius = clampDistance(spherical.radius * scale);
          zoomChanged = prevRadius != spherical.radius;
        }

        offset.fromSpherical(spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse);

        position.from(scope.target).add(offset);

        scope.object.lookAt(scope.target);

        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;

          panOffset.scale(1 - scope.dampingFactor);
        } else {
          sphericalDelta.clear();

          panOffset.set(0, 0, 0);
        }

        // adjust camera position
        if (scope.zoomToCursor && performCursorZoom) {
          let newRadius = null;
          if (scope.object instanceof PerspectiveCamera) {
            // move the camera down the pointer ray
            // this method avoids floating point error
            const prevRadius = offset.length();
            newRadius = clampDistance(prevRadius * scale);

            const radiusDelta = prevRadius - newRadius;
            scope.object.position.addScaled(dollyDirection, radiusDelta);
            scope.object.updateMatrixWorld();

            zoomChanged = !!radiusDelta;
          } else if (scope.object instanceof OrthographicCamera) {
            // adjust the ortho camera position based on zoom changes
            const mouseBefore = new Vec3(mouse.x, mouse.y, 0);
            mouseBefore.unproject(scope.object);

            const prevZoom = scope.object.zoom;
            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / scale));
            scope.object.updateProjectionMatrix();

            zoomChanged = prevZoom !== scope.object.zoom;

            const mouseAfter = new Vec3(mouse.x, mouse.y, 0);
            mouseAfter.unproject(scope.object);

            scope.object.position.sub(mouseAfter).add(mouseBefore);
            scope.object.updateMatrixWorld();

            newRadius = offset.length();
          }

          // handle the placement of the target
          if (newRadius !== null) {
            if (this.screenSpacePanning) {
              // position the orbit target in front of the new camera position
              scope.target
                .set(0, 0, -1)
                .transformDirection(scope.object.matrix)
                .scale(newRadius)
                .add(scope.object.position);
            } else {
              // get the ray and translation plane to compute target
              scope.object.position.from(_ray.origin);
              _ray.direction.set(0, 0, -1).transformDirection(scope.object.matrix);

              // if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
              // extremely large values
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

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (
          zoomChanged ||
          lastPosition.distanceSqTo(scope.object.position) > EPS ||
          8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS ||
          lastTargetPosition.distanceSqTo(scope.target) > EPS
        ) {
          scope.eventDispatcher.dispatch(_changeEvent, this);

          scope.object.position.from(lastPosition);
          scope.object.quaternion.from(lastQuaternion);
          scope.target.from(lastTargetPosition);
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

      const document = scope.domElement.getRootNode(); // offscreen canvas compatibility

      document.removeEventListener('keydown', interceptControlDown, { capture: true });

      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown);
        scope._domElementKeyEvents = null;
      }
    };

    //
    // internals
    //

    const scope = this;

    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
    };

    let state = STATE.NONE;

    const EPS = 0.000001;

    // current position in spherical coordinates
    const spherical = Spherical.empty();
    const sphericalDelta = Spherical.empty();

    let scale = 1;
    const panOffset = new Vec3();

    const rotateStart = Vec2.new();
    const rotateEnd = Vec2.new();
    const rotateDelta = Vec2.new();

    const panStart = Vec2.new();
    const panEnd = Vec2.new();
    const panDelta = Vec2.new();

    const dollyStart = Vec2.new();
    const dollyEnd = Vec2.new();
    const dollyDelta = Vec2.new();

    const dollyDirection = new Vec3();
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
      const v = new Vec3();

      return function panLeft(distance: number, objectMatrix: Mat4) {
        v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        v.multiplyScalar(-distance);

        panOffset.add(v);
      };
    })();

    const panUp = (function () {
      const v = new Vec3();

      return function panUp(distance: number, objectMatrix: Mat4) {
        if (scope.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1);
        } else {
          v.setFromMatrixColumn(objectMatrix, 0);
          v.crossVectors(scope.object.up, v);
        }

        v.multiplyScalar(distance);

        panOffset.add(v);
      };
    })();

    // deltaX and deltaY are in pixels; right and down are positive
    const pan = (function () {
      const offset = new Vec3();

      return function pan(deltaX: number, deltaY: number) {
        const element = scope.domElement;

        if (scope.object instanceof PerspectiveCamera) {
          // perspective
          const position = scope.object.position;
          offset.copy(position).sub(scope.target);
          let targetDistance = offset.length();

          // half of the fov is center to top of screen
          targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0);

          // we use only clientHeight here so aspect ratio does not distort speed
          panLeft((2 * deltaX * targetDistance) / element.clientHeight, scope.object.matrix);
          panUp((2 * deltaY * targetDistance) / element.clientHeight, scope.object.matrix);
        } else if (scope.object instanceof OrthographicCamera) {
          // orthographic
          panLeft(
            (deltaX * (scope.object.right - scope.object.left)) / scope.object.zoom / element.clientWidth,
            scope.object.matrix,
          );
          panUp(
            (deltaY * (scope.object.top - scope.object.bottom)) / scope.object.zoom / element.clientHeight,
            scope.object.matrix,
          );
        } else {
          // camera neither orthographic nor perspective
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

    //
    // event callbacks - update the object state
    //

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

      Vec2.into(rotateDelta, rotateEnd).sub(rotateStart).scale(scope.rotateSpeed);

      const element = scope.domElement;

      rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight); // yes, height

      rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);

      Vec2.into(rotateStart, rotateEnd);

      scope.update();
    }

    function handleMouseMoveDolly(event: MouseEvent) {
      dollyEnd.set(event.clientX, event.clientY);

      Vec2.into(dollyDelta, dollyEnd).sub(dollyStart);

      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale(dollyDelta.y));
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale(dollyDelta.y));
      }

      Vec2.into(dollyStart, dollyEnd);

      scope.update();
    }

    function handleMouseMovePan(event: MouseEvent) {
      panEnd.set(event.clientX, event.clientY);

      Vec2.into(panDelta, panEnd).sub(panStart).scale(scope.panSpeed);

      pan(panDelta.x, panDelta.y);

      Vec2.into(panStart, panEnd);

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
        // prevent the browser from scrolling on cursor keys
        event.preventDefault();

        scope.update();
      }
    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onPointerDown(event: PointerEvent) {
      if (scope.enabled === false) return;

      if (pointers.length === 0) {
        scope.domElement.setPointerCapture(event.pointerId);

        scope.domElement.addEventListener('pointermove', onPointerMove);
        scope.domElement.addEventListener('pointerup', onPointerUp);
      }

      //

      if (isTrackingPointer(event)) return;

      //

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

          scope.eventDispatcher.dispatch(_endEvent, this);

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
        scope.eventDispatcher.dispatch(_startEvent, this);
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

      scope.eventDispatcher.dispatch(_startEvent, this);

      handleMouseWheel(customWheelEvent(event));

      scope.eventDispatcher.dispatch(_endEvent, this);
    }

    function customWheelEvent(event: WheelEvent): WheelEvent {
      const mode = event.deltaMode;

      // minimal wheel event altered to meet delta-zoom demand
      const newEvent = {
        clientX: event.clientX,
        clientY: event.clientY,
        deltaY: event.deltaY,
      };

      switch (mode) {
        case 1: // LINE_MODE
          newEvent.deltaY *= 16;
          break;

        case 2: // PAGE_MODE
          newEvent.deltaY *= 100;
          break;
      }

      // detect if event was triggered by pinching
      if (event.ctrlKey && !controlActive) {
        newEvent.deltaY *= 10;
      }

      //@ts-expect-error
      return newEvent;
    }

    function interceptControlDown(event: KeyboardEvent) {
      if (event.key === 'Control') {
        controlActive = true;

        const document = scope.domElement.getRootNode(); // offscreen canvas compatibility

        document.addEventListener('keyup', interceptControlUp, { passive: true, capture: true });
      }
    }

    function interceptControlUp(event: KeyboardEvent) {
      if (event.key === 'Control') {
        controlActive = false;

        const document = scope.domElement.getRootNode(); // offscreen canvas compatibility

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

    //

    scope.domElement.addEventListener('contextmenu', onContextMenu);

    scope.domElement.addEventListener('pointerdown', onPointerDown);
    scope.domElement.addEventListener('pointercancel', onPointerUp);
    scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false });

    const document = scope.domElement.getRootNode(); // offscreen canvas compatibility

    document.addEventListener('keydown', interceptControlDown, { passive: true, capture: true });

    // force an update at start

    this.update();
  }
}
