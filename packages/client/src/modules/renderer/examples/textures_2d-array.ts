import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshBasicNodeMaterial, oscTriangle, texture, timerLocal, uv } from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

import { unzipSync } from 'fflate';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, mesh, renderer;

const planeWidth = 50;
const planeHeight = 50;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 70;

  scene = new Engine.Scene();

  FileLoader.loadAsync('resources/textures/3d/head256x256x109.zip', { responseType: ResponseType.Buffer }).then(
    data => {
      const zip = unzipSync(new Uint8Array(data));
      const array = new Uint8Array(zip['head256x256x109'].buffer);

      const map = new Engine.DataArrayTexture(array, 256, 256, 109);
      map.format = Engine.TextureFormat.Red;
      map.needsUpdate = true;

      let coord = uv();
      coord = coord.setY(coord.y.oneMinus()); // flip y

      let oscLayers = oscTriangle(timerLocal(0.5)); // [ /\/ ] triangle osc animation
      oscLayers = oscLayers.add(1).mul(0.5); // convert osc range of [ -1, 1 ] to [ 0, 1 ]
      oscLayers = oscLayers.mul(map.image.depth); // scale osc range to texture depth

      const material = new MeshBasicNodeMaterial();
      material.colorNode = texture(map, coord).depth(oscLayers).r.remap(0, 1, -0.1, 1.8); // remap to make it more visible

      const geometry = new Engine.PlaneGeometry(planeWidth, planeHeight);

      mesh = new Engine.Mesh(geometry, material);

      scene.add(mesh);
    },
  );

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  container.appendChild(renderer.parameters.canvas);

  useWindowResizer(renderer, camera);
}

function animate() {
  render();
}

function render() {
  renderer.render(scene, camera);
}
