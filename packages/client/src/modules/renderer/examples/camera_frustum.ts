import { MeshStandardNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import {
  Camera,
  CameraHelper,
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

const createCamera = () => {
  const perspectiveCamera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
  perspectiveCamera.position.set(0, 0, 3);
  perspectiveCamera.lookAt(0, 0, 0);

  const frustumCamera = new OrthographicCamera(0, 1, 1, 0, 5, 100);
  frustumCamera.position.set(0, 0, 3);
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

const frustumHelper = new CameraHelper(frustumCamera);
perspectiveCamera.add(light);
scene.add(frustumHelper, frustumCamera, perspectiveCamera, spheres);

const renderer = await createRenderer(() => {
  const delta = clock.getDelta();

  spheres.rotateZ(delta * 0.5);

  renderer.render(scene, state.camera);
});
useWindowResizer.updateSize(renderer, state.camera);
useWindowResizer(renderer, state.camera);

UI.create<{ camera: Camera }>('Controls', state)
  .action('Switch camera', s => {
    s.camera = s.camera === perspectiveCamera ? frustumCamera : perspectiveCamera;
    useWindowResizer.updateSize(renderer, s.camera);
  })
  .action('Reset camera position', () => {
    perspectiveCamera.position.set(0, 0, 3);
    perspectiveCamera.lookAt(0, 0, 0);

    frustumCamera.position.set(0, 0, 3);
    frustumCamera.lookAt(0, 0, 0);
  });
