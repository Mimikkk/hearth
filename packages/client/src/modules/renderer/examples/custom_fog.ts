import {
  color,
  f32,
  fog,
  MeshPhongNodeMaterial,
  Node,
  Noise,
  normalWorld,
  positionView,
  positionWorld,
  timerLocal,
} from '@mimi/hearth';
import { Hearth } from '@mimi/hearth';
import { OrbitControls } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { PerspectiveCamera } from '@mimi/hearth';
import { BoxGeometry } from '@mimi/hearth';
import { Scene } from '@mimi/hearth';
import { InstancedMesh } from '@mimi/hearth';
import { Entity } from '@mimi/hearth';
import { Vec3 } from '@mimi/hearth';
import { HemisphereLight } from '@mimi/hearth';
import { PlaneGeometry } from '@mimi/hearth';
import { MeshPhongMaterial } from '@mimi/hearth';
import { Mesh } from '@mimi/hearth';

const createGround = () => {
  const geometry = new PlaneGeometry({ width: 200, height: 200 });
  const material = new MeshPhongMaterial({ color: 0x999999 });
  const mesh = new Mesh(geometry, material);

  mesh.setRotationX(-Math.PI / 2);
  mesh.scale.scale(3);
  mesh.useShadowCast = true;
  mesh.useShadowReceive = true;

  return mesh;
};
const createSkyScrappers = () => {
  const level = positionView.z.negate().smoothstep(0, camera.far - 300);

  const windows = positionWorld.y.mul(10).floor().mod(4).sign().mix(color(0x000066).add(level), color(0xffffff));

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshPhongNodeMaterial({ colorNode: windows });

  return new InstancedMesh(geometry, material, 4000);
};
const randomizeSkyScrappers = (skyscrappers: InstancedMesh) => {
  const dummy = new Entity();
  const center = new Vec3();
  for (let i = 0; i < skyScrappers.count; i++) {
    dummy.position.x = Math.random() * 600 - 300;
    dummy.position.z = Math.random() * 600 - 300;
    const distance = Math.max(dummy.position.distanceTo(center) * 0.012, 1);

    const scaleY = Math.random() * 7 + 0.5;
    dummy.position.y = 0.5 * scaleY * distance;
    dummy.scale.x = dummy.scale.z = Math.random() * 3 + 0.5;
    dummy.scale.y = scaleY * distance;

    dummy.updateMatrix();
    skyscrappers.setMatrixAt(i, dummy.matrix);
  }
};
const createCamera = () => {
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 600);
  camera.position.set(30, 15, 30);

  return camera;
};
const createLight = (sky: Node, ground: Node) => new HemisphereLight(sky.value, ground.value, 0.5);
const createFog = () => {
  const level = positionView.z.negate().smoothstep(0, camera.far - 300);

  const distance = level.mul(20).max(4);
  const ground = f32(distance).sub(positionWorld.y).div(distance).pow(3).saturate().mul(0.98);

  const timer = timerLocal();
  const fogNoiseA = Noise.tri.f32(positionWorld.mul(0.005), 0.2, timer);
  const fogNoiseB = Noise.tri.f32(positionWorld.mul(0.01), 0.2, timer.mul(1.2));
  const noise = fogNoiseA.add(fogNoiseB).mul(groundColor);

  return fog(level.oneMinus().mix(groundColor, noise), ground);
};
const createScene = (sky: Node, ground: Node) => {
  const scene = new Scene();
  scene.fogNode = createFog();
  scene.backgroundNode = normalWorld.y.max(0).mix(ground, sky);

  return scene;
};

const skyColor = color(0xf0f5f5);
const groundColor = color(0xd0dee7);

const camera = createCamera();
const skyScrappers = createSkyScrappers();
randomizeSkyScrappers(skyScrappers);

const ground = createGround();
const light = createLight(skyColor, groundColor);
const scene = createScene(skyColor, groundColor).add(skyScrappers, light, ground);

const hearth = await Hearth.as({
  animate() {
    hearth.render(scene, camera);
  },
});

OrbitControls.attach(hearth, camera, { autoRotate: true, autoRotateSpeed: 0.5 });
useWindowResizer(hearth, camera);
