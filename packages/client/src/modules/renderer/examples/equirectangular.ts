import * as Engine from '@modules/renderer/engine/engine.js';
import { texture, equirectUV } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let controls;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(1, 0, 0);

  const equirectTexture = await new TextureLoader().loadAsync('resources/textures/2294472375_24a3b8ef46_o.jpg');

  scene = new Engine.Scene();
  scene.backgroundNode = texture(equirectTexture, equirectUV(), 0);

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.parameters.canvas);

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.autoRotate = true;
  controls.rotateSpeed = -0.125; // negative, to track mouse pointer
  controls.autoRotateSpeed = 1.0;

  useWindowResizer(renderer, camera);
}

function render() {
  controls.update();

  renderer.render(scene, camera);
}
