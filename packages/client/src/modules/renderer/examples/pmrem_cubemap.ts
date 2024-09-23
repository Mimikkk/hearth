import * as Engine from '@mimi/hearth';

import {
  cameraViewMatrix,
  MeshBasicNodeMaterial,
  normalView,
  normalWorld,
  pmremTexture,
  positionViewDirection,
  uniform,
} from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';

import { RGBMLoader } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;

  await hearth.init();

  container.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.onChange = render;
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.update();

  new RGBMLoader()
    .loadAsync([
      'resources/textures/cube/pisaRGBM16/px.png',
      'resources/textures/cube/pisaRGBM16/nx.png',
      'resources/textures/cube/pisaRGBM16/py.png',
      'resources/textures/cube/pisaRGBM16/ny.png',
      'resources/textures/cube/pisaRGBM16/pz.png',
      'resources/textures/cube/pisaRGBM16/nz.png',
    ])
    .then(map => {
      const reflectVec = positionViewDirection.negate().reflect(normalView).transformDirection(cameraViewMatrix);

      const pmremRoughness = uniform(0.5);
      const pmremNode = pmremTexture(map, reflectVec, pmremRoughness);

      scene.backgroundNode = pmremTexture(map, normalWorld, pmremRoughness);

      scene.add(
        new Engine.Mesh(new Engine.SphereGeometry(0.5, 64, 64), new MeshBasicNodeMaterial({ colorNode: pmremNode })),
      );

      const gui = new GUI();
      gui
        .add(pmremRoughness, 'value', 0, 1, 0.001)
        .name('roughness')
        .onChange(() => render());

      render();
    });

  useWindowResizer(hearth, camera);
}

function render() {
  hearth.render(scene, camera);
}
