import * as Engine from '@modules/renderer/engine/engine.js';

import { GUI } from 'lil-gui';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { HearthPostprocess } from '@modules/renderer/engine/hearth/Hearth.Postprocess.js';
import { pass } from '@modules/renderer/engine/nodes/Nodes.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
let mesh, postProcessing, combinedPass;

const params = {
  damp: 0.96,
};

init();
createGUI();

async function init() {
  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  camera = new Engine.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 400;

  scene = new Engine.Scene();
  scene.fog = new Engine.Fog(0x000000, 1, 1000);

  const geometry = new Engine.TorusKnotGeometry(100, 30, 100, 16);
  const material = new Engine.MeshNormalMaterial();
  mesh = new Engine.Mesh(geometry, material);
  scene.add(mesh);

  postProcessing = new HearthPostprocess(hearth);

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();

  combinedPass = scenePassColor;
  combinedPass = combinedPass.afterImage(params.damp);

  postProcessing.outputNode = combinedPass;

  useWindowResizer(hearth, camera);
}

function createGUI() {
  const gui = new GUI({ title: 'Damp setting' });
  gui.add(combinedPass.damp, 'value', 0, 1).step(0.001);
}

function render() {
  mesh.rotateX(0.0075);
  mesh.rotateY(0.015);

  postProcessing.render();
}

function animate() {
  render();
}
