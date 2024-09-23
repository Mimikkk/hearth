import { Clock, Mapping, PerspectiveCamera, Scene, ToneMapping } from '@mimi/hearth';
import { Hearth } from '@mimi/hearth';
import { RGBELoader } from '@mimi/hearth';
import { OrbitControls } from '@mimi/hearth';
import { GLTFLoader } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { WorldAxesControls } from '@mimi/hearth';

let camera!: PerspectiveCamera;
let scene!: Scene;
let hearth!: Hearth;
let viewHelper!: WorldAxesControls;

const clock = new Clock();

await init();
render();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Scene();

  hearth = await Hearth.as({
    autoClear: false,
  });

  viewHelper = new WorldAxesControls(camera, hearth.parameters.canvas);
  hearth.animation.loop = animate;
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.parameters.toneMapping = ToneMapping.ACESFilmic;
  container.appendChild(hearth.parameters.canvas);

  RGBELoader.loadAsync('resources/textures/equirectangular/royal_esplanade_1k.hdr').then(texture => {
    texture.mapping = Mapping.EquirectangularReflection;
    scene.background = texture;
    scene.environment = texture;

    const loader = new GLTFLoader();
    loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(gltf => {
      scene.add(gltf.scene);

      render();
    });
  });

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  useWindowResizer(hearth, camera);
}

async function animate() {
  const delta = clock.tick();
  viewHelper.update(delta);
  render();
}

function render() {
  hearth.clear();

  hearth.render(scene, camera);
  viewHelper.render(hearth);
}
