import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Hearth } from '@mimi/hearth';
import { PerspectiveCamera } from '@mimi/hearth';
import { Scene } from '@mimi/hearth';
import { normalWorld } from '@mimi/hearth';
import { color } from '@mimi/hearth';
import {
  Geometry,
  Fog,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  SphereGeometry,
  SpotLight,
  ICamera,
} from '@mimi/hearth';
import { OrbitControls } from '@mimi/hearth';
import { ColorMap } from '@mimi/hearth';
import { Random } from '@mimi/hearth';
import { MiniUi } from '@mimi/mini-ui';

const createCamera = () => {
  const camera = new PerspectiveCamera();
  camera.position.set(0, 2, 3);
  return camera;
};
const createLight = () => new SpotLight(ColorMap.white, 30);
const createScene = () => {
  const scene = new Scene();
  scene.fog = new Fog(ColorMap.red, 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(ColorMap.violet), color(ColorMap.blue));
  return scene;
};

const createSphere = (geometry: Geometry, x: number, y: number, z: number) => {
  const material = new MeshLambertMaterial({ color: Random.color() });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return mesh;
};

const useOrbitControls = (camera: ICamera, canvas: HTMLCanvasElement) => {
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

const reference = createSphere(new SphereGeometry({ radius: 0.1 }), 0, 0, 0);
const sphere = createSphere(new SphereGeometry({ radius: 0.25 }), 1, 0, 0);

const scene = createScene();

scene.add(camera, reference, sphere);

const hearth = await Hearth.as({
  animate() {
    controls.update();
    hearth.render(scene, camera);
  },
});
useWindowResizer(hearth, camera);

const controls = useOrbitControls(camera, hearth.parameters.canvas);

MiniUi.create('Orbit controls')
  .text('Move:', 'Right Click  + Drag')
  .text('Zoom:', 'Scroll')
  .text('Rotate:', 'Left Click + Drag');
