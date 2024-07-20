import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  BoundingBoxVisualizer,
  BoxGeometry,
  BufferGeometry,
  Fog,
  Group,
  Mesh,
  Object3D,
  Raycaster,
  SphereGeometry,
  SpotLight,
  Vector2,
} from '@modules/renderer/engine/engine.js';
import { MeshStandardNodeMaterial } from '@modules/renderer/engine/nodes/materials/MeshStandardNodeMaterial.js';
import { float } from 'three/examples/jsm/nodes/shadernode/ShaderNode.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { Vec3 } from '@modules/renderer/engine/math/Vector3.js';
import { DragControls } from '@modules/renderer/engine/controls/DragControls.js';
import { UI } from '@modules/renderer/examples/utilities/UI.js';

const container = document.createElement('div');
document.body.appendChild(container);

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  Vec3.set(camera.position, 0, 2, 3);
  return camera;
};
const createLight = () => new SpotLight(0xffffff, 30);
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog('red', 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color('violet'), color('blue'));
  return scene;
};
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.setAnimationLoop(onAnimate);
  document.body.appendChild(renderer.parameters.canvas);

  return renderer;
};

const createSpheres = () => {
  const material = new MeshStandardNodeMaterial({ color: Math.random() * 0xffffff });

  const group = new Group();
  const box = new Mesh(new BoxGeometry(0.24, 0.24, 0.24), material);
  const sphere1 = new Mesh(new SphereGeometry(0.12, 32, 32), material);
  const sphere2 = new Mesh(new SphereGeometry(0.24, 32, 32), material);

  group.position.set(0, 1, 0);
  box.position.set(0, 0.5, 0);
  sphere1.position.set(0, -0.12, 0);
  sphere2.position.set(0, 0.12, 0);
  box.setRotationX(Math.PI / 4);
  group.add(sphere1, sphere2, box);

  return group;
};
const createSphere = (geometry: BufferGeometry, x: number, y: number, z: number) => {
  const material = new MeshStandardNodeMaterial({ color: Math.random() * 0xffffff });
  material.roughnessNode = float(0.8);
  material.metalnessNode = float(0.2);

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const state = {
  drag: {
    mode: 'translate' as 'translate' | 'rotate',
    selection: false,
  },
};
const useVisualizer = (scene: Scene, of: Object3D) => {
  const visualizer = new BoundingBoxVisualizer(of, 'red');

  scene.add(visualizer);
};
const useOrbitControls = () => {
  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.9;
  controls.target.set(0, 0.2, 0);
  controls.update();

  return controls;
};
const useDragControls = () => {
  const controls = new DragControls(scene.children, camera, renderer.parameters.canvas);

  const mouse = new Vector2();
  const raycaster = new Raycaster();

  document.addEventListener('click', () => {
    if (state.drag.selection) {
      console.log('here1');
    } else console.log('here2');
  });

  return controls;
};

const light = createLight();
const camera = createCamera();
camera.add(light);

const bigSphereGeometry = new SphereGeometry(0.25, 32, 24);
const smallSphereGeometry = new SphereGeometry(0.1, 32, 24);

const reference = createSphere(smallSphereGeometry, 0, 0, 0);
const sphere = createSphere(bigSphereGeometry, 1, 0, 0);
const spheres = createSpheres();

const scene = createScene();
const group = new Group();
scene.add(camera, reference, sphere, spheres, group);

useVisualizer(scene, reference);
useVisualizer(scene, sphere);
useVisualizer(scene, spheres);

const renderer = await createRenderer(() => {
  orbitControls.update();
  renderer.render(scene, camera);
});

useWindowResizer(renderer, camera);

const dragControls = useDragControls();
const orbitControls = useOrbitControls(spheres);

UI.create('Controls', state)
  .shortcut('s', 'Toggle selection', state => {
    state.drag.selection = !state.drag.selection;
    dragControls.enabled = state.drag.selection;
  })
  .shortcut('m', 'Toggle drag mode', state => {
    state.drag.mode = state.drag.mode === 'translate' ? 'rotate' : 'translate';
    dragControls.mode = state.drag.mode;
  })
  .folder('Drag options')
  .boolean('drag.selection', 'Selection', value => (dragControls.enabled = value))
  .option<'translate' | 'rotate'>(
    'drag.mode',
    'Mode',
    {
      translate: 'Translate',
      rotate: 'Rotate',
    },
    value => (dragControls.mode = value),
  );
