import * as Engine from '@modules/renderer/engine/engine.js';
import {
  color,
  MeshStandardNodeMaterial,
  mix,
  oscSine,
  pass,
  range,
  timerLocal,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/GLTFLoader.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import PostProcessing from '@modules/renderer/engine/renderers/common/PostProcessing.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let postProcessing;

let mixer, clock;

init();

function init() {
  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 40);
  camera.position.set(1, 2, 3);

  scene = new Engine.Scene();
  camera.lookAt(0, 1, 0);

  clock = new Engine.Clock();

  // lights

  const centerLight = new Engine.PointLight(0xff9900, 1, 100);
  centerLight.position.y = 4.5;
  centerLight.position.z = -2;
  centerLight.power = 400;
  scene.add(centerLight);

  const cameraLight = new Engine.PointLight(0x0099ff, 1, 100);
  cameraLight.power = 400;
  camera.add(cameraLight);
  scene.add(camera);

  const geometry = new Engine.PlaneGeometry(1000, 1000);
  geometry.rotateX(-Math.PI / 2);

  const plane = new Engine.Mesh(geometry, new Engine.MeshBasicMaterial({ color: 0x000000, visible: true }));
  scene.add(plane);

  const loader = new GLTFLoader();
  loader.loadAsync('models/gltf/Michelle.glb').then(function (gltf) {
    const object = gltf.scene;

    mixer = new Engine.AnimationMixer(object);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    const instanceCount = 30;
    const dummy = new Engine.Object3D();

    object.traverse(child => {
      if (child.isMesh) {
        const oscNode = oscSine(timerLocal(0.1));

        // random colors between instances from 0x000000 to 0xFFFFFF
        const randomColors = range(new Engine.Color(0x000000), new Engine.Color(0xffffff));

        // random [ 0, 1 ] values between instances
        const randomMetalness = range(0, 1);

        child.material = new MeshStandardNodeMaterial();
        child.material.roughness = 0.1;
        child.material.metalnessNode = mix(0.0, randomMetalness, oscNode);
        child.material.colorNode = mix(color(0xffffff), randomColors, oscNode);

        child.isInstancedMesh = true;
        child.instanceMatrix = new Engine.InstancedBufferAttribute(new Float32Array(instanceCount * 16), 16);
        child.count = instanceCount;

        for (let i = 0; i < instanceCount; i++) {
          dummy.position.x = -200 + (i % 5) * 70;
          dummy.position.y = Math.floor(i / 5) * -200;

          dummy.updateMatrix();

          dummy.matrix.toArray(child.instanceMatrix.array, i * 16);
        }
      }
    });

    scene.add(object);
  });

  // renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  // post processing ( just for WebGPUBackend for now )

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode();
  const scenePassDepth = scenePass.getDepthNode().remapClamp(0.15, 0.3);

  const scenePassColorBlurred = scenePassColor.gaussianBlur();
  scenePassColorBlurred.directionNode = scenePassDepth;

  postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = scenePassColorBlurred;

  // events

  useWindowResizer(renderer, camera);
}

function animate() {
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  postProcessing.render();
}
