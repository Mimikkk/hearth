import { TextureNode } from '../accessors/TextureNode.js';
import { asCommand, vec2 } from '../shadernode/ShaderNode.primitves.ts';
import { NodeUpdateStage } from '../core/constants.js';
import { viewportTopLeft } from '../display/ViewportNode.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { RenderTarget } from '@modules/renderer/engine/hearth/core/RenderTarget.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { TextureDataType } from '@modules/renderer/engine/constants.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

const _reflectorPlane = new Plane();
const _normal = Vec3.new();
const _reflectorWorldPosition = Vec3.new();
const _cameraWorldPosition = Vec3.new();
const _rotationMatrix = new Mat4();
const _lookAtPosition = Vec3.new(0, 0, -1);
const clipPlane = Vec4.new();

const _view = Vec3.new();
const _target = Vec3.new();
const _q = Vec4.new();

const _size = Vec2.new();

const _defaultRT = new RenderTarget();
const _defaultUV = vec2(viewportTopLeft.x.oneMinus(), viewportTopLeft.y);

let _inReflector = false;

interface Parameters {
  target?: Entity;
  resolution?: number;
  useMipmap?: boolean;
  bounces?: boolean;
}

export class ReflectorNode extends TextureNode {
  target: Entity;
  resolution: number;
  useMipmap: boolean;
  bounces: boolean;
  virtualCameras: WeakMap<ICamera, ICamera>;
  renderTargets: WeakMap<ICamera, RenderTarget>;

  constructor(parameters?: Parameters) {
    super(_defaultRT.texture, _defaultUV);

    this.target = parameters?.target ?? new Entity();
    this.resolution = parameters?.resolution ?? 1;
    this.useMipmap = parameters?.useMipmap ?? false;
    this.bounces = parameters?.bounces ?? true;

    this.updateBeforeType = this.bounces ? NodeUpdateStage.Render : NodeUpdateStage.Frame;

    this.virtualCameras = new WeakMap();
    this.renderTargets = new WeakMap();
  }

  _updateResolution(renderTarget: RenderTarget, hearth: Hearth) {
    const resolution = this.resolution;

    hearth.getDrawSize(_size);

    renderTarget.setSize(Math.round(_size.width * resolution), Math.round(_size.height * resolution));
  }

  setup(builder: NodeBuilder): void {
    this._updateResolution(_defaultRT, builder.hearth);

    return super.setup(builder);
  }

  getVirtualCamera(camera: ICamera): ICamera {
    let virtualCamera = this.virtualCameras.get(camera);

    if (virtualCamera === undefined) {
      virtualCamera = camera.clone();

      this.virtualCameras.set(camera, virtualCamera);
    }

    return virtualCamera;
  }

  getRenderTarget(camera: ICamera): RenderTarget {
    let renderTarget = this.renderTargets.get(camera);

    if (renderTarget === undefined) {
      renderTarget = new RenderTarget(0, 0, { type: TextureDataType.HalfFloat });

      if (this.useMipmap) {
        renderTarget.texture.minFilter = GPUFilterModeType.Linear;
        renderTarget.texture.useMipmap = true;
      }

      this.renderTargets.set(camera, renderTarget);
    }

    return renderTarget;
  }

  updateBefore(frame: NodeFrame) {
    if (!this.bounces && _inReflector) return false;

    _inReflector = true;

    const { scene, camera, hearth, material } = frame;
    const { target } = this;

    const virtualCamera = this.getVirtualCamera(camera);
    const renderTarget = this.getRenderTarget(virtualCamera);

    hearth.getDrawSize(_size);

    this._updateResolution(renderTarget, hearth);

    _reflectorWorldPosition.fromMat4Position(target.matrixWorld);
    _cameraWorldPosition.fromMat4Position(camera.matrixWorld);

    _rotationMatrix.fromMat4Rotation(target.matrixWorld);

    _normal.set(0, 0, 1);
    _normal.applyMat4(_rotationMatrix);

    _view.asSub(_reflectorWorldPosition, _cameraWorldPosition);

    if (_view.dot(_normal) > 0) return;

    _view.reflect(_normal).negate();
    _view.add(_reflectorWorldPosition);

    _rotationMatrix.fromMat4Rotation(camera.matrixWorld);

    _lookAtPosition.set(0, 0, -1);
    _lookAtPosition.applyMat4(_rotationMatrix);
    _lookAtPosition.add(_cameraWorldPosition);

    _target.asSub(_reflectorWorldPosition, _lookAtPosition);
    _target.reflect(_normal).negate();
    _target.add(_reflectorWorldPosition);

    virtualCamera.position.from(_view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMat4(_rotationMatrix);
    virtualCamera.up.reflect(_normal);
    virtualCamera.lookAt(_target);

    virtualCamera.near = camera.near;
    virtualCamera.far = camera.far;

    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.from(camera.projectionMatrix);

    _reflectorPlane.fromNormalAndCoplanar(_normal, _reflectorWorldPosition);
    _reflectorPlane.applyMat4(virtualCamera.matrixWorldInverse);

    clipPlane.set(
      _reflectorPlane.normal.x,
      _reflectorPlane.normal.y,
      _reflectorPlane.normal.z,
      _reflectorPlane.constant,
    );

    const projectionMatrix = virtualCamera.projectionMatrix;

    _q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    _q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    _q.z = -1.0;
    _q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    clipPlane.mulScalar(1.0 / clipPlane.dot(_q));

    const clipBias = 0;

    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z - clipBias;
    projectionMatrix.elements[14] = clipPlane.w;

    this.value = renderTarget.texture;

    material.visible = false;

    const currentRenderTarget = hearth.target;

    hearth.updateRenderTarget(renderTarget);

    hearth.render(scene, virtualCamera);

    hearth.updateRenderTarget(currentRenderTarget);

    material.visible = true;

    _inReflector = false;
  }
}

export const reflector = asCommand(ReflectorNode);
