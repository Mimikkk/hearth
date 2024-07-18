import TextureNode from '../accessors/TextureNode.js';
import { nodeObject, vec2 } from '../shadernode/ShaderNodes.js';
import { NodeUpdateType } from '../core/constants.ts';
import { viewportTopLeft } from '../display/ViewportNode.ts';
import {
  Filter,
  Mat4,
  Object3D,
  Plane,
  RenderTarget,
  TextureDataType,
  Vec3,
  Vec4,
} from '@modules/renderer/engine/engine.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.ts';

const _reflectorPlane = new Plane();
const _normal = new Vec3();
const _reflectorWorldPosition = new Vec3();
const _cameraWorldPosition = new Vec3();
const _rotationMatrix = new Mat4();
const _lookAtPosition = new Vec3(0, 0, -1);
const clipPlane = new Vec4();

const _view = new Vec3();
const _target = new Vec3();
const _q = new Vec4();

const _size = Vec2.new();

const _defaultRT = new RenderTarget();
const _defaultUV = vec2(viewportTopLeft.x.oneMinus(), viewportTopLeft.y);

let _inReflector = false;

class ReflectorNode extends TextureNode {
  constructor(parameters = {}) {
    super(_defaultRT.texture, _defaultUV);

    const { target = new Object3D(), resolution = 1, generateMipmaps = false, bounces = true } = parameters;

    //

    this.target = target;
    this.resolution = resolution;
    this.generateMipmaps = generateMipmaps;
    this.bounces = bounces;

    this.updateBeforeType = bounces ? NodeUpdateType.RENDER : NodeUpdateType.FRAME;

    this.virtualCameras = new WeakMap();
    this.renderTargets = new WeakMap();
  }

  _updateResolution(renderTarget, renderer) {
    const resolution = this.resolution;

    renderer.getDrawingBufferSize(_size);

    renderTarget.setSize(Math.round(_size.x * resolution), Math.round(_size.y * resolution));
  }

  setup(builder) {
    this._updateResolution(_defaultRT, builder.renderer);

    return super.setup(builder);
  }

  getTextureNode() {
    return this.textureNode;
  }

  getVirtualCamera(camera) {
    let virtualCamera = this.virtualCameras.get(camera);

    if (virtualCamera === undefined) {
      virtualCamera = camera.clone();

      this.virtualCameras.set(camera, virtualCamera);
    }

    return virtualCamera;
  }

  getRenderTarget(camera) {
    let renderTarget = this.renderTargets.get(camera);

    if (renderTarget === undefined) {
      renderTarget = new RenderTarget(0, 0, { type: TextureDataType.HalfFloat });

      if (this.generateMipmaps === true) {
        renderTarget.texture.minFilter = Filter.LinearMipmapLinear;
        renderTarget.texture.generateMipmaps = true;
      }

      this.renderTargets.set(camera, renderTarget);
    }

    return renderTarget;
  }

  updateBefore(frame) {
    if (this.bounces === false && _inReflector) return false;

    _inReflector = true;

    const { scene, camera, renderer, material } = frame;
    const { target } = this;

    const virtualCamera = this.getVirtualCamera(camera);
    const renderTarget = this.getRenderTarget(virtualCamera);

    renderer.getDrawingBufferSize(_size);

    this._updateResolution(renderTarget, renderer);

    //

    _reflectorWorldPosition.fromMat4Position(target.matrixWorld);
    _cameraWorldPosition.fromMat4Position(camera.matrixWorld);

    _rotationMatrix.extractRotation(target.matrixWorld);

    _normal.set(0, 0, 1);
    _normal.applyMat4(_rotationMatrix);

    _view.subVectors(_reflectorWorldPosition, _cameraWorldPosition);

    // Avoid rendering when reflector is facing away

    if (_view.dot(_normal) > 0) return;

    _view.reflect(_normal).negate();
    _view.add(_reflectorWorldPosition);

    _rotationMatrix.extractRotation(camera.matrixWorld);

    _lookAtPosition.set(0, 0, -1);
    _lookAtPosition.applyMat4(_rotationMatrix);
    _lookAtPosition.add(_cameraWorldPosition);

    _target.subVectors(_reflectorWorldPosition, _lookAtPosition);
    _target.reflect(_normal).negate();
    _target.add(_reflectorWorldPosition);

    //

    virtualCamera.coordinateSystem = camera.coordinateSystem;
    virtualCamera.position.copy(_view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMat4(_rotationMatrix);
    virtualCamera.up.reflect(_normal);
    virtualCamera.lookAt(_target);

    virtualCamera.near = camera.near;
    virtualCamera.far = camera.far;

    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.from(camera.projectionMatrix);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
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

    // Calculate the scaled plane vector
    clipPlane.scale(1.0 / clipPlane.dot(_q));

    const clipBias = 0;

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z - clipBias;
    projectionMatrix.elements[14] = clipPlane.w;

    //

    this.value = renderTarget.texture;

    material.visible = false;

    const currentRenderTarget = renderer.getRenderTarget();

    renderer.setRenderTarget(renderTarget);

    renderer.render(scene, virtualCamera);

    renderer.setRenderTarget(currentRenderTarget);

    material.visible = true;

    _inReflector = false;
  }
}

export const reflector = parameters => nodeObject(new ReflectorNode(parameters));

export default ReflectorNode;
