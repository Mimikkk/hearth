import {
  AnimationMixer,
  Clock,
  Color,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
} from '@modules/renderer/engine/engine.js';
import { PointsNodeMaterial, skinning, uniform } from '@modules/renderer/engine/nodes/Nodes.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

const createCamera = () => {
  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 300, -85);
  camera.lookAt(0, 0, -85);
  return camera;
};
const loadMichelle = () => GLTFLoader.loadAsync('resources/models/gltf/Michelle.glb');

const camera = createCamera();
const scene = new Scene();

const { animations, scene: object } = await loadMichelle();

object.traverse(child => {
  child.visible = false;
  const materialPoints = new PointsNodeMaterial();
  materialPoints.colorNode = uniform(Color.new());
  materialPoints.positionNode = skinning(child);
  const pointCloud = new Points(child.geometry, materialPoints);
  scene.add(pointCloud);
}, Mesh.is);

scene.add(object);

const mixer = new AnimationMixer(object);
mixer.clipAction(animations[0]).play();

const clock = new Clock();
const renderer = await Renderer.create({
  animate() {
    const delta = clock.getDelta();
    mixer?.update(delta);
    renderer.render(scene, camera);
  },
});

useWindowResizer(renderer, camera);
