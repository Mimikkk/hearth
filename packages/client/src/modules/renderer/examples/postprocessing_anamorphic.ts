import * as Engine from '@modules/renderer/engine/engine.js';
import { cubeTexture, pass, uniform, viewportTopLeft } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import PostProcessing from '@modules/renderer/engine/renderers/common/PostProcessing.js';

import { RGBMLoader } from '@modules/renderer/engine/loaders/textures/RGBMLoader/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let postProcessing;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, -0.6, 2.7);

  scene = new Engine.Scene();

  const cube1Texture = await new RGBMLoader({ maxRange: 16 }).loadAsync([
    'resources/textures/cube/pisaRGBM16/px.png',
    'resources/textures/cube/pisaRGBM16/nx.png',
    'resources/textures/cube/pisaRGBM16/py.png',
    'resources/textures/cube/pisaRGBM16/ny.png',
    'resources/textures/cube/pisaRGBM16/pz.png',
    'resources/textures/cube/pisaRGBM16/nz.png',
  ]);

  scene.environment = cube1Texture;
  scene.backgroundNode = cubeTexture(cube1Texture)
    .mul(viewportTopLeft.distance(0.5).oneMinus().remapClamp(0.1, 4))
    .saturation(0);

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
    scene.add(gltf.scene);
  });

  renderer = new Renderer();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = Engine.ToneMapping.Linear;
  renderer.toneMappingExposure = 1;
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  // post-processing

  const scenePass = pass(scene, camera);

  const threshold = uniform(1.4);
  const scaleNode = uniform(5);
  const intensity = uniform(1);
  const samples = 64;

  const anamorphicPass = scenePass.getTextureNode().anamorphic(threshold, scaleNode, samples);
  anamorphicPass.resolution = new Engine.Vector2(0.2, 0.2); // 1 = full resolution

  postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = scenePass.add(anamorphicPass.mul(intensity));
  //postProcessing.outputNode = scenePass.add( anamorphicPass.getTextureNode().gaussianBlur() );

  // gui

  const gui = new GUI();
  gui.add(intensity, 'value', 0, 4, 0.1).name('intensity');
  gui.add(threshold, 'value', 0.8, 3, 0.001).name('threshold');
  gui.add(scaleNode, 'value', 1, 10, 0.1).name('scale');
  gui
    .add(anamorphicPass.resolution, 'x', 0.1, 1, 0.1)
    .name('resolution')
    .onChange(v => (anamorphicPass.resolution.y = v));

  useWindowResizer(renderer, camera);
}

function render() {
  postProcessing.render();
}
