import * as Engine from '@modules/renderer/engine/engine.js';
import { mix, normalWorld, oscSine, range, timerLocal } from '@modules/renderer/engine/nodes/Nodes.js';

import Stats from 'stats-js';
import { GUI } from 'lil-gui';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { BufferGeometryLoader } from '@modules/renderer/engine/loaders/geometries/BufferGeometryLoader/BufferGeometryLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer, stats;

let mesh;
const amount = parseInt(window.location.search.slice(1)) || 10;
const count = Math.pow(amount, 3);
const dummy = new Engine.Object3D();

init();

async function init() {
  camera = new Engine.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(amount * 0.9, amount * 0.9, amount * 0.9);
  camera.lookAt(0, 0, 0);

  scene = new Engine.Scene();

  const material = new Engine.MeshBasicMaterial();

  // random colors between instances from 0x000000 to 0xFFFFFF
  const randomColors = range(new Engine.Color(0x000000), new Engine.Color(0xffffff));

  material.colorNode = mix(normalWorld, randomColors, oscSine(timerLocal(0.1)));

  const loader = new BufferGeometryLoader();
  loader.loadAsync('resources/models/json/suzanne_buffergeometry.json').then(function (geometry) {
    geometry.computeVertexNormals();
    geometry.scale(0.5, 0.5, 0.5);

    mesh = new Engine.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(Engine.BufferUsage.DynamicDraw);

    scene.add(mesh);

    //

    const gui = new GUI();
    gui.add(mesh, 'count', 0, count);
  });

  //

  renderer = await Renderer.create();
  renderer._animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

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

    mesh.setRotation(Math.sin(time / 4), Math.sin(time / 2), 0);

    let i = 0;
    const offset = (amount - 1) / 2;

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        for (let z = 0; z < amount; z++) {
          dummy.position.set(offset - x, offset - y, offset - z);

          const rotationY = Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time);
          dummy.rotate(0, rotationY, rotationY * 2);

          dummy.updateMatrix();

          mesh.setMatrixAt(i++, dummy.matrix);
        }
      }
    }
  }

  await renderer.render(scene, camera);
}
