import * as Engine from '@modules/renderer/engine/engine.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
//import { GUI } from 'lil-gui';

import {
  NodeMaterial,
  mix,
  modelNormalMatrix,
  normalGeometry,
  normalize,
  outputStruct,
  step,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec4,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { QuadMesh } from '@modules/renderer/engine/objects/QuadMesh.js';
import { Filter } from '@modules/renderer/engine/engine.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, torus;
let quadMesh, renderTarget;

/*

 const parameters = {
 samples: 4,
 wireframe: false
 };

 const gui = new GUI();
 gui.add( parameters, 'samples', 0, 4 ).step( 1 );
 gui.add( parameters, 'wireframe' );
 gui.onChange( render );

 */

class WriteGBufferMaterial extends NodeMaterial {
  constructor(diffuseTexture) {
    super();

    this.lights = false;
    this.fog = false;
    this.colorSpaced = false;

    this.diffuseTexture = diffuseTexture;

    const vUv = varying(uv());

    const transformedNormal = modelNormalMatrix.mul(normalGeometry);
    const vNormal = varying(normalize(transformedNormal));

    const repeat = uniform(vec2(5, 0.5));

    const gColor = texture(this.diffuseTexture, vUv.mul(repeat));
    const gNormal = vec4(normalize(vNormal), 1.0);

    this.fragmentNode = outputStruct(gColor, gNormal);
  }
}

class ReadGBufferMaterial extends NodeMaterial {
  constructor(tDiffuse, tNormal) {
    super();

    this.lights = false;
    this.fog = false;

    const vUv = varying(uv());

    const diffuse = texture(tDiffuse, vUv);
    const normal = texture(tNormal, vUv);

    this.fragmentNode = mix(diffuse, normal, step(0.5, vUv.x));
  }
}

init();

async function init() {
  renderer = await Renderer.create();
  renderer.setAnimationLoop(render);
  document.body.appendChild(renderer.parameters.canvas);

  // Create a multi render target with Float buffers

  renderTarget = new Engine.RenderTarget(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio,
    { count: 2, minFilter: Engine.Filter.Nearest, magFilter: Engine.Filter.Nearest },
  );

  // Name our G-Buffer attachments for debugging

  renderTarget.textures[0].name = 'diffuse';
  renderTarget.textures[1].name = 'normal';

  // Scene setup

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x222222);

  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.z = 4;

  const loader = new TextureLoader();

  const diffuse = await loader.loadAsync('resources/textures/hardwood2_diffuse.jpg', render);
  diffuse.colorSpace = Engine.ColorSpace.SRGB;
  diffuse.wrapS = Engine.Wrapping.Repeat;
  diffuse.wrapT = Engine.Wrapping.Repeat;

  torus = new Engine.Mesh(new Engine.TorusKnotGeometry(1, 0.3, 128, 32), new WriteGBufferMaterial(diffuse));

  scene.add(torus);

  // PostProcessing setup

  quadMesh = new QuadMesh(new ReadGBufferMaterial(renderTarget.textures[0], renderTarget.textures[1]));

  // Controls

  new OrbitControls(camera, renderer.parameters.canvas);

  useWindowResizer(renderer, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    const dpr = renderer.getPixelRatio();
    renderTarget.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  });
}

function render(time) {
  /*

   // Feature not yet working

   renderTarget.samples = parameters.samples;

   scene.traverse( function ( child ) {

   if ( child.material !== undefined ) {

   child.material.wireframe = parameters.wireframe;

   }

   } );

   */

  torus.setRotationY((time / 1000) * 0.4);

  // render scene into target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);

  // render post FX
  renderer.setRenderTarget(null);
  quadMesh.render(renderer);
}
