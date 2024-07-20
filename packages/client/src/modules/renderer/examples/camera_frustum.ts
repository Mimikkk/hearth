import { MeshStandardNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import {
  Camera,
  CameraVisualizer,
  Clock,
  Color,
  Group,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SpotLight,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { float } from 'three/examples/jsm/nodes/shadernode/ShaderNode.js';
import { UI } from '@modules/renderer/examples/utilities/UI.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

const createCamera = () => {
  const perspectiveCamera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
  perspectiveCamera.position.set(0, 0, 3);
  perspectiveCamera.lookAt(0, 0, 0);

  const frustumCamera = new OrthographicCamera(-1, 1, 1, -1, 1, 5);
  frustumCamera.position.set(0, 0, -3);
  frustumCamera.lookAt(0, 0, 0);

  return { perspectiveCamera, frustumCamera };
};
const createScene = () => {
  const scene = new Scene();
  scene.background = new Color('lightblue');
  return scene;
};
const createLight = () => new SpotLight(0xffffff, 10);
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.setAnimationLoop(onAnimate);
  document.body.append(renderer.parameters.canvas);

  return renderer;
};
const useOrbitControls = (canvas: HTMLCanvasElement) => {
  const controls = new OrbitControls(state.camera, canvas);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI * 0.9;
  controls.target.set(0, 0.2, 0);
  controls.update();

  return controls;
};

const { perspectiveCamera, frustumCamera } = createCamera();
const state = <{ camera: Camera }>{ camera: perspectiveCamera };

const scene = createScene();
const light = createLight();
const clock = new Clock();
const spheres = new Group();

const geometry = new SphereGeometry(0.25, 32, 24);
const addSphere = (x: number, y: number, z: number) => {
  const material = new MeshStandardNodeMaterial({ color: Math.random() * 0xffffff });
  material.roughnessNode = float(0.8);
  material.metalnessNode = float(0.2);

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  spheres.add(mesh);
};

addSphere(0, 0, 3);
addSphere(0, 0, -3);

addSphere(0, 0, 0);
addSphere(1, 0, 0);
addSphere(0, 1, 0);
addSphere(1, 1, 0);

const frustumVisualizer = new CameraVisualizer(frustumCamera);
perspectiveCamera.add(light);
scene.add(frustumVisualizer, frustumCamera, perspectiveCamera, spheres);

const renderer = await createRenderer(() => {
  spheres.rotateZ(clock.getDelta());

  controls.update();
  renderer.render(scene, state.camera);
});
const controls = useOrbitControls(renderer.parameters.canvas);
useWindowResizer.updateSize(renderer, state.camera);
useWindowResizer(renderer, state.camera);

UI.create<{ camera: Camera }>('Controls', state)
  .action('Switch camera', s => {
    s.camera = s.camera === perspectiveCamera ? frustumCamera : perspectiveCamera;
    controls.enabled = s.camera === perspectiveCamera;

    useWindowResizer.updateSize(renderer, s.camera);
  })
  .action('Reset camera position', () => {
    perspectiveCamera.position.set(0, 0, 3);
    perspectiveCamera.lookAt(0, 0, 0);

    frustumCamera.position.set(0, 0, 3);
    frustumCamera.lookAt(0, 0, 0);
  });
