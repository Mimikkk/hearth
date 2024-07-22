import { Clock, Mapping, PerspectiveCamera, Scene, ToneMapping } from '@modules/renderer/engine/engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { RGBELoader } from '@modules/renderer/engine/loaders/textures/RGBELoader/RGBELoader.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { WorldAxesVisualizer } from '@modules/renderer/engine/helpers/WorldAxesVisualizer.js';

let camera!: PerspectiveCamera;
let scene!: Scene;
let renderer!: Renderer;
let viewHelper!: WorldAxesVisualizer;

const clock = new Clock();

await init();
render();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8, 0.6, 2.7);

  scene = new Scene();

  renderer = await Renderer.create({
    autoClear: false,
  });

  viewHelper = new WorldAxesVisualizer(camera, renderer.parameters.canvas);
  renderer.setAnimationLoop(animate);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMapping = ToneMapping.ACESFilmic;
  container.appendChild(renderer.parameters.canvas);

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

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  useWindowResizer(renderer, camera);
}

async function animate() {
  const delta = clock.getDelta();
  viewHelper.update(delta);
  render();
}

function render() {
  renderer.clear();

  renderer.render(scene, camera);
  viewHelper.render(renderer);
}
