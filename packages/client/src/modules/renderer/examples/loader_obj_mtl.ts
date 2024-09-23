import { Scene } from '@mimi/hearth';
import { PerspectiveCamera } from '@mimi/hearth';
import { Hearth } from '@mimi/hearth';
import { MTLLoader } from '@mimi/hearth';
import { OBJLoader } from '@mimi/hearth';
import { OrbitControls } from '@mimi/hearth';
import { AmbientLight } from '@mimi/hearth';
import { PointLight } from '@mimi/hearth';
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
