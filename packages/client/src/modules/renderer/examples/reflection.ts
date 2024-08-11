import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  MeshPhongNodeMaterial,
  normalWorld,
  pass,
  reflector,
  texture,
  uv,
  vignette,
} from '@modules/renderer/engine/nodes/nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { HearthPostprocess } from '@modules/renderer/engine/hearth/Hearth.Postprocess.js';

import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';
import { TextureLoader } from '@modules/renderer/engine/loaders/textures/TextureLoader/TextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;
let model, mixer, clock;
let postProcessing;
let controls;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.25, 30);
  camera.position.set(2, 2.5, 3);

  scene = new Engine.Scene();
  scene.fog = new Engine.Fog(0x0487e2, 7, 25);
  scene.backgroundNode = normalWorld.y.mix(color(0x0487e2), color(0x0066ff));
  camera.lookAt(0, 1, 0);

  const sunLight = new Engine.DirectionalLight(0xffe499, 5);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 5;
  sunLight.shadow.camera.right = 2;
  sunLight.shadow.camera.left = -2;
  sunLight.shadow.camera.top = 2;
  sunLight.shadow.camera.bottom = -2;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  sunLight.position.set(0.5, 3, 0.5);

  const waterAmbientLight = new Engine.HemisphereLight(0x333366, 0x74ccf4, 5);
  const skyAmbientLight = new Engine.HemisphereLight(0x74ccf4, 0, 1);

  scene.add(sunLight);
  scene.add(skyAmbientLight);
  scene.add(waterAmbientLight);

  clock = new Engine.Clock();

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/Michelle.glb').then(function(gltf) {
    model = gltf.scene;
    model.children[0].children[0].castShadow = true;

    mixer = new Engine.AnimationMixer(model);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    scene.add(model);
  });

  const textureLoader = new TextureLoader();

  const floorColor = await textureLoader.loadAsync('resources/textures/floors/FloorsCheckerboard_S_Diffuse.jpg');
  floorColor.wrapS = Engine.Wrapping.Repeat;
  floorColor.wrapT = Engine.Wrapping.Repeat;
  floorColor.colorSpace = Engine.ColorSpace.SRGB;

  const floorNormal = await textureLoader.loadAsync('resources/textures/floors/FloorsCheckerboard_S_Normal.jpg');
  floorNormal.wrapS = Engine.Wrapping.Repeat;
  floorNormal.wrapT = Engine.Wrapping.Repeat;

  const floorUV = uv().mul(15);
  const floorNormalOffset = texture(floorNormal, floorUV).xy.mul(2).sub(1).mul(0.02);

  const reflection = reflector({ resolution: 0.5 });
  reflection.target.rotateX(-Math.PI / 2);
  reflection.uvNode = reflection.uvNode.add(floorNormalOffset);
  scene.add(reflection.target);

  const floorMaterial = new MeshPhongNodeMaterial();
  floorMaterial.colorNode = texture(floorColor, floorUV).add(reflection);

  const floor = new Engine.Mesh(new Engine.BoxGeometry(50, 0.001, 50), floorMaterial);
  floor.position.set(0, 0, 0);
  scene.add(floor);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1;
  controls.target.set(0, 0.5, 0);
  controls.update();

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();
  const scenePassDepth = scenePass.getDepthNode().remapClamp(0.3, 0.5);

  const scenePassColorBlurred = scenePassColor.gaussianBlur();
  scenePassColorBlurred.directionNode = scenePassDepth;

  postProcessing = new HearthPostprocess(hearth);
  postProcessing.outputNode = scenePassColorBlurred.mul(vignette());

  useWindowResizer(hearth, camera);
}

function animate() {
  controls.update();

  const delta = clock.tick();

  if (model) {
    mixer.update(delta);
  }

  postProcessing.render();
}
