import * as Engine from '@modules/renderer/engine/engine.js';
import { MeshBasicNodeMaterial, oscTriangle, texture, timerLocal, uv } from '@modules/renderer/engine/nodes/nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import { unzipSync } from 'fflate';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, mesh, hearth;

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
      map.useUpdate = true;

      let coord = uv();
      coord = coord.setY(coord.y.oneMinus());

      let oscLayers = oscTriangle(timerLocal(0.5));
      oscLayers = oscLayers.add(1).mul(0.5);
      oscLayers = oscLayers.mul(map.image.depth);

      const material = new MeshBasicNodeMaterial();
      material.colorNode = texture(map, coord).depth(oscLayers).r.remap(0, 1, -0.1, 1.8);

      const geometry = new Engine.PlaneGeometry(planeWidth, planeHeight);

      mesh = new Engine.Mesh(geometry, material);

      scene.add(mesh);
    },
  );

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  container.appendChild(hearth.parameters.canvas);

  useWindowResizer(hearth, camera);
}

function animate() {
  render();
}

function render() {
  hearth.render(scene, camera);
}
