import * as THREE from '../threejs/Three.js';
import { float, mix, oscSine, pmremTexture, timerLocal, toneMapping } from '../threejs/nodes/Nodes.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { RGBMLoader } from '../threejs/loaders/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { GLTFLoader } from '../threejs/loaders/GLTFLoader.js';

let camera, scene, renderer;

init();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new THREE.Scene();

  const rgbmUrls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
  const cube1Texture = new RGBMLoader({
    path: './textures/cube/pisaRGBM16/',
  })
    .setMaxRange(16)
    .loadCubemap(rgbmUrls);

  cube1Texture.generateMipmaps = true;
  cube1Texture.minFilter = THREE.Filter.LinearMipmapLinear;

  const cube2Urls = [
    'dark-s_px.jpg',
    'dark-s_nx.jpg',
    'dark-s_py.jpg',
    'dark-s_ny.jpg',
    'dark-s_pz.jpg',
    'dark-s_nz.jpg',
  ];
  const cube2Texture = new THREE.CubeTextureLoader({ path: './textures/cube/MilkyWay/' }).load(cube2Urls);

  cube2Texture.generateMipmaps = true;
  cube2Texture.minFilter = THREE.Filter.LinearMipmapLinear;

  scene.environmentNode = mix(pmremTexture(cube2Texture), pmremTexture(cube1Texture), oscSine(timerLocal(0.1)));

  scene.backgroundNode = scene.environmentNode.context({
    getTextureLevel: () => float(0.5),
  });

  const loader = new GLTFLoader({ path: 'models/gltf/DamagedHelmet/glTF/' });
  loader.load('DamagedHelmet.gltf', function (gltf) {
    scene.add(gltf.scene);
  });

  renderer = new WebGPURenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMappingNode = toneMapping(THREE.ToneMapping.Linear, 1);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function render() {
  renderer.render(scene, camera);
}
