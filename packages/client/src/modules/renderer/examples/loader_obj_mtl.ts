import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { MTLLoader } from '@modules/renderer/engine/loaders/objects/OBJLoader/MTLLoader/MTLLoader.js';
import { OBJLoader } from '@modules/renderer/engine/loaders/objects/OBJLoader/OBJLoader.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { AmbientLight } from '@modules/renderer/engine/entities/lights/AmbientLight.js';
import { PointLight } from '@modules/renderer/engine/entities/lights/PointLight.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera!: PerspectiveCamera;
let scene!: Scene;
let hearth!: Hearth;

init();

async function init() {
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.z = 2.5;

  scene = new Scene();

  const ambientLight = new AmbientLight(0xffffff);
  scene.add(ambientLight);

  const pointLight = new PointLight(0xffffff, 15);
  camera.add(pointLight);
  scene.add(camera);

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

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;

  useWindowResizer(hearth, camera);
}

function animate() {
  hearth.render(scene, camera);
}
