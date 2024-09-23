import * as Engine from '@mimi/hearth';
import { cubeTexture, pass, uniform, viewportTopLeft } from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';

import { HearthPostprocess } from '@mimi/hearth';

import { RGBMLoader } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';
import { GLTFLoader } from '@mimi/hearth';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
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

  hearth = await Hearth.as();

  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.parameters.toneMapping = Engine.ToneMapping.Linear;
  hearth.parameters.toneMappingExposure = 1;
  hearth.animation.loop = render;
  container.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  const scenePass = pass(scene, camera);

  const threshold = uniform(1.4);
  const scaleNode = uniform(5);
  const intensity = uniform(1);
  const samples = 64;

  const anamorphicPass = scenePass.getTextureNode().anamorphic(threshold, scaleNode, samples);
  anamorphicPass.resolution = new Engine.Vec2(0.2, 0.2);

  postProcessing = new HearthPostprocess(hearth);
  postProcessing.outputNode = scenePass.add(anamorphicPass.mul(intensity));
  //postProcessing.outputNode = scenePass.add( anamorphicPass.getTextureNode().gaussianBlur() );

  const gui = new GUI();
  gui.add(intensity, 'value', 0, 4, 0.1).name('intensity');
  gui.add(threshold, 'value', 0.8, 3, 0.001).name('threshold');
  gui.add(scaleNode, 'value', 1, 10, 0.1).name('scale');
  gui
    .add(anamorphicPass.resolution, 'x', 0.1, 1, 0.1)
    .name('resolution')
    .onChange(v => (anamorphicPass.resolution.y = v));

  useWindowResizer(hearth, camera);
}

function render() {
  postProcessing.render();
}
