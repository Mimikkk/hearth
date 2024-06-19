import * as Engine from '@modules/renderer/engine/engine.js';
import { float, mix, oscSine, pmremTexture, timerLocal, toneMapping } from '@modules/renderer/engine/nodes/Nodes.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';

import { RGBMLoader } from '@modules/renderer/engine/loaders/textures/RGBMLoader/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { CubeTextureLoader } from '@modules/renderer/engine/loaders/textures/CubeTextureLoader/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  const cube1Texture = await new RGBMLoader({ maxRange: 123 }).loadAsync([
    './textures/cube/pisaRGBM16/px.png',
    './textures/cube/pisaRGBM16/nx.png',
    './textures/cube/pisaRGBM16/py.png',
    './textures/cube/pisaRGBM16/ny.png',
    './textures/cube/pisaRGBM16/pz.png',
    './textures/cube/pisaRGBM16/nz.png',
  ]);
  cube1Texture.generateMipmaps = true;
  cube1Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

  const cube2Texture = await new CubeTextureLoader().loadAsync([
    'textures/cube/MilkyWay/dark-s_px.jpg',
    'textures/cube/MilkyWay/dark-s_nx.jpg',
    'textures/cube/MilkyWay/dark-s_py.jpg',
    'textures/cube/MilkyWay/dark-s_ny.jpg',
    'textures/cube/MilkyWay/dark-s_pz.jpg',
    'textures/cube/MilkyWay/dark-s_nz.jpg',
  ]);

  cube2Texture.generateMipmaps = true;
  cube2Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

  scene.environmentNode = mix(pmremTexture(cube2Texture), pmremTexture(cube1Texture), oscSine(timerLocal(0.1)));

  scene.backgroundNode = scene.environmentNode.context({
    getTextureLevel: () => float(0.5),
  });

  const loader = new GLTFLoader();
  loader.loadAsync('models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
    scene.add(gltf.scene);
  });

  renderer = new WebGPURenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  useWindowResizer(renderer, camera);
}

//

function render() {
  renderer.render(scene, camera);
}
