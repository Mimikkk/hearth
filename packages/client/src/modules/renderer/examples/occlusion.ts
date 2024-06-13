import * as THREE from '@modules/renderer/engine/engine.js';
import {
  MeshPhongNodeMaterial,
  Node,
  nodeObject,
  NodeUpdateType,
  uniform,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import { Renderer } from '@modules/renderer/engine/renderers/common/Renderer.js';
import { Camera, Scene } from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera: Camera, scene: Scene, renderer: Renderer, controls: OrbitControls;

class OcclusionNode extends Node {
  constructor(testObject: THREE.Object3D, normalColor: THREE.Color, occludedColor: THREE.Color) {
    super('vec3');

    this.updateType = NodeUpdateType.OBJECT;

    this.uniformNode = uniform(new THREE.Color());

    this.testObject = testObject;
    this.normalColor = normalColor;
    this.occludedColor = occludedColor;
  }

  async update(frame) {
    const isOccluded = frame.renderer.isOccluded(this.testObject);

    this.uniformNode.value.copy(isOccluded ? this.occludedColor : this.normalColor);
  }

  setup(/* builder */) {
    return this.uniformNode;
  }
}

init();

async function init() {
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.z = 7;

  scene = new THREE.Scene();

  // lights

  const ambientLight = new THREE.AmbientLight(0xb0b0b0);

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0.32, 0.39, 0.7);

  scene.add(ambientLight);
  scene.add(light);

  // models

  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const sphereGeometry = new THREE.SphereGeometry(0.5);

  const plane = new THREE.Mesh(planeGeometry, new MeshPhongNodeMaterial({ color: 0x00ff00 }));
  const sphere = new THREE.Mesh(sphereGeometry, new MeshPhongNodeMaterial({ color: 0xffff00 }));

  const instanceUniform = nodeObject(new OcclusionNode(sphere, new THREE.Color(0x00ff00), new THREE.Color(0x0000ff)));

  plane.material.colorNode = instanceUniform;

  sphere.position.z = -1;
  sphere.occlusionTest = true;

  scene.add(plane);
  scene.add(sphere);

  // renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ensure shaders/pipelines are all complete before rendering

  await renderer.compileAsync(scene, camera);

  renderer.setAnimationLoop(render);
  document.body.appendChild(renderer.domElement);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 3;
  controls.maxDistance = 25;

  useWindowResizer(renderer, camera);
}

function render() {
  renderer.render(scene, camera);
}
