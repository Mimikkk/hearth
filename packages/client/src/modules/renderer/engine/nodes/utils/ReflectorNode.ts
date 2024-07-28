import TextureNode from '../accessors/TextureNode.js';
import { asNode, vec2 } from '../shadernode/ShaderNodes.js';
import { NodeUpdateType } from '../core/constants.js';
import { viewportTopLeft } from '../display/ViewportNode.js';
import {
  Entity,
  Filter,
  Mat4,
  Plane,
  RenderTarget,
  TextureDataType,
  Vec2,
  Vec3,
  Vec4,
} from '@modules/renderer/engine/engine.js';

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

class ReflectorNode extends TextureNode {
  constructor(parameters = {}) {
    super(_defaultRT.texture, _defaultUV);

    const { target = new Entity(), resolution = 1, generateMipmaps = false, bounces = true } = parameters;

    //

    this.target = target;
    this.resolution = resolution;
    this.generateMipmaps = generateMipmaps;
    this.bounces = bounces;

    this.updateBeforeType = bounces ? NodeUpdateType.Render : NodeUpdateType.Frame;

    this.virtualCameras = new WeakMap();
    this.renderTargets = new WeakMap();
  }

  _updateResolution(renderTarget, renderer) {
    const resolution = this.resolution;

    renderer.getDrawSize(_size);

    renderTarget.setSize(Math.round(_size.width * resolution), Math.round(_size.height * resolution));
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

    renderer.getDrawSize(_size);

    this._updateResolution(renderTarget, renderer);

    //

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

    //

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

    //

    this.value = renderTarget.texture;

    material.visible = false;

    const currentRenderTarget = renderer.target;

    renderer.updateRenderTarget(renderTarget);

    renderer.render(scene, virtualCamera);

    renderer.updateRenderTarget(currentRenderTarget);

    material.visible = true;

    _inReflector = false;
  }
}

export const reflector = parameters => asNode(new ReflectorNode(parameters));

export default ReflectorNode;
