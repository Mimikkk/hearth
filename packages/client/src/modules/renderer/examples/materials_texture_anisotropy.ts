import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let container;

let camera, scene1, scene2, renderer;

let mouseX = 0,
  mouseY = 0;

init();

async function init() {
  const SCREEN_WIDTH = window.innerWidth;
  const SCREEN_HEIGHT = window.innerHeight;

  container = document.createElement('div');
  document.body.appendChild(container);

  renderer = await Renderer.create();

  // RENDERER

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.animation.loop = animate;
  renderer.parameters.autoClear = false;

  renderer.parameters.canvas.style.position = 'relative';
  container.appendChild(renderer.parameters.canvas);

  //

  camera = new Engine.PerspectiveCamera(35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000);
  camera.position.z = 1500;

  scene1 = new Engine.Scene();
  scene1.fog = new Engine.Fog(0xf2f7ff, 1, 25000);

  scene2 = new Engine.Scene();
  scene2.fog = new Engine.Fog(0xf2f7ff, 1, 25000);

  scene1.add(new Engine.AmbientLight(0xeef0ff, 3));
  scene2.add(new Engine.AmbientLight(0xeef0ff, 3));

  const light1 = new Engine.DirectionalLight(0xffffff, 6);
  light1.position.set(1, 1, 1);
  scene1.add(light1);

  const light2 = new Engine.DirectionalLight(0xffffff, 6);
  light2.position.set(1, 1, 1);
  scene2.add(light2);

  // GROUND

  const textureLoader = new TextureLoader();

  const maxAnisotropy = renderer.getMaxAnisotropy();

  const texture1 = await textureLoader.loadAsync('resources/textures/crate.gif');
  const material1 = new Engine.MeshPhongMaterial({ color: 0xffffff, map: texture1 });

  texture1.colorSpace = Engine.from.SRGB;
  texture1.anisotropy = renderer.getMaxAnisotropy();
  texture1.wrapS = texture1.wrapT = Engine.Wrapping.Repeat;
  texture1.repeat.set(512, 512);

  const texture2 = await textureLoader.loadAsync('resources/textures/crate.gif');
  const material2 = new Engine.MeshPhongMaterial({ color: 0xffffff, map: texture2 });

  texture2.colorSpace = Engine.from.SRGB;
  texture2.anisotropy = 1;
  texture2.wrapS = texture2.wrapT = Engine.Wrapping.Repeat;
  texture2.repeat.set(512, 512);

  if (maxAnisotropy > 0) {
    document.getElementById('val_left').innerHTML = texture1.anisotropy;
    document.getElementById('val_right').innerHTML = texture2.anisotropy;
  } else {
    document.getElementById('val_left').innerHTML = 'not supported';
    document.getElementById('val_right').innerHTML = 'not supported';
  }

  //

  const geometry = new Engine.PlaneGeometry(100, 100);

  const mesh1 = new Engine.Mesh(geometry, material1);
  mesh1.setRotationX(-Math.PI / 2);
  mesh1.scale.set(1000, 1000, 1000);

  const mesh2 = new Engine.Mesh(geometry, material2);
  mesh2.setRotationX(-Math.PI / 2);
  mesh2.scale.set(1000, 1000, 1000);

  scene1.add(mesh1);
  scene2.add(mesh2);

  document.addEventListener('mousemove', onDocumentMouseMove);

  useWindowResizer(renderer, camera);
}

function onDocumentMouseMove(event) {
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function animate() {
  render();
}

function render() {
  const SCREEN_WIDTH = window.innerWidth;
  const SCREEN_HEIGHT = window.innerHeight;

  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y = Engine.MathUtils.clamp(
    camera.position.y + (-(mouseY - 200) - camera.position.y) * 0.05,
    50,
    1000,
  );

  camera.lookAt(scene1.position);
  renderer.clear();

  renderer.useScissor = true;

  renderer.scissor.set(0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
  renderer.render(scene1, camera);

  renderer.useScissor = true;

  renderer.scissor.set(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT);
  renderer.render(scene2, camera);

  renderer.useScissor = false;
}
