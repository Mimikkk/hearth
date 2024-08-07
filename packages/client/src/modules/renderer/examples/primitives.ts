import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  Entity,
  Fog,
  Geometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  SpotLight,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

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
  const hearth = await Hearth.as();
  hearth.animation.loop = onAnimate;
  document.body.appendChild(hearth.parameters.canvas);

  return hearth;
};

const createSphere = (geometry: Geometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Math.random() * 0xffffff });

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const useVisualizer = (scene: Scene, of: Entity) => {};
const useOrbitControls = () => {
  const controls = new OrbitControls(camera, hearth.parameters.canvas);
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

const hearth = await createRenderer(() => {
  orbitControls.update();
  hearth.render(scene, camera);
});

useWindowResizer(hearth, camera);

const orbitControls = useOrbitControls();
