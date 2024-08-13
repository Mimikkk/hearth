import * as Engine from '@modules/renderer/engine/engine.js';
import { f32, mix, oscSine, pmremTexture, timerLocal, toneMapping } from '@modules/renderer/engine/nodes/nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { RGBMLoader } from '@modules/renderer/engine/loaders/textures/RGBMLoader/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { CubeTextureLoader } from '@modules/renderer/engine/loaders/textures/CubeTextureLoader/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { GPUFilterModeType } from '@modules/renderer/engine/engine.js';

let camera, scene, hearth;

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
  cube1Texture.useMipmap = true;
  cube1Texture.minFilter = GPUFilterModeType.Linear;

  const cube2Texture = await new CubeTextureLoader().loadAsync([
    'resources/textures/cube/MilkyWay/dark-s_px.jpg',
    'resources/textures/cube/MilkyWay/dark-s_nx.jpg',
    'resources/textures/cube/MilkyWay/dark-s_py.jpg',
    'resources/textures/cube/MilkyWay/dark-s_ny.jpg',
    'resources/textures/cube/MilkyWay/dark-s_pz.jpg',
    'resources/textures/cube/MilkyWay/dark-s_nz.jpg',
  ]);

  cube2Texture.useMipmap = true;
  cube2Texture.minFilter = GPUFilterModeType.Linear;

  scene.environmentNode = mix(pmremTexture(cube2Texture), pmremTexture(cube1Texture), oscSine(timerLocal(0.1)));

  scene.backgroundNode = scene.environmentNode.context({
    getTextureLevel: () => f32(0.5),
  });

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
    scene.add(gltf.scene);
  });

  hearth = await Hearth.as();

  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  hearth.animation.loop = render;
  container.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  useWindowResizer(hearth, camera);
}

function render() {
  hearth.render(scene, camera);
}
