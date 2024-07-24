import { Scene } from '@modules/renderer/engine/objects/scenes/Scene.js';
import { PerspectiveCamera } from '@modules/renderer/engine/objects/cameras/PerspectiveCamera.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { MTLLoader } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLLoader.js';
import { OBJLoader } from '@modules/renderer/engine/loaders/objects/OBJLoader/OBJLoader.js';
import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';
import { AmbientLight } from '@modules/renderer/engine/objects/lights/AmbientLight.js';
import { PointLight } from '@modules/renderer/engine/objects/lights/PointLight.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera!: PerspectiveCamera;
let scene!: Scene;
let renderer!: Renderer;

init();

async function init() {
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.z = 2.5;

  // scene

  scene = new Scene();

  const ambientLight = new AmbientLight(0xffffff);
  scene.add(ambientLight);

  const pointLight = new PointLight(0xffffff, 15);
  camera.add(pointLight);
  scene.add(camera);

  // model

  const onProgress = xhr => {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.info(percentComplete.toFixed(2) + '% downloaded');
    }
  };

  const materials = await new MTLLoader().loadAsync('resources/models/obj/male02/male02.mtl');
  await materials.preload();
  console.info({ materials });

  const object = await new OBJLoader({ materials }).loadAsync('resources/models/obj/male02/male02.obj');
  object.position.y = -0.95;
  object.scale.setScalar(0.01);
  scene.add(object);

  //

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  //

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;

  //

  useWindowResizer(renderer, camera);
}

function animate() {
  renderer.render(scene, camera);
}
