import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';
import {
  BoundingBoxVisualizer,
  Geometry,
  Fog,
  Mesh,
  MeshLambertMaterial,
  Entity,
  SphereGeometry,
  SpotLight,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

const container = document.createElement('div');
document.body.appendChild(container);

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  camera.position.set(0, 2, 3);
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
  renderer.animation.loop = onAnimate;
  document.body.appendChild(renderer.parameters.canvas);

  return renderer;
};

const createSphere = (geometry: Geometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Math.random() * 0xffffff });

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const useVisualizer = (scene: Scene, of: Entity) => {
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

const light = createLight();
const camera = createCamera();
camera.add(light);

const reference = createSphere(new SphereGeometry({ radius: 0.1, widthSegments: 32, heightSegments: 24 }), 0, 0, 0);
const sphere = createSphere(new SphereGeometry({ radius: 0.25, widthSegments: 32, heightSegments: 24 }), 1, 0, 0);

const scene = createScene();

scene.add(camera, reference, sphere);

useVisualizer(scene, reference);
useVisualizer(scene, sphere);

const renderer = await createRenderer(() => {
  orbitControls.update();
  renderer.render(scene, camera);
});

useWindowResizer(renderer, camera);

const orbitControls = useOrbitControls();
