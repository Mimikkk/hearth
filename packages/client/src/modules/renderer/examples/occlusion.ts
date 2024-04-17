import * as THREE from '../threejs/Three.js';
import { MeshPhongNodeMaterial, Node, nodeObject, NodeUpdateType, uniform } from '../threejs/nodes/Nodes.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';

import WebGPU from '@modules/renderer/threejs/capabilities/WebGPU.js';
import WebGL from '@modules/renderer/threejs/capabilities/WebGL.js';

import WebGPURenderer from '../threejs/renderers/webgpu/WebGPURenderer.js';

let camera, scene, renderer, controls;

class OcclusionNode extends Node {
  constructor(testObject, normalColor, occludedColor) {
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
  if (WebGPU.isAvailable() === false && WebGL.isWebGL2Available() === false) {
    document.body.appendChild(WebGPU.getErrorMessage());

    throw new Error('No WebGPU or WebGL2 support');
  }

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

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  renderer.render(scene, camera);
}
