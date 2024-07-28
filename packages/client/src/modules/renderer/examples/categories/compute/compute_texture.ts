import * as Engine from '@modules/renderer/engine/engine.js';
import {
  f32,
  instanceIndex,
  MeshBasicNodeMaterial,
  texture,
  textureStore,
  tslFn,
  uvec2,
  vec4,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import StorageTexture from '@modules/renderer/engine/entities/textures/StorageTexture.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

await init();
render();

async function init() {
  const aspect = window.innerWidth / window.innerHeight;
  camera = new Engine.OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
  camera.position.z = 1;

  scene = new Engine.Scene();



  const width = 512,
    height = 512;

  const storageTexture = new StorageTexture(width, height);



  const computeTexture = tslFn(({ storageTexture }) => {
    const posX = instanceIndex.remainder(width);
    const posY = instanceIndex.div(width);
    const indexUV = uvec2(posX, posY);



    const x = f32(posX).div(50.0);
    const y = f32(posY).div(50.0);

    const v1 = x.sin();
    const v2 = y.sin();
    const v3 = x.add(y).sin();
    const v4 = x.mul(x).add(y.mul(y)).sqrt().add(5.0).sin();
    const v = v1.add(v2, v3, v4);

    const r = v.sin();
    const g = v.add(Math.PI).sin();
    const b = v.add(Math.PI).sub(0.5).sin();

    textureStore(storageTexture, indexUV, vec4(r, g, b, 1));
  });



  const computeNode = computeTexture({ storageTexture }).compute(width * height);

  const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });
  material.colorNode = texture(storageTexture);

  const plane = new Engine.Mesh(new Engine.PlaneGeometry(1, 1), material);
  scene.add(plane);

  renderer = await Hearth.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.parameters.canvas);


  renderer.compute(computeNode);
  useWindowResizer(renderer, camera, () => {
    renderer.setSize(window.innerWidth, window.innerHeight);

    const aspect = window.innerWidth / window.innerHeight;

    const frustumHeight = camera.top - camera.bottom;

    camera.left = (-frustumHeight * aspect) / 2;
    camera.right = (frustumHeight * aspect) / 2;

    camera.updateProjectionMatrix();

    render();
  });
}

function render() {
  renderer.render(scene, camera);
}
