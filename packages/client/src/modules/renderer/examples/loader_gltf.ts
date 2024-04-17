import * as THREE from '../threejs/Three.js';

import WebGPU from '@modules/renderer/threejs/capabilities/WebGPU.js';
import WebGL from '@modules/renderer/threejs/capabilities/WebGL.js';

import WebGPURenderer from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { RGBELoader } from '../threejs/loaders/RGBELoader.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { GLTFLoader } from '../threejs/loaders/GLTFLoader.js';

let camera, scene, renderer;

init();
render();

function init() {
  if (WebGPU.isAvailable() === false && WebGL.isWebGL2Available() === false) {
    document.body.appendChild(WebGPU.getErrorMessage());

    throw new Error('No WebGPU or WebGL2 support');
  }

  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new THREE.Scene();

  new RGBELoader().setPath('textures/equirectangular/').load('royal_esplanade_1k.hdr', function (texture) {
    texture.mapping = THREE.Mapping.EquirectangularReflection;
    //texture.minFilter = THREE.LinearMipmapLinearFilter;
    //texture.generateMipmaps = true;

    scene.background = texture;
    scene.environment = texture;

    render();

    // model

    const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF/');
    loader.load('DamagedHelmet.gltf', function (gltf) {
      scene.add(gltf.scene);

      render();
    });
  });

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ToneMapping.ACESFilmic;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.eventDispatcher.add('change', render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

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
  renderer.renderAsync(scene, camera);
}
