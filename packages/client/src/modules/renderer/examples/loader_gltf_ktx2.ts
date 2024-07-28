import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { KTX2Loader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/KTX2Loader.js';
import { MeshoptDecoder } from 'meshoptimizer';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ToneMapping } from '@modules/renderer/engine/constants.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { PointLight } from '@modules/renderer/engine/entities/lights/PointLight.js';

init();

async function init() {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20);
  camera.position.set(2, 2, 2);

  const scene = new Scene();
  scene.background = Color.new(0xeeeeee);

  //lights

  const light = new PointLight(0xffffff);
  light.power = 1300;
  camera.add(light);
  scene.add(camera);

  //hearth

  const hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = () => hearth.render(scene, camera);
  hearth.parameters.toneMapping = ToneMapping.Reinhard;
  hearth.parameters.toneMappingExposure = 1;
  document.body.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 3;
  controls.maxDistance = 6;
  controls.update();

  const ktx2Loader = await new KTX2Loader();
  await ktx2Loader.detectSupportAsync(hearth);

  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.loadAsync('resources/models/gltf/coffeemat.glb').then(gltf => {
    const gltfScene = gltf.scene;
    gltfScene.position.y = -0.8;
    gltfScene.scale.setScalar(0.01);

    scene.add(gltfScene);
  });

  useWindowResizer(hearth, camera);
}
