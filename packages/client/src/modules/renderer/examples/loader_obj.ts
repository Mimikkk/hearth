import { AmbientLight, ColorSpace, PerspectiveCamera, PointLight, Scene } from '@modules/renderer/engine/engine.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { OBJLoader } from '@modules/renderer/engine/loaders/objects/OBJLoader/OBJLoader.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
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

  // texture

  const textureLoader = new TextureLoader();
  const texture = await textureLoader.loadAsync('resources/textures/uv_grid_opengl.jpg');
  texture.colorSpace = ColorSpace.SRGB;

  // model

  function onProgress(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.info('model ' + percentComplete.toFixed(2) + '% downloaded');
    }
  }

  const loader = new OBJLoader();
  const object = await loader.loadAsync('resources/models/obj/male02/male02.obj');

  object.traverse(child => {
    if (child.isMesh) child.material.map = texture;
  });

  object.position.y = -0.95;
  object.scale.setScalar(0.01);
  scene.add(object);
  //

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.parameters.canvas);

  //

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.onChange = render;

  useWindowResizer(renderer, camera);

  render();
}

function render() {
  renderer.render(scene, camera);
}
