import {
  color,
  depth,
  depthTexture,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  mx_cell_noise_float,
  mx_fractal_noise_float,
  mx_perlin_noise_float,
  mx_worley_noise_float,
  normalWorld,
  objectPosition,
  pass,
  positionWorld,
  texture,
  timerLocal,
  triplanarTexture,
  vec2,
  viewportDepthTexture,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import PostProcessing from '@modules/renderer/engine/renderers/PostProcessing.js';

import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';

import { GUI } from 'lil-gui';

import {
  AnimationMixer,
  BoxGeometry,
  Clock,
  ColorSpace,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vec3,
  Wrapping,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';

// let camera, scene, renderer;
// let mixer, objects, clock;
// let model, floor, floorPosition;
// let postProcessing;
// let controls;

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
camera.position.set(3, 2, 4);

const scene = new Scene();
scene.fog = new Fog(0x0487e2, 7, 25);
scene.backgroundNode = normalWorld.y.mix(color(0x0487e2), color(0x0066ff));
camera.lookAt(0, 1, 0);

const sunLight = new DirectionalLight(0xffe499, 5);
sunLight.castShadow = true;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 5;
sunLight.shadow.camera.right = 2;
sunLight.shadow.camera.left = -2;
sunLight.shadow.camera.top = 1;
sunLight.shadow.camera.bottom = -2;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.001;
sunLight.position.set(0.5, 3, 0.5);

const waterAmbientLight = new HemisphereLight(0x333366, 0x74ccf4, 5);
const skyAmbientLight = new HemisphereLight(0x74ccf4, 0, 1);

scene.add(sunLight);
scene.add(skyAmbientLight);
scene.add(waterAmbientLight);

const clock = new Clock();

// animated model

let model: Group;
let mixer: AnimationMixer;
const loader = new GLTFLoader();
loader.loadAsync('resources/models/gltf/Michelle.glb').then(gltf => {
  model = gltf.scene;
  model.children[0].children[0].castShadow = true;

  mixer = new AnimationMixer(model);

  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  scene.add(model);
});

// objects

const iceDiffuse = await new TextureLoader().loadAsync('resources/textures/water/water.jpg');
iceDiffuse.wrapS = Wrapping.Repeat;
iceDiffuse.wrapT = Wrapping.Repeat;
iceDiffuse.colorSpace = null;

const iceColorNode = triplanarTexture(texture(iceDiffuse)).add(color(0x0066ff)).mul(0.8);

const geometry = new IcosahedronGeometry(1, 3);
const material = new MeshStandardNodeMaterial({ colorNode: iceColorNode });

const count = 100;
const scale = 3.5;
const column = 10;

const objects = new Group();

for (let i = 0; i < count; i++) {
  const x = i % column;
  const y = i / column;

  const mesh = new Mesh(geometry, material);
  mesh.position.set(x * scale, 0, y * scale);
  mesh.setRotation(Math.random(), Math.random(), Math.random());
  objects.add(mesh);
}

objects.position.set((column - 1) * scale * -0.5, -1, (count / column) * scale * -0.5);

scene.add(objects);

// water

const timer = timerLocal(1);
const floorUV = positionWorld.xzy;

const waterLayer0 = mx_perlin_noise_float(floorUV.mul(4).add(timer));
const waterLayer1 = mx_perlin_noise_float(floorUV.mul(2).add(timer));

const waterIntensity = waterLayer0.mul(waterLayer1);
const waterColor = waterIntensity.mul(1.4).mix(color(0x0487e2), color(0x74ccf4));

const depthWater = depthTexture(viewportDepthTexture()).sub(depth);
const depthEffect = depthWater.remapClamp(-0.002, 0.04);

const refractionUV = viewportTopLeft.add(vec2(0, waterIntensity.mul(0.1)));

const depthTestForRefraction = depthTexture(viewportDepthTexture(refractionUV)).sub(depth);

const depthRefraction = depthTestForRefraction.remapClamp(0, 0.1);

const finalUV = depthTestForRefraction.lessThan(0).cond(viewportTopLeft, refractionUV);

const viewportTexture = viewportSharedTexture(finalUV);

const waterMaterial = new MeshBasicNodeMaterial();
waterMaterial.colorNode = waterColor;
waterMaterial.backdropNode = depthEffect.mix(
  viewportSharedTexture(),
  viewportTexture.mul(depthRefraction.mix(1, waterColor)),
);
waterMaterial.backdropAlphaNode = depthRefraction.oneMinus();
waterMaterial.transparent = true;

const water = new Mesh(new BoxGeometry(50, 0.001, 50), waterMaterial);
water.position.set(0, 0, 0);
scene.add(water);

// floor

const floor = new Mesh(new CylinderGeometry(1.1, 1.1, 10), new MeshStandardNodeMaterial({ colorNode: iceColorNode }));
floor.position.set(0, -5, 0);
scene.add(floor);

// caustics

const waterPosY = positionWorld.y.sub(water.position.y);

let transition = waterPosY.add(0.1).saturate().oneMinus();
transition = waterPosY.lessThan(0).cond(transition, normalWorld.y.mix(transition, 0)).toVar();

const colorNode = transition.mix(material.colorNode, material.colorNode.add(waterLayer0));

//material.colorNode = colorNode;
floor.material.colorNode = colorNode;

// renderer

const renderer = await Renderer.create();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.animation.loop = animate;
document.body.appendChild(renderer.parameters.canvas);

const controls = new OrbitControls(camera, renderer.parameters.canvas);
controls.minDistance = 1;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI * 0.9;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
controls.target.set(0, 0.2, 0);
controls.update();

// gui

const gui = new GUI();

const floorPosition = Vec3.new(0, 0.2, 0);

gui.add(floorPosition, 'y', -1, 1, 0.001).name('position');

// post processing

const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode();
const scenePassDepth = scenePass.getDepthNode().remapClamp(0.3, 0.5);

const waterMask = objectPosition(camera).y.greaterThan(0);

const scenePassColorBlurred = scenePassColor.gaussianBlur();
scenePassColorBlurred.directionNode = waterMask.cond(scenePassDepth, scenePass.getDepthNode().mul(5));

const vignet = viewportTopLeft.distance(0.5).mul(1.35).clamp().oneMinus();

const postProcessing = new PostProcessing(renderer);
postProcessing.outputNode = waterMask.cond(
  scenePassColorBlurred,
  scenePassColorBlurred.mul(color(0x74ccf4)).mul(vignet),
);

//

useWindowResizer(renderer, camera);

function animate() {
  controls.update();

  const delta = clock.tick();

  floor.position.y = floorPosition.y - 5;

  if (model) {
    mixer.update(delta);

    model.position.y = floorPosition.y;
  }

  for (const object of objects.children) {
    object.position.y = Math.sin(clock.total + object.id) * 0.3;
    object.rotateY(delta * 0.3);
  }

  postProcessing.render();
}
