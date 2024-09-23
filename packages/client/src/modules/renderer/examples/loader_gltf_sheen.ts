import * as Engine from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';
import { GLTFLoader } from '@mimi/hearth';
import { RGBELoader } from '@mimi/hearth';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth, controls;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.set(-0.75, 0.7, 1.25);

  scene = new Engine.Scene();

  new GLTFLoader().loadAsync('resources/models/gltf/SheenChair.glb').then(gltf => {
    scene.add(gltf.scene);

    const object = gltf.scene.getObjectByName('SheenChair_fabric');

    const gui = new GUI();

    gui.add(object.material, 'sheen', 0, 1);
    gui.open();
  });

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  hearth.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  hearth.parameters.toneMappingExposure = 1;
  container.appendChild(hearth.parameters.canvas);

  scene.background = new Engine.Color(0xaaaaaa);

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Engine.Mapping.EquirectangularReflection;

    scene.background = texture;
    //scene.backgroundBlurriness = 1;
    scene.environment = texture;
  });

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.enableDamping = true;
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.target.set(0, 0.35, 0);
  controls.update();

  useWindowResizer(hearth, camera);
}

function animate() {
  controls.update();

  render();
}

function render() {
  hearth.render(scene, camera);
}
