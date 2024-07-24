import * as Engine from '@modules/renderer/engine/engine.js';

import { MeshBasicNodeMaterial, normalWorld, pmremTexture, uniform } from '@modules/renderer/engine/nodes/Nodes.js';

import PMREMGenerator from '@modules/renderer/engine/renderers/extras/PMREMGenerator.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

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
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.parameters.canvas);

  await renderer.init();

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.onChange = render; // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.update();

  //

  scene.background = new Engine.Color(0x006699);

  let model;

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0x0000ff }));
  model.position.z -= 1;
  scene.add(model);

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0xff0000 }));
  model.position.z += 1;
  scene.add(model);

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0xff00ff }));
  model.position.x += 1;
  scene.add(model);

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0x00ffff }));
  model.position.x -= 1;
  scene.add(model);

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0xffff00 }));
  model.position.y -= 1;
  scene.add(model);

  model = new Engine.Mesh(new Engine.SphereGeometry(0.2, 64, 64), new Engine.MeshBasicMaterial({ color: 0x00ff00 }));
  model.position.y += 1;
  scene.add(model);

  //while ( scene.children.length > 0 ) scene.remove( scene.children[ 0 ] );

  const sceneRT = new PMREMGenerator(renderer).fromScene(scene);

  scene.background = null;
  scene.backgroundNode = null;

  //

  const pmremRoughness = uniform(0.5);
  const pmremNode = pmremTexture(sceneRT.texture, normalWorld, pmremRoughness);

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

  useWindowResizer(renderer, camera);
}

function render() {
  renderer.render(scene, camera);
}
