import * as Engine from '@modules/renderer/engine/engine.js';
import { PointsNodeMaterial, skinning, uniform } from '@modules/renderer/engine/nodes/Nodes.js';

import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

let mixer, clock;

init();

async function init() {
  camera = new Engine.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 300, -85);

  scene = new Engine.Scene();
  camera.lookAt(0, 0, -85);

  clock = new Engine.Clock();

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/Michelle.glb').then(function (gltf) {
    const object = gltf.scene;
    mixer = new Engine.AnimationMixer(object);

    const action = mixer.clipAction(gltf.animations[0]);
    action.play();

    object.traverse(function (child) {
      if (child.isMesh) {
        child.visible = false;

        const materialPoints = new PointsNodeMaterial();
        materialPoints.colorNode = uniform(new Engine.Color());
        materialPoints.positionNode = skinning(child);

        const pointCloud = new Engine.Points(child.geometry, materialPoints);
        scene.add(pointCloud);
      }
    });

    scene.add(object);
  });

  //renderer

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer._animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  useWindowResizer(renderer, camera);
}

function animate() {
  const delta = clock.tick();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
