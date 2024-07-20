import { Camera, Material, Mat3, Mat4, Plane, Vec4 } from '@modules/renderer/engine/engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

const _plane = new Plane();
const _viewNormalMatrix = new Mat3();

let _clippingContextVersion = 0;

export class ClippingContext {
  version: number;
  globalClippingCount: number;
  localClippingCount: number;
  localClippingEnabled: boolean;
  localClipIntersection: boolean;
  planes: Vec4[];
  parentVersion: number;
  viewMatrix: Mat4 | null;

  constructor() {
    this.version = ++_clippingContextVersion;

    this.globalClippingCount = 0;

    this.localClippingCount = 0;
    this.localClippingEnabled = false;
    this.localClipIntersection = false;

    this.planes = [];

    this.parentVersion = 0;
  }

  projectPlanes(source: Plane[], offset: number) {
    const l = source.length;
    const planes = this.planes;

    for (let i = 0; i < l; i++) {
      _plane.copy(source[i]).applyMat4(this.viewMatrix!, _viewNormalMatrix);

      const v = planes[offset + i];
      const normal = _plane.normal;

      v.x = -normal.x;
      v.y = -normal.y;
      v.z = -normal.z;
      v.w = _plane.constant;
    }
  }

  updateGlobal(renderer: Renderer, camera: Camera) {
    const rendererClippingPlanes = renderer.parameters.clippingPlanes;
    this.viewMatrix = camera.matrixWorldInverse;

    _viewNormalMatrix.getNormalMatrix(this.viewMatrix!);

    let update = false;

    if (Array.isArray(rendererClippingPlanes) && rendererClippingPlanes.length !== 0) {
      const l = rendererClippingPlanes.length;

      if (l !== this.globalClippingCount) {
        const planes = [];

        for (let i = 0; i < l; i++) {
          planes.push(new Vec4());
        }

        this.globalClippingCount = l;
        this.planes = planes;

        update = true;
      }

      this.projectPlanes(rendererClippingPlanes, 0);
    } else if (this.globalClippingCount !== 0) {
      this.globalClippingCount = 0;
      this.planes = [];
      update = true;
    }

    if (renderer.parameters.localClippingEnabled !== this.localClippingEnabled) {
      this.localClippingEnabled = renderer.parameters.localClippingEnabled;
      update = true;
    }

    if (update) this.version = _clippingContextVersion++;
  }

  update(parent: ClippingContext, material: Material) {
    let update = false;

    if (this !== parent && parent.version !== this.parentVersion) {
      this.globalClippingCount = material.isShadowNodeMaterial ? 0 : parent.globalClippingCount;
      this.localClippingEnabled = parent.localClippingEnabled;
      this.planes = Array.from(parent.planes);
      this.parentVersion = parent.version;
      this.viewMatrix = parent.viewMatrix;

      update = true;
    }

    if (this.localClippingEnabled) {
      const localClippingPlanes = material.clippingPlanes;

      if (Array.isArray(localClippingPlanes) && localClippingPlanes.length !== 0) {
        const l = localClippingPlanes.length;
        const planes = this.planes;
        const offset = this.globalClippingCount;

        if (update || l !== this.localClippingCount) {
          planes.length = offset + l;

          for (let i = 0; i < l; i++) {
            planes[offset + i] = new Vec4();
          }

          this.localClippingCount = l;
          update = true;
        }

        this.projectPlanes(localClippingPlanes, offset);
      } else if (this.localClippingCount !== 0) {
        this.localClippingCount = 0;
        update = true;
      }

      if (this.localClipIntersection !== material.clipIntersection) {
        this.localClipIntersection = material.clipIntersection;
        update = true;
      }
    }

    if (update) this.version = _clippingContextVersion++;
  }
}

export default ClippingContext;
