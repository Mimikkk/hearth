import * as THREE from '../threejs/Three.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { RGBELoader } from '../threejs/loaders/RGBELoader.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { GLTFLoader } from '../threejs/loaders/GLTFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();
render();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new THREE.Scene();

  RGBELoader.loadAsync('textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = THREE.Mapping.EquirectangularReflection;
    //texture.minFilter = THREE.LinearMipmapLinearFilter;
    //texture.generateMipmaps = true;

    scene.background = texture;
    scene.environment = texture;

    render();

    // model

    const loader = new GLTFLoader();
    loader.loadAsync('models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(gltf => {
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

  useWindowResizer(renderer, camera, () => {
    useWindowResizer.updateSize(renderer, camera);
    render();
  });
}

function render() {
  renderer.renderAsync(scene, camera);
}
