import * as Engine from '@modules/renderer/engine/engine.js';
import { float, mix, oscSine, pmremTexture, timerLocal, toneMapping } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

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
    'resources/textures/cube/pisaRGBM16/px.png',
    'resources/textures/cube/pisaRGBM16/nx.png',
    'resources/textures/cube/pisaRGBM16/py.png',
    'resources/textures/cube/pisaRGBM16/ny.png',
    'resources/textures/cube/pisaRGBM16/pz.png',
    'resources/textures/cube/pisaRGBM16/nz.png',
  ]);
  cube1Texture.generateMipmaps = true;
  cube1Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

  const cube2Texture = await new CubeTextureLoader().loadAsync([
    'resources/textures/cube/MilkyWay/dark-s_px.jpg',
    'resources/textures/cube/MilkyWay/dark-s_nx.jpg',
    'resources/textures/cube/MilkyWay/dark-s_py.jpg',
    'resources/textures/cube/MilkyWay/dark-s_ny.jpg',
    'resources/textures/cube/MilkyWay/dark-s_pz.jpg',
    'resources/textures/cube/MilkyWay/dark-s_nz.jpg',
  ]);

  cube2Texture.generateMipmaps = true;
  cube2Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

  scene.environmentNode = mix(pmremTexture(cube2Texture), pmremTexture(cube1Texture), oscSine(timerLocal(0.1)));

  scene.backgroundNode = scene.environmentNode.context({
    getTextureLevel: () => float(0.5),
  });

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
    scene.add(gltf.scene);
  });

  renderer = new Renderer();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  useWindowResizer(renderer, camera);
}

//

function render() {
  renderer.render(scene, camera);
}
