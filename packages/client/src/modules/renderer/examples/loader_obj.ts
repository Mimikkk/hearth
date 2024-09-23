import { AmbientLight, ColorSpace, PerspectiveCamera, PointLight, Scene } from '@mimi/hearth';
import { TextureLoader } from '@mimi/hearth';
import { OBJLoader } from '@mimi/hearth';
import { Hearth } from '@mimi/hearth';
import { OrbitControls } from '@mimi/hearth';
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

  const textureLoader = new TextureLoader();
  const texture = await textureLoader.loadAsync('resources/textures/uv_grid_opengl.jpg');
  texture.colorSpace = ColorSpace.SRGB;

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

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(hearth.parameters.canvas);

  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.onChange = render;

  useWindowResizer(hearth, camera);

  render();
}

function render() {
  hearth.render(scene, camera);
}
