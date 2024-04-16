import * as THREE from '../threejs/Three.js';

import WebGPURenderer from '../jsm/renderers/webgpu/WebGPURenderer.js';
import PostProcessing from '../jsm/renderers/common/PostProcessing.js';

import { pass, color, rangeFog } from '../jsm/nodes/Nodes.js';

import { RGBELoader } from '../jsm/loaders/RGBELoader.js';

import { OrbitControls } from '../jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let postProcessing;

init();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new THREE.Scene();

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.toneMapping = THREE.ToneMapping.ACESFilmic; // apply tone mapping in post processing
  container.appendChild(renderer.domElement);

  // post processing

  // render scene pass ( the same of css )
  const scenePass = pass(scene, camera);
  const scenePassViewZ = scenePass.getViewZNode();

  // background color
  const backgroundColor = color(0x0066ff);

  // get fog factor from scene pass context
  // equivalent to: scene.fog = new THREE.Fog( 0x0066ff, 2.7, 4 );
  const fogFactor = rangeFog(null, 2.7, 4).context({ getViewZ: () => scenePassViewZ });

  // tone mapping scene pass
  const scenePassTM = scenePass.toneMapping(THREE.ToneMapping.ACESFilmic);

  // mix fog from fog factor and background color
  const compose = fogFactor.mix(scenePassTM, backgroundColor);

  postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = compose;

  //

  new RGBELoader().setPath('textures/equirectangular/').load('royal_esplanade_1k.hdr', function (texture) {
    texture.mapping = THREE.Mapping.EquirectangularReflection;

    scene.environment = texture;

    // model

    const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');
    loader.load('DamagedHelmet.gltf', function (gltf) {
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

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

//

function render() {
  postProcessing.renderAsync();
}
