import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { KTX2Loader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/KTX2Loader.js';
import { MeshoptDecoder } from 'meshoptimizer';

import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { ToneMapping } from '@modules/renderer/engine/constants.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/objects/scenes/Scene.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { PointLight } from '@modules/renderer/engine/objects/lights/PointLight.js';

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

  //renderer

  const renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = () => renderer.render(scene, camera);
  renderer.parameters.toneMapping = ToneMapping.Reinhard;
  renderer.parameters.toneMappingExposure = 1;
  document.body.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 3;
  controls.maxDistance = 6;
  controls.update();

  const ktx2Loader = await new KTX2Loader();
  await ktx2Loader.detectSupportAsync(renderer);

  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.loadAsync('resources/models/gltf/coffeemat.glb').then(gltf => {
    const gltfScene = gltf.scene;
    gltfScene.position.y = -0.8;
    gltfScene.scale.setScalar(0.01);

    scene.add(gltfScene);
  });

  useWindowResizer(renderer, camera);
}
