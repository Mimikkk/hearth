import * as THREE from '../threejs/Three.js';
import { mix, normalWorld, oscSine, range, timerLocal } from '../threejs/nodes/Nodes.js';

import Stats from 'stats-js';
import { GUI } from 'lil-gui';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';
import { BufferGeometryLoader } from '@modules/renderer/threejs/loaders/BufferGeometryLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, stats;

let mesh;
const amount = parseInt(window.location.search.slice(1)) || 10;
const count = Math.pow(amount, 3);
const dummy = new THREE.Object3D();

init();

function init() {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(amount * 0.9, amount * 0.9, amount * 0.9);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();

  const material = new THREE.MeshBasicMaterial();

  // random colors between instances from 0x000000 to 0xFFFFFF
  const randomColors = range(new THREE.Color(0x000000), new THREE.Color(0xffffff));

  material.colorNode = mix(normalWorld, randomColors, oscSine(timerLocal(0.1)));

  const loader = new BufferGeometryLoader();
  loader.loadAsync('models/json/suzanne_buffergeometry.json').then(function (geometry) {
    geometry.computeVertexNormals();
    geometry.scale(0.5, 0.5, 0.5);

    mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.BufferUsage.DynamicDraw);

    scene.add(mesh);

    //

    const gui = new GUI();
    gui.add(mesh, 'count', 0, count);
  });

  //

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  //

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  useWindowResizer(renderer, camera);
}

//

function animate() {
  render();

  stats.update();
}

async function render() {
  if (mesh) {
    const time = Date.now() * 0.001;

    mesh.rotation.x = Math.sin(time / 4);
    mesh.rotation.y = Math.sin(time / 2);

    let i = 0;
    const offset = (amount - 1) / 2;

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        for (let z = 0; z < amount; z++) {
          dummy.position.set(offset - x, offset - y, offset - z);
          dummy.rotation.y = Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time);
          dummy.rotation.z = dummy.rotation.y * 2;

          dummy.updateMatrix();

          mesh.setMatrixAt(i++, dummy.matrix);
        }
      }
    }
  }

  await renderer.render(scene, camera);
}
