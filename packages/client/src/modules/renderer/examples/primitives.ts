import { WindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { normalWorld } from '@modules/renderer/engine/nodes/accessors/NormalNode.js';
import { color } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.primitves.js';
import {
  BoxGeometry,
  Fog,
  Geometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
} from '@modules/renderer/engine/engine.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

const container = document.createElement('div');
document.body.appendChild(container);

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(0, 2, 3);
  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(0xff0000, 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(0x0f00a5), color(0x0f0fbc));
  return scene;
};

const createSphere = (geometry: Geometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Math.random() * 0xffffff });

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const createGround = () => {
  const geometry = new BoxGeometry();
  const material = new MeshLambertMaterial({ color: 0x00ff00 });
  const mesh = new Mesh(geometry, material);

  mesh.position.set(0, -1, 0);
  mesh.setRotationX(-Math.PI / 2);
  return mesh;
};

const camera = createCamera();

const center = createSphere(new SphereGeometry({ radius: 0.1 }), 0, 0, 0);
const sphere = createSphere(new SphereGeometry({ radius: 0.25 }), 1, 0, 0);
const ground = createGround();

const scene = createScene();
scene.add(camera, center, sphere, ground);

const hearth = await Hearth.as({ useAntialias: true });
WindowResizer.attach(hearth, camera);
OrbitControls.attach(hearth, camera);
scene.attach(hearth, camera);
