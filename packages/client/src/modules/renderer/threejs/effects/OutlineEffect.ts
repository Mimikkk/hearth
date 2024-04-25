import { WebGLRenderer } from '../renderers/WebGLRenderer.js';
import { Color } from '../math/Color.js';
import { ShaderMaterial } from '../materials/ShaderMaterial.js';
import { UniformsUtils } from '../renderers/shaders/UniformsUtils.js';
import { UniformsLib } from '../renderers/shaders/UniformsLib.js';
import { Side } from '../constants.js';
import { Vector4 } from '../math/Vector4.js';
import { Vector2 } from '../math/Vector2.js';
import { Scene } from '../scenes/Scene.js';
import { Camera } from '../cameras/Camera.js';
import { WebGLRenderTarget } from '../renderers/WebGLRenderTarget.js';
import { WebGLShadowMap } from '../renderers/webgl/WebGLShadowMap.js';
import { Material } from '@modules/renderer/threejs/materials/Material.js';
import { Object3D } from '@modules/renderer/threejs/core/Object3D.js';
import { BufferGeometry } from '@modules/renderer/threejs/core/BufferGeometry.js';

export interface OutlineEffectParameters {
  defaultThickness?: number;
  defaultColor?: number[];
  defaultAlpha?: number;
  defaultKeepAlive?: boolean;
}

export class OutlineEffect {
  enabled: boolean;
  autoClear: boolean;
  domElement: HTMLElement;
  shadowMap: WebGLShadowMap;

  constructor(renderer: WebGLRenderer, parameters: OutlineEffectParameters = {}) {
    this.enabled = true;

    const defaultThickness = parameters.defaultThickness !== undefined ? parameters.defaultThickness : 0.003;
    const defaultColor = new Color().fromArray(
      parameters.defaultColor !== undefined ? parameters.defaultColor : [0, 0, 0],
    );
    const defaultAlpha = parameters.defaultAlpha !== undefined ? parameters.defaultAlpha : 1.0;
    const defaultKeepAlive = parameters.defaultKeepAlive !== undefined ? parameters.defaultKeepAlive : false;

    // object.material.uuid -> outlineMaterial or
    // object.material[ n ].uuid -> outlineMaterial
    // save at the outline material creation and release
    // if it's unused removeThresholdCount frames
    // unless keepAlive is true.
    const cache: Record<string, ShaderMaterial> = {};

    const removeThresholdCount = 60;

    // outlineMaterial.uuid -> object.material or
    // outlineMaterial.uuid -> object.material[ n ]
    // save before render and release after render.
    const originalMaterials = {};

    // object.uuid -> originalOnBeforeRender
    // save before render and release after render.
    const originalOnBeforeRenders = {};

    //this.cache = cache;  // for debug

    const uniformsOutline = {
      outlineThickness: { value: defaultThickness },
      outlineColor: { value: defaultColor },
      outlineAlpha: { value: defaultAlpha },
    };

    const vertexShader = [
      '#include <common>',
      '#include <uv_pars_vertex>',
      '#include <displacementmap_pars_vertex>',
      '#include <fog_pars_vertex>',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',
      '#include <logdepthbuf_pars_vertex>',
      '#include <clipping_planes_pars_vertex>',

      'uniform float outlineThickness;',

      'vec4 calculateOutline( vec4 pos, vec3 normal, vec4 skinned ) {',
      '	float thickness = outlineThickness;',
      '	const float ratio = 1.0;', // TODO: support outline thickness ratio for each vertex
      '	vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + normal, 1.0 );',
      // NOTE: subtract pos2 from pos because Side.Back objectNormal is negative
      '	vec4 norm = normalize( pos - pos2 );',
      '	return pos + norm * thickness * pos.w * ratio;',
      '}',

      'void main() {',

      '	#include <uv_vertex>',

      '	#include <beginnormal_vertex>',
      '	#include <morphnormal_vertex>',
      '	#include <skinbase_vertex>',
      '	#include <skinnormal_vertex>',

      '	#include <begin_vertex>',
      '	#include <morphtarget_vertex>',
      '	#include <skinning_vertex>',
      '	#include <displacementmap_vertex>',
      '	#include <project_vertex>',

      '	vec3 outlineNormal = - objectNormal;', // the outline material is always rendered with Side.Back

      '	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( transformed, 1.0 ) );',

      '	#include <logdepthbuf_vertex>',
      '	#include <clipping_planes_vertex>',
      '	#include <fog_vertex>',

      '}',
    ].join('\n');

    const fragmentShader = [
      '#include <common>',
      '#include <fog_pars_fragment>',
      '#include <logdepthbuf_pars_fragment>',
      '#include <clipping_planes_pars_fragment>',

      'uniform vec3 outlineColor;',
      'uniform float outlineAlpha;',

      'void main() {',

      '	#include <clipping_planes_fragment>',
      '	#include <logdepthbuf_fragment>',

      '	gl_FragColor = vec4( outlineColor, outlineAlpha );',

      '	#include <tonemapping_fragment>',
      '	#include <colorspace_fragment>',
      '	#include <fog_fragment>',
      '	#include <premultiplied_alpha_fragment>',

      '}',
    ].join('\n');

    function createMaterial() {
      return new ShaderMaterial({
        type: 'OutlineEffect',
        uniforms: UniformsUtils.merge([UniformsLib['fog'], UniformsLib['displacementmap'], uniformsOutline]),
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: Side.Back,
      });
    }

    function getOutlineMaterialFromCache(originalMaterial: Material) {
      let data = cache[originalMaterial.uuid];

      if (data === undefined) {
        data = {
          //@ts-expect-error
          material: createMaterial(),
          used: true,
          keepAlive: defaultKeepAlive,
          count: 0,
        };

        cache[originalMaterial.uuid] = data;
      }

      //@ts-expect-error
      data.used = true;

      //@ts-expect-error
      return data.material;
    }

    function getOutlineMaterial(originalMaterial: Material) {
      const outlineMaterial = getOutlineMaterialFromCache(originalMaterial);

      originalMaterials[outlineMaterial.uuid] = originalMaterial;

      updateOutlineMaterial(outlineMaterial, originalMaterial);

      return outlineMaterial;
    }

    function isCompatible(object: Object3D) {
      const geometry = object.geometry;
      const hasNormals = geometry !== undefined && geometry.attributes.normal !== undefined;

      return object.isMesh === true && object.material !== undefined && hasNormals === true;
    }

    function setOutlineMaterial(object: Object3D) {
      if (isCompatible(object) === false) return;

      if (Array.isArray(object.material)) {
        for (let i = 0, il = object.material.length; i < il; i++) {
          object.material[i] = getOutlineMaterial(object.material[i]);
        }
      } else {
        object.material = getOutlineMaterial(object.material);
      }

      originalOnBeforeRenders[object.uuid] = object.onBeforeRender;
      object.onBeforeRender = onBeforeRender;
    }

    function restoreOriginalMaterial(object: Object3D) {
      if (isCompatible(object) === false) return;

      if (Array.isArray(object.material)) {
        for (let i = 0, il = object.material.length; i < il; i++) {
          object.material[i] = originalMaterials[object.material[i].uuid];
        }
      } else {
        object.material = originalMaterials[object.material.uuid];
      }

      object.onBeforeRender = originalOnBeforeRenders[object.uuid];
    }

    function onBeforeRender(
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      material: Material,
    ) {
      const originalMaterial = originalMaterials[material.uuid];

      // just in case
      if (originalMaterial === undefined) return;

      updateUniforms(material, originalMaterial);
    }

    function updateUniforms(material: Material, originalMaterial: Material) {
      const outlineParameters = originalMaterial.userData.outlineParameters;

      material.uniforms.outlineAlpha.value = originalMaterial.opacity;

      if (outlineParameters !== undefined) {
        if (outlineParameters.thickness !== undefined)
          material.uniforms.outlineThickness.value = outlineParameters.thickness;
        if (outlineParameters.color !== undefined)
          material.uniforms.outlineColor.value.fromArray(outlineParameters.color);
        if (outlineParameters.alpha !== undefined) material.uniforms.outlineAlpha.value = outlineParameters.alpha;
      }

      if (originalMaterial.displacementMap) {
        material.uniforms.displacementMap.value = originalMaterial.displacementMap;
        material.uniforms.displacementScale.value = originalMaterial.displacementScale;
        material.uniforms.displacementBias.value = originalMaterial.displacementBias;
      }
    }

    function updateOutlineMaterial(material: Material, originalMaterial: Material) {
      if (material.name === 'invisible') return;

      const outlineParameters = originalMaterial.userData.outlineParameters;

      material.fog = originalMaterial.fog;
      material.toneMapped = originalMaterial.toneMapped;
      material.premultipliedAlpha = originalMaterial.premultipliedAlpha;
      material.displacementMap = originalMaterial.displacementMap;

      if (outlineParameters !== undefined) {
        if (originalMaterial.visible === false) {
          material.visible = false;
        } else {
          material.visible = outlineParameters.visible !== undefined ? outlineParameters.visible : true;
        }

        material.transparent =
          outlineParameters.alpha !== undefined && outlineParameters.alpha < 1.0 ? true : originalMaterial.transparent;

        if (outlineParameters.keepAlive !== undefined)
          cache[originalMaterial.uuid].keepAlive = outlineParameters.keepAlive;
      } else {
        material.transparent = originalMaterial.transparent;
        material.visible = originalMaterial.visible;
      }

      if (originalMaterial.wireframe === true || originalMaterial.depthTest === false) material.visible = false;

      if (originalMaterial.clippingPlanes) {
        material.clipping = true;

        material.clippingPlanes = originalMaterial.clippingPlanes;
        material.clipIntersection = originalMaterial.clipIntersection;
        material.clipShadows = originalMaterial.clipShadows;
      }

      material.version = originalMaterial.version; // update outline material if necessary
    }

    function cleanupCache() {
      let keys;

      // clear originialMaterials
      keys = Object.keys(originalMaterials);

      for (let i = 0, il = keys.length; i < il; i++) {
        originalMaterials[keys[i]] = undefined;
      }

      // clear originalOnBeforeRenders
      keys = Object.keys(originalOnBeforeRenders);

      for (let i = 0, il = keys.length; i < il; i++) {
        originalOnBeforeRenders[keys[i]] = undefined;
      }

      // remove unused outlineMaterial from cache
      keys = Object.keys(cache);

      for (let i = 0, il = keys.length; i < il; i++) {
        const key = keys[i];

        if (cache[key].used === false) {
          cache[key].count++;

          if (cache[key].keepAlive === false && cache[key].count > removeThresholdCount) {
            delete cache[key];
          }
        } else {
          cache[key].used = false;
          cache[key].count = 0;
        }
      }
    }

    this.render = function (scene, camera) {
      if (this.enabled === false) {
        renderer.render(scene, camera);
        return;
      }

      const currentAutoClear = renderer.autoClear;
      renderer.autoClear = this.autoClear;

      renderer.render(scene, camera);

      renderer.autoClear = currentAutoClear;

      this.renderOutline(scene, camera);
    };

    this.renderOutline = function (scene, camera) {
      const currentAutoClear = renderer.autoClear;
      const currentSceneAutoUpdate = scene.matrixWorldAutoUpdate;
      const currentSceneBackground = scene.background;
      const currentShadowMapEnabled = renderer.shadowMap.enabled;

      scene.matrixWorldAutoUpdate = false;
      scene.background = null;
      renderer.autoClear = false;
      renderer.shadowMap.enabled = false;

      scene.traverse(setOutlineMaterial);

      renderer.render(scene, camera);

      scene.traverse(restoreOriginalMaterial);

      cleanupCache();

      scene.matrixWorldAutoUpdate = currentSceneAutoUpdate;
      scene.background = currentSceneBackground;
      renderer.autoClear = currentAutoClear;
      renderer.shadowMap.enabled = currentShadowMapEnabled;
    };

    /*
     * See #9918
     *
     * The following property copies and wrapper methods enable
     * OutlineEffect to be called from other *Effect, like
     *
     * effect = new StereoEffect( new OutlineEffect( renderer ) );
     *
     * function render () {
     *
     * 	effect.render( scene, camera );
     *
     * }
     */
    this.autoClear = renderer.autoClear;
    this.domElement = renderer.domElement;
    this.shadowMap = renderer.shadowMap;

    this.clear = function (color, depth, stencil) {
      renderer.clear(color, depth, stencil);
    };

    this.getPixelRatio = function () {
      return renderer.getPixelRatio();
    };

    this.setPixelRatio = function (value) {
      renderer.setPixelRatio(value);
    };

    this.getSize = function (target) {
      return renderer.getSize(target);
    };

    this.setSize = function (width, height, updateStyle) {
      renderer.setSize(width, height, updateStyle);
    };

    this.setViewport = function (x, y, width, height) {
      renderer.setViewport(x, y, width, height);
    };

    this.setScissor = function (x, y, width, height) {
      renderer.setScissor(x, y, width, height);
    };

    this.setScissorTest = function (boolean) {
      renderer.setScissorTest(boolean);
    };

    this.setRenderTarget = function (renderTarget) {
      renderer.setRenderTarget(renderTarget);
    };
  }

  clear: (color?: boolean, depth?: boolean, stencil?: boolean) => void;
  getPixelRatio: () => number;
  getSize: (target: Vector2) => Vector2;
  render: (scene: Scene, camera: Camera) => void;
  renderOutline: (scene: Scene, camera: Camera) => void;
  setRenderTarget: (renderTarget: WebGLRenderTarget | null) => void;
  setPixelRatio: (value: number) => void;
  setScissor: (x: Vector4 | number, y?: number, width?: number, height?: number) => void;
  setScissorTest: (enable: boolean) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  setViewport: (x: Vector4 | number, y?: number, width?: number, height?: number) => void;
}
