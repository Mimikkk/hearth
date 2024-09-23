import * as Engine from '@mimi/hearth';
import { texture, equirectUV } from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';
import { TextureLoader } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
let controls;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(1, 0, 0);

  const equirectTexture = await new TextureLoader().loadAsync('resources/textures/2294472375_24a3b8ef46_o.jpg');

  scene = new Engine.Scene();
  scene.backgroundNode = texture(equirectTexture, equirectUV(), 0);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = render;
  container.appendChild(hearth.parameters.canvas);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.autoRotate = true;
  controls.rotateSpeed = -0.125;
  controls.autoRotateSpeed = 1.0;

  useWindowResizer(hearth, camera);
}

function render() {
  controls.update();

  hearth.render(scene, camera);
}
