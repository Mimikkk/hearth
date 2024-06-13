import * as THREE from '@modules/renderer/engine/engine.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/GLTFLoader.js';
import { KTX2Loader } from '@modules/renderer/engine/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'meshoptimizer';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();

async function init() {
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20);
  camera.position.set(2, 2, 2);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  //lights

  const light = new THREE.PointLight(0xffffff);
  light.power = 1300;
  camera.add(light);
  scene.add(camera);

  //renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ToneMapping.Reinhard;
  renderer.toneMappingExposure = 1;
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 3;
  controls.maxDistance = 6;
  controls.update();

  const ktx2Loader = await new KTX2Loader().setTranscoderPath('../engine/libs/basis/').detectSupportAsync(renderer);

  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.loadAsync('./models/gltf/coffeemat.glb').then(function (gltf) {
    const gltfScene = gltf.scene;
    gltfScene.position.y = -0.8;
    gltfScene.scale.setScalar(0.01);

    scene.add(gltfScene);
  });

  useWindowResizer(renderer, camera);
}

function animate() {
  renderer.render(scene, camera);
}
