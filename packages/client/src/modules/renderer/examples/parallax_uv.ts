import * as THREE from '../threejs/Three.js';
import { TextureLoader } from '../threejs/loaders/TextureLoader.ts';
import { MeshStandardNodeMaterial, parallaxUV, texture, uv } from '../threejs/nodes/Nodes.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { CubeTextureLoader } from '@modules/renderer/threejs/loaders/CubeTextureLoader.js';

let camera, scene, renderer;

let controls;

init();

async function init() {
  // scene

  scene = new THREE.Scene();

  // camera

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(10, 14, 10);

  // environment

  const environmentTexture = new CubeTextureLoader().loadAsync([
    'textures/cube/Park2/posx.jpg',
    'textures/cube/Park2/negx.jpg',
    'textures/cube/Park2/posy.jpg',
    'textures/cube/Park2/negy.jpg',
    'textures/cube/Park2/posz.jpg',
    'textures/cube/Park2/negz.jpg',
  ]);

  scene.environment = environmentTexture;
  scene.background = environmentTexture;

  // textures

  const loader = new TextureLoader();

  const topTexture = await loader.loadAsync('textures/ambientcg/Ice002_1K-JPG_Color.jpg');
  topTexture.colorSpace = THREE.ColorSpace.SRGB;

  const roughnessTexture = await loader.loadAsync('textures/ambientcg/Ice002_1K-JPG_Roughness.jpg');
  roughnessTexture.colorSpace = THREE.ColorSpace.No;

  const normalTexture = await loader.loadAsync('textures/ambientcg/Ice002_1K-JPG_NormalGL.jpg');
  normalTexture.colorSpace = THREE.ColorSpace.No;

  const displaceTexture = await loader.loadAsync('textures/ambientcg/Ice002_1K-JPG_Displacement.jpg');
  displaceTexture.colorSpace = THREE.ColorSpace.No;

  //

  const bottomTexture = await loader.loadAsync('textures/ambientcg/Ice003_1K-JPG_Color.jpg');
  bottomTexture.colorSpace = THREE.ColorSpace.SRGB;
  bottomTexture.wrapS = THREE.Wrapping.Repeat;
  bottomTexture.wrapT = THREE.Wrapping.Repeat;

  // paralax effect

  const parallaxScale = 0.3;
  const offsetUV = texture(displaceTexture).mul(parallaxScale);

  const parallaxUVOffset = parallaxUV(uv(), offsetUV);
  const parallaxResult = texture(bottomTexture, parallaxUVOffset);

  const iceNode = texture(topTexture).overlay(parallaxResult);

  // material

  const material = new MeshStandardNodeMaterial();
  material.colorNode = iceNode.mul(5); // increase the color intensity to 5 ( contrast )
  material.roughnessNode = texture(roughnessTexture);
  material.normalMap = normalTexture;
  material.metalness = 0;

  const geometry = new THREE.BoxGeometry(10, 10, 10);

  const ground = new THREE.Mesh(geometry, material);
  ground.rotateX(-Math.PI / 2);
  scene.add(ground);

  // renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ToneMapping.Reinhard;
  renderer.toneMappingExposure = 6;
  document.body.appendChild(renderer.domElement);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.maxDistance = 40;
  controls.minDistance = 10;
  controls.autoRotate = true;
  controls.autoRotateSpeed = -1;
  controls.update();

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  controls.update();

  renderer.render(scene, camera);
}
