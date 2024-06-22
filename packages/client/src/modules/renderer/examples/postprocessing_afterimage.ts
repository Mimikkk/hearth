import * as Engine from '@modules/renderer/engine/engine.js';

import { GUI } from 'lil-gui';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import PostProcessing from '@modules/renderer/engine/renderers/common/PostProcessing.js';
import { pass } from '@modules/renderer/engine/nodes/Nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let mesh, postProcessing, combinedPass;

const params = {
  damp: 0.96,
};

init();
createGUI();

function init() {
  renderer = new Renderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 400;

  scene = new Engine.Scene();
  scene.fog = new Engine.Fog(0x000000, 1, 1000);

  const geometry = new Engine.TorusKnotGeometry(100, 30, 100, 16);
  const material = new Engine.MeshNormalMaterial();
  mesh = new Engine.Mesh(geometry, material);
  scene.add(mesh);

  // postprocessing

  postProcessing = new PostProcessing(renderer);

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();

  combinedPass = scenePassColor;
  combinedPass = combinedPass.afterImage(params.damp);

  postProcessing.outputNode = combinedPass;

  useWindowResizer(renderer, camera);
}

function createGUI() {
  const gui = new GUI({ title: 'Damp setting' });
  gui.add(combinedPass.damp, 'value', 0, 1).step(0.001);
}

function render() {
  mesh.rotation.x += 0.0075;
  mesh.rotation.y += 0.015;

  postProcessing.render();
}

function animate() {
  render();
}
