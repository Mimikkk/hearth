import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let renderer, scene, camera, controls;

init();

async function init() {
  renderer = await Renderer.as();
  renderer.animation.loop = render;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  document.body.appendChild(renderer.parameters.canvas);

  scene = new Engine.Scene();

  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 20);
  camera.position.set(0.35, 0.05, 0.35);

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.autoRotate = true;
  controls.autoRotateSpeed = -0.5;
  controls.target.set(0, 0.2, 0);
  controls.update();

  const gltfLoader = new GLTFLoader();

  const [texture, gltf] = await Promise.all([
    RGBELoader.loadAsync('resources/textures/equirectangular/venice_sunset_1k.hdr'),
    gltfLoader.loadAsync('resources/models/gltf/IridescenceLamp.glb'),
  ]);

  // environment

  texture.mapping = Engine.Mapping.EquirectangularReflection;

  scene.background = texture;
  scene.environment = texture;

  // model

  scene.add(gltf.scene);

  render();

  useWindowResizer(renderer, camera);
}

function render() {
  controls.update();
  renderer.render(scene, camera);
}
