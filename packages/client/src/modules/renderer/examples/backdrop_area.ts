import {
  checker,
  color,
  depth,
  depthTexture,
  MeshBasicNodeMaterial,
  modelScale,
  toneMapping,
  uv,
  viewportMipTexture,
  viewportSharedTexture,
  viewportTopLeft,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GUI } from 'lil-gui';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import {
  AnimationMixer,
  BoxGeometry,
  Clock,
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  Side,
  ToneMapping,
} from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 25);
camera.position.set(3, 2, 3);

const scene = new Scene();
scene.background = new Color(0x333333);
camera.lookAt(0, 1, 0);

const clock = new Clock();

// modelwe

let mixer: AnimationMixer;
const loader = new GLTFLoader();
loader.loadAsync('resources/models/gltf/Michelle.glb').then(function (gltf) {
  const object = gltf.scene;
  mixer = new AnimationMixer(object);

  const action = mixer.clipAction(gltf.animations[0]);
  action.play();

  scene.add(object);
});

// volume

const depthDistance = depthTexture().distance(depth);
const depthAlphaNode = depthDistance.oneMinus().smoothstep(0.9, 2).mul(20).saturate();
const depthBlurred = viewportMipTexture().bicubic(
  depthDistance
    .smoothstep(0, 0.6)
    .mul(40 * 5)
    .clamp(0, 5),
);

const blurredBlur = new MeshBasicNodeMaterial();
blurredBlur.backdropNode = depthBlurred.add(depthAlphaNode.mix(color(0x0066ff), 0));
blurredBlur.transparent = true;
blurredBlur.side = Side.Double;

const volumeMaterial = new MeshBasicNodeMaterial();
volumeMaterial.colorNode = color(0x0066ff);
volumeMaterial.backdropNode = viewportSharedTexture();
volumeMaterial.backdropAlphaNode = depthAlphaNode;
volumeMaterial.transparent = true;
volumeMaterial.side = Side.Double;

const depthMaterial = new MeshBasicNodeMaterial();
depthMaterial.backdropNode = depthAlphaNode;
depthMaterial.transparent = true;
depthMaterial.side = Side.Double;

const bicubicMaterial = new MeshBasicNodeMaterial();
bicubicMaterial.backdropNode = viewportMipTexture().bicubic(5); // @TODO: Move to alpha value [ 0, 1 ]
bicubicMaterial.backdropAlphaNode = checker(uv().mul(3).mul(modelScale.xy));
bicubicMaterial.opacityNode = bicubicMaterial.backdropAlphaNode;
bicubicMaterial.transparent = true;
bicubicMaterial.side = Side.Double;

const pixelMaterial = new MeshBasicNodeMaterial();
pixelMaterial.backdropNode = viewportSharedTexture(viewportTopLeft.mul(100).floor().div(100));
pixelMaterial.transparent = true;

// box / floor

const box = new Mesh(new BoxGeometry(2, 2, 2), volumeMaterial);
box.position.set(0, 1, 0);
scene.add(box);

const floor = new Mesh(new BoxGeometry(1.99, 0.01, 1.99), new MeshBasicNodeMaterial({ color: 0x333333 }));
floor.position.set(0, 0, 0);
scene.add(floor);

// renderer

const renderer = await Renderer.create();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.parameters.toneMappingNode = toneMapping(ToneMapping.Linear, 0.15);
document.body.appendChild(renderer.parameters.canvas);

const controls = new OrbitControls(camera, renderer.parameters.canvas);
controls.target.set(0, 1, 0);
controls.update();

useWindowResizer(renderer, camera);

// gui

const materials = {
  blurred: blurredBlur,
  volume: volumeMaterial,
  depth: depthMaterial,
  bicubic: bicubicMaterial,
  pixel: pixelMaterial,
};

const gui = new GUI();
const options = { material: 'blurred' };

box.material = materials[options.material];

gui.add(box.scale, 'x', 0.1, 2, 0.01);
gui.add(box.scale, 'z', 0.1, 2, 0.01);
gui.add(options, 'material', Object.keys(materials)).onChange(name => {
  box.material = materials[name];
});

function animate() {
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
