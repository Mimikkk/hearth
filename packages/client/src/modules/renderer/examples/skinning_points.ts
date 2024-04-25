import * as THREE from '../threejs/Three.js';
import { uniform, skinning, PointsNodeMaterial } from '../threejs/nodes/Nodes.js';

import { GLTFLoader } from '../threejs/loaders/GLTFLoader.js';

import { WebGPU } from '@modules/renderer/threejs/capabilities/WebGPU.js';
import { WebGL } from '@modules/renderer/threejs/capabilities/WebGL.js';

import WebGPURenderer from '../threejs/renderers/webgpu/WebGPURenderer.js';

let camera, scene, renderer;

let mixer, clock;

init();

function init() {
  if (WebGPU.isAvailable() === false && WebGL.isWebGL2Available() === false) {
    document.body.appendChild(WebGPU.getErrorMessage());

    throw new Error('No WebGPU or WebGL2 support');
  }

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 300, -85);

  scene = new THREE.Scene();
  camera.lookAt(0, 0, -85);

  clock = new THREE.Clock();

  const loader = new GLTFLoader();
  loader.load('models/gltf/Michelle.glb', function (gltf) {
    const object = gltf.scene;
    mixer = new THREE.AnimationMixer(object);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    object.traverse(function (child) {
      if (child.isMesh) {
        child.visible = false;

        const materialPoints = new PointsNodeMaterial();
        materialPoints.colorNode = uniform(new THREE.Color());
        materialPoints.positionNode = skinning(child);

        const pointCloud = new THREE.Points(child.geometry, materialPoints);
        scene.add(pointCloud);
      }
    });

    scene.add(object);
  });

  //renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
