import * as Engine from '@modules/renderer/engine/engine.js';
import * as Nodes from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { GUI } from 'lil-gui';
import Stats from 'stats-js';
import { RGBMLoader } from '@modules/renderer/engine/loaders/textures/RGBMLoader/RGBMLoader.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, stats;
let cube, sphere, torus, material;

let cubeCamera, cubeRenderTarget;

let controls;

init();

async function init() {
  renderer = new Renderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  renderer.toneMapping = Engine.ToneMapping.ACESFilmic;
  document.body.appendChild(renderer.domElement);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  camera = new Engine.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 75;

  scene = new Engine.Scene();

  const uvTexture = await new TextureLoader().loadAsync('resources/textures/uv_grid_opengl.jpg');

  const texture = await new RGBMLoader({ maxRange: 16 }).loadAsync([
    'resources/textures/cube/pisaRGBM16/px.png',
    'resources/textures/cube/pisaRGBM16/nx.png',
    'resources/textures/cube/pisaRGBM16/py.png',
    'resources/textures/cube/pisaRGBM16/ny.png',
    'resources/textures/cube/pisaRGBM16/pz.png',
    'resources/textures/cube/pisaRGBM16/nz.png',
  ]);

  texture.name = 'pisaRGBM16';
  texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;
  texture.magFilter = Engine.MagnificationTextureFilter.Linear;

  scene.background = texture;
  scene.environment = texture;

  //

  cubeRenderTarget = new Engine.CubeRenderTarget(256);
  cubeRenderTarget.texture.type = Engine.TextureDataType.HalfFloat;
  cubeRenderTarget.texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;
  cubeRenderTarget.texture.magFilter = Engine.MagnificationTextureFilter.Linear;
  cubeRenderTarget.texture.generateMipmaps = true;

  cubeCamera = new Engine.CubeCamera(1, 1000, cubeRenderTarget);

  //

  material = new Nodes.MeshStandardNodeMaterial({
    envMap: cubeRenderTarget.texture,
    roughness: 0.05,
    metalness: 1,
  });

  const gui = new GUI();
  gui.add(material, 'roughness', 0, 1);
  gui.add(material, 'metalness', 0, 1);
  gui.add(renderer, 'toneMappingExposure', 0, 2).name('exposure');

  sphere = new Engine.Mesh(new Engine.IcosahedronGeometry(15, 8), material);
  scene.add(sphere);

  const material2 = new Engine.MeshStandardMaterial({
    map: uvTexture,
    roughness: 0.1,
    metalness: 0,
  });

  cube = new Engine.Mesh(new Engine.BoxGeometry(15, 15, 15), material2);
  scene.add(cube);

  torus = new Engine.Mesh(new Engine.TorusKnotGeometry(8, 3, 128, 16), material2);
  scene.add(torus);

  //

  useWindowResizer(renderer, camera);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
}

function animation(msTime) {
  const time = msTime / 1000;

  cube.position.x = Math.cos(time) * 30;
  cube.position.y = Math.sin(time) * 30;
  cube.position.z = Math.sin(time) * 30;

  cube.rotation.x += 0.02;
  cube.rotation.y += 0.03;

  torus.position.x = Math.cos(time + 10) * 30;
  torus.position.y = Math.sin(time + 10) * 30;
  torus.position.z = Math.sin(time + 10) * 30;

  torus.rotation.x += 0.02;
  torus.rotation.y += 0.03;

  material.visible = false;

  cubeCamera.update(renderer, scene);

  material.visible = true;

  controls.update();

  renderer.render(scene, camera);

  stats.update();
}
