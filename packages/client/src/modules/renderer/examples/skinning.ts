import * as Engine from '@modules/renderer/engine/engine.js';
import { toneMapping } from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;

let mixer, clock;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(1, 2, 3);

  scene = new Engine.Scene();
  scene.background = new Engine.Color('lightblue');
  camera.lookAt(0, 1, 0);

  clock = new Engine.Clock();

  //lights

  const light = new Engine.PointLight(0xffffff, 1, 100);
  light.power = 2500;
  camera.add(light);
  scene.add(camera);

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/Michelle.glb').then(function (gltf) {
    const object = gltf.scene;
    mixer = new Engine.AnimationMixer(object);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    scene.add(object);
  });

  //hearth

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  hearth.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 0.15);
  document.body.appendChild(hearth.parameters.canvas);

  useWindowResizer(hearth, camera);
}

function animate() {
  const delta = clock.tick();

  if (mixer) mixer.update(delta);

  hearth.render(scene, camera);
}
