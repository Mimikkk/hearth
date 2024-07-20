import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, controls;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.set(-0.75, 0.7, 1.25);

  scene = new Engine.Scene();
  // model

  new GLTFLoader().loadAsync('resources/models/gltf/SheenChair.glb').then(gltf => {
    scene.add(gltf.scene);

    const object = gltf.scene.getObjectByName('SheenChair_fabric');

    const gui = new GUI();

    gui.add(object.material, 'sheen', 0, 1);
    gui.open();
  });

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  renderer.parameters.toneMappingExposure = 1;
  container.appendChild(renderer.parameters.canvas);

  scene.background = new Engine.Color(0xaaaaaa);

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Engine.Mapping.EquirectangularReflection;

    scene.background = texture;
    //scene.backgroundBlurriness = 1; // @TODO: Needs PMREM
    scene.environment = texture;
  });

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.enableDamping = true;
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.target.set(0, 0.35, 0);
  controls.update();

  useWindowResizer(renderer, camera);
}

//

function animate() {
  controls.update(); // required if damping enabled

  render();
}

function render() {
  renderer.render(scene, camera);
}
