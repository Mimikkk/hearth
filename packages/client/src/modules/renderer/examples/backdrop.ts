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
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
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

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(1, 2, 3);

const scene = new Scene();
scene.background = new Color('lightblue');
camera.lookAt(0, 1, 0);

const clock = new Clock();

//lights

const light = new SpotLight(0xffffff, 1);
light.power = 2000;
camera.add(light);
scene.add(camera);

const loader = new GLTFLoader();
let mixer: AnimationMixer;
loader.loadAsync('resources/models/gltf/Michelle.glb').then(function (gltf) {
  const object = gltf.scene;
  mixer = new AnimationMixer(object);

  const material = object.children[0].children[0].material;

  // output material effect ( better using hsv )
  // ignore output.sRGBToLinear().linearTosRGB() for now

  material.outputNode = oscSine(timerLocal(0.1)).mix(output, output.add(0.1).posterize(4).mul(2));

  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  scene.add(object);
});

// portals

const geometry = new SphereGeometry(0.3, 32, 16);

const portals = new Group();
scene.add(portals);

function addBackdropSphere(backdropNode, backdropAlphaNode = null) {
  const distance = 1;
  const id = portals.children.length;
  const rotation = degreeToRadian(id * 45);

  const material = new MeshStandardNodeMaterial({ color: 0x0066ff });
  material.roughnessNode = float(0.2);
  material.metalnessNode = float(0);
  material.backdropNode = backdropNode;
  material.backdropAlphaNode = backdropAlphaNode;
  material.transparent = true;

  const mesh = new Mesh(geometry, material);
  mesh.position.set(Math.cos(rotation) * distance, 1, Math.sin(rotation) * distance);

  portals.add(mesh);
}

addBackdropSphere(viewportSharedTexture().bgr.hue(oscSine().mul(Math.PI)));
addBackdropSphere(viewportSharedTexture().rgb.oneMinus());
addBackdropSphere(viewportSharedTexture().rgb.saturation(0));
addBackdropSphere(viewportSharedTexture().rgb.saturation(10), oscSine());
addBackdropSphere(viewportSharedTexture().rgb.overlay(checker(uv().mul(10))));
addBackdropSphere(viewportSharedTexture(viewportTopLeft.mul(40).floor().div(40)));
addBackdropSphere(viewportSharedTexture(viewportTopLeft.mul(80).floor().div(80)).add(color(0x0033ff)));
addBackdropSphere(vec3(0, 0, viewportSharedTexture().b));

//renderer

const renderer = await Renderer.create();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
await renderer.setAnimationLoop(animate);

renderer.parameters.toneMappingNode = toneMapping(ToneMapping.Linear, 0.15);
document.body.appendChild(renderer.parameters.canvas);

const controls = new OrbitControls(camera, renderer.parameters.canvas);
controls.target.set(0, 1, 0);

let rotate = true;

const toggleRotation = () => (rotate = !rotate);
controls.eventDispatcher.add('start', toggleRotation);
controls.eventDispatcher.add('end', toggleRotation);
controls.update();

useWindowResizer(renderer, camera);

function animate() {
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);
  if (rotate) portals.rotation.y += delta * 0.5;

  renderer.render(scene, camera);
}
