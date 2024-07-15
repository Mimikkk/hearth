import {
  checker,
  color,
  float,
  MeshStandardNodeMaterial,
  oscSine,
  output,
  timerLocal,
  toneMapping,
  uv,
  vec3,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import {
  AnimationMixer,
  Clock,
  Color,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SpotLight,
  ToneMapping,
} from '@modules/renderer/engine/engine.js';
import { degreeToRadian } from '@modules/renderer/engine/math/MathUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { useStats } from '@modules/renderer/examples/utilities/useStats.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.set(1, 2, 3);
  camera.lookAt(0, 1, 0);

  return camera;
};
const createScene = () => {
  const scene = new Scene();
  scene.background = new Color('lightblue');
  return scene;
};
const createLight = () => {
  const light = new SpotLight(0xffffff, 1);
  light.power = 2000;

  return light;
};
const createRenderer = async (onAnimate: () => void) => {
  const renderer = await Renderer.create();
  renderer.setAnimationLoop(onAnimate);
  renderer.parameters.toneMappingNode = toneMapping(ToneMapping.Linear, 0.15);
  document.body.append(renderer.parameters.canvas);

  return renderer;
};
const loadMichelle = async () => {
  const gltf = await GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');
  const object = gltf.scene;
  const mixer = new AnimationMixer(object);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  return { object, mixer };
};

const camera = createCamera();
const scene = createScene();
const light = createLight();
const clock = new Clock();
const { object, mixer } = await loadMichelle();

const spheres = new Group();

const geometry = new SphereGeometry({ radius: 0.3, widthSegments: 32, heightSegments: 16 });
const addBackdropSphere = (backdropNode: any) => {
  const distance = 1;
  const id = spheres.children.length;
  const rotation = degreeToRadian(id * 45);

  const material = new MeshStandardNodeMaterial({ color: 0x0066ff });
  material.roughnessNode = float(0.2);
  material.metalnessNode = float(0);
  material.backdropNode = backdropNode;
  material.transparent = true;

  const mesh = new Mesh(geometry, material);
  mesh.position.set(Math.cos(rotation) * distance, 1, Math.sin(rotation) * distance);

  spheres.add(mesh);
};

addBackdropSphere(viewportSharedTexture().bgr.hue(oscSine().mul(Math.PI)));
addBackdropSphere(viewportSharedTexture().rgb.oneMinus());
addBackdropSphere(viewportSharedTexture().rgb.saturation(0));
addBackdropSphere(viewportSharedTexture().rgb.saturation(10), oscSine());
addBackdropSphere(viewportSharedTexture().rgb.overlay(checker(uv().mul(10))));
addBackdropSphere(viewportSharedTexture(viewportTopLeft.mul(40).floor().div(40)));
addBackdropSphere(viewportSharedTexture(viewportTopLeft.mul(80).floor().div(80)).add(color(0x0033ff)));
addBackdropSphere(vec3(0, 0, viewportSharedTexture().b));

camera.add(light);
scene.add(object, camera, spheres);

const renderer = await createRenderer(() => {
  const delta = clock.getDelta();

  mixer?.update(delta);
  spheres.rotateY(delta * 0.5);

  renderer.render(scene, camera);
});
useWindowResizer(renderer, camera);
