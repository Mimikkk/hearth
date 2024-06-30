import * as Engine from '@modules/renderer/engine/engine.js';

import {
  cameraViewMatrix,
  MeshBasicNodeMaterial,
  normalView,
  normalWorld,
  pmremTexture,
  positionViewDirection,
  uniform,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  renderer = await Renderer.create();
  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;

  container.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.eventDispatcher.add('change', render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.update();

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(map => {
    map.mapping = Engine.Mapping.EquirectangularReflection;

    const reflectVec = positionViewDirection.negate().reflect(normalView).transformDirection(cameraViewMatrix);

    const pmremRoughness = uniform(0.5);
    const pmremNode = pmremTexture(map, reflectVec, pmremRoughness);

    scene.backgroundNode = pmremTexture(map, normalWorld, pmremRoughness);

    scene.add(
      new Engine.Mesh(new Engine.SphereGeometry(0.5, 64, 64), new MeshBasicNodeMaterial({ colorNode: pmremNode })),
    );

    // gui

    const gui = new GUI();
    gui
      .add(pmremRoughness, 'value', 0, 1, 0.001)
      .name('roughness')
      .onChange(() => render());

    render();
  });

  useWindowResizer(renderer, camera);
}

function render() {
  renderer.render(scene, camera);
}
