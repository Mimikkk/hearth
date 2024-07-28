import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { KTX2Loader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/KTX2Loader.js';
import { MeshoptDecoder } from 'meshoptimizer';

import { GUI } from 'lil-gui';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

init();

async function init() {
  let mixer;

  const clock = new Engine.Clock();

  const container = document.createElement('div');
  document.body.appendChild(container);

  const camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20);
  camera.position.set(-1.8, 0.8, 3);

  const scene = new Engine.Scene();
  scene.add(new Engine.HemisphereLight(0xffffff, 0x443333, 2));

  const renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMapping = Engine.ToneMapping.ACESFilmic;
  renderer.animation.loop = animate;

  container.appendChild(renderer.parameters.canvas);

  const ktx2Loader = await new KTX2Loader().detectSupportAsync(renderer);

  new GLTFLoader()
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync('resources/models/gltf/facecap.glb', {
      onLoad: gltf => {
        const mesh = gltf.scene.children[0];

        scene.add(mesh);

        mixer = new Engine.AnimationMixer(mesh);

        mixer.clipAction(gltf.animations[0]).play();

        

        const head = mesh.getObjectByName('mesh_2');
        const influences = head.morphTargetInfluences;

        //head.morphTargetInfluences = null;

        
        head.material.map = null;

        const gui = new GUI();
        gui.close();

        for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
          gui.add(influences, value, 0, 1, 0.01).name(key.replace('blendShape1.', '')).listen();
        }
      },
    });

  scene.background = new Engine.Color(0x666666);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  controls.maxDistance = 5;
  controls.minAzimuthAngle = -Math.PI / 2;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 1.8;
  controls.target.set(0, 0.15, -0.2);

  const
  function animate() {
    const delta = clock.tick();

    if (mixer) {
      mixer.update(delta);
    }

    renderer.render(scene, camera);

    controls?.update();

    stats.update();
  }

  useWindowResizer(renderer, camera);
}
