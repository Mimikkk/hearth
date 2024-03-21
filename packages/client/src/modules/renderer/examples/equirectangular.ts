import * as THREE from '../threejs/Three.js';
import { texture, equirectUV } from '../jsm/nodes/Nodes.js';

import WebGPU from '../jsm/capabilities/WebGPU.js';
import WebGL from '../jsm/capabilities/WebGL.js';

import WebGPURenderer from '../jsm/renderers/webgpu/WebGPURenderer.js';

import { OrbitControls } from '../jsm/controls/OrbitControls.js';

let camera, scene, renderer;
let controls;

init();

function init() {
  if (WebGPU.isAvailable() === false && WebGL.isWebGL2Available() === false) {
    document.body.appendChild(WebGPU.getErrorMessage());

    throw new Error('No WebGPU or WebGL2 support');
  }

  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(1, 0, 0);

  const equirectTexture = new THREE.TextureLoader().load('textures/2294472375_24a3b8ef46_o.jpg');

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

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  controls.update();

  renderer.render(scene, camera);
}
