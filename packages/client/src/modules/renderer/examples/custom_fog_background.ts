import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import Postprocess from '@modules/renderer/engine/hearth/Postprocess.js';

import { color, pass, rangeFog } from '@modules/renderer/engine/nodes/Nodes.js';

import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ToneMapping } from '@modules/renderer/engine/engine.js';

let camera, scene, renderer;
let postProcessing;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Engine.Scene();

  renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMapping = ToneMapping.ACESFilmic;
  container.appendChild(renderer.parameters.canvas);




  const scenePass = pass(scene, camera);
  const scenePassViewZ = scenePass.getViewZNode();


  const backgroundColor = color(0x0066ff);

  const fogFactor = rangeFog(null, 2.7, 4).context({ getViewZ: () => scenePassViewZ });


  const scenePassTM = scenePass.toneMapping(Engine.ToneMapping.ACESFilmic);


  const compose = fogFactor.mix(scenePassTM, backgroundColor);

  postProcessing = new Postprocess(renderer);
  postProcessing.outputNode = compose;

  //

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Engine.Mapping.EquirectangularReflection;

    scene.environment = texture;



    const loader = new GLTFLoader();
    loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
      scene.add(gltf.scene);

      render();
    });
  });

  //

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.target.set(0, -0.1, -0.2);
  controls.update();
  controls.onChange = render;

  useWindowResizer(renderer, camera);
}

//

function render() {
  postProcessing.render();
}
