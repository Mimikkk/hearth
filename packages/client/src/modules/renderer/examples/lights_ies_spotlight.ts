import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { IESSpotLight } from '@modules/renderer/engine/entities/lights/IESSpotLight.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

import { IESLoader } from '@modules/renderer/engine/loaders/lights/IESLoader/IESLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let renderer, scene, camera;
let lights;

async function init() {
  scene = new Engine.Scene();

  const [iesTexture1, iesTexture2, iesTexture3, iesTexture4] = await IESLoader.loadAsyncMultiple([
    'resources/ies/007cfb11e343e2f42e3b476be4ab684e.ies',
    'resources/ies/06b4cfdc8805709e767b5e2e904be8ad.ies',
    'resources/ies/02a7562c650498ebb301153dbbf59207.ies',
    'resources/ies/1a936937a49c63374e6d4fbed9252b29.ies',
  ]);

  const spotLight = new IESSpotLight(0xff0000, 500);
  spotLight.position.set(6.5, 1.5, 6.5);
  spotLight.angle = Math.PI / 8;
  spotLight.penumbra = 0.7;
  spotLight.distance = 20;
  spotLight.iesMap = iesTexture1;
  scene.add(spotLight);

  const spotLight2 = new IESSpotLight(0x00ff00, 500);
  spotLight2.position.set(6.5, 1.5, -6.5);
  spotLight2.angle = Math.PI / 8;
  spotLight2.penumbra = 0.7;
  spotLight2.distance = 20;
  spotLight2.iesMap = iesTexture2;
  scene.add(spotLight2);

  const spotLight3 = new IESSpotLight(0x0000ff, 500);
  spotLight3.position.set(-6.5, 1.5, -6.5);
  spotLight3.angle = Math.PI / 8;
  spotLight3.penumbra = 0.7;
  spotLight3.distance = 20;
  spotLight3.iesMap = iesTexture3;
  scene.add(spotLight3);

  const spotLight4 = new IESSpotLight(0xffffff, 500);
  spotLight4.position.set(-6.5, 1.5, 6.5);
  spotLight4.angle = Math.PI / 8;
  spotLight4.penumbra = 0.7;
  spotLight4.distance = 20;
  spotLight4.iesMap = iesTexture4;
  scene.add(spotLight4);

  lights = [spotLight, spotLight2, spotLight3, spotLight4];

  const material = new Engine.MeshPhongMaterial({ color: 0x808080 });

  const geometry = new Engine.PlaneGeometry(200, 200);

  const mesh = new Engine.Mesh(geometry, material);
  mesh.setRotationX(-Math.PI * 0.5);
  scene.add(mesh);

  renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = render;
  document.body.appendChild(renderer.parameters.canvas);

  camera = new Engine.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(16, 4, 1);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.enablePan = false;

  useWindowResizer(renderer, camera);
}

function render(time) {
  time = (time / 1000) * 2.0;

  for (let i = 0; i < lights.length; i++) {
    lights[i].position.y = Math.sin(time + i) + 0.97;
  }

  renderer.render(scene, camera);
}

init();
