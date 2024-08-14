import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  MeshStandardNodeMaterial,
  mix,
  oscSine,
  pass,
  range,
  timerLocal,
} from '@modules/renderer/engine/nodes/nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { HearthPostprocess } from '@modules/renderer/engine/hearth/Hearth.Postprocess.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';
import { Attribute, Buffer } from '@modules/renderer/engine/engine.js';

let camera, scene, hearth;
let postProcessing;

let mixer, clock;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 40);
  camera.position.set(1, 2, 3);

  scene = new Engine.Scene();
  camera.lookAt(0, 1, 0);

  clock = new Engine.Clock();

  const centerLight = new Engine.PointLight(0xff9900, 1, 100);
  centerLight.position.y = 4.5;
  centerLight.position.z = -2;
  centerLight.power = 400;
  scene.add(centerLight);

  const cameraLight = new Engine.PointLight(0x0099ff, 1, 100);
  cameraLight.power = 400;
  camera.add(cameraLight);
  scene.add(camera);

  const geometry = new Engine.PlaneGeometry({ width: 1000, height: 2 });
  geometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(geometry, new Engine.MeshBasicMaterial({ color: 0x000000, visible: true }));
  scene.add(plane);

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/Michelle.glb').then(function (gltf) {
    const object = gltf.scene;

    mixer = new Engine.AnimationMixer(object);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    const instanceCount = 30;
    const dummy = new Engine.Entity();

    object.traverse(child => {
      if (child.isMesh) {
        const oscNode = oscSine(timerLocal(0.1));

        const randomColors = range(new Engine.Color(0x000000), new Engine.Color(0xffffff));

        const randomMetalness = range(0, 1);

        child.material = new MeshStandardNodeMaterial();
        child.material.roughness = 0.1;
        child.material.metalnessNode = mix(0.0, randomMetalness, oscNode);
        child.material.colorNode = mix(color(0xffffff), randomColors, oscNode);

        child.isInstancedMesh = true;

        const buffer = Buffer.f32(instanceCount * 16, 16, BufferStep.Instance);
        child.instanceMatrix = Attribute.use(buffer);
        child.count = instanceCount;

        for (let i = 0; i < instanceCount; i++) {
          dummy.position.x = -200 + (i % 5) * 70;
          dummy.position.y = Math.floor(i / 5) * -200;

          dummy.updateMatrix();

          dummy.matrix.intoArray(child.instanceMatrix.array, i * 16);
        }
      }
    });

    scene.add(object);
  });

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();
  const scenePassDepth = scenePass.getDepthNode().remapClamp(0.15, 0.3);

  const scenePassColorBlurred = scenePassColor.gaussianBlur();
  scenePassColorBlurred.directionNode = scenePassDepth;

  postProcessing = new HearthPostprocess(hearth);
  postProcessing.outputNode = scenePassColorBlurred;

  useWindowResizer(hearth, camera);
}

function animate() {
  const delta = clock.tick();

  if (mixer) mixer.update(delta);

  postProcessing.render();
}
