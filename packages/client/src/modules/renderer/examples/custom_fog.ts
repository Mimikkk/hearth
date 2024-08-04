import {
  color,
  f32,
  fog,
  MeshPhongNodeMaterial,
  Noise,
  normalWorld,
  positionView,
  positionWorld,
  timerLocal,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { PerspectiveCamera } from '@modules/renderer/engine/entities/cameras/PerspectiveCamera.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { InstancedMesh } from '@modules/renderer/engine/entities/InstancedMesh.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { HemisphereLight } from '@modules/renderer/engine/entities/lights/HemisphereLight.js';
import { PlaneGeometry } from '@modules/renderer/engine/entities/geometries/PlaneGeometry.js';
import { MeshPhongMaterial } from '@modules/renderer/engine/entities/materials/MeshPhongMaterial.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';

const transform = new Entity();
const center = Vec3.new();
const randomTransformMatrix = () => {
  const scaleY = Math.random() * 7 + 0.5;
  transform.position.x = Math.random() * 600 - 300;
  transform.position.z = Math.random() * 600 - 300;

  const distance = Math.max(transform.position.distanceTo(center) * 0.012, 1);

  transform.position.y = 0.5 * scaleY * distance;
  transform.scale.x = transform.scale.z = Math.random() * 3 + 0.5;
  transform.scale.y = scaleY * distance;

  transform.updateMatrix();

  return transform.matrix;
};
const createGround = () => {
  const geometry = new PlaneGeometry(200, 200);
  const material = new MeshPhongMaterial({ color: 0x999999 });
  const mesh = new Mesh(geometry, material);

  mesh.setRotationX(-Math.PI / 2);
  mesh.scale.scale(3);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};
const createSkyScrapper = (fogLevel: Node) => {
  const windows = positionWorld.y.mul(10).floor().mod(4).sign().mix(color(0x000066).add(fogLevel), color(0xffffff));

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshPhongNodeMaterial({ colorNode: windows });

  return new InstancedMesh(geometry, material, 4000);
};
const createCamera = () => {
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 600);
  camera.position.set(30, 15, 30);

  return camera;
};
const createLight = (skyColor: Node, groundColor: Node) => {
  return new HemisphereLight(skyColor.value, groundColor.value, 0.5);
};
const createFogNoise = (groundColor: Node) => {
  const timer = timerLocal(1);
  const fogNoiseA = Noise.tri.f32(positionWorld.mul(0.005), 0.2, timer);
  const fogNoiseB = Noise.tri.f32(positionWorld.mul(0.01), 0.2, timer.mul(1.2));

  return fogNoiseA.add(fogNoiseB).mul(groundColor);
};
const createFogLevel = (camera: ICamera) => {
  return positionView.z.negate().smoothstep(0, camera.far - 300);
};
const createGroundFog = (groundColor: Node) => {
  const fogNoise = createFogNoise(groundColor);

  const alpha = 0.98;
  const distance = fogLevel.mul(20).max(4);
  const groundFogArea = f32(distance).sub(positionWorld.y).div(distance).pow(3).saturate().mul(alpha);
  return fog(fogLevel.oneMinus().mix(groundColor, fogNoise), groundFogArea);
};
const createBackground = (skyColor: Node, groundColor: Node) => {
  return normalWorld.y.max(0).mix(groundColor, skyColor);
};
const useControls = (camera: ICamera, hearth: Hearth) => {
  const controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.target.set(0, 2, 0);
  controls.minDistance = 7;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.1;
  controls.update();
  return controls;
};

const skyColor = color(0xf0f5f5);
const groundColor = color(0xd0dee7);

const camera = createCamera();
const fogLevel = createFogLevel(camera);
const scrapper = createSkyScrapper(fogLevel);
for (let i = 0; i < scrapper.count; ++i) scrapper.setMatrixAt(i, randomTransformMatrix());

const scene = new Scene();
scene.fogNode = createGroundFog(groundColor);
scene.backgroundNode = createBackground(skyColor, groundColor);

const ground = createGround();
const light = createLight(skyColor, groundColor);

scene.add(scrapper, light, ground);

const hearth = await Hearth.as({
  animate() {
    controls.update();

    hearth.render(scene, camera);
  },
});
const controls = useControls(camera, hearth);

useWindowResizer(hearth, camera);
