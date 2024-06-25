import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import PostProcessing from '@modules/renderer/engine/renderers/common/PostProcessing.js';

import { color, pass, rangeFog } from '@modules/renderer/engine/nodes/Nodes.js';

import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ToneMapping } from '@modules/renderer/engine/engine.js';

let camera, scene, renderer;
let postProcessing;

init();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  renderer = new Renderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = ToneMapping.ACESFilmic;
  container.appendChild(renderer.domElement);

  // post processing

  // render scene pass ( the same of css )
  const scenePass = pass(scene, camera);
  const scenePassViewZ = scenePass.getViewZNode();

  // background color
  const backgroundColor = color(0x0066ff);

  const fogFactor = rangeFog(null, 2.7, 4).context({ getViewZ: () => scenePassViewZ });

  // tone mapping scene pass
  const scenePassTM = scenePass.toneMapping(Engine.ToneMapping.ACESFilmic);

  // mix fog from fog factor and background color
  const compose = fogFactor.mix(scenePassTM, backgroundColor);

  postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = compose;

  //

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Engine.Mapping.EquirectangularReflection;

    scene.environment = texture;

    // model

    const loader = new GLTFLoader();
    loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
      scene.add(gltf.scene);

      render();
    });
  });

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.target.set(0, -0.1, -0.2);
  controls.update();
  controls.eventDispatcher.add('change', render); // use if there is no animation loop

  useWindowResizer(renderer, camera);
}

//

function render() {
  postProcessing.renderAsync();
}
