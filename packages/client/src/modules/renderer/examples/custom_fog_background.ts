import * as Engine from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';
import { HearthPostprocess } from '@mimi/hearth';

import { color, pass, rangeFog } from '@mimi/hearth';

import { RGBELoader } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';
import { GLTFLoader } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ToneMapping } from '@mimi/hearth';

let camera, scene, hearth;
let postProcessing;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.parameters.toneMapping = ToneMapping.ACESFilmic;
  container.appendChild(hearth.parameters.canvas);

  const scenePass = pass(scene, camera);
  const scenePassViewZ = scenePass.getViewZNode();

  const backgroundColor = color(0x0066ff);

  const fogFactor = rangeFog(null, 2.7, 4).context({ getViewZ: () => scenePassViewZ });

  const scenePassTM = scenePass.toneMapping(ToneMapping.ACESFilmic);

  const compose = fogFactor.mix(scenePassTM, backgroundColor);

  postProcessing = new HearthPostprocess(hearth);
  postProcessing.outputNode = compose;

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Engine.Mapping.EquirectangularReflection;

    scene.environment = texture;

    const loader = new GLTFLoader();
    loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
      scene.add(gltf.scene);

      render();
    });
  });

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.target.set(0, -0.1, -0.2);
  controls.update();
  controls.onChange = render;

  useWindowResizer(hearth, camera);
}

function render() {
  postProcessing.render();
}
