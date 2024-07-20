import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  BufferGeometry,
  Fog,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  SphereGeometry,
  SpotLight,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { IVec3 } from '@modules/renderer/engine/math/Vector3.js';
import { UI } from '@mimi/ui';
import { ColorMap } from '@modules/renderer/engine/math/Color.js';
import { Random } from '@modules/renderer/engine/math/random.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  IVec3.set(camera.position, 0, 2, 3);
  return camera;
};
const createLight = () => new SpotLight(ColorMap.white, 30);
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog('red', 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(ColorMap.violet), color(ColorMap.blue));
  return scene;
};
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.setAnimationLoop(onAnimate);
  document.body.appendChild(renderer.parameters.canvas);

  return renderer;
};

const createSphere = (geometry: BufferGeometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Random.color() });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const useOrbitControls = (camera: PerspectiveCamera | OrthographicCamera, canvas: HTMLCanvasElement) => {
  const controls = new OrbitControls(camera, canvas);
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

const renderer = await createRenderer(() => {
  orbitControls.update();
  renderer.render(scene, camera);
});
useWindowResizer(renderer, camera);

const orbitControls = useOrbitControls(camera, renderer.parameters.canvas);

UI.create('Orbit controls')
  .text('Move:', 'Right Click  + Drag')
  .text('Zoom:', 'Scroll')
  .text('Rotate:', 'Left Click + Drag');
