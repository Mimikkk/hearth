import { Revision } from './constants.ts';

export { WebGLArrayRenderTarget } from './renderers/WebGLArrayRenderTarget.js';
export { WebGL3DRenderTarget } from './renderers/WebGL3DRenderTarget.js';
export { WebGLCubeRenderTarget } from './renderers/WebGLCubeRenderTarget.js';
export { WebGLRenderTarget } from './renderers/WebGLRenderTarget.js';
export { WebGLRenderer } from './renderers/WebGLRenderer.js';
export { ShaderLib } from './renderers/shaders/ShaderLib.js';
export { UniformsLib } from './renderers/shaders/UniformsLib.js';
export { UniformsUtils } from './renderers/shaders/UniformsUtils.js';
export { ShaderChunk } from './renderers/shaders/ShaderChunk.js';
export { FogExp2 } from './scenes/FogExp2.ts';
export { Fog } from './scenes/Fog.ts';
export { Scene } from './scenes/Scene.ts';
export { Sprite } from './objects/Sprite.js';
export { LOD } from './objects/LOD.js';
export { SkinnedMesh } from './objects/SkinnedMesh.js';
export { Skeleton } from './objects/Skeleton.js';
export { Bone } from './objects/Bone.js';
export { Mesh } from './objects/Mesh.js';
export { InstancedMesh } from './objects/InstancedMesh.js';
export { BatchedMesh } from './objects/BatchedMesh.js';
export { LineSegments } from './objects/LineSegments.js';
export { LineLoop } from './objects/LineLoop.js';
export { Line } from './objects/Line.js';
export { Points } from './objects/Points.js';
export { Group } from './objects/Group.js';
export { VideoTexture } from './textures/VideoTexture.js';
export { FramebufferTexture } from './textures/FramebufferTexture.js';
export { Source } from './textures/Source.js';
export { DataTexture } from './textures/DataTexture.js';
export { DataArrayTexture } from './textures/DataArrayTexture.js';
export { Data3DTexture } from './textures/Data3DTexture.js';
export { CompressedTexture } from './textures/CompressedTexture.js';
export { CompressedArrayTexture } from './textures/CompressedArrayTexture.js';
export { CompressedCubeTexture } from './textures/CompressedCubeTexture.js';
export { CubeTexture } from './textures/CubeTexture.js';
export { CanvasTexture } from './textures/CanvasTexture.js';
export { DepthTexture } from './textures/DepthTexture.js';
export { Texture } from './textures/Texture.js';
export * from './geometries/Geometries.js';
export * from './materials/Materials.js';
export { AnimationLoader } from './loaders/AnimationLoader.js';
export { CompressedTextureLoader } from './loaders/CompressedTextureLoader.js';
export { CubeTextureLoader } from './loaders/CubeTextureLoader.js';
export { DataTextureLoader } from './loaders/DataTextureLoader.js';
export { TextureLoader } from './loaders/TextureLoader.js';
export { ObjectLoader } from './loaders/ObjectLoader.js';
export { MaterialLoader } from './loaders/MaterialLoader.js';
export { BufferGeometryLoader } from './loaders/BufferGeometryLoader.js';
export { DefaultLoadingManager, LoadingManager } from './loaders/LoadingManager.js';
export { ImageLoader } from './loaders/ImageLoader.js';
export { ImageBitmapLoader } from './loaders/ImageBitmapLoader.js';
export { FileLoader } from './loaders/FileLoader.js';
export { Loader } from './loaders/Loader.js';
export { LoaderUtils } from './loaders/LoaderUtils.js';
export { Cache } from './loaders/Cache.js';
export { AudioLoader } from './loaders/AudioLoader.js';
export { SpotLight } from './lights/SpotLight.js';
export { PointLight } from './lights/PointLight.js';
export { RectAreaLight } from './lights/RectAreaLight.js';
export { HemisphereLight } from './lights/HemisphereLight.js';
export { DirectionalLight } from './lights/DirectionalLight.js';
export { AmbientLight } from './lights/AmbientLight.js';
export { Light } from './lights/Light.js';
export { LightProbe } from './lights/LightProbe.js';
export { StereoCamera } from './cameras/StereoCamera.js';
export { PerspectiveCamera } from './cameras/PerspectiveCamera.js';
export { OrthographicCamera } from './cameras/OrthographicCamera.js';
export { CubeCamera } from './cameras/CubeCamera.js';
export { ArrayCamera } from './cameras/ArrayCamera.js';
export { Camera } from './cameras/Camera.js';
export { AudioListener } from './audio/AudioListener.ts';
export { PositionalAudio } from './audio/PositionalAudio.ts';
export { AudioContextManager } from './audio/AudioContextManager.ts';
export { AudioAnalyser } from './audio/AudioAnalyser.ts';
export { Audio } from './audio/Audio.ts';
export { VectorKeyframeTrack } from './animation/tracks/VectorKeyframeTrack.js';
export { StringKeyframeTrack } from './animation/tracks/StringKeyframeTrack.js';
export { QuaternionKeyframeTrack } from './animation/tracks/QuaternionKeyframeTrack.js';
export { NumberKeyframeTrack } from './animation/tracks/NumberKeyframeTrack.js';
export { ColorKeyframeTrack } from './animation/tracks/ColorKeyframeTrack.js';
export { BooleanKeyframeTrack } from './animation/tracks/BooleanKeyframeTrack.js';
export { PropertyMixer } from './animation/PropertyMixer.js';
export { PropertyBinding } from './animation/PropertyBinding.js';
export { KeyframeTrack } from './animation/KeyframeTrack.js';
export { AnimationUtils } from './animation/AnimationUtils.js';
export { AnimationObjectGroup } from './animation/AnimationObjectGroup.js';
export { AnimationMixer } from './animation/AnimationMixer.js';
export { AnimationClip } from './animation/AnimationClip.js';
export { AnimationAction } from './animation/AnimationAction.js';
export { RenderTarget } from './core/RenderTarget.ts';
export { Uniform } from './core/Uniform.ts';
export { UniformsGroup } from './core/UniformsGroup.ts';
export { InstancedBufferGeometry } from './core/InstancedBufferGeometry.ts';
export { BufferGeometry } from './core/BufferGeometry.ts';
export { InterleavedBufferAttribute } from './core/InterleavedBufferAttribute.ts';
export { InstancedInterleavedBuffer } from './core/InstancedInterleavedBuffer.ts';
export { InterleavedBuffer } from './core/InterleavedBuffer.ts';
export { InstancedBufferAttribute } from './core/InstancedBufferAttribute.ts';
export * from './core/BufferAttribute.ts';
export { Object3D } from './core/Object3D.ts';
export { Raycaster } from './core/Raycaster.ts';
export { Layers } from './core/Layers.ts';
export { EventDispatcher } from './core/EventDispatcher.ts';
export { Clock } from './core/Clock.ts';
export { QuaternionLinearInterpolant } from './math/interpolants/QuaternionLinearInterpolant.ts';
export { LinearInterpolant } from './math/interpolants/LinearInterpolant.ts';
export { DiscreteInterpolant } from './math/interpolants/DiscreteInterpolant.ts';
export { CubicInterpolant } from './math/interpolants/CubicInterpolant.ts';
export { Interpolant } from './math/Interpolant.ts';
export { Triangle } from './math/Triangle.ts';
export * as MathUtils from './math/MathUtils.ts';
export { Spherical } from './math/Spherical.ts';
export { Cylindrical } from './math/Cylindrical.ts';
export { Plane } from './math/Plane.ts';
export { Frustum } from './math/Frustum.ts';
export { Sphere } from './math/Sphere.ts';
export { Ray } from './math/Ray.ts';
export { Matrix4 } from './math/Matrix4.ts';
export { Matrix3 } from './math/Matrix3.ts';
export { Box3 } from './math/Box3.ts';
export { Box2 } from './math/Box2.ts';
export { Line3 } from './math/Line3.ts';
export { Euler } from './math/Euler.ts';
export { Vector4 } from './math/Vector4.ts';
export { Vector3 } from './math/Vector3.ts';
export { Vector2 } from './math/Vector2.ts';
export { Quaternion } from './math/Quaternion.ts';
export { Color } from './math/Color.ts';
export { ColorManagement } from './math/ColorManagement.ts';
export { SphericalHarmonics3 } from './math/SphericalHarmonics3.ts';
export { SpotLightHelper } from './helpers/SpotLightHelper.js';
export { SkeletonHelper } from './helpers/SkeletonHelper.js';
export { PointLightHelper } from './helpers/PointLightHelper.js';
export { HemisphereLightHelper } from './helpers/HemisphereLightHelper.js';
export { GridHelper } from './helpers/GridHelper.js';
export { PolarGridHelper } from './helpers/PolarGridHelper.js';
export { DirectionalLightHelper } from './helpers/DirectionalLightHelper.js';
export { CameraHelper } from './helpers/CameraHelper.js';
export { BoxHelper } from './helpers/BoxHelper.js';
export { Box3Helper } from './helpers/Box3Helper.js';
export { PlaneHelper } from './helpers/PlaneHelper.js';
export { ArrowHelper } from './helpers/ArrowHelper.js';
export { AxesHelper } from './helpers/AxesHelper.js';
export * from './extras/curves/Curves.js';
export { Shape } from './extras/core/Shape.js';
export { Path } from './extras/core/Path.js';
export { ShapePath } from './extras/core/ShapePath.js';
export { CurvePath } from './extras/core/CurvePath.js';
export { Curve } from './extras/core/Curve.js';
export { DataUtils } from './extras/DataUtils.ts';
export { ImageUtils } from './extras/ImageUtils.ts';
export { ShapeUtils } from './extras/ShapeUtils.ts';
export { PMREMGenerator } from './extras/PMREMGenerator.js';
export { WebGLUtils } from './renderers/webgl/WebGLUtils.js';
export { createCanvasElement } from './utils.ts';
export * from './constants.ts';

if (typeof __THREE_DEVTOOLS__ !== 'undefined') {
  __THREE_DEVTOOLS__.dispatchEvent(
    new CustomEvent('register', {
      detail: {
        revision: Revision,
      },
    }),
    this,
  );
}

if (typeof window !== 'undefined') {
  if (window.__THREE__) {
    console.warn('WARNING: Multiple instances of Three.js being imported.');
  } else {
    window.__THREE__ = Revision;
  }
}
