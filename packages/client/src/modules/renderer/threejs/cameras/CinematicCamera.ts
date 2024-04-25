import { OrthographicCamera } from './OrthographicCamera.js';
import { Scene } from '../scenes/Scene.js';
import { WebGLRenderTarget } from '../renderers/WebGLRenderTarget.js';
import { BokehDepthShader, BokehShader, BokehShaderUniforms } from '../shaders/BokehShader2.js';
import { UniformsUtils } from '../renderers/shaders/UniformsUtils.js';
import { ShaderMaterial } from '../materials/ShaderMaterial.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { Mesh } from '../objects/Mesh.js';
import { PlaneGeometry } from '@modules/renderer/threejs/geometries/PlaneGeometry.js';
import type { WebGLRenderer } from '@modules/renderer/threejs/renderers/WebGLRenderer.js';

export class CinematicCamera extends PerspectiveCamera {
  declare type: string | 'CinematicCamera';

  postprocessing: {
    enabled: boolean;
    scene: Scene;
    camera: OrthographicCamera;
    rtTextureDepth: WebGLRenderTarget;
    rtTextureColor: WebGLRenderTarget;
    bokeh_uniforms: BokehShaderUniforms;
    bokeh_material: ShaderMaterial;
    quad: Mesh;
  };
  shaderSettings: {
    rings: number;
    samples: number;
  };
  materialDepth: ShaderMaterial;
  coc: number;
  aperture: number;
  fNumber: number;
  hyperFocal: number;
  filmGauge: number;

  constructor(fov: number, aspect: number, near: number, far: number) {
    super(fov, aspect, near, far);

    this.type = 'CinematicCamera';

    this.postprocessing = { enabled: true } as any;
    this.shaderSettings = {
      rings: 3,
      samples: 4,
    };

    const depthShader = BokehDepthShader;

    this.materialDepth = new ShaderMaterial({
      uniforms: depthShader.uniforms,
      vertexShader: depthShader.vertexShader,
      fragmentShader: depthShader.fragmentShader,
    });

    //@ts-expect-error
    this.materialDepth.uniforms['mNear'].value = near;
    //@ts-expect-error
    this.materialDepth.uniforms['mFar'].value = far;

    // In case of cinematicCamera, having a default lens set is important
    this.setLens();

    this.initPostProcessing();
  }

  // providing fnumber and coc(Circle of Confusion) as extra arguments
  // In case of cinematicCamera, having a default lens set is important
  // if fnumber and coc are not provided, cinematicCamera tries to act as a basic PerspectiveCamera
  setLens(focalLength: number = 35, filmGauge: number = 35, fNumber: number = 8, coc: number = 0.019): this {
    this.filmGaugeMM = filmGauge;

    this.setFocalLength(focalLength);

    this.fNumber = fNumber;
    this.coc = coc;

    // fNumber is focalLength by aperture
    this.aperture = focalLength / this.fNumber;

    // hyperFocal is required to calculate depthOfField when a lens tries to focus at a distance with given fNumber and focalLength
    this.hyperFocal = (focalLength * focalLength) / (this.aperture * this.coc);
    return this;
  }

  linearize(depth: number): number {
    const zfar = this.far;
    const znear = this.near;
    return (-zfar * znear) / (depth * (zfar - znear) - zfar);
  }

  smoothstep(near: number, far: number, depth: number): number {
    const x = this.saturate((depth - near) / (far - near));
    return x * x * (3 - 2 * x);
  }

  saturate(x: number): number {
    return Math.max(0, Math.min(1, x));
  }

  // function for focusing at a distance from the camera
  focusAt(focusDistance: number = 20): this {
    const focalLength = this.getFocalLength();

    // distance from the camera (normal to frustrum) to focus on
    this.focus = focusDistance;

    // the nearest point from the camera which is in focus (unused)
    this.nearPoint = (this.hyperFocal * this.focus) / (this.hyperFocal + (this.focus - focalLength));

    // the farthest point from the camera which is in focus (unused)
    this.farPoint = (this.hyperFocal * this.focus) / (this.hyperFocal - (this.focus - focalLength));

    // the gap or width of the space in which is everything is in focus (unused)
    this.depthOfField = this.farPoint - this.nearPoint;

    // Considering minimum distance of focus for a standard lens (unused)
    if (this.depthOfField < 0) this.depthOfField = 0;

    this.sdistance = this.smoothstep(this.near, this.far, this.focus);

    this.ldistance = this.linearize(1 - this.sdistance);

    this.postprocessing.bokeh_uniforms['focalDepth'].value = this.ldistance;
    return this;
  }

  nearPoint: number;
  farPoint: number;
  depthOfField: number;
  sdistance: number;
  ldistance: number;

  initPostProcessing(): this {
    if (this.postprocessing.enabled) {
      this.postprocessing.scene = new Scene();

      this.postprocessing.camera = new OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        -10000,
        10000,
      );

      this.postprocessing.scene.add(this.postprocessing.camera as any);

      this.postprocessing.rtTextureDepth = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
      this.postprocessing.rtTextureColor = new WebGLRenderTarget(window.innerWidth, window.innerHeight);

      const bokeh_shader = BokehShader;

      //@ts-expect-error
      this.postprocessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);

      this.postprocessing.bokeh_uniforms['tColor'].value = this.postprocessing.rtTextureColor.texture;
      this.postprocessing.bokeh_uniforms['tDepth'].value = this.postprocessing.rtTextureDepth.texture;

      this.postprocessing.bokeh_uniforms['manualdof'].value = 0;
      this.postprocessing.bokeh_uniforms['shaderFocus'].value = 0;

      this.postprocessing.bokeh_uniforms['fstop'].value = 2.8;

      this.postprocessing.bokeh_uniforms['showFocus'].value = 1;

      this.postprocessing.bokeh_uniforms['focalDepth'].value = 0.1;

      this.postprocessing.bokeh_uniforms['znear'].value = this.near;
      this.postprocessing.bokeh_uniforms['zfar'].value = this.near;

      this.postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;

      this.postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;

      this.postprocessing.bokeh_material = new ShaderMaterial({
        uniforms: this.postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
          RINGS: this.shaderSettings.rings,
          SAMPLES: this.shaderSettings.samples,
          DEPTH_PACKING: 1,
        },
      });

      this.postprocessing.quad = new Mesh(
        new PlaneGeometry(window.innerWidth, window.innerHeight),
        //@ts-expect-error
        this.postprocessing.bokeh_material,
      );
      this.postprocessing.quad.position.z = -500;
      this.postprocessing.scene.add(this.postprocessing.quad);
    }
    return this;
  }

  renderCinematic(scene: Scene, renderer: WebGLRenderer): this {
    if (this.postprocessing.enabled) {
      const currentRenderTarget = renderer.getRenderTarget();

      renderer.clear();

      // Render scene into texture

      scene.overrideMaterial = null;
      renderer.setRenderTarget(this.postprocessing.rtTextureColor);
      renderer.clear();
      renderer.render(scene, this);

      // Render depth into texture

      scene.overrideMaterial = this.materialDepth;
      renderer.setRenderTarget(this.postprocessing.rtTextureDepth);
      renderer.clear();
      renderer.render(scene, this);

      // Render bokeh composite

      renderer.setRenderTarget(null);
      renderer.render(this.postprocessing.scene, this.postprocessing.camera);

      renderer.setRenderTarget(currentRenderTarget);
    }

    return this;
  }
}
CinematicCamera.prototype.type = 'CinematicCamera';
