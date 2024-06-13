import * as THREE from '../threejs/Three.js';
import { texture, equirectUV } from '../threejs/nodes/Nodes.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { TextureLoader } from '@modules/renderer/threejs/loaders/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let controls;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(1, 0, 0);

  const equirectTexture = await new TextureLoader().loadAsync('textures/2294472375_24a3b8ef46_o.jpg');

  scene = new THREE.Scene();
  scene.backgroundNode = texture(equirectTexture, equirectUV(), 0);

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.rotateSpeed = -0.125; // negative, to track mouse pointer
  controls.autoRotateSpeed = 1.0;

  useWindowResizer(renderer, camera);
}

function render() {
  controls.update();

  renderer.render(scene, camera);
}
