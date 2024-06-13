import { AmbientLight, ColorSpace, PerspectiveCamera, PointLight, Scene } from '../threejs/Three.js';
import { TextureLoader } from '@modules/renderer/threejs/loaders/TextureLoader.js';
import { OBJLoader } from '@modules/renderer/threejs/loaders/OBJLoader.js';
import { WebGPURenderer } from '@modules/renderer/threejs/renderers/webgpu/WebGPURenderer.js';
import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera!: PerspectiveCamera;
let scene!: Scene;
let renderer!: WebGPURenderer;

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
  const texture = await textureLoader.loadAsync('textures/uv_grid_opengl.jpg');
  texture.colorSpace = ColorSpace.SRGB;

  // model

  function onProgress(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log('model ' + percentComplete.toFixed(2) + '% downloaded');
    }
  }

  const loader = new OBJLoader();
  const object = await loader.loadAsync('models/obj/male02/male02.obj');

  object.traverse(child => {
    if (child.isMesh) child.material.map = texture;
  });

  object.position.y = -0.95;
  object.scale.setScalar(0.01);
  scene.add(object);

  //

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.eventDispatcher.add('change', render);

  useWindowResizer(renderer, camera);

  render();
}

function render() {
  renderer.render(scene, camera);
}
